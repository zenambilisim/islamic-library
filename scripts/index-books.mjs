#!/usr/bin/env node

/**
 * Kitap dosyalarını (PDF / DOCX) parçalara ayırır, OpenAI embedding üretir ve
 * book_file_chunks tablosuna yazar.
 *
 * Gerekli ortam değişkenleri (.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 *   R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY (R2 dosyaları için)
 *
 * Supabase'de pgvector + match_book_chunks fonksiyonu gerekir (docs/rag-setup.sql).
 *
 * Kullanım:
 *   node scripts/index-books.mjs
 *   node scripts/index-books.mjs --dry-run
 *   node scripts/index-books.mjs --limit=5
 *   node scripts/index-books.mjs --book-id=<uuid>
 *   node scripts/index-books.mjs --force
 *   node scripts/index-books.mjs --retry-failed
 *   node scripts/index-books.mjs --retry-processing
 *   node scripts/index-books.mjs --index-docx
 *
 * veya: npm run index:books
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import WordExtractor from 'word-extractor';

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_BATCH = 32;
const DELETE_BATCH = 200;
const PAGE_SIZE = 1000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const RETRY_FAILED = args.includes('--retry-failed');
const RETRY_PROCESSING = args.includes('--retry-processing');
const INDEX_DOCX = args.includes('--index-docx');
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '0', 10) || 0;
const BOOK_ID = args.find((a) => a.startsWith('--book-id='))?.split('=')[1]?.trim() || '';

function formatDuration(ms) {
  const totalSec = ms / 1000;
  if (totalSec < 60) return `${totalSec.toFixed(1)} sn`;
  const min = Math.floor(totalSec / 60);
  const sec = (totalSec % 60).toFixed(1);
  if (min < 60) return `${min} dk ${sec} sn`;
  const hours = Math.floor(min / 60);
  const remainMin = min % 60;
  return `${hours} sa ${remainMin} dk ${sec} sn`;
}

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
const openaiKey = (process.env.OPENAI_API_KEY ?? '').trim();

const r2Endpoint = (process.env.R2_ENDPOINT ?? '').trim().replace(/\/$/, '');
const r2Bucket = (process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET ?? 'islamic-library').trim();
const r2AccessKey = (process.env.R2_ACCESS_KEY_ID ?? '').trim();
const r2SecretKey = (process.env.R2_SECRET_ACCESS_KEY ?? '').trim();
const r2PublicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? '')
  .trim()
  .replace(/\/$/, '');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}
if (!openaiKey && !DRY_RUN) {
  console.error('OPENAI_API_KEY gerekli (--dry-run hariç).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;

let r2Client = null;
function isR2Configured() {
  return r2Endpoint && r2Bucket && r2AccessKey && r2SecretKey;
}
function getR2Client() {
  if (!isR2Configured()) return null;
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
    });
  }
  return r2Client;
}

const R2_PROXY_PREFIX = '/api/storage/r2/';

function tryExtractR2ProxyKey(pathOrUrl) {
  const s = pathOrUrl.trim();
  if (!s) return null;

  let rest = null;
  if (s.startsWith(R2_PROXY_PREFIX)) {
    rest = s.slice(R2_PROXY_PREFIX.length);
  } else {
    const withoutLeading = s.replace(/^\/+/, '');
    if (withoutLeading.startsWith('api/storage/r2/')) {
      rest = withoutLeading.slice('api/storage/r2/'.length);
    }
  }

  if (!rest && /^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (u.pathname.startsWith(R2_PROXY_PREFIX)) {
        rest = u.pathname.slice(R2_PROXY_PREFIX.length);
      }
    } catch {
      return null;
    }
  }

  if (!rest) return null;
  const q = rest.indexOf('?');
  if (q !== -1) rest = rest.slice(0, q);
  rest = rest.replace(/^\/+/, '');
  if (!rest) return null;

  try {
    return decodeURIComponent(rest);
  } catch {
    return rest;
  }
}

function tryExtractStorageKey(pathOrUrl) {
  const s = pathOrUrl.trim();
  if (!s) return null;

  const proxyKey = tryExtractR2ProxyKey(s);
  if (proxyKey && (proxyKey.startsWith('covers/') || proxyKey.startsWith('books/'))) {
    return proxyKey;
  }

  if (!/^https?:\/\//i.test(s)) {
    const t = s.replace(/^\/+/, '');
    if (t.startsWith('covers/') || t.startsWith('books/')) return t.split('?')[0];
    return t || null;
  }
  try {
    const supabaseMarker = '/storage/v1/object/public/book-assets/';
    const idx = s.indexOf(supabaseMarker);
    if (idx !== -1) return s.slice(idx + supabaseMarker.length).split('?')[0] ?? null;
    if (r2PublicBase && s.startsWith(r2PublicBase)) {
      return s.slice(r2PublicBase.length).replace(/^\/+/, '').split('?')[0] || null;
    }
    const u = new URL(s);
    const path = u.pathname.replace(/^\/+/, '').split('?')[0];
    if (path.startsWith('covers/') || path.startsWith('books/')) return path;
    return null;
  } catch {
    return null;
  }
}

function isSupabaseStorageUrl(url) {
  return url.includes('supabase.co') && url.includes('/storage/v1/object/');
}

async function streamToBuffer(body) {
  const chunks = [];
  for await (const chunk of body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function downloadFromR2(key) {
  const client = getR2Client();
  if (!client) throw new Error('R2 yapılandırılmamış');
  const out = await client.send(new GetObjectCommand({ Bucket: r2Bucket, Key: key }));
  if (!out.Body) throw new Error(`R2 nesnesi boş: ${key}`);
  return streamToBuffer(out.Body);
}

async function downloadFromSupabaseStorage(key) {
  const { data, error } = await supabase.storage.from('book-assets').download(key);
  if (error || !data) throw new Error(`Supabase storage indirme hatası: ${error?.message ?? key}`);
  return Buffer.from(await data.arrayBuffer());
}

async function downloadBookFile(fileUrl) {
  const key = tryExtractStorageKey(fileUrl);
  if (key && isR2Configured()) {
    return downloadFromR2(key);
  }
  if (key && (isSupabaseStorageUrl(fileUrl) || !fileUrl.startsWith('http'))) {
    return downloadFromSupabaseStorage(key);
  }
  if (fileUrl.startsWith('http')) {
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${fileUrl}`);
    return Buffer.from(await res.arrayBuffer());
  }
  if (key) return downloadFromSupabaseStorage(key);
  throw new Error(`Dosya indirilemedi: ${fileUrl}`);
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** PostgreSQL / JSON insert için güvenli metin (null byte, surrogate, bozuk \\u). */
function sanitizeChunkContent(text) {
  let s = text.replace(/\0/g, '');

  // UTF-16 surrogate çiftleri dışında kalan surrogate'leri at (PostgreSQL UTF-8 hatası)
  s = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '');
  s = s.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');

  // JSON unicode kaçışı gibi görünen ama geçersiz \uXXXX dizilerini nötrle
  s = s.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');

  return s.replace(/[\uFFFE\uFFFF]/g, '');
}

