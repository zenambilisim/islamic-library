import type { Language } from '@/types';

const LOCALE_BY_LANG: Record<Language, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  ru: 'ru-RU',
  az: 'az-AZ',
};

/** Arayüz diline göre büyük/küçük harf duyarsız karşılaştırma için metni normalize eder. */
export function resolveSearchLocale(lang?: string): string {
  const base = (lang || 'tr').split('-')[0].toLowerCase();
  if (base in LOCALE_BY_LANG) return LOCALE_BY_LANG[base as Language];
  return 'tr-TR';
}

export function normalizeForSearch(text: string, locale?: string): string {
  return text.trim().toLocaleLowerCase(locale ?? 'tr-TR');
}

export function textIncludesSearch(
  haystack: string | null | undefined,
  needle: string,
  locale?: string
): boolean {
  const q = needle.trim();
  if (!q) return true;
  const loc = locale ?? 'tr-TR';
  return normalizeForSearch(haystack ?? '', loc).includes(normalizeForSearch(q, loc));
}

export function bookMatchesSearch(
  book: { title: string; author?: string; authors?: string[] },
  needle: string,
  locale?: string,
): boolean {
  const q = needle.trim();
  if (!q) return true;
  if (textIncludesSearch(book.title, q, locale)) return true;
  if (textIncludesSearch(book.author, q, locale)) return true;
  if (book.authors?.some((name) => textIncludesSearch(name, q, locale))) return true;
  return false;
}

export function authorMatchesSearch(
  author: { name: string; biography?: string },
  needle: string,
  locale?: string,
): boolean {
  const q = needle.trim();
  if (!q) return true;
  if (textIncludesSearch(author.name, q, locale)) return true;
  if (textIncludesSearch(author.biography, q, locale)) return true;
  return false;
}
