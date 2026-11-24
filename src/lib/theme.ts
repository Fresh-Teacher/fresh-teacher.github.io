export type Theme = 'light' | 'dark';
export const THEME_KEY = 'ft-theme';

// Runs before first paint so returning visitors never see a flash of the wrong theme.
export const themeBootstrap = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage unavailable */ }
}

export const nextTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark');
