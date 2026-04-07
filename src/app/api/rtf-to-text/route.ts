import { Readable } from 'node:stream';
import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error CommonJS module
import rtf2text from 'rtf2text';
// @ts-expect-error CommonJS module, no bundled types
import WordExtractor from 'word-extractor';

type DescFormat = 'rtf' | 'word' | 'txt';

function extensionLower(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

/** UTF-8 / UTF-16 (BOM’lu) düz metin — açıklama için */
function decodePlainTextBuffer(buffer: Buffer): string {
  if (buffer.length === 0) return '';
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.subarray(3).toString('utf8');
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString('utf16le');
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(buffer.subarray(2));
  }
  return buffer.toString('utf8');
}

function detectFormat(filename: string, buffer: Buffer): DescFormat | null {
  const ext = extensionLower(filename);
  if (ext === '.rtf') return 'rtf';
  if (ext === '.doc' || ext === '.docx') return 'word';
  if (ext === '.txt') return 'txt';

  const head = buffer.subarray(0, Math.min(32, buffer.length));
  const rtfProbeStart =
    buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf ? 3 : 0;
  const probe = buffer
    .subarray(rtfProbeStart, Math.min(rtfProbeStart + 512, buffer.length))
    .toString('latin1');
  if (probe.trimStart().startsWith('{\\rtf')) return 'rtf';
  if (head.length >= 4 && head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04) {
    return 'word';
  }
  if (
    head.length >= 4 &&
    head[0] === 0xd0 &&
    head[1] === 0xcf &&
    head[2] === 0x11 &&
    head[3] === 0xe0
  ) {
    return 'word';
  }
  return null;
}

/**
 * POST /api/rtf-to-text
 * FormData: "file" — RTF, .doc, .docx veya .txt (açıklama metnine çevirmek için).
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const blob = file && typeof (file as Blob).arrayBuffer === 'function' ? (file as Blob) : null;
    if (!blob) {
      return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 });
    }

    const filename = typeof (file as File).name === 'string' ? (file as File).name : '';
    const buffer = Buffer.from(await blob.arrayBuffer());
    const kind = detectFormat(filename, buffer);

    if (kind === null) {
      return NextResponse.json(
        { error: 'Desteklenen biçimler: RTF, DOC, DOCX, TXT' },
        { status: 400 }
      );
    }

    let text: string;
    if (kind === 'rtf') {
      text = await new Promise<string>((resolve, reject) => {
        const stream = Readable.from(buffer);
        rtf2text.stream(stream, (err: Error | null, result?: string) => {
          if (err) reject(err);
          else resolve(result ?? '');
        });
      });
    } else if (kind === 'txt') {
      text = decodePlainTextBuffer(buffer);
    } else {
      const extractor = new WordExtractor();
      const doc = await extractor.extract(buffer);
      text = doc.getBody() ?? '';
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error('Description file parse error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Dosya işlenemedi' },
      { status: 500 }
    );
  }
}
