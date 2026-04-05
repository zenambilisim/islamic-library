import { NextResponse } from 'next/server';
import { normalizeAuthorTranslations } from '@/lib/author-db';
import { getCategoryById, updateCategory } from '@/lib/books';
import { convertSupabaseCategoryToCategory } from '@/lib/converters-server';
import type { Category as SupabaseCategoryRow } from '@/lib/supabase';

/**
 * GET /api/categories/[id]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }

    const { category: raw, error } = await getCategoryById(id);
    if (error || !raw) {
      return NextResponse.json(
        { error: error?.message ?? 'Kategori bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      category: convertSupabaseCategoryToCategory(raw as SupabaseCategoryRow),
    });
  } catch (err) {
    console.error('API GET /api/categories/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categories/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }

    const body = await request.json();
    const name = String(body?.name ?? '').trim();
    const description = String(body?.description ?? '').trim();
    const icon = String(body?.icon ?? '').trim();

    if (!name) {
      return NextResponse.json({ error: 'name zorunludur' }, { status: 400 });
    }

    const name_translations = normalizeAuthorTranslations(body?.name_translations, name);
    const description_translations = normalizeAuthorTranslations(
      body?.description_translations,
      description
    );

    const { category: raw, error } = await updateCategory(id, {
      name,
      description,
      name_translations,
      description_translations,
      icon: icon || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const category = raw
      ? convertSupabaseCategoryToCategory(raw as SupabaseCategoryRow)
      : null;
    return NextResponse.json({ category });
  } catch (err) {
    console.error('API PATCH /api/categories/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
