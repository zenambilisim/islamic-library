import { NextResponse } from 'next/server';
import { normalizeAuthorTranslations } from '@/lib/author-db';
import { createAuthor, getAuthors } from '@/lib/authors';

/**
 * GET /api/authors
 */
export async function GET() {
  try {
    const { authors, error } = await getAuthors();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ authors });
  } catch (err) {
    console.error('API GET /api/authors error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/authors
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const biography = String(body?.biography ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name zorunludur' }, { status: 400 });
    }

    const name_translations = normalizeAuthorTranslations(body?.name_translations, name);
    const biography_translations = normalizeAuthorTranslations(body?.biography_translations, biography);

    const { author, error } = await createAuthor({
      name,
      biography,
      name_translations,
      biography_translations,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ author });
  } catch (err) {
    console.error('API POST /api/authors error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
