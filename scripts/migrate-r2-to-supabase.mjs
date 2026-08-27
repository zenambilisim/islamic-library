#!/usr/bin/env node

/**
 * Cloudflare R2 → Supabase Storage (book-assets) parça parça taşıma.
 *
 * Önkoşul:
 *   1. Supabase’te public `book-assets` bucket
 *   2. (Önerilir) docs/storage-migration-table.sql çalıştırılmış olsun
 *   3. .env: R2_* + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *
 * Kullanım:
 *   node scripts/migrate-r2-to-supabase.mjs --dry-run --limit=5
 *   node scripts/migrate-r2-to-supabase.mjs --limit=20
 *   node scripts/migrate-r2-to-supabase.mjs --book-id=<uuid>
 *   node scripts/migrate-r2-to-supabase.mjs --retry-failed --limit=50
 *   node scripts/migrate-r2-to-supabase.mjs --status
 *
 * Not: R2 env’lerini henüz silme. Taşıma + doğrulama bitince kapat.
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

const PAGE_SIZE = 100;
const DEFAULT_LIMIT = 20;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RETRY_FAILED = args.includes('--retry-failed');
const STATUS_ONLY = args.includes('--status');
const SKIP_DB_UPDATE = args.includes('--skip-db-update');
const LIMIT =
  parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? String(DEFAULT_LIMIT), 10) ||
  DEFAULT_LIMIT;
const BOOK_ID = args.find((a) => a.startsWith('--book-id='))?.split('=')[1]?.trim() || '';
const OFFSET = parseInt(args.find((a) => a.startsWith('--offset='))?.split('=')[1] ?? '0', 10) || 0;

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

const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim().replace(/\/$/, '');
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
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
if (!r2Endpoint || !r2Bucket || !r2AccessKey || !r2SecretKey) {
  console.error('R2_ENDPOINT, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY gerekli.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const r2 = new S3Client({
  region: 'auto',
  endpoint: r2Endpoint,
  credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
});

const BUCKET = 'book-assets';
const logDir = resolve(process.cwd(), 'scripts/logs');
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
const logFile = resolve(logDir, `migrate-r2-${new Date().toISOString().slice(0, 10)}.log`);

function logLine(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(msg);
  appendFileSync(logFile, `${line}\n`);
}

function guessContentType(key) {
  const k = key.toLowerCase();
  if (k.endsWith('.pdf')) return 'application/pdf';
  if (k.endsWith('.epub')) return 'application/epub+zip';
  if (k.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (k.endsWith('.doc')) return 'application/msword';
  if (k.endsWith('.webp')) return 'image/webp';
  if (k.endsWith('.png')) return 'image/png';
  if (k.endsWith('.jpg') || k.endsWith('.jpeg')) return 'image/jpeg';
  if (k.endsWith('.gif')) return 'image/gif';
  if (k.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function supabasePublicUrl(key) {
  const k = key.replace(/^\/+/, '');
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${k}`;
}

function isAlreadyOnSupabase(url) {
  if (!url) return false;
  return (
    url.includes('/storage/v1/object/public/book-assets/') ||
    url.includes('/storage/v1/object/sign/book-assets/')
  );
}

function tryExtractStorageKey(pathOrUrl) {
  const s = (pathOrUrl || '').trim();
  if (!s) return null;

  if (s.startsWith('/api/storage/r2/')) {
    const rest = s.slice('/api/storage/r2/'.length).split('?')[0];
    try {
      return decodeURIComponent(rest);
    } catch {
      return rest;
    }
  }

  if (!/^https?:\/\//i.test(s)) {
    const t = s.replace(/^\/+/, '');
    if (t.startsWith('covers/') || t.startsWith('books/')) return t.split('?')[0];
    return t || null;
  }

  try {
    const marker = '/storage/v1/object/public/book-assets/';
    const idx = s.indexOf(marker);
    if (idx !== -1) return s.slice(idx + marker.length).split('?')[0] || null;

    if (r2PublicBase && s.startsWith(r2PublicBase)) {
      return s.slice(r2PublicBase.length).replace(/^\/+/, '').split('?')[0] || null;
    }

    const u = new URL(s);
    const path = u.pathname.replace(/^\/+/, '');
    if (path.startsWith('api/storage/r2/')) {
      const rest = path.slice('api/storage/r2/'.length);
      try {
        return decodeURIComponent(rest);
      } catch {
        return rest;
      }
    }
    if (path.startsWith('covers/') || path.startsWith('books/')) return path.split('?')[0];

    // R2 S3-style: /bucket/key
    if (path.startsWith(`${r2Bucket}/`)) {
      return path.slice(r2Bucket.length + 1).split('?')[0] || null;
    }
  } catch {
    return null;
  }
  return null;
}

async function streamToBuffer(body) {
  const chunks = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: r2Bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadFromR2(key) {
  const out = await r2.send(new GetObjectCommand({ Bucket: r2Bucket, Key: key }));
  if (!out.Body) throw new Error(`R2 boş: ${key}`);
  return streamToBuffer(out.Body);
}

async function uploadToSupabase(key, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(key, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new Error(`Supabase upload: ${error.message}`);
}

let trackingEnabled = true;

async function ensureTrackingAvailable() {
  const { error } = await supabase.from('storage_migration_items').select('id').limit(1);
  if (error) {
    trackingEnabled = false;
    console.warn(
      'Uyarı: storage_migration_items yok/erişilemiyor — URL tabanlı atlama kullanılacak.\n' +
        '  Öneri: docs/storage-migration-table.sql çalıştırın.\n' +
        `  (${error.message})`
    );
  }
}

async function upsertTrack(row) {
  if (!trackingEnabled || DRY_RUN) return;
  const payload = {
    ...row,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('storage_migration_items').upsert(payload, {
    onConflict: 'book_id,kind,storage_key',
  });
  if (error) {
    console.warn(`  track upsert uyarısı: ${error.message}`);
  }
}

async function markTrack(bookId, kind, storageKey, patch) {
  if (!trackingEnabled || DRY_RUN) return;
  const { error } = await supabase
    .from('storage_migration_items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('book_id', bookId)
    .eq('kind', kind)
    .eq('storage_key', storageKey);
  if (error) console.warn(`  track update uyarısı: ${error.message}`);
}

async function fetchAllRows(table, cols, buildQuery) {
  const rows = [];
  let from = 0;
  const size = 1000;
  for (;;) {
    let query = supabase.from(table).select(cols).range(from, from + size - 1);
    if (buildQuery) query = buildQuery(query);
    const { data, error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < size) break;
    from += size;
  }
  return rows;
}

async function printStatus() {
  if (!trackingEnabled) {
    console.log('Takip tablosu yok; --status için docs/storage-migration-table.sql çalıştırın.');
    return;
  }
  const data = await fetchAllRows('storage_migration_items', 'status,kind,book_id,storage_key,error');
  const counts = new Map();
  const failed = [];
  for (const row of data) {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    if (row.status === 'failed') failed.push(row);
  }
  console.log('Migration durumu:');
  for (const [status, n] of [...counts.entries()].sort()) {
    console.log(`  ${status.padEnd(12)} ${n}`);
  }
  console.log(`  ${'toplam'.padEnd(12)} ${data.length}`);
  if (failed.length) {
    console.log(`\nFailed (${failed.length}):`);
    for (const row of failed) {
      console.log(`  ${row.kind} ${row.book_id} ${row.storage_key}`);
      if (row.error) console.log(`    → ${row.error}`);
    }
    console.log('\nTekrar dene: node scripts/migrate-r2-to-supabase.mjs --retry-failed --limit=20');
  }
}

async function fetchFailedBookIds() {
  const rows = await fetchAllRows(
    'storage_migration_items',
    'book_id',
    (q) => q.eq('status', 'failed')
  );
  const ids = [...new Set(rows.map((r) => r.book_id).filter(Boolean))];
  return ids.slice(OFFSET, OFFSET + LIMIT);
}

async function fetchBookBatch() {
  if (BOOK_ID) {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, cover_image_url, language_code')
      .eq('id', BOOK_ID);
    if (error) throw new Error(`books: ${error.message}`);
    return data ?? [];
  }

  if (RETRY_FAILED) {
    if (!trackingEnabled) {
      throw new Error('--retry-failed için storage_migration_items tablosu gerekli.');
    }
    const ids = await fetchFailedBookIds();
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from('books')
      .select('id, title, cover_image_url, language_code')
      .in('id', ids);
    if (error) throw new Error(`books: ${error.message}`);
    // failed list sırasını koru
    const byId = new Map((data ?? []).map((b) => [b.id, b]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }

  const { data, error } = await supabase
    .from('books')
    .select('id, title, cover_image_url, language_code')
    .order('created_at', { ascending: true })
    .range(OFFSET, OFFSET + LIMIT - 1);
  if (error) throw new Error(`books: ${error.message}`);
  return data ?? [];
}

async function fetchBookFiles(bookId) {
  const { data, error } = await supabase
    .from('book_files')
    .select('id, format, file_url')
    .eq('book_id', bookId);
  if (error) throw new Error(`book_files: ${error.message}`);
  return data ?? [];
}

async function shouldSkipItem(bookId, kind, storageKey, currentUrl) {
  if (isAlreadyOnSupabase(currentUrl || '')) return { skip: true, reason: 'URL zaten Supabase' };

  if (trackingEnabled) {
    const { data } = await supabase
      .from('storage_migration_items')
      .select('status')
      .eq('book_id', bookId)
      .eq('kind', kind)
      .eq('storage_key', storageKey)
      .maybeSingle();

    if (data?.status === 'db_updated' || data?.status === 'skipped') {
      return { skip: true, reason: `track=${data.status}` };
    }
    if (data?.status === 'failed' && !RETRY_FAILED) {
      return { skip: true, reason: 'failed ( --retry-failed ile tekrar dene )' };
    }
  }

  // Supabase’te dosya var mı?
  const { data: listed } = await supabase.storage.from(BUCKET).list(
    storageKey.includes('/') ? storageKey.split('/').slice(0, -1).join('/') : '',
    { search: storageKey.split('/').pop(), limit: 5 }
  );
  const fileName = storageKey.split('/').pop();
  const exists = (listed ?? []).some((f) => f.name === fileName);
  if (exists && isAlreadyOnSupabase(currentUrl || '')) {
    return { skip: true, reason: 'Supabase + DB OK' };
  }

  return { skip: false };
}

async function migrateOneObject({
  bookId,
  kind,
  bookFileId,
  sourceUrl,
  storageKey,
}) {
  const targetUrl = supabasePublicUrl(storageKey);
  await upsertTrack({
    book_id: bookId,
    kind,
    book_file_id: bookFileId ?? null,
    storage_key: storageKey,
    status: 'pending',
    source_url: sourceUrl || null,
    target_url: targetUrl,
    attempts: 1,
  });

  if (!(await r2Exists(storageKey))) {
    await markTrack(bookId, kind, storageKey, {
      status: 'failed',
      error: 'R2 object not found',
    });
    throw new Error(`R2’de yok: ${storageKey}`);
  }

  if (DRY_RUN) {
    logLine(`  [dry-run] ${kind}: ${storageKey} → ${targetUrl}`);
    return { bytes: 0, targetUrl, dryRun: true };
  }

  const buffer = await downloadFromR2(storageKey);
  await uploadToSupabase(storageKey, buffer, guessContentType(storageKey));
  await markTrack(bookId, kind, storageKey, {
    status: 'copied',
    bytes: buffer.length,
    error: null,
  });

  if (!SKIP_DB_UPDATE) {
    if (kind === 'cover') {
      const { error } = await supabase
        .from('books')
        .update({ cover_image_url: targetUrl })
        .eq('id', bookId);
      if (error) throw new Error(`books update: ${error.message}`);
    } else if (bookFileId) {
      const { error } = await supabase
        .from('book_files')
        .update({ file_url: targetUrl })
        .eq('id', bookFileId);
      if (error) throw new Error(`book_files update: ${error.message}`);
    }
    await markTrack(bookId, kind, storageKey, { status: 'db_updated', target_url: targetUrl });
  }

  return { bytes: buffer.length, targetUrl };
}

async function migrateBook(book) {
  const title = (book.title || book.id).slice(0, 60);
  logLine(`\n→ ${book.id} | ${title}`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  let bytes = 0;

  // Cover
  if (book.cover_image_url) {
    const key = tryExtractStorageKey(book.cover_image_url);
    if (!key || (!key.startsWith('covers/') && !key.startsWith('books/'))) {
      logLine(`  cover atlandı (key çıkarılamadı): ${book.cover_image_url}`);
      skipped += 1;
    } else {
      const gate = await shouldSkipItem(book.id, 'cover', key, book.cover_image_url);
      if (gate.skip) {
        logLine(`  cover skip: ${gate.reason}`);
        skipped += 1;
      } else {
        try {
          const res = await migrateOneObject({
            bookId: book.id,
            kind: 'cover',
            sourceUrl: book.cover_image_url,
            storageKey: key,
          });
          ok += 1;
          bytes += res.bytes || 0;
          logLine(`  cover OK (${((res.bytes || 0) / 1024).toFixed(1)} KB)`);
        } catch (err) {
          failed += 1;
          const msg = err instanceof Error ? err.message : String(err);
          logLine(`  cover HATA: ${msg}`);
          await markTrack(book.id, 'cover', key, { status: 'failed', error: msg });
        }
      }
    }
  } else {
    logLine('  cover yok');
  }

  const files = await fetchBookFiles(book.id);
  for (const file of files) {
    const key = tryExtractStorageKey(file.file_url);
    if (!key || (!key.startsWith('covers/') && !key.startsWith('books/'))) {
      logLine(`  file[${file.format}] atlandı (key yok)`);
      skipped += 1;
      continue;
    }
    const gate = await shouldSkipItem(book.id, 'file', key, file.file_url);
    if (gate.skip) {
      logLine(`  file[${file.format}] skip: ${gate.reason}`);
      skipped += 1;
      continue;
    }
    try {
      const res = await migrateOneObject({
        bookId: book.id,
        kind: 'file',
        bookFileId: file.id,
        sourceUrl: file.file_url,
        storageKey: key,
      });
      ok += 1;
      bytes += res.bytes || 0;
      logLine(`  file[${file.format}] OK (${((res.bytes || 0) / 1024 / 1024).toFixed(2)} MB)`);
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      logLine(`  file[${file.format}] HATA: ${msg}`);
      await markTrack(book.id, 'file', key, { status: 'failed', error: msg });
    }
  }

  return { ok, skipped, failed, bytes };
}

async function main() {
  console.log('R2 → Supabase Storage migration');
  console.log(`Bucket hedef: ${BUCKET}`);
  if (DRY_RUN) console.log('(dry-run)');
  if (BOOK_ID) console.log(`book-id=${BOOK_ID}`);
  if (RETRY_FAILED) console.log('mod: yalnızca status=failed kayıtlar');
  console.log(`limit=${LIMIT} offset=${OFFSET}`);
  console.log(`log: ${logFile}`);

  await ensureTrackingAvailable();

  if (STATUS_ONLY) {
    await printStatus();
    return;
  }

  const books = await fetchBookBatch();
  console.log(`\n${books.length} kitap işlenecek.\n`);
  if (books.length === 0) {
    if (RETRY_FAILED) {
      console.log('Failed kayıt yok (veya offset dışında). yarn migrate:r2:status ile bakın.');
    } else {
      console.log('Kitap yok. --offset artırın veya filtreyi değiştirin.');
    }
    return;
  }

  let totalOk = 0;
  let totalSkip = 0;
  let totalFail = 0;
  let totalBytes = 0;

  for (const book of books) {
    const r = await migrateBook(book);
    totalOk += r.ok;
    totalSkip += r.skipped;
    totalFail += r.failed;
    totalBytes += r.bytes;
  }

  console.log('\n========== ÖZET ==========');
  console.log(`OK:      ${totalOk}`);
  console.log(`Skip:    ${totalSkip}`);
  console.log(`Fail:    ${totalFail}`);
  console.log(`Boyut:   ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Sonraki: --offset=${OFFSET + books.length} --limit=${LIMIT}`);
  if (trackingEnabled) await printStatus();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
