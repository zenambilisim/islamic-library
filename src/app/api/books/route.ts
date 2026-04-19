import { NextRequest, NextResponse } from 'next/server';
import {
  getBooks,
  getBooksByCategory,
  createBook,
  type CreateBookPayload,
  type BookAuthorInput,
  type BookSortBy,
} from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';

function parseAuthorsBody(body: Record<string, unknown>): BookAuthorInput[] | undefined {
  const raw = body.authors;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: BookAuthorInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name : '';
    const author_id = typeof o.author_id === 'string' ? o.author_id : undefined;
    if (!name.trim() && !author_id?.trim()) continue;
    out.push({ name, author_id });
  }
  return out.length ? out : undefined;
}

/**
 * POST /api/books – Yeni kitap oluşturur (metadata, kapak/dosya ayrı endpoint'lerden).
 * Body: title, kategori; yazar: `authors: [{ name, author_id? }, ...]` veya tek `author` (+ author_id).
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const authorsParsed = parseAuthorsBody(body);
    const payload: CreateBookPayload = {
      title: (body.title as string) ?? '',
      author: typeof body.author === 'string' ? body.author : '',
      author_id: typeof body.author_id === 'string' ? body.author_id : undefined,
      authors: authorsParsed,
      category: typeof body.category === 'string' ? body.category : '',
      category_id: typeof body.category_id === 'string' ? body.category_id : undefined,
      language_code: (body.language as string) ?? (body.language_code as string) ?? 'tr',
      description: body.description as string | undefined,
      pages: body.pages != null ? Number(body.pages) : undefined,
    };
    const hasCat = Boolean(payload.category_id?.trim() || payload.category?.trim());
    const hasAuthors =
      Boolean(authorsParsed?.length) ||
      (typeof body.author === 'string' && body.author.trim().length > 0);
    if (!payload.title.trim() || !hasAuthors || !hasCat) {
      return NextResponse.json(
        { error: 'title, en az bir yazar ve kategori (category_id veya category) zorunludur' },
        { status: 400 }
      );
    }
    const { book, error } = await createBook(payload);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const converted = book ? convertSupabaseBookToBook(book) : null;
    return NextResponse.json({ book: converted });
  } catch (err) {
    console.error('API POST /api/books error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

const APP_LANGS = new Set(['tr', 'en', 'ru', 'az']);
const SORT_OPTIONS = new Set<BookSortBy>(['uploadDate', 'alphabetical', 'mostDownloaded']);

function parseLanguageParam(raw: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const code = raw.trim().toLowerCase().split('-')[0];
  return APP_LANGS.has(code) ? code : undefined;
}

function parseSortByParam(raw: string | null): BookSortBy {
  if (!raw?.trim()) return 'uploadDate';
  return SORT_OPTIONS.has(raw as BookSortBy) ? (raw as BookSortBy) : 'uploadDate';
}

/**
 * GET /api/books
 * Query: page, limit, category (slug; sayfalı), language (tr|en|ru|az),
 * withTotal (kategori + dil için toplam sayım), sortBy (uploadDate|alphabetical|mostDownloaded).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const category = searchParams.get('category') || undefined;
    const language = parseLanguageParam(searchParams.get('language'));
    const withTotal = searchParams.get('withTotal') === '1';
    const sortBy = parseSortByParam(searchParams.get('sortBy'));

    let rawBooks: any[];
    let total = 0;
    let hasMore = false;

    if (category) {
      const result = await getBooksByCategory(category, language, page, limit, {
        includeTotal: withTotal,
        sortBy,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      rawBooks = result.books;
      total = withTotal ? result.total : 0;
      hasMore = result.hasMore ?? false;
    } else {
      const result = await getBooks(page, limit, language, {
        includeTotal: withTotal,
        sortBy,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      rawBooks = result.books;
      total = withTotal ? result.total : 0;
      hasMore = result.hasMore ?? false;
    }

    const books = rawBooks.map(convertSupabaseBookToBook);

    return NextResponse.json({
      books,
      total,
      hasMore,
    });
  } catch (err) {
    console.error('API GET /api/books error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
