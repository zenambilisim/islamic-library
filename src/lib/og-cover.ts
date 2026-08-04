import { absoluteAssetUrl } from '@/lib/seo';
import {
  isR2Configured,
  r2GetObjectForProxy,
  tryExtractStorageKey,
} from '@/lib/r2-storage';
import { getBookCoverUrl } from '@/lib/supabase-server';

function keyFromProxyPath(pathOrUrl: string): string | null {
  const marker = '/api/storage/r2/';
  const idx = pathOrUrl.indexOf(marker);
  if (idx === -1) return null;
  const rest = pathOrUrl.slice(idx + marker.length).split('?')[0];
  if (!rest) return null;
  return rest
    .split('/')
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .join('/');
}

async function bodyToDataUrl(
  body: { transformToByteArray?: () => Promise<Uint8Array> },
  contentType: string | undefined
): Promise<string | null> {
  if (typeof body.transformToByteArray !== 'function') return null;
  try {
    const bytes = await body.transformToByteArray();
    const ct = contentType || 'image/webp';
    return `data:${ct};base64,${Buffer.from(bytes).toString('base64')}`;
  } catch {
    return null;
  }
}

/** Kapak görselini OG ImageResponse için data URL’e çevirir. */
export async function loadCoverDataUrl(
  coverPath: string | null | undefined
): Promise<string | null> {
  if (!coverPath || coverPath.includes('placeholder-book')) return null;

  const resolved = getBookCoverUrl(coverPath);
  const key =
    tryExtractStorageKey(coverPath) ||
    tryExtractStorageKey(resolved) ||
    keyFromProxyPath(resolved) ||
    keyFromProxyPath(coverPath);

  if (
    key &&
    isR2Configured() &&
    (key.startsWith('covers/') || key.startsWith('books/'))
  ) {
    const obj = await r2GetObjectForProxy(key);
    if (obj?.body) {
      const data = await bodyToDataUrl(
        obj.body as { transformToByteArray?: () => Promise<Uint8Array> },
        obj.contentType
      );
      if (data) return data;
    }
  }

  const abs = absoluteAssetUrl(resolved);
  if (!abs?.startsWith('http')) return null;

  try {
    const res = await fetch(abs, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ct = res.headers.get('content-type') || 'image/jpeg';
    return `data:${ct};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}
