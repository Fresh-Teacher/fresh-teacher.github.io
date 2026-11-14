import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CookieNotice } from '@/components/cookie-notice';
import { InstallPrompt } from '@/components/install-prompt';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const eligible = () => act(() => { window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })); });

it('waits five minutes on the site and avoids overlapping the cookie notice', () => {
  render(<><CookieNotice /><InstallPrompt /></>);
  eligible();
  expect(screen.getByRole('dialog', { name: 'Cookie notice' })).toBeTruthy();
  advance(40_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Accept all' }));
  advance(420);
  expect(screen.getByRole('dialog', { name: 'Install the Fresh App' })).toBeTruthy();
});

it.each(['Accept all', 'Essential only'])('remembers %s after leaving and returning', (choice) => {
  const first = render(<CookieNotice />);
  fireEvent.click(screen.getByRole('button', { name: choice }));
  advance(420);
  first.unmount();
  render(<CookieNotice />);
  expect(screen.queryByRole('dialog', { name: 'Cookie notice' })).toBeNull();
});

it('waits exactly five minutes even when cookie consent was saved on an earlier visit', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  render(<InstallPrompt />);
  eligible();
  advance(39_999);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  advance(1);
  expect(screen.getByRole('dialog', { name: 'Install the Fresh App' })).toBeTruthy();
});

it('remembers a completed installation and hides the offer on returning browser visits', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  const first = render(<InstallPrompt />);
  eligible();
  advance(40_000);
  act(() => { window.dispatchEvent(new Event('appinstalled')); });
  advance(420);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  first.unmount();
  render(<InstallPrompt />);
  eligible();
  advance(40_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  expect(localStorage.getItem('ft-app-installed')).toBe('1');
});

it('never offers installation when already running as an installed app', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<InstallPrompt />);
  eligible();
  advance(40_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  expect(localStorage.getItem('ft-app-installed')).toBe('1');
});

it('does not count time in a hidden tab toward the five-minute delay', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  render(<InstallPrompt />);
  eligible();
  advance(10_000);
  act(() => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  advance(80_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  act(() => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  advance(29_999);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  advance(1);
  expect(screen.getByRole('dialog', { name: 'Install the Fresh App' })).toBeTruthy();
  vi.restoreAllMocks();
});

it('keeps the elapsed site time through navigation or reload', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  const first = render(<InstallPrompt />);
  eligible();
  advance(15_000);
  first.unmount();
  render(<InstallPrompt />);
  eligible();
  advance(24_999);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  advance(1);
  expect(screen.getByRole('dialog', { name: 'Install the Fresh App' })).toBeTruthy();
});

it('does not offer installation when the browser has no native or Safari installation option', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  render(<InstallPrompt />);
  advance(40_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
});

it('respects Not Interested on future visits', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  const first = render(<InstallPrompt />);
  eligible();
  advance(40_000);
  fireEvent.click(screen.getByRole('button', { name: 'Not Interested' }));
  advance(420);
  first.unmount();
  render(<InstallPrompt />);
  eligible();
  advance(40_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
});

it('snoozes installation offers for seven days', () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  const first = render(<InstallPrompt />);
  eligible();
  advance(40_000);
  const now = Date.now();
  fireEvent.click(screen.getByRole('button', { name: 'Remind me later' }));
  expect(Number(localStorage.getItem('ft-install-snooze-until'))).toBe(now + 7 * 24 * 60 * 60 * 1000);
  advance(420);
  first.unmount();
  render(<InstallPrompt />);
  eligible();
  advance(40_000);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
});

it('uses the browser prompt and remembers an accepted installation', async () => {
  localStorage.setItem('ft-cookie-consent', 'accepted');
  render(<InstallPrompt />);
  const event = new Event('beforeinstallprompt', { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  act(() => { window.dispatchEvent(event); });
  advance(40_000);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Install now' })); });
  expect(prompt).toHaveBeenCalledOnce();
  expect(localStorage.getItem('ft-app-installed')).toBe('1');
  advance(420);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
});