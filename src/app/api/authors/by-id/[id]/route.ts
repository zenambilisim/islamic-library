import { NextRequest, NextResponse } from 'next/server';
import { normalizeAuthorTranslations } from '@/lib/author-db';
import { deleteAuthor, getAuthorById, updateAuthor } from '@/lib/authors';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing author id' }, { status: 400 });
    const { author, error } = await getAuthorById(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!author) return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    return NextResponse.json(author);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing author id' }, { status: 400 });

    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const biography = String(body?.biography ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name zorunludur' }, { status: 400 });
    }

    const name_translations = normalizeAuthorTranslations(body?.name_translations, name);
    const biography_translations = normalizeAuthorTranslations(
      body?.biography_translations,
      biography
    );

    const { author, error } = await updateAuthor(id, {
      name,
      biography,
      name_translations,
      biography_translations,
    });

    if (error) {
      const msg = error.message;
      if (msg.includes('bulunamadı')) {
        return NextResponse.json({ error: msg }, { status: 404 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ author });
  } catch (err) {
    console.error('API PATCH /api/authors/by-id/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing author id' }, { status: 400 });

    const { error } = await deleteAuthor(id);
    if (error) {
      const msg = error.message;
      if (msg.includes('bağlı kitaplar')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API DELETE /api/authors/by-id/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
