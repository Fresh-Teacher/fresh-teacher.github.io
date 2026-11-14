import { memo, useEffect, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';

/** Thin top bar shown while a page navigation is pending; isolated so the shell never redraws. */
export const RouteProgress = memo(function RouteProgress() {
  const pending = useRouterState({ select: state => state.status === 'pending' || state.isLoading });
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (pending) { setVisible(true); return; }
    const timer = window.setTimeout(() => setVisible(false), 200);
    return () => window.clearTimeout(timer);
  }, [pending]);
  if (!visible) return null;
  return <div className={`route-progress ${pending ? 'is-active' : 'is-done'}`} role="progressbar" aria-label="Loading page" />;
});
