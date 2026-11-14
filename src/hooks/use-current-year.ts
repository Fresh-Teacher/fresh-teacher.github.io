import { useEffect, useState } from 'react';

// Start empty so static exports remain hydration-safe even after New Year's Day.
export function useCurrentYear() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setYear(new Date().getFullYear());
    update();
    const timer = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return year;
}