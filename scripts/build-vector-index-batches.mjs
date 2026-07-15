#!/usr/bin/env node

/**
 * book_file_chunks için parçalı HNSW indeks oluşturur.
 * Büyük tablolarda tek seferde CREATE INDEX bellek/timeout verir; bu script
 * kitapları ~5000 chunk'lık gruplara böler ve her grup için ayrı partial indeks kurar.
 *
 * Ön koşul:
 *   1. docs/rag-setup-batched.sql → Supabase SQL Editor
 *   2. .env → SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   3. DATABASE_URL veya --db-url (psql bağlantı URI'si)
 *   4. psql (Windows: PostgreSQL kurulumu veya PSQL_PATH)
 *
 * Kullanım:
 *   npm run index:vector-batches
 *   npm run index:vector-batches -- --dry-run
 *   npm run index:vector-batches -- --batch-size=4000
 *   npm run index:vector-batches -- --from-batch=3
 *   npm run index:vector-batches -- --db-url="postgresql://..."
 *
 * Windows örnek:
 *   set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe
 *   npm run index:vector-batches -- --db-url="postgresql://postgres.[REF]:[ŞİFRE]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_CHUNKS_PER_BATCH = 2000;
const PAGE_SIZE = 1000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const CHUNKS_PER_BATCH =
  parseInt(args.find((a) => a.startsWith('--batch-size='))?.split('=')[1] ?? '0', 10) ||
  DEFAULT_CHUNKS_PER_BATCH;
const FROM_BATCH =
  parseInt(args.find((a) => a.startsWith('--from-batch='))?.split('=')[1] ?? '1', 10) || 1;

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

const DB_URL =
  args.find((a) => a.startsWith('--db-url='))?.split('=').slice(1).join('=').trim() ||
  (process.env.DATABASE_URL ?? '').trim();

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

function progressBar(done, total, width = 20) {
  if (!total) return `[${' '.repeat(width)}]`;
  const filled = Math.min(width, Math.round((done / total) * width));
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`;
}

function findPsql() {
  const fromEnv = (process.env.PSQL_PATH ?? '').trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates = [
    'psql',
    'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
    'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
    '/c/Program Files/PostgreSQL/18/bin/psql.exe',
    '/c/Program Files/PostgreSQL/17/bin/psql.exe',
  ];

  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
    if (probe.status === 0) return candidate;
  }

  return null;
}

function buildWhereClause(bookIds, sliceFilters) {
  if (sliceFilters?.length) {
    return sliceFilters
      .map(
        (s) =>
          `(book_id = '${s.book_id}'::uuid and id >= '${s.id_min}'::uuid and id <= '${s.id_max}'::uuid)`
      )
      .join(' or ');
  }
  const uuidList = bookIds.map((id) => `'${id}'`).join(', ');
  return `book_id = any(array[${uuidList}]::uuid[])`;
}

async function fetchBookChunkSlices(supabase, bookId, maxChunks) {
  const { data, error } = await supabase.rpc('plan_book_chunk_slices', {
    p_book_id: bookId,
    p_max_chunks: maxChunks,
  });

  if (error) {
    if (/plan_book_chunk_slices|function.*does not exist|could not find the function/i.test(error.message)) {
      throw new Error(
        'plan_book_chunk_slices bulunamadı. Script psql ile otomatik kurar; DATABASE_URL ve PSQL_PATH tanımlı olmalı.'
      );
    }
    throw new Error(`Kitap slice planı alınamadı (${bookId}): ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    book_id: bookId,
    id_min: row.id_min,
    id_max: row.id_max,
    chunk_count: Number(row.chunk_count),
  }));
}

async function buildBatches(supabase, bookCounts, maxChunks) {
  const batches = [];
  let current = { bookIds: [], chunkCount: 0, sliceFilters: null };

  const sorted = [...bookCounts].sort((a, b) => b.chunkCount - a.chunkCount);

  for (const row of sorted) {
    if (row.chunkCount > maxChunks) {
      if (current.bookIds.length > 0) {
        batches.push(current);
        current = { bookIds: [], chunkCount: 0, sliceFilters: null };
      }

      const slices = await fetchBookChunkSlices(supabase, row.bookId, maxChunks);
      for (const slice of slices) {
        batches.push({
          bookIds: [row.bookId],
          chunkCount: slice.chunk_count,
          sliceFilters: [
            { book_id: slice.book_id, id_min: slice.id_min, id_max: slice.id_max },
          ],
        });
      }
      continue;
    }

    if (current.chunkCount + row.chunkCount > maxChunks && current.bookIds.length > 0) {
      batches.push(current);
      current = { bookIds: [], chunkCount: 0, sliceFilters: null };
    }

    current.bookIds.push(row.bookId);
    current.chunkCount += row.chunkCount;
  }

  if (current.bookIds.length > 0) batches.push(current);
  return batches;
}

async function fetchChunkCountsByBook(supabase) {
  const counts = new Map();
  let from = 0;

  console.log('Chunk sayıları okunuyor…');
  while (true) {
    const { data, error } = await supabase
      .from('book_file_chunks')
      .select('book_id')
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`book_file_chunks okunamadı: ${error.message}`);
    if (!data?.length) break;

    for (const row of data) {
      const id = row.book_id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    process.stdout.write(`\r  ${counts.size} kitap, ${[...counts.values()].reduce((a, b) => a + b, 0)} chunk yüklendi…`);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  process.stdout.write('\n');

  return [...counts.entries()].map(([bookId, chunkCount]) => ({ bookId, chunkCount }));
}

function sqlForBatch(indexName, bookIds, sliceFilters) {
  const where = buildWhereClause(bookIds, sliceFilters);
  return `
\\set ON_ERROR_STOP on
set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set maintenance_work_mem = '64MB';
set max_parallel_maintenance_workers = 0;

drop index if exists ${indexName};

create index ${indexName}
  on book_file_chunks
  using hnsw (embedding vector_cosine_ops)
  where ${where};

analyze book_file_chunks;
`;
}

function ensureSlicePlanner(psqlPath, dbUrl) {
  const sqlPath = resolve(process.cwd(), 'docs/rag-setup-plan-slices.sql');
  if (!existsSync(sqlPath)) {
    throw new Error('docs/rag-setup-plan-slices.sql bulunamadı');
  }
  console.log('Slice planlayıcı kuruluyor (plan_book_chunk_slices)…');
  runPsql(psqlPath, dbUrl, readFileSync(sqlPath, 'utf8'));
}

function runPsql(psqlPath, dbUrl, sqlText) {
  const tmpDir = resolve(process.cwd(), 'scripts/logs');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const tmpFile = resolve(tmpDir, `vector-batch-${Date.now()}.sql`);
  writeFileSync(tmpFile, sqlText, 'utf8');

  try {
    const result = spawnSync(psqlPath, [dbUrl, '-f', tmpFile], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.stdout?.trim()) console.log(result.stdout.trim());
    if (result.stderr?.trim()) console.error(result.stderr.trim());

    if (result.status !== 0) {
      throw new Error(`psql çıkış kodu ${result.status ?? '?'}`);
    }
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      // ignore
    }
  }
}

function isMissingBatchTableError(message) {
  return /relation .* does not exist|could not find the table.*chunk_index_batches/i.test(message ?? '');
}

function missingBatchTableHelp() {
  return (
    'chunk_index_batches tablosu yok.\n' +
    '  → Supabase Dashboard → SQL Editor\n' +
    '  → docs/rag-setup-batched.sql içeriğini yapıştırıp Run\n' +
    '  → Sonra komutu tekrar çalıştırın.'
  );
}

async function syncBatchPlan(supabase, batches, force) {
  if (!force) {
    const { count, error } = await supabase
      .from('chunk_index_batches')
      .select('*', { count: 'exact', head: true });
    if (error) {
      if (isMissingBatchTableError(error.message)) {
        throw new Error(missingBatchTableHelp());
      }
      throw new Error(`chunk_index_batches okunamadı: ${error.message}`);
    }
    if ((count ?? 0) > 0) {
      console.log(`Mevcut batch planı kullanılıyor (${count} batch). Yeniden plan için --force ekleyin.`);
      const { data, error: fetchError } = await supabase
        .from('chunk_index_batches')
        .select('batch_no, index_name, book_ids, chunk_count, index_ready, slice_filters')
        .order('batch_no', { ascending: true });
      if (fetchError) throw new Error(fetchError.message);
      return data ?? [];
    }
  }

  if (force) {
    const { error: delError } = await supabase.from('chunk_index_batches').delete().neq('batch_no', -1);
    if (delError) throw new Error(`Eski batch planı silinemedi: ${delError.message}`);
  }

  const rows = batches.map((batch, i) => ({
    batch_no: i + 1,
    index_name: `book_file_chunks_embedding_hnsw_b${String(i + 1).padStart(3, '0')}`,
    book_ids: batch.bookIds,
    chunk_count: batch.chunkCount,
    slice_filters: batch.sliceFilters,
    index_ready: false,
    indexed_at: null,
  }));

  const { error: insError } = await supabase.from('chunk_index_batches').insert(rows);
  if (insError) {
    if (isMissingBatchTableError(insError.message)) {
      throw new Error(missingBatchTableHelp());
    }
    throw new Error(`Batch planı yazılamadı: ${insError.message}`);
  }

  console.log(`Yeni batch planı: ${rows.length} grup`);
  return rows;
}

async function main() {
  const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env).');
    process.exit(1);
  }
  if (!DB_URL && !DRY_RUN) {
    console.error('DATABASE_URL veya --db-url gerekli (psql bağlantı URI\'si).');
    process.exit(1);
  }

  const psqlPath = findPsql();
  if (!DRY_RUN && !psqlPath) {
    console.error('psql bulunamadı. PostgreSQL kurun veya PSQL_PATH ayarlayın.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log('Parçalı HNSW indeks kurulumu');
  if (psqlPath) console.log(`psql: ${psqlPath}`);
  console.log(`batch boyutu: ~${CHUNKS_PER_BATCH} chunk`);
  if (DRY_RUN) console.log('(dry-run — indeks oluşturulmayacak)');

  const bookCounts = await fetchChunkCountsByBook(supabase);
  const totalChunks = bookCounts.reduce((sum, row) => sum + row.chunkCount, 0);
  console.log(`Toplam: ${bookCounts.length} kitap, ${totalChunks} chunk`);

  if (totalChunks === 0) {
    console.log('Chunk yok. Önce npm run index:books çalıştırın.');
    return;
  }

  const needsSlices = bookCounts.some((row) => row.chunkCount > CHUNKS_PER_BATCH);
  if (needsSlices) {
    if (!DB_URL) {
      console.error('Büyük kitaplar var; .env içinde DATABASE_URL gerekli.');
      process.exit(1);
    }
    if (!psqlPath) {
      console.error('Büyük kitaplar var; psql gerekli (PSQL_PATH).');
      process.exit(1);
    }
    ensureSlicePlanner(psqlPath, DB_URL);
  }

  const batches = await buildBatches(supabase, bookCounts, CHUNKS_PER_BATCH);
  let plan = await syncBatchPlan(supabase, batches, FORCE);

  const pending = plan.filter((row) => !row.index_ready && row.batch_no >= FROM_BATCH);
  const doneCount = plan.filter((row) => row.index_ready).length;
  console.log(`Batch durumu: ${doneCount}/${plan.length} hazır, ${pending.length} kaldı\n`);

  const startedAt = Date.now();

  for (const row of pending) {
    const {
      batch_no: batchNo,
      index_name: indexName,
      book_ids: bookIds,
      chunk_count: chunkCount,
      slice_filters: sliceFilters,
    } = row;
    const idx = plan.findIndex((p) => p.batch_no === batchNo) + 1;
    const sliceHint = sliceFilters?.length ? ' (kitap dilimi)' : '';

    console.log(
      `\n→ Batch ${batchNo}/${plan.length} ${progressBar(idx - 1, plan.length)}` +
        ` | ${chunkCount} chunk | ${bookIds.length} kitap${sliceHint}`
    );
    console.log(`  İndeks: ${indexName}`);

    if (DRY_RUN) {
      console.log('  [dry-run] CREATE INDEX atlandı');
      continue;
    }

    const batchStarted = Date.now();
    try {
      runPsql(psqlPath, DB_URL, sqlForBatch(indexName, bookIds, sliceFilters));

      const { error: updError } = await supabase
        .from('chunk_index_batches')
        .update({ index_ready: true, indexed_at: new Date().toISOString() })
        .eq('batch_no', batchNo);

      if (updError) throw new Error(`Batch durumu güncellenemedi: ${updError.message}`);

      console.log(`  Tamamlandı (${formatDuration(Date.now() - batchStarted)})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  HATA batch ${batchNo}: ${msg}`);
      console.error(
        `\nKaldığınız yerden devam:\n  npm run index:vector-batches -- --from-batch=${batchNo}` +
          `\nBellek hatası devam ederse:\n  npm run index:vector-batches -- --force --batch-size=1500`
      );
      process.exit(1);
    }
  }

  console.log(`\nBitti. Süre: ${formatDuration(Date.now() - startedAt)}`);
  console.log('Doğrulama (SQL Editor):');
  console.log("  select batch_no, index_name, chunk_count, index_ready from chunk_index_batches order by batch_no;");
  console.log("  select indexname from pg_indexes where tablename = 'book_file_chunks' and indexdef ilike '%hnsw%';");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
