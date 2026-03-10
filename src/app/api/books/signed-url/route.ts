import { NextRequest, NextResponse } from 'next/server';
import { getSignedBookFileUrl } from '@/lib/supabase-server';

/**
 * POST /api/books/signed-url
 * Body: { pathOrUrl: string } – Storage path veya mevcut URL (http ise aynen döner)
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pathOrUrl = body?.pathOrUrl ?? body?.path ?? '';
    if (!pathOrUrl || typeof pathOrUrl !== 'string') {
      return NextResponse.json({ error: 'pathOrUrl required' }, { status: 400 });
    }
    const url = await getSignedBookFileUrl(pathOrUrl.trim(), 3600);
    if (!url) return NextResponse.json({ error: 'Could not get signed URL' }, { status: 500 });
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
