import { NextResponse } from 'next/server';
import { normalizeLanguageCode } from '@/lib/author-db';
import { deleteCategory, getCategoryById, updateCategory } from '@/lib/books';
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
    if (!name) {
      return NextResponse.json({ error: 'name zorunludur' }, { status: 400 });
    }

    const language_code = normalizeLanguageCode(body?.language_code ?? body?.language, 'tr');

    const { category: raw, error } = await updateCategory(id, {
      name,
      description,
      language_code,
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

/**
 * DELETE /api/categories/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id gerekli' }, { status: 400 });
    }

    const { error } = await deleteCategory(id);
    if (error) {
      const msg = error.message;
      if (msg.includes('bağlı kitaplar')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('API DELETE /api/categories/[id] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
