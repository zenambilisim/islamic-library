import { NextRequest, NextResponse } from 'next/server';
import { getBooks, getBooksByCategory } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';

/**
 * GET /api/books
 * Query: page, limit, language, category (category varsa sayfalama yok, tüm liste döner)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(0, parseInt(searchParams.get('page') || '0', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const language = searchParams.get('language') || undefined;
    const category = searchParams.get('category') || undefined;

    let rawBooks: any[];
    let total = 0;
    let hasMore = false;

    if (category) {
      const result = await getBooksByCategory(category, language);
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      rawBooks = result.books;
      total = rawBooks.length;
    } else {
      const result = await getBooks(page, limit, language);
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
