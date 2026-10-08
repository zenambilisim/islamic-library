import type { Language } from '@/types';

export const LANG_COOKIE = 'il_lang';

export const SUPPORTED_LANGS = ['en', 'tr', 'ru', 'az'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLanguage = 'en';

const OG_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  ru: 'ru_RU',
  az: 'az_AZ',
};

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  if (!value) return DEFAULT_LANG;
  const base = value.trim().toLowerCase().split('-')[0] ?? '';
  return isSupportedLanguage(base) ? base : DEFAULT_LANG;
}

export function toOgLocale(lang: string | null | undefined): string {
  return OG_LOCALE_MAP[normalizeLanguage(lang)];
}

/** CookieStore (next/headers) veya RequestCookies uyumlu */
type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

export function getRequestLanguage(cookies: CookieReader): SupportedLanguage {
  return normalizeLanguage(cookies.get(LANG_COOKIE)?.value);
}

/**
 * Path'in ilk segmentinden locale oku.
 * Desteklenmeyen veya yoksa null.
 */
export function getLocaleFromPathname(pathname: string): SupportedLanguage | null {
  const segment = pathname.split('/').filter(Boolean)[0] ?? '';
  return isSupportedLanguage(segment) ? segment : null;
}

/**
 * Locale önekini path'ten çıkarır.
 * `/en/categories` → `/categories`, `/tr` → `/`
 */
export function stripLocaleFromPathname(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  if (!isSupportedLanguage(parts[0])) {
    return pathname.startsWith('/') ? pathname : `/${pathname}` || '/';
  }
  const rest = parts.slice(1).join('/');
  return rest ? `/${rest}` : '/';
}

/**
 * Dosya sistemi yolu (İngilizce) → her dilde görünen ilk segment.
 * localizedPath('tr', '/authors') → '/tr/yazarlar'
 */
const SECTION_SLUGS: Record<string, Record<SupportedLanguage, string>> = {
  authors: { en: 'authors', tr: 'yazarlar', ru: 'avtory', az: 'muellifler' },
  categories: { en: 'categories', tr: 'kategoriler', ru: 'kategorii', az: 'kateqoriyalar' },
  books: { en: 'books', tr: 'kitaplar', ru: 'knigi', az: 'kitablar' },
  about: { en: 'about', tr: 'hakkimizda', ru: 'o-nas', az: 'haqqimizda' },
  contact: { en: 'contact', tr: 'iletisim', ru: 'kontakty', az: 'elaqe' },
  'useful-info': {
    en: 'useful-info',
    tr: 'faydali-bilgiler',
    ru: 'poleznaya-informatsiya',
    az: 'faydali-melumatlar',
  },
  library: { en: 'library', tr: 'kutuphanem', ru: 'biblioteka', az: 'kitabxanam' },
};

const SLUG_TO_INTERNAL = new Map<string, string>();
for (const [internal, byLang] of Object.entries(SECTION_SLUGS)) {
  SLUG_TO_INTERNAL.set(internal, internal);
  for (const slug of Object.values(byLang)) {
    const prev = SLUG_TO_INTERNAL.get(slug);
    if (prev && prev !== internal) {
      throw new Error(`Duplicate section slug: ${slug}`);
    }
    SLUG_TO_INTERNAL.set(slug, internal);
  }
}

/** Görünen bölüm adı hangi dile ait (`yazarlar` → tr, `authors` → en). */
export function localeForSectionSlug(segment: string): SupportedLanguage | null {
  for (const byLang of Object.values(SECTION_SLUGS)) {
    for (const lang of SUPPORTED_LANGS) {
      if (byLang[lang] === segment) return lang;
    }
  }
  return null;
}

/** `/tr/yazarlar` veya `/yazarlar` → `/authors` (locale öneki düşer). */
export function toInternalPath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const stripped = getLocaleFromPathname(withSlash)
    ? stripLocaleFromPathname(withSlash)
    : withSlash;
  const parts = stripped.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  const internal = SLUG_TO_INTERNAL.get(parts[0]);
  if (internal) parts[0] = internal;
  return `/${parts.join('/')}`;
}

/**
 * Locale önekli, bölüm adı dile çevrilmiş path.
 * localizedPath('en', '/categories') → '/en/categories'
 * localizedPath('tr', '/authors') → '/tr/yazarlar'
 * localizedPath('tr', '/') → '/tr'
 */
export function localizedPath(
  locale: string | null | undefined,
  path: string = '/'
): string {
  const lang = normalizeLanguage(locale);
  const internal = toInternalPath(path);
  const parts = internal.split('/').filter(Boolean);
  if (parts.length === 0) return `/${lang}`;
  const publicSlug = SECTION_SLUGS[parts[0]]?.[lang];
  if (publicSlug) parts[0] = publicSlug;
  return `/${lang}/${parts.join('/')}`;
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
 */
export function resolveClientLanguage(
  fallback: SupportedLanguage = DEFAULT_LANG
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