function chunkPageText(text, pageNumber) {
  const normalized = sanitizeChunkContent(text.replace(/\s+/g, ' ').trim());
  if (!normalized) return [];

  const chunks = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    chunks.push({
      page_number: pageNumber,
      chunk_index: chunkIndex,
      content: normalized.slice(start, end),
    });
    if (end >= normalized.length) break;
    start = Math.max(0, end - CHUNK_OVERLAP);
    chunkIndex += 1;
  }

  return chunks;
}

async function extractPdfChunks(buffer) {
  try {
    await import('@napi-rs/canvas');
  } catch {
    // pdfjs-dist Node ortamında DOMMatrix için @napi-rs/canvas gerekir
  }

  let PDFParse;
  try {
    ({ PDFParse } = await import('pdf-parse'));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `pdf-parse yüklenemedi (${msg}). Node.js 20+ ve npm install @napi-rs/canvas deneyin.`
    );
  }

  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const all = [];

  for (const page of result.pages ?? []) {
    const pageChunks = chunkPageText(page.text ?? '', page.num ?? 1);
    all.push(...pageChunks);
  }

  if (all.length === 0 && result.text?.trim()) {
    all.push(...chunkPageText(result.text, 1));
  }

  if (all.length === 0) {
    const pageCount = result.total ?? result.pages?.length ?? 0;
    const textChars = (result.text ?? '').replace(/\s/g, '').length;
    if (pageCount > 0 && textChars === 0) {
      throw new Error(
        `PDF taranmış görüntü (OCR metin katmanı yok): ${pageCount} sayfa, çıkarılabilir metin 0 karakter`
      );
    }
    throw new Error('PDF\'den metin çıkarılamadı');
  }

  return all;
}

