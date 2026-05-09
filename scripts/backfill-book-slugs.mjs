#!/usr/bin/env node

/**
 * Veritabanından yalnızca slug'ı null veya tamamen boş string olan satırları çeker (sayfalı),
 * başlık + dil ile slug yazar. (Sadece boşluk karakterinden oluşan slug’lar SQL’de ayrı filtre
 * gerektirir; gerekirse Supabase’de trim ile düzeltin.)
 *
 * Mantık `src/lib/author-db.ts` içindeki `slugifyBookTitle` ile uyumlu tutulmalı (değişirse güncelleyin).
 *
 * Ortam: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Proje kökündeki .env otomatik okunur (basit KEY=VALUE).
 *
 * Not: PostgREST sayfa boyutu 1000; yalnız slug’ı eksik satırlar çekildiği için ağ ve bellek yükü düşük.
 *
 * Kullanım:
 *   node scripts/backfill-book-slugs.mjs
 *   node scripts/backfill-book-slugs.mjs --dry-run
 *   node scripts/backfill-book-slugs.mjs --limit=50
 *
 * veya: npm run backfill:book-slugs
 */

import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const AUTHOR_LANGS = new Set(['tr', 'en', 'ru', 'az']);

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

function normalizeLanguageCode(code, fallback = 'tr') {
  const s = String(code ?? '')
    .trim()
    .toLowerCase()
    .split('-')[0];
  return AUTHOR_LANGS.has(s) ? s : fallback;
}

const CYRILLIC_TO_LATIN = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  і: 'i',
  ї: 'yi',
  є: 'e',
  ґ: 'g',
  ը: 'e',
};

function transliterateCyrillicSegment(input) {
  let out = '';
  for (const ch of input) {
    out += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return out;
}

function slugifyBookTitle(title, languageCode) {
  const lang = normalizeLanguageCode(languageCode, 'tr');
  const raw = (title || '').trim();
  if (!raw) return 'book';

  let s =
    lang === 'ru'
      ? transliterateCyrillicSegment(raw.toLocaleLowerCase('ru'))
      : raw.toLowerCase();

  if (lang === 'tr' || lang === 'az') {
    const trAz = {
      ğ: 'g',
      ü: 'u',
      ş: 's',
      ı: 'i',
      i: 'i',
      ö: 'o',
      ç: 'c',
      â: 'a',
      î: 'i',
      û: 'u',
      İ: 'i',
      I: 'i',
      ə: 'e',
    };
    s = s.replace(/[ğüşıöçâîûİIə]/g, (c) => trAz[c] ?? c);
  }

  s = s.normalize('NFD').replace(/\p{M}/gu, '');
  s = s.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return s || 'book';
}

/** Bu slug başka satırda kullanılıyor mu? (maybeSingle yerine limit(1); çoklu satır hatası olmaz.) */
async function isSlugTaken(client, slug, excludeBookId) {
  const { data, error } = await client
    .from('books')
    .select('id')
    .eq('slug', slug)
    .neq('id', excludeBookId)
    .limit(1);
  if (error) return { taken: false, error };
  return { taken: (data?.length ?? 0) > 0, error: null };
}

async function ensureUniqueBookSlug(client, title, languageCode, excludeBookId) {
  const lang = normalizeLanguageCode(languageCode, 'tr');
  let base = slugifyBookTitle(title, lang);
  if (!base) base = 'book';

  let slug = base;
  for (let attempt = 0; attempt < 10; attempt++) {
    const { taken, error } = await isSlugTaken(client, slug, excludeBookId);
    if (error) return { slug: base, error };
    if (!taken) return { slug, error: null };
    slug = `${base}-${randomBytes(3).toString('hex')}`;
  }
  return { slug: `${base}-${randomBytes(4).toString('hex')}`, error: null };
}

function parseArgs() {
  const dryRun = process.argv.includes('--dry-run');
  let limit;
  for (const a of process.argv) {
    if (a.startsWith('--limit=')) {
      const n = parseInt(a.slice('--limit='.length), 10);
      if (Number.isFinite(n) && n > 0) limit = n;
    }
  }
  return { dryRun, limit };
}

/**
 * Sadece slug’ı güncellenmesi gereken satırlar: `slug IS NULL` veya `slug = ''`.
 * İki ayrı sorgu (PostgREST OR ile kolon tipi/locale sorunlarından kaçınmak için); id ile birleştirilir.
 */
async function fetchBooksNeedingSlug(client) {
  const pageSize = 1000;
  const full = 'id, title, language_code, language, slug';
  const min = 'id, title, language_code, slug';
  const probe = await client.from('books').select(full).limit(1);
  const selectCols =
    probe.error && /language|column/i.test(probe.error.message ?? '') ? min : full;

  const byId = new Map();

  async function pullFiltered(applyFilter) {
    let from = 0;
    for (;;) {
      let q = client.from('books').select(selectCols);
      q = applyFilter(q);
      q = q.order('id', { ascending: true }).range(from, from + pageSize - 1);
      const { data, error } = await q;
      if (error) throw error;
      const batch = data ?? [];
      for (const row of batch) {
        byId.set(row.id, row);
      }
      if (batch.length < pageSize) break;
      from += pageSize;
    }
  }

  await pullFiltered((q) => q.is('slug', null));
  await pullFiltered((q) => q.eq('slug', ''));

  return [...byId.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

async function main() {
  const { dryRun, limit } = parseArgs();

  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env veya ortam değişkeni).');
    process.exit(1);
  }

  const client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let rows;
  try {
    rows = await fetchBooksNeedingSlug(client);
  } catch (fetchError) {
    console.error('Kitaplar alınamadı:', fetchError instanceof Error ? fetchError.message : fetchError);
    process.exit(1);
  }

  const needSlug = rows.filter((r) => {
    const s = r.slug;
    return s == null || String(s).trim() === '';
  });

  const toProcess = limit != null ? needSlug.slice(0, limit) : needSlug;

  console.log(
    `Sorgu: slug null veya boş string. Toplam ${needSlug.length} kayıt; işlenecek: ${toProcess.length}${dryRun ? ' (dry-run)' : ''}.`
  );

  let ok = 0;
  let fail = 0;

  for (const row of toProcess) {
    const title = (row.title ?? '').trim();
    if (!title) {
      console.warn(`Atlandı (başlık boş): ${row.id}`);
      fail++;
      continue;
    }

    const langRaw = row.language_code ?? row.language ?? 'tr';
    const slugRes = await ensureUniqueBookSlug(client, title, langRaw, row.id);

    if (slugRes.error) {
      console.error(`Slug üretilemedi ${row.id}:`, slugRes.error.message);
      fail++;
      continue;
    }

    if (dryRun) {
      console.log(
        `[dry-run] ${row.id} → slug=${slugRes.slug} (lang=${normalizeLanguageCode(langRaw)})`
      );
      ok++;
      continue;
    }

    const { data: updatedRows, error: upErr } = await client
      .from('books')
      .update({ slug: slugRes.slug })
      .eq('id', row.id)
      .select('id');
    if (upErr) {
      console.error(`Güncellenemedi ${row.id}:`, upErr.message);
      fail++;
    } else if (!updatedRows?.length) {
      console.error(
        `Hiç satır güncellenmedi ${row.id} (RLS mi, yanlış anahtar mı? service role kullanın).`
      );
      fail++;
    } else {
      console.log(`OK ${row.id} → ${slugRes.slug}`);
      ok++;
    }
  }

  console.log(`Bitti. Başarılı: ${ok}, hata/atlanan: ${fail}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
