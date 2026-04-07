import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 (S3 uyumlu). Bucket: islamic-library gibi.
 * S3 API endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 * Tarayıcıda dosya açmak için Cloudflare’de “Public access” veya özel domain / r2.dev kökü gerekir.
 */

const accessKeyId = (process.env.R2_ACCESS_KEY_ID ?? '').trim();
const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY ?? '').trim();
const bucket = (process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET ?? 'islamic-library').trim();

/** Örnek: https://bf6db32691eee051cb124020ed3f51ac.r2.cloudflarestorage.com (bucket path’i OLMADAN) */
const endpoint = (process.env.R2_ENDPOINT ?? '').trim().replace(/\/$/, '');

/** Örnek: https://pub-xxxxx.r2.dev veya https://assets.siteniz.com — sonda / yok */
const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? '')
  .trim()
  .replace(/\/$/, '');

let client: S3Client | null = null;

export function isR2Configured(): boolean {
  return (
    accessKeyId.length > 0 &&
    secretAccessKey.length > 0 &&
    endpoint.length > 0 &&
    bucket.length > 0
  );
}

export function isR2PublicUrlConfigured(): boolean {
  return publicBase.length > 0;
}

function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new Error('R2 ortam değişkenleri eksik (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)');
  }
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

/** Genel bucket URL’si tanımlıysa doğrudan erişim linki */
export function r2PublicUrlForKey(key: string): string {
  const k = key.replace(/^\/+/, '');
  if (!publicBase) {
    throw new Error(
      'NEXT_PUBLIC_R2_PUBLIC_URL tanımlı değil. r2KeyToProxyPath() kullanın veya ortam değişkenini ekleyin.'
    );
  }
  return `${publicBase}/${k}`;
}

/**
 * Zaten uygulama proxy URL’si ise aynen döndürür (imzalı R2 URL’ine çevrilmemeli — CORS).
 */
export function normalizeAppR2ProxyPath(pathOrUrl: string): string | null {
  const t = pathOrUrl.trim();
  if (t.startsWith('/api/storage/r2/')) {
    const q = t.indexOf('?');
    return q === -1 ? t : t.slice(0, q);
  }
  if (!/^https?:\/\//i.test(t)) return null;
  try {
    const u = new URL(t);
    if (u.pathname.startsWith('/api/storage/r2/')) {
      return u.pathname + (u.search || '');
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Public URL yokken tarayıcıda kullanılacak uygulama içi proxy yolu (relative).
 * Örnek: /api/storage/r2/books%2Fuuid%2Ffile.pdf
 */
export function r2KeyToProxyPath(key: string): string {
  const k = key.replace(/^\/+/, '');
  if (!k) return '/api/storage/r2';
  return `/api/storage/r2/${k.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * DB’de saklanacak değer: tam public URL veya (public yoksa) S3 object key.
 */
export function r2StoredFileReference(key: string): string {
  const k = key.replace(/^\/+/, '');
  if (publicBase) {
    return `${publicBase}/${k}`;
  }
  return k;
}

export async function r2PutObject(
  key: string,
  body: Buffer,
  opts?: { contentType?: string; cacheControl?: string }
): Promise<{ key: string; publicUrl: string }> {
  const k = key.replace(/^\/+/, '');
  const input: PutObjectCommandInput = {
    Bucket: bucket,
    Key: k,
    Body: body,
    ...(opts?.contentType && { ContentType: opts.contentType }),
    ...(opts?.cacheControl && { CacheControl: opts.cacheControl }),
  };
  await getClient().send(new PutObjectCommand(input));
  return { key: k, publicUrl: r2StoredFileReference(k) };
}

export async function r2DeleteKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const uniq = [...new Set(keys.map((k) => k.replace(/^\/+/, '')))];
  const s3 = getClient();
  while (uniq.length > 0) {
    const batch = uniq.splice(0, 1000);
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })) },
      })
    );
  }
}

export async function r2ListKeys(prefix: string): Promise<string[]> {
  const p = prefix.replace(/^\/+/, '');
  const s3 = getClient();
  const keys: string[] = [];
  let ContinuationToken: string | undefined;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: p,
        ContinuationToken,
      })
    );
    for (const o of out.Contents ?? []) {
      if (o.Key) keys.push(o.Key);
    }
    ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return keys;
}

/** Kitap silinirken: books/{id}/* ve covers/{id}-cover.* */
export async function r2DeleteBookObjects(bookId: string): Promise<void> {
  const bookPrefix = `books/${bookId}/`;
  const bookKeys = await r2ListKeys(bookPrefix);
  const coverKeys = (await r2ListKeys('covers/')).filter(
    (k) => k.startsWith(`covers/${bookId}-cover.`)
  );
  await r2DeleteKeys([...bookKeys, ...coverKeys]);
}

/** GetObject için süreli imzalı URL (bucket özel ise) */
export async function r2GetSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
  const k = key.replace(/^\/+/, '');
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: k });
  return getSignedUrl(getClient(), cmd, { expiresIn: expiresInSeconds });
}

/** Proxy route için nesneyi oku (stream + içerik tipi) */
export async function r2GetObjectForProxy(key: string) {
  const k = key.replace(/^\/+/, '');
  if (!k.startsWith('books/') && !k.startsWith('covers/')) {
    return null;
  }
  try {
    const out = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: k }));
    if (!out.Body) return null;
    return { body: out.Body, contentType: out.ContentType };
  } catch {
    return null;
  }
}

/** Göreli path veya tam URL içinden object key (covers/… veya books/…) */
export function tryExtractStorageKey(pathOrUrl: string): string | null {
  const s = pathOrUrl.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) {
    const t = s.replace(/^\/+/, '');
    if (t.startsWith('covers/') || t.startsWith('books/')) return t.split('?')[0];
    return t || null;
  }
  try {
    const supabaseMarker = '/storage/v1/object/public/book-assets/';
    const idx = s.indexOf(supabaseMarker);
    if (idx !== -1) {
      return s.slice(idx + supabaseMarker.length).split('?')[0] ?? null;
    }
    if (publicBase && s.startsWith(publicBase)) {
      return s.slice(publicBase.length).replace(/^\/+/, '').split('?')[0] || null;
    }
    const u = new URL(s);
    const path = u.pathname.replace(/^\/+/, '').split('?')[0];
    if (path.startsWith('covers/') || path.startsWith('books/')) return path;
    return null;
  } catch {
    return null;
  }
}

export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co') && url.includes('/storage/v1/object/');
}
