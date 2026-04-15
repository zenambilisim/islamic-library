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
    const blob = file && typeof (file as Blob).arrayBuffer === 'function' ? (file as Blob) : null;
    if (!blob) {
      return NextResponse.json({ error: 'Dosya (file) gerekli' }, { status: 400 });
    }
    const fileNameFromField =
      file && typeof file === 'object' && 'name' in file
        ? String((file as { name?: unknown }).name ?? '')
        : '';
    const filename =
      (formData.get('filename') as string) ||
      fileNameFromField ||
      'cover.jpg';
    const { url, error: uploadError } = await uploadBookCover(blob, id, filename);
    if (uploadError || !url) {
      const msg = uploadError?.message ?? 'Kapak yüklenemedi';
      console.error('Cover upload failed:', msg, uploadError);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    const { error: updateError } = await updateBookCover(id, url);
    if (updateError) {
      console.error('Cover DB update failed:', updateError);
      return NextResponse.json(
        { error: `Veritabanı güncellenemedi: ${updateError.message}` },
        { status: 500 }
      );
    }
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('API POST /api/books/[id]/cover error:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
