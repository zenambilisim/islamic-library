import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error CommonJS module
import rtf2text from 'rtf2text';
import iconv from 'iconv-lite';

/**
 * POST /api/rtf-to-text
 * FormData: "file" (RTF dosyası)
 * Döner: { text: string } veya { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const blob = file && typeof (file as Blob).arrayBuffer === 'function' ? (file as Blob) : null;
    if (!blob) {
      return NextResponse.json({ error: 'RTF dosyası gerekli' }, { status: 400 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    let rtfString: string = buffer.toString('utf8');
    if (rtfString.includes('\uFFFD')) {
      rtfString = iconv.decode(buffer, 'win1254');
    }

    const text = await new Promise<string>((resolve, reject) => {
      rtf2text.string(rtfString, (err: Error | null, result?: string) => {
        if (err) reject(err);
        else resolve(result ?? '');
      });
    });

    return NextResponse.json({ text });
  } catch (err) {
    console.error('RTF parse error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'RTF işlenemedi' },
      { status: 500 }
    );
  }
}
