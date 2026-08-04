export const THEME_COOKIE = 'il_theme';
export const THEME_STORAGE_KEY = 'theme';

export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

export function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

export function normalizeTheme(value: string | null | undefined): Theme {
  if (!value) return 'light';
  const raw = value.trim().toLowerCase();
  return isTheme(raw) ? raw : 'light';
}

/** CookieStore (next/headers) veya RequestCookies uyumlu */
type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function getRequestTheme(cookies: CookieReader): Theme {
  return normalizeTheme(cookies.get(THEME_COOKIE)?.value);
}

/** Client: document.cookie içinden tema oku */
export function readThemeCookieFromDocument(): Theme | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )il_theme=([^;]*)/);
  if (!match?.[1]) return null;
  const raw = decodeURIComponent(match[1].trim());
  return isTheme(raw) ? raw : null;
}

function readThemeFromLocalStorage(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isTheme(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Client tema kaynağı: cookie → localStorage → SSR/fallback.
 */
export function resolveClientTheme(fallback: Theme = 'light'): Theme {
  if (typeof window === 'undefined') return fallback;
  return readThemeCookieFromDocument() ?? readThemeFromLocalStorage() ?? fallback;
}

export function applyThemeClass(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.dataset.theme = theme;
}

/** Client: tema cookie + localStorage yaz (1 yıl) */
export function setThemeCookie(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const value = normalizeTheme(theme);
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; secure'
      : '';
  document.cookie = `${THEME_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  applyThemeClass(value);
}

/** Paint öncesi FOUC önleme scripti (inline) */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )il_theme=([^;]*)/);var t=m?decodeURIComponent(m[1]):null;if(t!=='light'&&t!=='dark'){t=localStorage.getItem('theme');}if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.dataset.theme='light';}}catch(e){}})();`;