async function extractDocxChunks(buffer) {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  const text = doc.getBody() ?? '';
  const chunks = chunkPageText(text, 1);

  if (chunks.length === 0) {
    const textChars = text.replace(/\s/g, '').length;
    if (textChars === 0) {
      throw new Error('DOCX dosyasından metin çıkarılamadı (boş veya desteklenmeyen biçim)');
    }
    throw new Error('DOCX\'den metin çıkarılamadı');
  }

  return chunks;
}

async function extractChunks(buffer, format) {
  const formatNorm = format === 'doc' ? 'docx' : format;
  if (formatNorm === 'docx') return extractDocxChunks(buffer);
  if (formatNorm === 'pdf') return extractPdfChunks(buffer);
  throw new Error(`Desteklenmeyen format: ${format}`);
}

async function embedTexts(texts) {
  if (!openai) throw new Error('OpenAI yapılandırılmamış');
  const embeddings = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH);
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    for (const item of res.data) {
      embeddings.push(item.embedding);
    }
  }

  return embeddings;
}

async function deleteChunksForFile(bookFileId) {
  let removed = 0;

  while (true) {
    const { data, error } = await supabase
      .from('book_file_chunks')
      .delete()
      .eq('book_file_id', bookFileId)
      .select('id')
      .limit(DELETE_BATCH);

    if (error) throw new Error(`Eski parçalar silinemedi: ${error.message}`);
    if (!data?.length) break;

    removed += data.length;
    if (data.length < DELETE_BATCH) break;
  }

  if (removed > 0) {
    console.log(`  ${removed} eski parça silindi`);
  }
}

async function setFileStatus(fileId, status, extra = {}) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from('book_files')
    .update({ indexing_status: status, ...extra })
    .eq('id', fileId);
  if (error) throw new Error(`Durum güncellenemedi (${status}): ${error.message}`);
}

/** PDF başarısızken DOCX ile indexlendiyse PDF kaydını failed yerine skipped yapar. */
async function markPdfSkippedWhenDocxIndexed(bookId) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from('book_files')
    .update({ indexing_status: 'skipped' })
    .eq('book_id', bookId)
    .eq('format', 'pdf')
    .eq('indexing_status', 'failed');
  if (error) throw new Error(`PDF skipped güncellenemedi: ${error.message}`);
}

async function fetchPendingFiles() {
  if (INDEX_DOCX) return fetchDocxTargetFiles();

  let query = supabase
    .from('book_files')
    .select('id, book_id, format, file_url, content_hash, indexing_status')
    .eq('format', 'pdf')
    .order('created_at', { ascending: true });

  if (BOOK_ID) {
    query = query.eq('book_id', BOOK_ID);
  } else if (FORCE) {
    // tüm PDF'ler
  } else if (RETRY_PROCESSING) {
    query = query.eq('indexing_status', 'processing');
  } else if (RETRY_FAILED) {
    query = query.in('indexing_status', ['pending', 'failed']);
  } else {
    query = query.or('indexing_status.is.null,indexing_status.eq.pending');
  }

  if (LIMIT > 0) query = query.limit(LIMIT);

  const { data, error } = await query;
  if (error) throw new Error(`book_files sorgusu: ${error.message}`);
  return data ?? [];
}

async function fetchAllBookFiles({ format, formats, select = 'book_id, indexing_status' }) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('book_files')
      .select(select)
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

async function fetchDocxTargetFiles() {
  const pdfFiles = await fetchAllBookFiles({ format: 'pdf' });

  const failedPdfBookIds = new Set(
    pdfFiles.filter((f) => f.indexing_status === 'failed').map((f) => f.book_id)
  );
  const hasPdfBookIds = new Set(pdfFiles.map((f) => f.book_id));

  const docxFiles = await fetchAllBookFiles({
    formats: ['docx', 'doc'],
    select: 'id, book_id, format, file_url, content_hash, indexing_status',
  });

  let results = docxFiles.filter((f) => {
    if (BOOK_ID && f.book_id !== BOOK_ID) return false;
    if (failedPdfBookIds.has(f.book_id)) return true;
    return !hasPdfBookIds.has(f.book_id);
  });

  if (!FORCE) {
    results = results.filter(
      (f) => !f.indexing_status || f.indexing_status === 'pending' || f.indexing_status === 'failed'
    );
  }

  if (LIMIT > 0) results = results.slice(0, LIMIT);
  return results;
}

