import { NextRequest, NextResponse } from 'next/server';
import { getBooks, getBooksByCategory, createBook, type CreateBookPayload } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';

/**
 * POST /api/books – Yeni kitap oluşturur (metadata, kapak/dosya ayrı endpoint'lerden).
 * Body: CreateBookPayload (title, author, category, language, ...)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload: CreateBookPayload = {
      title: body.title ?? '',
      author: body.author ?? '',
      category: body.category ?? '',
      language: body.language ?? 'tr',
      title_translations: body.title_translations,
      author_translations: body.author_translations,
      category_translations: body.category_translations,
      description: body.description,
      description_translations: body.description_translations,
      pages: body.pages != null ? Number(body.pages) : undefined,
      publish_year: body.publish_year != null ? Number(body.publish_year) : undefined,
      tags: Array.isArray(body.tags) ? body.tags : body.tags ? [body.tags] : undefined,
    };
    if (!payload.title.trim() || !payload.author.trim() || !payload.category.trim()) {
      return NextResponse.json(
        { error: 'title, author ve category zorunludur' },
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

/**
 * GET /api/books
 * Query: page, limit, category (category varsa sayfalama yok, tüm liste döner). Dil filtresi yok – tüm kitaplar döner.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const category = searchParams.get('category') || undefined;

    let rawBooks: any[];
    let total = 0;
    let hasMore = false;

    if (category) {
      const result = await getBooksByCategory(category);
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      rawBooks = result.books;
      total = rawBooks.length;
    } else {
      const result = await getBooks(page, limit);
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      rawBooks = result.books;
      total = result.total;
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
