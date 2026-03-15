import { NextRequest, NextResponse } from 'next/server';
import { uploadBookCover, updateBookCover } from '@/lib/books';

/**
 * POST /api/books/[id]/cover – Kitap kapağı yükler.
 * FormData: "file" (image file)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Kitap id gerekli' }, { status: 400 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya (file) gerekli' }, { status: 400 });
    }
    const { url, error: uploadError } = await uploadBookCover(file, id);
    if (uploadError || !url) {
      return NextResponse.json(
        { error: uploadError?.message ?? 'Kapak yüklenemedi' },
        { status: 500 }
      );
    }
    const { error: updateError } = await updateBookCover(id, url);
    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ url });
  } catch (err) {
    console.error('API POST /api/books/[id]/cover error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
