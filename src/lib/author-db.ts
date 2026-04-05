/** authors tablosu ile uyumlu yardımcılar (ideal_schema: slug, name_translations, biography_translations) */

export const AUTHOR_LANGS = ['tr', 'en', 'ru', 'az'] as const;
export type AuthorLang = (typeof AUTHOR_LANGS)[number];

export function slugifyAuthorName(name: string): string {
  const map: Record<string, string> = {
    ğ: 'g',
    ü: 'u',
    ş: 's',
    ı: 'i',
    i: 'i',
    ö: 'o',
    ç: 'c',
    â: 'a',
    î: 'i',
    û: 'u',
    İ: 'i',
    I: 'i',
  };
  let s = name.trim().toLowerCase();
  s = s.replace(/[ğüşıöçâîûİI]/g, (c) => map[c] ?? c);
  s = s.normalize('NFD').replace(/\p{M}/gu, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return s || 'yazar';
}

/** Body’den gelen çeviri objesini şemadaki 4 dile sabitler; boş değerler fallback ile doldurulur. */
export function normalizeAuthorTranslations(
  raw: unknown,
  fallback: string
): Record<AuthorLang, string> {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out = {} as Record<AuthorLang, string>;
  for (const code of AUTHOR_LANGS) {
    const v = obj[code];
    const str = typeof v === 'string' ? v.trim() : '';
    out[code] = str || fallback;
  }
  return out;
}
