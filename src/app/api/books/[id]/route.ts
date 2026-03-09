import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';

/**
 * GET /api/books/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing book id' }, { status: 400 });
    }

    const { book: rawBook, error } = await getBookById(id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!rawBook) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const book = convertSupabaseBookToBook(rawBook);
    return NextResponse.json(book);
  } catch (err) {
    console.error('API GET /api/books/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
