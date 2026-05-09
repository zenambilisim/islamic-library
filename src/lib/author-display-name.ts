/**
 * Veritabanında saklanan İngilizce/topluluk yer tutucu yazar adlarını UI diline çevirir.
 */
const UNKNOWN_AUTHOR_SINGULAR = new Set([
  'unknown author',
  'bilinmeyen yazar',
  'bilinmeyen',
  'unknown',
  'naməlum müəllif',
  'namelum müəllif',
  'неизвестный автор',
]);

const UNKNOWN_AUTHOR_PLURAL = new Set(['unknown authors', 'bilinmeyen yazarlar', 'naməlum müəlliflər', 'неизвестные авторы']);

export function isUnknownAuthorDisplayName(name: string): boolean {
  const n = name.trim().toLowerCase();
  return UNKNOWN_AUTHOR_SINGULAR.has(n) || UNKNOWN_AUTHOR_PLURAL.has(n);
}

type Translate = (key: string) => string;

export function resolveAuthorDisplayName(name: string, t: Translate): string {
  const n = name.trim().toLowerCase();
  if (UNKNOWN_AUTHOR_PLURAL.has(n)) return t('authors.unknownAuthors');
  if (UNKNOWN_AUTHOR_SINGULAR.has(n)) return t('book.unknownAuthor');
  return name.trim();
}