async function indexFile(file) {
  const formatLabel = file.format === 'doc' ? 'docx' : file.format;
  const label = `${file.book_id} / ${file.id}`;
  console.log(`\n→ İşleniyor (${formatLabel}): ${label}`);

  if (!DRY_RUN) await setFileStatus(file.id, 'processing');

  const buffer = await downloadBookFile(file.file_url);
  const hash = sha256(buffer);

  if (!FORCE && file.indexing_status === 'completed' && file.content_hash === hash) {
    console.log('  Atlandı (içerik değişmemiş)');
    return { skipped: true };
  }

  const chunks = await extractChunks(buffer, file.format);

  console.log(`  ${chunks.length} parça, ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  if (DRY_RUN) {
    console.log('  [dry-run] embedding ve DB yazımı atlandı');
    return { chunks: chunks.length, dryRun: true };
  }

  await deleteChunksForFile(file.id);

  const embeddings = await embedTexts(chunks.map((c) => c.content));

  const rows = chunks.map((chunk, i) => ({
    book_id: file.book_id,
    book_file_id: file.id,
    page_number: chunk.page_number,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    embedding: embeddings[i],
  }));

  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error: insError } = await supabase.from('book_file_chunks').insert(batch);
    if (insError) {
      const batchNo = Math.floor(i / 100) + 1;
      throw new Error(`Parça eklenemedi (batch ${batchNo}): ${insError.message}`);
    }
  }

  await setFileStatus(file.id, 'completed', {
    content_hash: hash,
    indexed_at: new Date().toISOString(),
  });

  const formatNorm = file.format === 'doc' ? 'docx' : file.format;
  if (formatNorm === 'docx') {
    await markPdfSkippedWhenDocxIndexed(file.book_id);
  }

  console.log('  Tamamlandı');
  return { chunks: chunks.length };
}

async function main() {
  const startedAt = Date.now();
  const logDir = resolve(process.cwd(), 'scripts/logs');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  const logFile = resolve(logDir, `index-books-${new Date().toISOString().slice(0, 10)}.log`);

  console.log('Kitap indexleme başlıyor…');
  if (DRY_RUN) console.log('(dry-run modu)');
  if (FORCE) console.log('(--force: tüm PDF dosyaları yeniden indexlenecek)');
  if (RETRY_PROCESSING) console.log('(--retry-processing: yarım kalmış dosyalar)');
  if (INDEX_DOCX) console.log('(--index-docx: PDF başarısız veya PDF’siz kitapların DOCX dosyaları)');

  const files = await fetchPendingFiles();
  const formatLabel = INDEX_DOCX ? 'DOCX' : 'PDF';
  console.log(`${files.length} ${formatLabel} dosyası bulundu.`);
  if (INDEX_DOCX && files.length > 0) {
    const pdfFiles = await fetchAllBookFiles({ format: 'pdf' });
    const failedPdfBookIds = new Set(
      pdfFiles.filter((f) => f.indexing_status === 'failed').map((f) => f.book_id)
    );
    const hasPdfBookIds = new Set(pdfFiles.map((f) => f.book_id));
    const failedCount = files.filter((f) => failedPdfBookIds.has(f.book_id)).length;
    const noPdfCount = files.filter((f) => !hasPdfBookIds.has(f.book_id)).length;
    console.log(`  ${failedCount} başarısız PDF kitabı, ${noPdfCount} PDF’siz kitap`);
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const result = await indexFile(file);
      if (result.skipped) skipped += 1;
      else ok += 1;
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  HATA: ${msg}`);
      appendFileSync(logFile, `[${new Date().toISOString()}] ${file.id}: ${msg}\n`);
      if (!DRY_RUN) {
        await setFileStatus(file.id, 'failed').catch(() => {});
      }
    }
  }

  const elapsed = Date.now() - startedAt;
  console.log(`\nÖzet: ${ok} indexlendi, ${skipped} atlandı, ${failed} hata`);
  console.log(`Süre: ${formatDuration(elapsed)}`);
  if (failed > 0) console.log(`Hata logu: ${logFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
