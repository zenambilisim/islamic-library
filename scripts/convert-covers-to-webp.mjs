#!/usr/bin/env node

/**
 * Mevcut kitap kapaklarını PNG/JPG → WebP (quality 80) dönüştürür.
 * Hedef yol: covers/{bookId}-cover.webp  (yeni yükleme ile aynı)
 *
 * Ortam: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *        R2 varsa: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *        (NEXT_PUBLIC_R2_PUBLIC_URL varsa DB’ye tam public URL yazılır)
 *
 * Kullanım (proje kökünden):
 *   node scripts/convert-covers-to-webp.mjs --status
 *   node scripts/convert-covers-to-webp.mjs --dry-run --limit=10
 *   node scripts/convert-covers-to-webp.mjs --limit=50
 *   node scripts/convert-covers-to-webp.mjs --book-id=<uuid>
 *   node scripts/convert-covers-to-webp.mjs --keep-original
 *
 * veya: npm run covers:webp:status
 *       npm run covers:webp:dry-run
 *       npm run covers:webp
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';

const PAGE_SIZE = 100;
const WEBP_QUALITY = 80;
const COVER_EXTS = ['png', 'jpg', 'jpeg', 'webp'];
const CONVERTIBLE = new Set(['png', 'jpg', 'jpeg']);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const STATUS_ONLY = args.includes('--status');
const KEEP_ORIGINAL = args.includes('--keep-original');
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

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '')
  .trim()
  .replace(/\/$/, '');
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const r2Endpoint = (process.env.R2_ENDPOINT ?? '').trim().replace(/\/$/, '');
const r2Bucket = (process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET ?? 'islamic-library').trim();
const r2AccessKey = (process.env.R2_ACCESS_KEY_ID ?? '').trim();
const r2SecretKey = (process.env.R2_SECRET_ACCESS_KEY ?? '').trim();
const r2PublicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? '')
  .trim()
  .replace(/\/$/, '');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('SUPABASE_URL (veya NEXT_PUBLIC_SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
  process.exit(1);
}

const r2Configured = Boolean(r2Endpoint && r2Bucket && r2AccessKey && r2SecretKey);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const r2 = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: r2Endpoint,
      credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
  : null;

let r2Usable = false;

function isSupabaseCoverUrl(url) {
  return /supabase\.co\/storage\/v1\/object\//i.test(url || '');
}

function destForCover(url) {
  if (r2Usable && !isSupabaseCoverUrl(url) && String(url || '').includes('/api/storage/r2/')) {
    return 'r2';
  }
  return 'supabase';
}

async function probeR2() {
  if (!r2Configured) return false;
  try {
    await r2.send(new ListObjectsV2Command({ Bucket: r2Bucket, MaxKeys: 1 }));
    return true;
  } catch (err) {
    console.warn(`R2 okunamıyor (${errText(err)}). /api/storage/r2 kapakları atlanacak.`);
    return false;
  }
}

function errText(err) {
  if (!err) return 'unknown';
  if (typeof err === 'string') return err;
  return err.message || err.Code || err.code || String(err);
}

function storedCoverUrl(dest, key) {
  const k = key.replace(/^\/+/, '');
  if (dest === 'r2') {
    return r2PublicBase ? `${r2PublicBase}/${k}` : k;
  }
  return `${supabaseUrl}/storage/v1/object/public/book-assets/${k}`;
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
    if (path.startsWith(`${r2Bucket}/`)) {
      return path.slice(r2Bucket.length + 1).split('?')[0] || null;
    }
  } catch {
    return null;
  }
  return null;
}

function extFromKey(key) {
  const base = (key || '').split('?')[0];
  const ext = (base.split('.').pop() || '').trim().toLowerCase();
  return ext === 'jpeg' ? 'jpeg' : ext;
}

function needsWebp(url, key) {
  const ext = extFromKey(key || url || '');
  return CONVERTIBLE.has(ext === 'jpeg' ? 'jpg' : ext) || CONVERTIBLE.has(ext);
}

async function r2GetBuffer(key) {
  const out = await r2.send(new GetObjectCommand({ Bucket: r2Bucket, Key: key }));
  if (!out.Body) return null;
  const bytes = await out.Body.transformToByteArray();
  return Buffer.from(bytes);
}

async function readCoverBytes(key, sourceUrl) {
  const { data, error } = await supabase.storage.from('book-assets').download(key);
  if (!error && data) {
    return Buffer.from(await data.arrayBuffer());
  }

  const urls = [];
  if (sourceUrl && /^https?:\/\//i.test(sourceUrl)) urls.push(sourceUrl);
  urls.push(`${supabaseUrl}/storage/v1/object/public/book-assets/${key}`);

  for (const url of [...new Set(urls)]) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length) return buf;
      }
    } catch {
      /* next source */
    }
  }

  if (r2Usable) {
    const buf = await r2GetBuffer(key);
    if (buf?.length) return buf;
  }

  throw new Error(`Kapak dosyası yok: ${key}`);
}

