import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Kitap id gerekli' }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;
    const filePath = String(body.filePath ?? '').trim();
    const publicUrl = String(body.publicUrl ?? '').trim();

    if (!filePath || !publicUrl) {
      return NextResponse.json({ error: 'filePath ve publicUrl gerekli' }, { status: 400 });
    }

    const { error } = await supabase.from('books').update({ cover_image_url: publicUrl }).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, filePath, url: publicUrl });
  } catch (err) {
    console.error('POST /api/books/[id]/cover/complete error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
