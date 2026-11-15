import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VisitorNotices } from '@/components/visitor-notices';
import { offerInstall } from '@/lib/app-installation';

afterEach(() => { cleanup(); localStorage.clear(); offerInstall(null); vi.restoreAllMocks(); });

const installNotice = () => screen.queryByRole('dialog', { name: 'Install the Fresh App' });
const fireReady = () => {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  act(() => { window.dispatchEvent(event); });
  return event;
};

describe('Install notice', () => {
  it('stays hidden until the browser says the app is installable', () => {
    render(<VisitorNotices />);
    expect(installNotice()).not.toBeInTheDocument();
    fireReady();
    expect(installNotice()).toBeInTheDocument();
  });

  it('opens the real browser install dialog', async () => {
    render(<VisitorNotices />);
    const event = fireReady();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install now' })));
    expect(event.prompt).toHaveBeenCalled();
    expect(localStorage.getItem('ft-app-installed')).toBe('1');
  });

  it('respects Not Interested', () => {
    localStorage.setItem('ft-install-blocked', '1');
    render(<VisitorNotices />);
    fireReady();
    expect(installNotice()).not.toBeInTheDocument();
  });
});
