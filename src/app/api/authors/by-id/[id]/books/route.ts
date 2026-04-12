import { NextRequest, NextResponse } from 'next/server';
import { getBooksByAuthorId } from '@/lib/authors';

/**
 * GET /api/authors/by-id/[id]/books — yazar UUID’sine göre kitaplar
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing author id' }, { status: 400 });

    const { books, error } = await getBooksByAuthorId(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ books });
  } catch (err) {
    console.error('API GET /api/authors/by-id/[id]/books error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
