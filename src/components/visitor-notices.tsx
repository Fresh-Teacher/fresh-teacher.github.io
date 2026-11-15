// import { CookieNotice } from '@/components/cookie-notice';
import { InstallPrompt } from '@/components/install-prompt';

export function VisitorNotices() {
  return <>
    <InstallPrompt />
    {/* Cookie notice paused for now. Restore with: <CookieNotice ready /> */}
  </>;
}
