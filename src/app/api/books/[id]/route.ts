import { NextRequest, NextResponse } from 'next/server';
import { getBookById, deleteBook, updateBook } from '@/lib/books';
import { convertSupabaseBookToBook } from '@/lib/converters-server';

/**
 * DELETE /api/books/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing book id' }, { status: 400 });
    }
    const { error } = await deleteBook(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API DELETE /api/books/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/books/[id] — metadata güncelleme (kapak/dosya ayrı endpoint'ler).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing book id' }, { status: 400 });
    }
    const body = await request.json();
    const { error } = await updateBook(id, {
      title: body.title ?? '',
      author: body.author ?? '',
      author_id: typeof body.author_id === 'string' ? body.author_id : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      category_id: typeof body.category_id === 'string' ? body.category_id : undefined,
      language_code: body.language ?? body.language_code ?? 'tr',
      description: body.description,
      pages: body.pages != null ? Number(body.pages) : undefined,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const { book: rawBook, error: fetchErr } = await getBookById(id);
    if (fetchErr || !rawBook) {
      return NextResponse.json(
        { error: fetchErr?.message ?? 'Kitap yeniden yüklenemedi' },
        { status: 500 }
      );
    }
    return NextResponse.json({ book: convertSupabaseBookToBook(rawBook) });
  } catch (err) {
    console.error('API PATCH /api/books/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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
