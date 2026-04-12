import { NextRequest, NextResponse } from 'next/server';
import { getBooks, getBooksByCategory, createBook, type CreateBookPayload } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';

/**
 * POST /api/books – Yeni kitap oluşturur (metadata, kapak/dosya ayrı endpoint'lerden).
 * Body: CreateBookPayload (title, author, category, language_code, ...)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload: CreateBookPayload = {
      title: body.title ?? '',
      author: body.author ?? '',
      author_id: typeof body.author_id === 'string' ? body.author_id : undefined,
      category: typeof body.category === 'string' ? body.category : '',
      category_id: typeof body.category_id === 'string' ? body.category_id : undefined,
      language_code: body.language ?? body.language_code ?? 'tr',
      description: body.description,
      pages: body.pages != null ? Number(body.pages) : undefined,
    };
    const hasCat = Boolean(payload.category_id?.trim() || payload.category?.trim());
    if (!payload.title.trim() || !payload.author.trim() || !hasCat) {
      return NextResponse.json(
        { error: 'title, author ve kategori (category_id veya category) zorunludur' },
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

function parseLanguageParam(raw: string | null): string | undefined {
  if (!raw?.trim()) return undefined;
  const code = raw.trim().toLowerCase().split('-')[0];
  return APP_LANGS.has(code) ? code : undefined;
}

/**
 * GET /api/books
 * Query: page, limit, category (slug; sayfalı), language (tr|en|ru|az), withTotal (kategori + dil için toplam sayım).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const category = searchParams.get('category') || undefined;
    const language = parseLanguageParam(searchParams.get('language'));
    const withTotal = searchParams.get('withTotal') === '1';

    let rawBooks: any[];
    let total = 0;
    let hasMore = false;

    if (category) {
      const result = await getBooksByCategory(category, language, page, limit, {
        includeTotal: withTotal,
      });
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      rawBooks = result.books;
      total = withTotal ? result.total : 0;
      hasMore = result.hasMore ?? false;
    } else {
      const result = await getBooks(page, limit, language, { includeTotal: withTotal });
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
