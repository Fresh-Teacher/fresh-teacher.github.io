import { useCallback, useState } from 'react';
import { CookieNotice } from '@/components/cookie-notice';
import { InstallPrompt } from '@/components/install-prompt';

export function VisitorNotices() {
  const [installComplete, setInstallComplete] = useState(false);
  const completeInstall = useCallback(() => setInstallComplete(true), []);

  return <>
    <InstallPrompt onComplete={completeInstall} />
    <CookieNotice ready={installComplete} />
  </>;
}