async function putWebp(dest, key, body) {
  if (dest === 'r2') {
    if (!r2Configured) throw new Error('R2 yapılandırılmamış');
    await r2.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: body,
        ContentType: 'image/webp',
        CacheControl: '3600',
      })
    );
    return;
  }
  const { error } = await supabase.storage.from('book-assets').upload(key, body, {
    cacheControl: '3600',
    upsert: true,
    contentType: 'image/webp',
  });
  if (error) throw new Error(error.message || errText(error));
}

async function deleteKeys(dest, keys) {
  const uniq = [...new Set(keys.map((k) => k.replace(/^\/+/, '')).filter(Boolean))];
  if (uniq.length === 0) return;
  if (dest === 'r2') {
    if (!r2Configured) return;
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: r2Bucket,
        Delete: { Objects: uniq.map((Key) => ({ Key })) },
      })
    );
    return;
  }
  await supabase.storage.from('book-assets').remove(uniq);
}

async function fetchCandidates() {
  const rows = [];
  if (BOOK_ID) {
    const { data, error } = await supabase
      .from('books')
      .select('id, title, cover_image_url')
      .eq('id', BOOK_ID)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) rows.push(data);
    return rows;
  }

  let from = 0;
  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('books')
      .select('id, title, cover_image_url')
      .not('cover_image_url', 'is', null)
      .or(
        'cover_image_url.ilike.%.png%,cover_image_url.ilike.%.jpg%,cover_image_url.ilike.%.jpeg%'
      )
      .order('id', { ascending: true })
      .range(from, to);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
    if (LIMIT && rows.length >= LIMIT * 4) break;
  }
  return rows;
}

async function main() {
  r2Usable = await probeR2();
  const all = await fetchCandidates();
  const candidates = [];
  let skipped = 0;
  for (const book of all) {
    const url = book.cover_image_url || '';
    const key = tryExtractStorageKey(url);
    if (!key || !needsWebp(url, key)) {
      skipped += 1;
      continue;
    }
    candidates.push({ book, key });
    if (LIMIT && candidates.length >= LIMIT) break;
  }

  const destCounts = candidates.reduce(
    (acc, { book }) => {
      const d = destForCover(book.cover_image_url);
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    },
    {}
  );

  console.log(
    [
      STATUS_ONLY ? 'status' : DRY_RUN ? 'dry-run' : 'convert',
      `hedef=${Object.entries(destCounts)
        .map(([k, v]) => `${k}:${v}`)
        .join(',') || 'yok'}`,
      `aday=${candidates.length}`,
      skipped ? `atlanan=${skipped}` : '',
      LIMIT ? `limit=${LIMIT}` : '',
      KEEP_ORIGINAL ? 'keep-original' : '',
    ]
      .filter(Boolean)
      .join(' | ')
  );

  if (STATUS_ONLY) {
    for (const { book, key } of candidates.slice(0, 15)) {
      console.log(`  ${book.id}  ${destForCover(book.cover_image_url)}  ${extFromKey(key)}  ${key}`);
    }
    if (candidates.length > 15) console.log(`  … +${candidates.length - 15} kayıt`);
    return;
  }

  let ok = 0;
  let fail = 0;
  let missing = 0;
  for (const { book, key } of candidates) {
    const storage = destForCover(book.cover_image_url);
    const webpKey = `covers/${book.id}-cover.webp`;
    const label = `${book.id}  ${book.title ?? ''}`.trim();
    try {
      if (DRY_RUN) {
        console.log(`  would convert [${storage}]  ${key} → ${webpKey}`);
        ok += 1;
        continue;
      }

      const original = await readCoverBytes(key, book.cover_image_url);
      const webp = await sharp(original).webp({ quality: WEBP_QUALITY }).toBuffer();
      await putWebp(storage, webpKey, webp);
      const publicUrl = storedCoverUrl(storage, webpKey);

      const { error } = await supabase
        .from('books')
        .update({ cover_image_url: publicUrl })
        .eq('id', book.id);
      if (error) throw new Error(error.message || errText(error));

      if (!KEEP_ORIGINAL) {
        const stale = COVER_EXTS.map((ext) => `covers/${book.id}-cover.${ext}`).filter((k) => k !== webpKey);
        if (key !== webpKey) stale.push(key);
        await deleteKeys(storage, stale).catch((err) => {
          console.warn(`  eski dosya silinemedi (${book.id}):`, errText(err));
        });
      }

      console.log(`  ok  ${label}  [${storage}] ${key} → ${webpKey}  (${original.length}→${webp.length} B)`);
      ok += 1;
    } catch (err) {
      const msg = errText(err);
      if (msg.startsWith('Kapak dosyası yok')) {
        missing += 1;
        console.warn(`  skip  ${label}  ${key}: dosya yok (R2 erişilemiyor / Supabase'de yok)`);
      } else {
        fail += 1;
        console.error(`  fail  ${label}  ${key}:`, msg);
      }
    }
  }

  console.log(`bitti  ok=${ok}  fail=${fail}  skip=${missing}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
