import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';
import { countPdfPages } from '@/lib/pdf-page-count';

const ALLOWED_FORMATS = ['pdf', 'epub', 'docx', 'doc'] as const;

function normalizeFormat(raw: string): string {
  const x = raw.toLowerCase().replace('.', '').trim();
  return x === 'doc' ? 'docx' : x;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Kitap id gerekli' }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown>;
    const formatNorm = normalizeFormat(String(body.format ?? ''));
    if (!ALLOWED_FORMATS.includes(formatNorm as (typeof ALLOWED_FORMATS)[number])) {
      return NextResponse.json({ error: 'format pdf, epub veya docx olmalı' }, { status: 400 });
    }

    const filePath = String(body.filePath ?? '').trim();
    const fileUrl = String(body.publicUrl ?? '').trim();
    const size = Number(body.size ?? 0);

    if (!filePath || !fileUrl) {
      return NextResponse.json({ error: 'filePath ve publicUrl gerekli' }, { status: 400 });
    }

    if (formatNorm === 'docx') {
      await supabase.from('book_files').delete().eq('book_id', id).in('format', ['docx', 'doc']);
    } else {
      await supabase.from('book_files').delete().eq('book_id', id).eq('format', formatNorm);
    }

    const { error } = await supabase.from('book_files').insert({
      book_id: id,
      format: formatNorm,
      file_url: fileUrl,
      file_size_mb: size > 0 ? size / (1024 * 1024) : null,
      file_size_text: size > 0 ? formatFileSize(size) : null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let pages: number | null = null;
    if (formatNorm === 'pdf') {
      try {
        const { data: pdfFile, error: downloadError } = await supabase.storage
          .from('book-assets')
          .download(filePath);
        if (downloadError) {
          console.error('PDF download failed while counting pages:', downloadError);
        } else {
          const arr = await pdfFile.arrayBuffer();
          pages = await countPdfPages(Buffer.from(arr));
          if (pages != null) {
            const { error: pageErr } = await supabase.from('books').update({ pages }).eq('id', id);
            if (pageErr) {
              console.error('Error updating book pages from PDF:', pageErr);
            }
          }
        }
      } catch (pageCountErr) {
        console.error('Unexpected page count error:', pageCountErr);
      }
    }

    return NextResponse.json({ ok: true, filePath, fileUrl, ...(pages != null ? { pages } : {}) });
  } catch (err) {
    console.error('POST /api/books/[id]/files/complete error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
