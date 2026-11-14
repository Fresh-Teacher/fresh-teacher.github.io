import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { VisitorNotices } from '@/components/visitor-notices';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android Chrome/130.0 Safari/537.36');
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); localStorage.clear(); });
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

it.each(['Accept all', 'Essential only'])('remembers %s after leaving and returning', choice => {
  localStorage.setItem('ft-app-installed', '1');
  const first = render(<VisitorNotices />);
  fireEvent.click(screen.getByRole('button', { name: choice }));
  advance(420);
  first.unmount();
  render(<VisitorNotices />);
  expect(screen.queryByRole('dialog', { name: 'Cookie notice' })).toBeNull();
});

it('remembers a completed installation on returning browser visits', () => {
  const first = render(<VisitorNotices />);
  act(() => { window.dispatchEvent(new Event('appinstalled')); });
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  expect(localStorage.getItem('ft-app-installed')).toBe('1');
  first.unmount();
  render(<VisitorNotices />);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
});

it('offers installation again only after the seven-day snooze ends', () => {
  const now = Date.now();
  localStorage.setItem('ft-install-snooze-until', String(now + 7 * 24 * 60 * 60 * 1000));
  const first = render(<VisitorNotices />);
  expect(screen.queryByRole('dialog', { name: 'Install the Fresh App' })).toBeNull();
  first.unmount();
  vi.setSystemTime(now + 7 * 24 * 60 * 60 * 1000);
  render(<VisitorNotices />);
  expect(screen.getByRole('dialog', { name: 'Install the Fresh App' })).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: 'Cookie notice' })).toBeNull();
});
