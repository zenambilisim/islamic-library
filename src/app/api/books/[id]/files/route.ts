import { NextRequest, NextResponse } from 'next/server';
import { uploadBookFile } from '@/lib/books';

const ALLOWED_FORMATS = ['pdf', 'epub', 'docx', 'doc'];

/**
 * POST /api/books/[id]/files – Kitap dosyası yükler (PDF, EPUB, DOC).
 * FormData: "file" (file), "format" (pdf | epub | docx | doc)
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
    const formatRaw = (formData.get('format') ?? '').toString().toLowerCase().replace('.', '');
    const format = formatRaw === 'doc' ? 'docx' : formatRaw;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Dosya (file) gerekli' }, { status: 400 });
    }
    if (!ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: 'format pdf, epub veya docx olmalı' },
        { status: 400 }
      );
    }
    const { url, error } = await uploadBookFile(file, id, format);
    if (error || !url) {
      return NextResponse.json(
        { error: error?.message ?? 'Dosya yüklenemedi' },
        { status: 500 }
      );
    }
    return NextResponse.json({ url });
  } catch (err) {
    console.error('API POST /api/books/[id]/files error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
