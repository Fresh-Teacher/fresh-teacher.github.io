import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { applyTheme, nextTheme, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => { setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }, []);
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return <Button variant="source" size="source" className="library-install-control library-theme-control" aria-label={label} title={label} onClick={() => { const t = nextTheme(theme); applyTheme(t); setTheme(t); }}>
    <span aria-hidden="true">{theme === 'dark' ? '🌚' : '🌞'}</span>
  </Button>;
}
