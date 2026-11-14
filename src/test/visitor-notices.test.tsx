import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitorNotices } from '@/components/visitor-notices';
import { offerInstall } from '@/lib/app-installation';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Android Chrome/130.0 Safari/537.36');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  offerInstall(null);
});

const installNotice = () => screen.queryByRole('dialog', { name: 'Install the Fresh App' });
const cookieNotice = () => screen.queryByRole('dialog', { name: 'Cookie notice' });

describe('Install-first visitor notices', () => {
  it('offers installation immediately with no browsing delay or cookie choice', () => {
    render(<VisitorNotices />);
    expect(installNotice()).toBeInTheDocument();
    expect(cookieNotice()).not.toBeInTheDocument();
  });

  it.each(['Remind me later', 'Not Interested', 'Close'])('waits for %s to finish closing before cookies appear', name => {
    render(<VisitorNotices />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}$`) }));
    act(() => vi.advanceTimersByTime(419));
    expect(cookieNotice()).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(installNotice()).not.toBeInTheDocument();
    expect(cookieNotice()).toBeInTheDocument();
  });

  it('keeps the existing seven-day reminder', () => {
    render(<VisitorNotices />);
    const now = Date.now();
    fireEvent.click(screen.getByRole('button', { name: 'Remind me later' }));
    expect(Number(localStorage.getItem('ft-install-snooze-until'))).toBe(now + 7 * 24 * 60 * 60 * 1000);
  });

  it.each(['ft-app-installed', 'ft-install-blocked'])('skips installation for saved %s', key => {
    localStorage.setItem(key, '1');
    render(<VisitorNotices />);
    expect(installNotice()).not.toBeInTheDocument();
    expect(cookieNotice()).toBeInTheDocument();
  });

  it('skips installation when launched from a home-screen icon', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query === '(display-mode: standalone)', media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    render(<VisitorNotices />);
    expect(installNotice()).not.toBeInTheDocument();
    expect(cookieNotice()).toBeInTheDocument();
  });

  it('skips unsupported browsers without holding up cookies', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 Firefox/130.0');
    render(<VisitorNotices />);
    expect(installNotice()).not.toBeInTheDocument();
    expect(cookieNotice()).toBeInTheDocument();
  });

  it('leaves installed visitors with saved consent uninterrupted', () => {
    localStorage.setItem('ft-app-installed', '1');
    localStorage.setItem('ft-cookie-consent', 'accepted');
    render(<VisitorNotices />);
    expect(installNotice()).not.toBeInTheDocument();
    expect(cookieNotice()).not.toBeInTheDocument();
  });

  it('hands over to cookies after a successful native install', async () => {
    render(<VisitorNotices />);
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    act(() => window.dispatchEvent(event));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install now' })));
    act(() => vi.advanceTimersByTime(420));
    expect(localStorage.getItem('ft-app-installed')).toBe('1');
    expect(installNotice()).not.toBeInTheDocument();
    expect(cookieNotice()).toBeInTheDocument();
  });

  it('shows manual iPhone installation immediately', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 iPhone Version/18.0 Mobile Safari/604.1');
    render(<VisitorNotices />);
    expect(installNotice()).toBeInTheDocument();
    expect(cookieNotice()).not.toBeInTheDocument();
  });
});