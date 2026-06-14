#!/usr/bin/env node

/**
 * Kitap dosyalarını (PDF) parçalara ayırır, OpenAI embedding üretir ve
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
 *
 * veya: npm run index:books
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import OpenAI from 'openai';

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_BATCH = 32;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const RETRY_FAILED = args.includes('--retry-failed');
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? '0', 10) || 0;
const BOOK_ID = args.find((a) => a.startsWith('--book-id='))?.split('=')[1]?.trim() || '';

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

function tryExtractStorageKey(pathOrUrl) {
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

function chunkPageText(text, pageNumber) {
  const normalized = text.replace(/\s+/g, ' ').trim();
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

  return all;
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

async function setFileStatus(fileId, status, extra = {}) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from('book_files')
    .update({ indexing_status: status, ...extra })
    .eq('id', fileId);
  if (error) throw new Error(`Durum güncellenemedi (${status}): ${error.message}`);
}

async function fetchPendingFiles() {
  let query = supabase
    .from('book_files')
    .select('id, book_id, format, file_url, content_hash, indexing_status')
    .eq('format', 'pdf')
    .order('created_at', { ascending: true });

  if (BOOK_ID) {
    query = query.eq('book_id', BOOK_ID);
  } else if (FORCE) {
    // tüm PDF'ler
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

async function indexFile(file) {
  const label = `${file.book_id} / ${file.id}`;
  console.log(`\n→ İşleniyor: ${label}`);

  if (!DRY_RUN) await setFileStatus(file.id, 'processing');

  const buffer = await downloadBookFile(file.file_url);
  const hash = sha256(buffer);

  if (!FORCE && file.indexing_status === 'completed' && file.content_hash === hash) {
    console.log('  Atlandı (içerik değişmemiş)');
    return { skipped: true };
  }

  const chunks = await extractPdfChunks(buffer);
  if (chunks.length === 0) {
    throw new Error('PDF\'den metin çıkarılamadı');
  }

  console.log(`  ${chunks.length} parça, ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

  if (DRY_RUN) {
    console.log('  [dry-run] embedding ve DB yazımı atlandı');
    return { chunks: chunks.length, dryRun: true };
  }

  const embeddings = await embedTexts(chunks.map((c) => c.content));

  const { error: delError } = await supabase
    .from('book_file_chunks')
    .delete()
    .eq('book_file_id', file.id);
  if (delError) throw new Error(`Eski parçalar silinemedi: ${delError.message}`);

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
    if (insError) throw new Error(`Parça eklenemedi: ${insError.message}`);
  }

  await setFileStatus(file.id, 'completed', {
    content_hash: hash,
    indexed_at: new Date().toISOString(),
  });

  console.log('  Tamamlandı');
  return { chunks: chunks.length };
}

async function main() {
  const logDir = resolve(process.cwd(), 'scripts/logs');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  const logFile = resolve(logDir, `index-books-${new Date().toISOString().slice(0, 10)}.log`);

  console.log('Kitap indexleme başlıyor…');
  if (DRY_RUN) console.log('(dry-run modu)');
  if (FORCE) console.log('(--force: tüm PDF dosyaları yeniden indexlenecek)');

  const files = await fetchPendingFiles();
  console.log(`${files.length} PDF dosyası bulundu.`);

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

  console.log(`\nÖzet: ${ok} indexlendi, ${skipped} atlandı, ${failed} hata`);
  if (failed > 0) console.log(`Hata logu: ${logFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
