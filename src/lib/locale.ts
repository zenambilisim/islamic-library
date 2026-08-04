import type { Language } from '@/types';

export const LANG_COOKIE = 'il_lang';

export const SUPPORTED_LANGS = ['tr', 'en', 'ru', 'az'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGS)[number];

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  if (!value) return 'tr';
  const base = value.trim().toLowerCase().split('-')[0] ?? '';
  return isSupportedLanguage(base) ? base : 'tr';
}

/** CookieStore (next/headers) veya RequestCookies uyumlu */
type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function getRequestLanguage(cookies: CookieReader): SupportedLanguage {
  return normalizeLanguage(cookies.get(LANG_COOKIE)?.value);
}

/** Client: document.cookie içinden dil oku */
export function readLanguageCookieFromDocument(): SupportedLanguage | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )il_lang=([^;]*)/);
  if (!match?.[1]) return null;
  const raw = decodeURIComponent(match[1].trim());
  return isSupportedLanguage(raw) ? raw : null;
}

function readLanguageFromLocalStorage(): SupportedLanguage | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem('language');
    if (stored && isSupportedLanguage(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Client dil kaynağı: cookie → localStorage → SSR/fallback.
 * Cookie yoksa localStorage tercihi geri yüklenir (middleware’in tr basması eski davranışı).
 */
export function resolveClientLanguage(
  fallback: SupportedLanguage = 'tr'
): SupportedLanguage {
  if (typeof window === 'undefined') return fallback;
  return (
    readLanguageCookieFromDocument() ??
    readLanguageFromLocalStorage() ??
    fallback
  );
}

/** Client: dil cookie + localStorage yaz (1 yıl) */
export function setLanguageCookie(lang: Language): void {
  if (typeof document === 'undefined') return;
  const code = normalizeLanguage(lang);
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; secure'
      : '';
  document.cookie = `${LANG_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  try {
    window.localStorage.setItem('language', code);
  } catch {
    /* ignore */
  }
}
