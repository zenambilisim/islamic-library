import { NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { r2GetObjectForProxy } from '@/lib/r2-storage';

export const runtime = 'nodejs';

function s3BodyToWebStream(body: unknown): ReadableStream | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as { transformToWebStream?: () => ReadableStream };
  if (typeof b.transformToWebStream === 'function') {
    try {
      return b.transformToWebStream();
    } catch {
      /* fall through to Node Readable */
    }
  }
  /** Node `stream/web` ReadableStream vs DOM lib — NextResponse accepts either at runtime */
  const asWeb = (s: ReturnType<typeof Readable.toWeb>) => s as unknown as ReadableStream;
  if (body instanceof Readable) {
    return asWeb(Readable.toWeb(body));
  }
  if (Readable.isReadable?.(body as NodeJS.ReadableStream)) {
    return asWeb(Readable.toWeb(body as Readable));
  }
  return null;
}

/**
 * R2’de public URL yokken kitap/kapak dosyalarını sunar.
 * Sadece books/… ve covers/… anahtarlarına izin verilir.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path: segments } = await params;
    if (!segments?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const key = segments.map((s) => decodeURIComponent(s)).join('/');
    const obj = await r2GetObjectForProxy(key);
    if (!obj?.body) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const webStream = s3BodyToWebStream(obj.body);
    if (!webStream) {
      console.error('[r2 proxy] unsupported GetObject body stream');
      return NextResponse.json({ error: 'Stream unsupported' }, { status: 500 });
    }

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': obj.contentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('[r2 proxy] GET failed', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
