import { NextRequest, NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/author-db';
import { createCategory, getCategories } from '@/lib/books';
import { convertSupabaseCategoryToCategory } from '@/lib/converters-server';
import type { Category as SupabaseCategoryRow } from '@/lib/supabase';

/**
 * GET /api/categories
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const languageRaw = searchParams.get('language');
    const language = languageRaw?.trim()
      ? normalizeLanguageCode(languageRaw, 'tr')
      : undefined;
    const nameSearch = searchParams.get('search')?.trim() || undefined;
    const { categories: rawCategories, error } = await getCategories(language, nameSearch);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const categories = (rawCategories || []).map(convertSupabaseCategoryToCategory);

    return NextResponse.json({ categories });
  } catch (err) {
    console.error('API GET /api/categories error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const description = String(body?.description ?? '').trim();
    if (!name) {
      return NextResponse.json({ error: 'name zorunludur' }, { status: 400 });
    }

    const language_code = normalizeLanguageCode(body?.language_code ?? body?.language, 'tr');

    const { category: raw, error } = await createCategory({
      name,
      description,
      language_code,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const category = raw ? convertSupabaseCategoryToCategory(raw as SupabaseCategoryRow) : null;
    return NextResponse.json({ category });
  } catch (err) {
    console.error('API POST /api/categories error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
