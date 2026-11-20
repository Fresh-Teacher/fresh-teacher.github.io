import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { InstallCard } from '@/components/navigation/install-card';
import { VisitorNotices } from '@/components/visitor-notices';
import { hasInstallOffer, isAppleMobile, isInstalled, offerInstall, requestInstall } from '@/lib/app-installation';

afterEach(() => { cleanup(); localStorage.clear(); offerInstall(null); vi.restoreAllMocks(); vi.useRealTimers(); });

const offer = (outcome: 'accepted' | 'dismissed' = 'accepted') => Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
  prompt: vi.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome }),
});

it('consumes dismissed browser offers exactly once', async () => {
  const event = offer('dismissed');
  offerInstall(event);
  expect(await requestInstall()).toBe('dismissed');
  expect(hasInstallOffer()).toBe(false);
  expect(await requestInstall()).toBe('unavailable');
  expect(event.prompt).toHaveBeenCalledTimes(1);
});

it('does not permanently hide installation after an uninstall', () => {
  localStorage.setItem('ft-app-installed', '1');
  expect(isInstalled()).toBe(false);
});

it('recognizes iPhones and desktop-mode iPads', () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone Safari');
  expect(isAppleMobile()).toBe(true);
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Macintosh Safari');
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
  vi.spyOn(navigator, 'maxTouchPoints', 'get').mockReturnValue(5);
  expect(isAppleMobile()).toBe(true);
});

it('recognizes a running standalone app', () => {
  vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query === '(display-mode: standalone)', media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
  expect(isInstalled()).toBe(true);
});

it('keeps manual installation available despite a dismissed automatic reminder', async () => {
  localStorage.setItem('ft-install-blocked', '1');
  const close = vi.fn();
  render(<><VisitorNotices /><InstallCard open onClose={close} /></>);
  const event = offer();
  act(() => { window.dispatchEvent(event); });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install Fresh App' })));
  expect(event.prompt).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
});

it('snoozes the banner for exactly seven days', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-19T03:25:00Z'));
  render(<VisitorNotices />);
  act(() => { window.dispatchEvent(offer()); });
  fireEvent.pointerDown(window);
  act(() => vi.advanceTimersByTime(30000));
  fireEvent.click(screen.getByRole('button', { name: 'Remind me later' }));
  expect(Number(localStorage.getItem('ft-install-snooze-until'))).toBe(Date.now() + 604800000);
});