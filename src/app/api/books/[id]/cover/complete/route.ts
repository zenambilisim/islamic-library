import { NextRequest, NextResponse } from 'next/server';
import { coverExtFromName, encodeCoverToWebp, shouldConvertCoverToWebp } from '@/lib/cover-webp';
import {
  isR2Configured,
  r2DeleteKeys,
  r2GetObjectBuffer,
  r2PutObject,
} from '@/lib/r2-storage';
import { getStoragePublicUrl, supabase } from '@/lib/supabase-server';

const COVER_EXTS = ['png', 'jpg', 'jpeg', 'webp'] as const;

async function readCoverBytes(filePath: string): Promise<Buffer> {
  const key = filePath.replace(/^\/+/, '');
  if (isR2Configured()) {
    const got = await r2GetObjectBuffer(key);
    if (!got?.buffer.length) {
      throw new Error('Yüklenen kapak okunamadı');
    }
    return got.buffer;
  }
  const { data, error } = await supabase.storage.from('book-assets').download(key);
  if (error || !data) {
    throw new Error(error?.message || 'Yüklenen kapak okunamadı');
  }
  return Buffer.from(await data.arrayBuffer());
}

async function deleteCoverKeys(keys: string[]): Promise<void> {
  const uniq = [...new Set(keys.map((k) => k.replace(/^\/+/, '')).filter(Boolean))];
  if (uniq.length === 0) return;
  if (isR2Configured()) {
    await r2DeleteKeys(uniq);
    return;
  }
  await supabase.storage.from('book-assets').remove(uniq);
}

async function deleteOtherCoverVariants(bookId: string, keepPath: string): Promise<void> {
  const keep = keepPath.replace(/^\/+/, '');
  const stale = COVER_EXTS.map((ext) => `covers/${bookId}-cover.${ext}`).filter((key) => key !== keep);
  try {
    await deleteCoverKeys(stale);
  } catch (err) {
    console.warn('Eski kapak varyantları silinemedi:', err);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Kitap id gerekli' }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;
    const filePath = String(body.filePath ?? '').trim().replace(/^\/+/, '');
    const filename = String(body.filename ?? filePath);

    const expectedPrefix = `covers/${id}-cover.`;
    if (!filePath.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Geçersiz kapak yolu' }, { status: 400 });
    }

    const uploadedExt = coverExtFromName(filePath || filename);
    let storedPath = filePath;
    let publicUrl = String(body.publicUrl ?? '').trim();

    if (shouldConvertCoverToWebp(uploadedExt)) {
      const original = await readCoverBytes(filePath);
      const webpBuffer = await encodeCoverToWebp(original);
      storedPath = `covers/${id}-cover.webp`;

      if (isR2Configured()) {
        const put = await r2PutObject(storedPath, webpBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600',
        });
        publicUrl = put.publicUrl;
      } else {
        const { error: uploadError } = await supabase.storage.from('book-assets').upload(storedPath, webpBuffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        });
        if (uploadError) {
          return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }
        publicUrl = getStoragePublicUrl('book-assets', storedPath);
      }

      if (filePath !== storedPath) {
        try {
          await deleteCoverKeys([filePath]);
        } catch (err) {
          console.warn('Orijinal kapak silinemedi:', err);
        }
      }
    } else if (!publicUrl) {
      publicUrl = getStoragePublicUrl('book-assets', storedPath);
    }

    if (!storedPath || !publicUrl) {
      return NextResponse.json({ error: 'filePath ve publicUrl gerekli' }, { status: 400 });
    }

    const { error } = await supabase.from('books').update({ cover_image_url: publicUrl }).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await deleteOtherCoverVariants(id, storedPath);

    return NextResponse.json({ ok: true, filePath: storedPath, url: publicUrl });
  } catch (err) {
    console.error('POST /api/books/[id]/cover/complete error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
