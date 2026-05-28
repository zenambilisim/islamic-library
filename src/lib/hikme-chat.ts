import type { Book } from '@/types';

export type ChatBlock =
  | { type: 'text'; content: string }
  | { type: 'arabic'; content: string }
  | { type: 'tag'; content: string }
  | { type: 'books'; bookIds: string[] };

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'ai'; blocks: ChatBlock[] };

export type QuickPromptId = 'explain-ayah' | 'find-book' | 'hadith-day' | 'for-beginner';

export interface QuickPrompt {
  id: QuickPromptId;
  icon: 'book' | 'search' | 'sun' | 'seedling';
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  { id: 'explain-ayah', icon: 'book' },
  { id: 'find-book', icon: 'search' },
  { id: 'hadith-day', icon: 'sun' },
  { id: 'for-beginner', icon: 'seedling' },
];

function pickBooks(books: Book[], count: number, seed = 0): Book[] {
  if (books.length === 0) return [];
  const out: Book[] = [];
  for (let i = 0; i < count; i++) {
    out.push(books[(seed + i) % books.length]!);
  }
  return out;
}

function ids(books: Book[]): string[] {
  return books.map((b) => b.id);
}

export function buildQuickPromptResponse(
  promptId: QuickPromptId,
  books: Book[],
  t: (key: string) => string,
): ChatBlock[] {
  const a = pickBooks(books, 3, 0);
  const b = pickBooks(books, 3, 2);
  const c = pickBooks(books, 2, 4);

  switch (promptId) {
    case 'explain-ayah':
      return [
        {
          type: 'text',
          content: t('hikme.responses.explainAyah1'),
        },
        { type: 'arabic', content: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
        { type: 'text', content: t('hikme.responses.explainAyah2') },
        { type: 'books', bookIds: ids(a) },
      ];
    case 'find-book':
      return [
        { type: 'text', content: t('hikme.responses.findBook') },
        { type: 'books', bookIds: ids(b) },
      ];
    case 'hadith-day':
      return [
        { type: 'tag', content: t('hikme.responses.hadithTag') },
        { type: 'arabic', content: 'قِيمَةُ كُلِّ امْرِئٍ مَا يُحْسِنُهُ' },
        { type: 'text', content: t('hikme.responses.hadithText') },
        { type: 'books', bookIds: ids(c) },
      ];
    case 'for-beginner':
      return [
        { type: 'text', content: t('hikme.responses.forBeginner1') },
        { type: 'books', bookIds: ids(pickBooks(books, 3, 1)) },
        { type: 'text', content: t('hikme.responses.forBeginner2') },
        { type: 'books', bookIds: ids(pickBooks(books, 1, 0)) },
      ];
  }
}

export function buildGenericResponse(books: Book[], t: (key: string) => string): ChatBlock[] {
  return [
    { type: 'text', content: t('hikme.responses.generic') },
    { type: 'books', bookIds: ids(pickBooks(books, 3, 0)) },
  ];
}

export function matchPromptFromText(text: string): QuickPromptId | null {
  const lower = text.toLowerCase();
  if (
    lower.includes('ayet') ||
    lower.includes('verse') ||
    lower.includes('fatih') ||
    lower.includes('sure') ||
    lower.includes('сур') ||
    lower.includes('ayat')
  ) {
    return 'explain-ayah';
  }
  if (
    lower.includes('kitap') ||
    lower.includes('book') ||
    lower.includes('bul') ||
    lower.includes('find') ||
    lower.includes('книг')
  ) {
    return 'find-book';
  }
  if (lower.includes('hadis') || lower.includes('hadith') || lower.includes('хадис')) {
    return 'hadith-day';
  }
  if (
    lower.includes('başla') ||
    lower.includes('begin') ||
    lower.includes('yeni') ||
    lower.includes('nereden') ||
    lower.includes('начать')
  ) {
    return 'for-beginner';
  }
  return null;
}

export const QUICK_PROMPT_IDS: QuickPromptId[] = QUICK_PROMPTS.map((p) => p.id);
