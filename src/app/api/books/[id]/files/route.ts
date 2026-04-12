import { NextRequest, NextResponse } from 'next/server';
import { uploadBookFile } from '@/lib/books';

const ALLOWED_FORMATS = ['pdf', 'epub', 'docx', 'doc'];

/** Büyük PDF/EPUB yüklemeleri için body limiti (Vercel default 4.5MB üstü). */
export const maxDuration = 60;

/**
 * POST /api/books/[id]/files – Kitap dosyası yükler (PDF, EPUB, DOC).
 * FormData: "file" (file), "format" (pdf | epub | docx | doc), isteğe bağlı "filename"
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
    const formatRaw = (formData.get('format') ?? '').toString().toLowerCase().replace('.', '');
    const format = formatRaw === 'doc' ? 'docx' : formatRaw;
    if (!ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: 'format pdf, epub veya docx olmalı' },
        { status: 400 }
      );
    }
    const filename =
      (formData.get('filename') as string) ||
      (file instanceof File ? file.name : null) ||
      `file.${format}`;
    const { url, error, pages } = await uploadBookFile(blob, id, format, filename);
    if (error || !url) {
      const msg = error?.message ?? 'Dosya yüklenemedi';
      console.error('Book file upload failed:', msg, error);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ url, ...(pages != null ? { pages } : {}) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('API POST /api/books/[id]/files error:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
