#!/usr/bin/env node

/**
 * Veritabanındaki kitap indexleme durumunu özetler (PDF + DOCX).
 *
 * Ortam: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env otomatik okunur)
 *
 * Kullanım:
 *   node scripts/index-books-status.mjs
 *   node scripts/index-books-status.mjs --verbose
 *   node scripts/index-books-status.mjs --limit=20
 *
 * veya: npm run index:books:status
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;
const TITLE_BATCH_SIZE = 100;

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const LIST_LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '0', 10) || 0;

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).replace(/\\n/g, '\n');
    }
    if (key && process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalizeStatus(status) {
  if (!status || status === 'null') return 'pending';
  return status;
}

async function fetchAllBookFiles({ format, formats }) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('book_files')
      .select('id, book_id, format, indexing_status')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (format) query = query.eq('format', format);
    if (formats) query = query.in('format', formats);

    const { data, error } = await query;
    if (error) throw new Error(`book_files sorgusu: ${error.message}`);
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

async function fetchBookTitles(bookIds) {
  const titles = new Map();
  const ids = [...new Set(bookIds)];
  if (ids.length === 0) return titles;

  for (let i = 0; i < ids.length; i += TITLE_BATCH_SIZE) {
    const batch = ids.slice(i, i + TITLE_BATCH_SIZE);
    const { data, error } = await supabase
      .from('books')
      .select('id, title, language_code')
      .in('id', batch);

    if (error) throw new Error(`books sorgusu: ${error.message}`);
    for (const row of data ?? []) {
      titles.set(row.id, row);
    }
  }

  return titles;
}

function printFileStatusCounts(label, files) {
  const counts = new Map();
  for (const file of files) {
    const status = normalizeStatus(file.indexing_status);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  console.log(`${label}:`);
  const order = ['completed', 'skipped', 'pending', 'failed', 'processing'];
  const seen = new Set();

  for (const status of order) {
    if (counts.has(status)) {
      console.log(`  ${status.padEnd(12)} ${counts.get(status)}`);
      seen.add(status);
    }
  }
  for (const [status, count] of counts) {
    if (!seen.has(status)) console.log(`  ${status.padEnd(12)} ${count}`);
  }
  console.log(`  ${'toplam'.padEnd(12)} ${files.length}`);
}

function summarizeByBook(pdfFiles, docxFiles) {
  /** @type {Map<string, { pdfStatus?: string, docxStatus?: string, hasPdf: boolean, hasDocx: boolean }>} */
  const byBook = new Map();

  for (const file of pdfFiles) {
    const entry = byBook.get(file.book_id) ?? { hasPdf: false, hasDocx: false };
    entry.hasPdf = true;
    entry.pdfStatus = normalizeStatus(file.indexing_status);
    byBook.set(file.book_id, entry);
  }

  for (const file of docxFiles) {
    const entry = byBook.get(file.book_id) ?? { hasPdf: false, hasDocx: false };
    entry.hasDocx = true;
    entry.docxStatus = normalizeStatus(file.indexing_status);
    byBook.set(file.book_id, entry);
  }

  const indexedBooks = [];
  const unindexedBooks = [];

  for (const [bookId, entry] of byBook) {
    const pdfStatus = entry.pdfStatus;
    const docxStatus = entry.docxStatus;

    const indexedViaPdf = pdfStatus === 'completed';
    const indexedViaDocx = docxStatus === 'completed';
    const pdfSkippedForDocx = pdfStatus === 'skipped' && indexedViaDocx;
    const isIndexed = indexedViaPdf || indexedViaDocx || pdfSkippedForDocx;

    let primaryStatus;
    let indexSource;
    if (isIndexed) {
      primaryStatus = 'completed';
      if (indexedViaPdf) indexSource = 'pdf';
      else if (indexedViaDocx) indexSource = entry.hasPdf ? 'docx (pdf başarısız)' : 'docx';
      else indexSource = 'docx';
    } else if (pdfStatus === 'failed' || docxStatus === 'failed') {
      primaryStatus = 'failed';
      indexSource = null;
    } else if (pdfStatus === 'processing' || docxStatus === 'processing') {
      primaryStatus = 'processing';
      indexSource = null;
    } else {
      primaryStatus = 'pending';
      indexSource = null;
    }

    const item = {
      bookId,
      hasPdf: entry.hasPdf,
      hasDocx: entry.hasDocx,
      pdfStatus,
      docxStatus,
      primaryStatus,
      indexSource,
    };

    if (isIndexed) indexedBooks.push(item);
    else unindexedBooks.push(item);
  }

  return { indexedBooks, unindexedBooks };
}

