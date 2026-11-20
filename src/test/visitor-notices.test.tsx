import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitorNotices } from '@/components/visitor-notices';
import { offerInstall } from '@/lib/app-installation';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); localStorage.clear(); offerInstall(null); vi.useRealTimers(); vi.restoreAllMocks(); });

const installNotice = () => screen.queryByRole('complementary', { name: 'Install the Fresh App' });
const fireReady = () => {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  act(() => { window.dispatchEvent(event); });
  return event;
};

describe('Install notice', () => {
  it('waits for a browser offer, interaction, and 30 seconds before showing a banner', () => {
    render(<VisitorNotices />);
    expect(installNotice()).not.toBeInTheDocument();
    fireReady();
    expect(installNotice()).not.toBeInTheDocument();
    fireEvent.pointerDown(window);
    act(() => vi.advanceTimersByTime(29999));
    expect(installNotice()).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(installNotice()).toBeInTheDocument();
  });

  it('opens the real browser install dialog', async () => {
    render(<VisitorNotices />);
    const event = fireReady();
    fireEvent.pointerDown(window);
    act(() => vi.advanceTimersByTime(30000));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install' })));
    expect(event.prompt).toHaveBeenCalled();
    expect(localStorage.getItem('ft-app-installed')).toBe('1');
  });

  it('respects Not Interested', () => {
    localStorage.setItem('ft-install-blocked', '1');
    render(<VisitorNotices />);
    fireReady();
    fireEvent.pointerDown(window);
    act(() => vi.advanceTimersByTime(30000));
    expect(installNotice()).not.toBeInTheDocument();
  });
});
