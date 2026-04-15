import { NextRequest, NextResponse } from 'next/server';
import { deleteBook } from '@/lib/books';

type BulkDeleteResponse = {
  ok: boolean;
  deleted: number;
  failed: Array<{ id: string; error: string }>;
};

/**
 * POST /api/books/bulk-delete
 * Body: { ids: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const idsRaw: unknown[] = Array.isArray(body?.ids) ? (body.ids as unknown[]) : [];
    const ids = [...new Set(idsRaw.map((id: unknown) => String(id ?? '').trim()).filter(Boolean))];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids zorunludur' }, { status: 400 });
    }
    if (ids.length > 200) {
      return NextResponse.json({ error: 'Bir istekte en fazla 200 kitap silinebilir' }, { status: 400 });
    }

    const failed: Array<{ id: string; error: string }> = [];
    let deleted = 0;

    for (const id of ids) {
      const { error } = await deleteBook(id);
      if (error) {
        failed.push({ id, error: error.message });
      } else {
        deleted += 1;
      }
    }

    const response: BulkDeleteResponse = {
      ok: failed.length === 0,
      deleted,
      failed,
    };

    if (failed.length > 0) {
      return NextResponse.json(response, { status: 207 });
    }
    return NextResponse.json(response);
  } catch (err) {
    console.error('API POST /api/books/bulk-delete error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