async function countBooksWithoutPdf(pdfFiles) {
  const { count: totalBooks, error: booksErr } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true });

  if (booksErr) throw new Error(`books sayımı: ${booksErr.message}`);

  const booksWithPdf = new Set(pdfFiles.map((f) => f.book_id));

  return {
    totalBooks: totalBooks ?? 0,
    booksWithPdf: booksWithPdf.size,
    booksWithoutPdf: Math.max(0, (totalBooks ?? 0) - booksWithPdf.size),
  };
}

async function main() {
  console.log('Indexleme durumu sorgulanıyor…\n');

  const [pdfFiles, docxFiles] = await Promise.all([
    fetchAllBookFiles({ format: 'pdf' }),
    fetchAllBookFiles({ formats: ['docx', 'doc'] }),
  ]);

  const { indexedBooks, unindexedBooks } = summarizeByBook(pdfFiles, docxFiles);
  const bookCounts = await countBooksWithoutPdf(pdfFiles);

  printFileStatusCounts('PDF dosyası (book_files)', pdfFiles);
  printFileStatusCounts('DOCX dosyası (book_files)', docxFiles);

  const indexedViaDocx = indexedBooks.filter((b) => b.indexSource?.startsWith('docx')).length;

  console.log('\nKitap (book) özeti:');
  console.log(`  PDF’i olan kitap           ${bookCounts.booksWithPdf}`);
  console.log(`  Indexlenmiş kitap          ${indexedBooks.length}`);
  console.log(`    PDF ile                  ${indexedBooks.filter((b) => b.indexSource === 'pdf').length}`);
  console.log(`    DOCX ile                 ${indexedViaDocx}`);
  console.log(`  Indexlenmemiş kitap        ${unindexedBooks.length}`);
  console.log(`  PDF’siz kitap              ${bookCounts.booksWithoutPdf}`);
  console.log(`  Toplam kitap (books)       ${bookCounts.totalBooks}`);

  const unindexedByStatus = new Map();
  for (const book of unindexedBooks) {
    unindexedByStatus.set(book.primaryStatus, (unindexedByStatus.get(book.primaryStatus) ?? 0) + 1);
  }

  if (unindexedBooks.length > 0) {
    console.log('\nIndexlenmemiş kitaplar (duruma göre):');
    for (const status of ['pending', 'failed', 'processing']) {
      const n = unindexedByStatus.get(status) ?? 0;
      if (n > 0) console.log(`  ${status.padEnd(12)} ${n}`);
    }
  }

  const showList = VERBOSE || LIST_LIMIT > 0;
  if (showList && unindexedBooks.length > 0) {
    const limit = LIST_LIMIT > 0 ? LIST_LIMIT : VERBOSE ? 50 : unindexedBooks.length;
    const slice = unindexedBooks.slice(0, limit);
    const titles = await fetchBookTitles(slice.map((b) => b.bookId));

    console.log(`\nIndexlenmemiş kitaplar (ilk ${slice.length}):`);
    for (const book of slice) {
      const meta = titles.get(book.bookId);
      const title = meta?.title ?? '(başlık yok)';
      const lang = meta?.language_code ? ` [${meta.language_code}]` : '';
      const formats = [
        book.hasPdf ? `pdf:${book.pdfStatus ?? '?'}` : null,
        book.hasDocx ? `docx:${book.docxStatus ?? '?'}` : null,
      ]
        .filter(Boolean)
        .join(', ');
      console.log(`  - ${book.bookId}  ${title}${lang}  (${book.primaryStatus}; ${formats})`);
    }
    if (unindexedBooks.length > limit) {
      console.log(`  … ve ${unindexedBooks.length - limit} kitap daha (--limit=N ile genişletin)`);
    }
  } else if (unindexedBooks.length > 0) {
    console.log('\nListe için: node scripts/index-books-status.mjs --verbose');
  }

  console.log('\nIndexleme komutu: npm run index:books');
  if (unindexedBooks.some((b) => b.primaryStatus === 'failed')) {
    console.log('Başarısız PDF’ler (DOCX varsa): npm run index:books -- --index-docx');
    console.log('Başarısız PDF’ler: npm run index:books -- --retry-failed');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
