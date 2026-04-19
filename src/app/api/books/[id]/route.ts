import { NextRequest, NextResponse } from 'next/server';
import { getBookById, deleteBook, updateBook, type BookAuthorInput } from '@/lib/books';
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
    const body = (await request.json()) as Record<string, unknown>;
    const authorsParsed = parseAuthorsBody(body);
    const { error } = await updateBook(id, {
      title: (body.title as string) ?? '',
      author: typeof body.author === 'string' ? body.author : '',
      author_id: typeof body.author_id === 'string' ? body.author_id : undefined,
      authors: authorsParsed,
      category: typeof body.category === 'string' ? body.category : undefined,
      category_id: typeof body.category_id === 'string' ? body.category_id : undefined,
      language_code: (body.language as string) ?? (body.language_code as string) ?? 'tr',
      description: body.description as string | undefined,
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
