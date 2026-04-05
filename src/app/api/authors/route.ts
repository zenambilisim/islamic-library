import { NextResponse } from 'next/server';
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
    const profileImageUrl = String(body?.profile_image_url ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name zorunludur' }, { status: 400 });
    }

    const nameTranslations =
      body?.name_translations && typeof body.name_translations === 'object'
        ? body.name_translations
        : {
            tr: name,
            en: name,
            ru: name,
            az: name,
          };

    const biographyTranslations =
      body?.biography_translations && typeof body.biography_translations === 'object'
        ? body.biography_translations
        : {
            tr: biography,
            en: biography,
            ru: biography,
            az: biography,
          };

    const { author, error } = await createAuthor({
      name,
      biography,
      name_translations: nameTranslations,
      biography_translations: biographyTranslations,
      profile_image_url: profileImageUrl || undefined,
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
