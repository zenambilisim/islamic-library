import { NextRequest, NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/author-db';
import { createAuthor, getAuthors } from '@/lib/authors';

/**
 * GET /api/authors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageRaw = searchParams.get('language');
    const language = languageRaw?.trim()
      ? normalizeLanguageCode(languageRaw, 'tr')
      : undefined;
    const { authors, error } = await getAuthors(language);

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

    const language_code = normalizeLanguageCode(body?.language_code ?? body?.language, 'tr');

    const { author, error } = await createAuthor({
      name,
      biography,
      language_code,
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
