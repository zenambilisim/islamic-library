/** authors tablosu ile uyumlu yardımcılar (ideal_schema: slug, language_code, name, biography) */

export const AUTHOR_LANGS = ['tr', 'en', 'ru', 'az'] as const;
export type AuthorLang = (typeof AUTHOR_LANGS)[number];

/** API / formdan gelen dil kodunu tr|en|ru|az ile sınırlar. */
export function normalizeLanguageCode(raw: unknown, fallback: AuthorLang = 'tr'): AuthorLang {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase().split('-')[0] : '';
  return (AUTHOR_LANGS as readonly string[]).includes(s) ? (s as AuthorLang) : fallback;
}

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

/** Kiril harfleri Latin slug harflerine (ISO 9 benzeri, URL için). */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  і: 'i',
  ї: 'yi',
  є: 'e',
  ґ: 'g',
  ը: 'e',
};

function transliterateCyrillicSegment(input: string): string {
  let out = '';
  for (const ch of input) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return out;
}

/**
 * Kitap başlığından URL güvenli slug; `language_code` diline göre transliterasyon uygular.
 * (ru: Kiril→Latin, tr/az: Türkçe/Azeri harfleri, en: diakritik temizliği)
 */
export function slugifyBookTitle(title: string, languageCode: string): string {
  const lang = normalizeLanguageCode(languageCode, 'tr');
  const raw = title.trim();
  if (!raw) return 'book';

  let s =
    lang === 'ru' ? transliterateCyrillicSegment(raw.toLocaleLowerCase('ru')) : raw.toLowerCase();

  if (lang === 'tr' || lang === 'az') {
    const trAz: Record<string, string> = {
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
      ə: 'e',
    };
    s = s.replace(/[ğüşıöçâîûİIə]/g, (c) => trAz[c] ?? c);
  }

  s = s.normalize('NFD').replace(/\p{M}/gu, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return s || 'book';
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
