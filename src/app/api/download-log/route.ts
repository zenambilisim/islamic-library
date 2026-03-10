import { NextRequest, NextResponse } from 'next/server';
import { incrementDownloadCount } from '@/lib/books';

/**
 * POST /api/download-log
 * Body: { bookId: string, format: string }
 * Sunucuda indirme loglarını yazar (Supabase key client'ta yok).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookId = body?.bookId;
    const format = body?.format;
    if (!bookId || !format) {
      return NextResponse.json({ error: 'bookId and format required' }, { status: 400 });
    }
    const { error } = await incrementDownloadCount(bookId, format);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
