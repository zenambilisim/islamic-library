import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, r2CreatePresignedUploadUrl } from '@/lib/r2-storage';
import { getStoragePublicUrl, supabase } from '@/lib/supabase-server';

const ALLOWED_FORMATS = ['pdf', 'epub', 'docx', 'doc'] as const;

function normalizeFormat(raw: string): string {
  const x = raw.toLowerCase().replace('.', '').trim();
  return x === 'doc' ? 'docx' : x;
}

function fileExtFromName(filename: string, fallback: string): string {
  const ext = filename.split('.').pop()?.trim().toLowerCase();
  if (!ext) return fallback;
  if (ext === 'doc') return 'docx';
  return ext;
}

function contentTypeByFormat(format: string): string | undefined {
  if (format === 'pdf') return 'application/pdf';
  if (format === 'epub') return 'application/epub+zip';
  if (format === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return undefined;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Kitap id gerekli' }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;
    const format = normalizeFormat(String(body.format ?? ''));
    if (!ALLOWED_FORMATS.includes(format as (typeof ALLOWED_FORMATS)[number])) {
      return NextResponse.json({ error: 'format pdf, epub veya docx olmalı' }, { status: 400 });
    }
    const filename = String(body.filename ?? `file.${format}`);
    const ext = fileExtFromName(filename, format);
    const filePath = `books/${id}/${id}.${ext}`;
    const contentType = contentTypeByFormat(format);
    const publicUrl = getStoragePublicUrl('book-assets', filePath);

    if (isR2Configured()) {
      const uploadUrl = await r2CreatePresignedUploadUrl(filePath, 60 * 10, {
        contentType,
        cacheControl: '3600',
      });
      return NextResponse.json({
        provider: 'r2',
        uploadUrl,
        uploadMethod: 'PUT',
        uploadHeaders: contentType ? { 'Content-Type': contentType } : {},
        filePath,
        publicUrl,
      });
    }

    const { data, error } = await supabase.storage.from('book-assets').createSignedUploadUrl(filePath);
    if (error || !data?.signedUrl || !data?.token) {
      return NextResponse.json({ error: error?.message || 'Signed upload URL oluşturulamadı' }, { status: 500 });
    }

    const uploadUrl = `${data.signedUrl}${data.signedUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(data.token)}`;
    return NextResponse.json({
      provider: 'supabase',
      uploadUrl,
      uploadMethod: 'PUT',
      uploadHeaders: {
        ...(contentType ? { 'Content-Type': contentType } : {}),
        'x-upsert': 'true',
      },
      filePath,
      publicUrl,
    });
  } catch (err) {
    console.error('POST /api/books/[id]/files/presign error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
