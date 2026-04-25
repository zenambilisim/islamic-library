import { NextRequest, NextResponse } from 'next/server';
import { isR2Configured, r2CreatePresignedUploadUrl } from '@/lib/r2-storage';
import { getStoragePublicUrl, supabase } from '@/lib/supabase-server';

function fileExtFromName(filename: string): string {
  const ext = filename.split('.').pop()?.trim().toLowerCase();
  if (!ext) return 'jpg';
  if (ext === 'jpeg') return 'jpg';
  return ext;
}

function contentTypeByExt(ext: string): string | undefined {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Kitap id gerekli' }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;
    const filename = String(body.filename ?? 'cover.jpg');
    const ext = fileExtFromName(filename);
    const filePath = `covers/${id}-cover.${ext}`;
    const contentType = contentTypeByExt(ext);
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
    console.error('POST /api/books/[id]/cover/presign error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
