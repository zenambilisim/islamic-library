import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { ChatBlock } from '@/lib/hikme-chat';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const MATCH_THRESHOLD = 0.35;
/** Early-exit only when top hits are strong enough (avoids weak false positives). */
const EARLY_EXIT_THRESHOLD = 0.48;
const MATCH_COUNT = 6;
const BATCH_SEARCH_CONCURRENCY = 8;
const MAX_BATCH_TASKS = 24;
const PER_BATCH_TIMEOUT_MS = 4000;
const TOTAL_SEARCH_BUDGET_MS = 10000;
const PER_BATCH_MATCH_LIMIT = MATCH_COUNT * 2;
const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY = 8;
const MAX_CATALOG_BOOKS = 8;
const MAX_CATALOG_PHRASES = 12;

const SUPPORTED_LANGS = new Set(['tr', 'en', 'ru', 'az']);

const SEARCH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'with',
  'from', 'about', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why',
  'how', 'is', 'are', 'was', 'were', 'be', 'been', 'can', 'could', 'would', 'should',
  'do', 'does', 'did', 'tell', 'me', 'please', 'book', 'books', 'author', 'titled',
  'title', 'named', 'called', 'regarding', 'concerning', 'info', 'information',
  'summary', 'summarize', 'explain', 'describe', 'there', 'library', 'written',
  'this', 'that', 'these', 'those', 'have', 'has', 'had', 'been', 'our', 'your',
  've', 'ile', 'bir', 'bu', 'şu', 'o', 'mi', 'mı', 'mu', 'mü', 'ne', 'nedir', 'hakkında',
  'kitap', 'kitabı', 'yazar', 'adlı', 'isimli', 'anlat', 'özet', 'özetle', 'açıkla',
  'и', 'о', 'об', 'про', 'что', 'это', 'книга', 'книге', 'автор', 'расскажи', 'кратко',
  'və', 'haqqında', 'kitab', 'müəllif', 'nədir',
]);

export type ChatHistoryTurn = { role: 'user' | 'assistant'; content: string };

interface MatchedChunk {
  id: string;
  book_id: string;
  book_file_id: string;
  page_number: number | null;
  chunk_index: number;
  content: string;
  similarity: number;
}

interface BookMeta {
  id: string;
  title: string;
  description?: string | null;
}

/** Named-book hits may have low vector scores (title ≠ body wording). */
const CATALOG_VECTOR_THRESHOLD = 0.12;

let openaiClient: OpenAI | null = null;

export function isChatRagConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim() && supabaseAdmin);
}

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: key });
  return openaiClient;
}

function normalizeLanguage(code?: string | null): string | null {
  const s = String(code ?? '')
    .trim()
    .toLowerCase()
    .split('-')[0];
  return SUPPORTED_LANGS.has(s) ? s : null;
}

async function embedQuery(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  const embedding = res.data[0]?.embedding;
  if (!embedding?.length) throw new Error('Embedding oluşturulamadı');
  return embedding;
}

interface IndexBatchRow {
  batch_no: number;
  book_ids: string[];
  slice_filters: unknown;
}

interface SliceFilter {
  book_id: string;
  id_min: string;
  id_max: string;
}

interface BatchSearchTask {
  batch_no: number;
  book_ids?: string[];
  slice?: SliceFilter;
}

function parseSliceFilters(raw: unknown): SliceFilter[] {
  if (!Array.isArray(raw)) return [];
  const out: SliceFilter[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const book_id = String((item as SliceFilter).book_id ?? '').trim();
    const id_min = String((item as SliceFilter).id_min ?? '').trim();
    const id_max = String((item as SliceFilter).id_max ?? '').trim();
    if (book_id && id_min && id_max) out.push({ book_id, id_min, id_max });
  }
  return out;
}

function expandBatchesToTasks(batches: IndexBatchRow[]): BatchSearchTask[] {
  const tasks: BatchSearchTask[] = [];
  for (const batch of batches) {
    const slices = parseSliceFilters(batch.slice_filters);
    if (slices.length > 0) {
      for (const slice of slices) {
        tasks.push({ batch_no: batch.batch_no, slice });
      }
    } else {
      tasks.push({ batch_no: batch.batch_no, book_ids: batch.book_ids });
    }
  }
  return tasks;
}

function isTimeoutError(message: string): boolean {
  return /statement timeout|canceling statement/i.test(message);
}

async function hasReadyIndexBatches(): Promise<boolean> {
  if (!supabaseAdmin) return false;
  const { count, error } = await supabaseAdmin
    .from('chunk_index_batches')
    .select('*', { count: 'exact', head: true })
    .eq('index_ready', true);
  if (error) return false;
  return (count ?? 0) > 0;
}

async function loadBooksForLanguage(bookIds: string[], language: string): Promise<Set<string>> {
  const allowed = new Set<string>();
  if (!supabaseAdmin || bookIds.length === 0) return allowed;

  const queries = [];
  for (let i = 0; i < bookIds.length; i += 80) {
    const slice = bookIds.slice(i, i + 80);
    queries.push(
      supabaseAdmin
        .from('books')
        .select('id')
        .in('id', slice)
        .eq('language_code', language),
    );
  }

  const results = await Promise.all(queries);
  for (const { data, error } of results) {
    if (error) throw new Error(`Kitap dili alınamadı: ${error.message}`);
    for (const row of data ?? []) {
      allowed.add(row.id as string);
    }
  }
  return allowed;
}

interface FetchBatchesResult {
  batches: IndexBatchRow[];
  allowedBooks?: Set<string>;
}

async function fetchReadyIndexBatches(language: string | null): Promise<FetchBatchesResult> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const { data, error } = await supabaseAdmin
    .from('chunk_index_batches')
    .select('batch_no, book_ids, slice_filters')
    .eq('index_ready', true)
    .order('batch_no');

  if (error) {
    if (/chunk_index_batches|could not find the table/i.test(error.message))
      return { batches: [] };
    throw new Error(`Batch listesi alınamadı: ${error.message}`);
  }

  let batches = (data ?? []) as IndexBatchRow[];
  if (!language || batches.length === 0) return { batches };

  const bookIds = [...new Set(batches.flatMap((b) => b.book_ids))];
  const allowedBooks = await loadBooksForLanguage(bookIds, language);
  batches = batches.filter((b) => b.book_ids.some((id) => allowedBooks.has(id)));
  return { batches, allowedBooks };
}

function rankMatchedChunks(
  rows: MatchedChunk[],
  language: string | null,
  allowedBooks?: Set<string>,
) {
  const aboveThreshold = rows.filter((row) => row.similarity > MATCH_THRESHOLD);
  const afterLang = aboveThreshold.filter(
    (row) => !language || !allowedBooks || allowedBooks.has(row.book_id),
  );

  return afterLang
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MATCH_COUNT);
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  // Supabase rpc() tipleri bazen Promise yerine thenable dönebildiği için
  // Promise.resolve ile uyumlu hale getiriyoruz.
  return Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function sanitizeIlikeFragment(raw: string): string {
  return raw.trim().replace(/[%_\\]/g, '').slice(0, 120);
}

/** Extract quoted strings and multi-word phrases likely to be book/author names. */
function extractCatalogPhrases(message: string): string[] {
  const phrases: string[] = [];
  const seen = new Set<string>();

  const add = (raw: string) => {
    const cleaned = sanitizeIlikeFragment(raw.replace(/\s+/g, ' '));
    if (cleaned.length < 3) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    phrases.push(cleaned);
  };

  for (const m of message.matchAll(/[“”"«»『』]([^“”"«»『』]{3,80})[“”"«»『』]/g)) {
    add(m[1]);
  }
  for (const m of message.matchAll(/'([^']{3,80})'/g)) {
    add(m[1]);
  }

  const tokens = message
    .replace(/[“”"«»『』']/g, ' ')
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter(Boolean);

  const meaningful = tokens.filter((t) => t.length > 1 && !SEARCH_STOPWORDS.has(t.toLowerCase()));

  // Prefer 2–3 word phrases (typical titles/names) before longer noisy n-grams
  for (const n of [2, 3, 4, 5]) {
    if (n > meaningful.length) continue;
    for (let i = 0; i + n <= meaningful.length; i++) {
      add(meaningful.slice(i, i + n).join(' '));
      if (phrases.length >= MAX_CATALOG_PHRASES) return phrases;
    }
  }

  // Single distinctive tokens (e.g. "Tijani") as author fallback
  for (const token of meaningful) {
    if (token.length >= 5) add(token);
    if (phrases.length >= MAX_CATALOG_PHRASES) break;
  }

  return phrases;
}

async function findCatalogBookIds(message: string, language: string | null): Promise<string[]> {
  if (!supabaseAdmin) return [];

  const phrases = extractCatalogPhrases(message);
  if (phrases.length === 0) return [];

  const matched = new Map<string, number>(); // bookId -> score

  const bump = (id: string, score: number) => {
    matched.set(id, Math.max(matched.get(id) ?? 0, score));
  };

  // Prefer UI language, then retry without language (EN book + TR UI, etc.)
  const languagePasses: Array<string | null> = language ? [language, null] : [null];

  for (const lang of languagePasses) {
    // Longer phrases first — more specific title matches win
    const ordered = [...phrases].sort((a, b) => b.length - a.length);

    for (const phrase of ordered) {
      let titleQuery = supabaseAdmin.from('books').select('id, title').ilike('title', `%${phrase}%`).limit(8);
      if (lang) titleQuery = titleQuery.eq('language_code', lang);

      const { data: titleRows, error: titleErr } = await titleQuery;
      if (titleErr) {
        console.warn('[chat-rag] katalog title araması:', titleErr.message);
      } else {
        for (const row of titleRows ?? []) {
          const title = String(row.title ?? '');
          const exactish = title.toLowerCase().includes(phrase.toLowerCase());
          const langBonus = lang ? 0 : -5; // slight preference for language-matched pass
          bump(row.id as string, (exactish ? 100 : 50) + phrase.length + langBonus);
        }
      }

      // Strong title hit is enough — skip remaining weaker phrases
      if ([...matched.values()].some((s) => s >= 100)) break;

      // Only run author lookup for multi-word / longer tokens
      if (phrase.split(/\s+/).length < 2 && phrase.length < 6) continue;

      let authorQuery = supabaseAdmin.from('authors').select('id, name').ilike('name', `%${phrase}%`).limit(8);
      if (lang) authorQuery = authorQuery.eq('language_code', lang);

      const { data: authorRows, error: authorErr } = await authorQuery;
      if (authorErr) {
        console.warn('[chat-rag] katalog author araması:', authorErr.message);
        continue;
      }
      if (!authorRows?.length) continue;

      const authorIds = authorRows.map((a) => a.id as string);
      const { data: links, error: linkErr } = await supabaseAdmin
        .from('book_authors')
        .select('book_id, author_id')
        .in('author_id', authorIds)
        .limit(40);

      if (linkErr) {
        console.warn('[chat-rag] katalog book_authors:', linkErr.message);
        continue;
      }

      const bookIdsFromAuthors = [...new Set((links ?? []).map((l) => l.book_id as string))];
      if (bookIdsFromAuthors.length === 0) continue;

      let booksQuery = supabaseAdmin.from('books').select('id').in('id', bookIdsFromAuthors).limit(40);
      if (lang) booksQuery = booksQuery.eq('language_code', lang);
      const { data: authorBooks, error: booksErr } = await booksQuery;
      if (booksErr) {
        console.warn('[chat-rag] katalog author books:', booksErr.message);
        continue;
      }
      for (const row of authorBooks ?? []) {
        bump(row.id as string, 30 + phrase.length);
      }
    }

    if (matched.size > 0) break;
  }

  return [...matched.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score], _i, arr) => {
      // If we have a clear title hit, drop author-only matches
      const hasTitleHit = arr.some(([, s]) => s >= 100);
      return hasTitleHit ? score >= 100 : true;
    })
    .slice(0, MAX_CATALOG_BOOKS)
    .map(([id]) => id);
}

function prioritizeTasksForBooks(tasks: BatchSearchTask[], bookIds: string[]): BatchSearchTask[] {
  if (bookIds.length === 0) return tasks;
  const wanted = new Set(bookIds);
  const priority: BatchSearchTask[] = [];
  const rest: BatchSearchTask[] = [];

  for (const task of tasks) {
    const hits =
      (task.slice && wanted.has(task.slice.book_id)) ||
      (task.book_ids?.some((id) => wanted.has(id)) ?? false);
    if (hits) priority.push(task);
    else rest.push(task);
  }

  // Always keep catalog-matched tasks; fill remaining slots from the rest
  const remainingSlots = Math.max(0, MAX_BATCH_TASKS - priority.length);
  return [...priority, ...rest.slice(0, remainingSlots)];
}

async function searchChunksForBooks(
  embedding: number[],
  bookIds: string[],
): Promise<MatchedChunk[]> {
  if (!supabaseAdmin || bookIds.length === 0) return [];

  // Direct book-scoped search — bypasses batch_no truncation for named books
  const result = await withTimeout(
    supabaseAdmin.rpc('match_book_chunks_batch', {
      query_embedding: embedding,
      p_book_ids: bookIds,
      p_slice_filters: null,
      p_limit: MATCH_COUNT * 3,
    }),
    PER_BATCH_TIMEOUT_MS,
  );

  if (!result) {
    console.warn('[chat-rag] katalog kitap araması timeout');
    return [];
  }

  const { data, error } = result;
  if (error) {
    if (/match_book_chunks_batch|could not find the function/i.test(error.message)) {
      console.warn('[chat-rag] match_book_chunks_batch yok, katalog doğrudan arama atlandı');
      return [];
    }
    if (isTimeoutError(error.message)) {
      console.warn('[chat-rag] katalog kitap araması DB timeout');
      return [];
    }
    console.warn('[chat-rag] katalog kitap araması:', error.message);
    return [];
  }

  return ((data ?? []) as MatchedChunk[]).filter((row) => bookIds.includes(row.book_id));
}

function dedupeChunksById(rows: MatchedChunk[]): MatchedChunk[] {
  const seen = new Set<string>();
  const out: MatchedChunk[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

/** Sources for books the user named: text hits + low-threshold vectors + intro pages. */
async function loadNamedBookChunks(
  bookIds: string[],
  message: string,
  embedding: number[],
): Promise<MatchedChunk[]> {
  if (!supabaseAdmin || bookIds.length === 0) return [];

  const candidates: MatchedChunk[] = [];
  const phrases = extractCatalogPhrases(message)
    .filter((p) => p.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 4);

  for (const bookId of bookIds) {
    for (const phrase of phrases) {
      const { data, error } = await supabaseAdmin
        .from('book_file_chunks')
        .select('id, book_id, book_file_id, page_number, chunk_index, content')
        .eq('book_id', bookId)
        .ilike('content', `%${phrase}%`)
        .limit(4);

      if (error) {
        console.warn('[chat-rag] katalog metin araması:', error.message);
        continue;
      }
      for (const row of data ?? []) {
        candidates.push({
          id: row.id as string,
          book_id: row.book_id as string,
          book_file_id: row.book_file_id as string,
          page_number: (row.page_number as number | null) ?? null,
          chunk_index: row.chunk_index as number,
          content: row.content as string,
          similarity: 0.95,
        });
      }
    }
  }

  const vectorHits = await searchChunksForBooks(embedding, bookIds);
  for (const row of vectorHits) {
    if (row.similarity >= CATALOG_VECTOR_THRESHOLD) candidates.push(row);
  }

  if (candidates.length < 2) {
    for (const bookId of bookIds) {
      const { data, error } = await supabaseAdmin
        .from('book_file_chunks')
        .select('id, book_id, book_file_id, page_number, chunk_index, content')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true })
        .order('chunk_index', { ascending: true })
        .limit(3);

      if (error) {
        console.warn('[chat-rag] katalog intro chunk:', error.message);
        continue;
      }
      for (const row of data ?? []) {
        candidates.push({
          id: row.id as string,
          book_id: row.book_id as string,
          book_file_id: row.book_file_id as string,
          page_number: (row.page_number as number | null) ?? null,
          chunk_index: row.chunk_index as number,
          content: row.content as string,
          similarity: 0.85,
        });
      }
    }
  }

  return dedupeChunksById(candidates)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MATCH_COUNT);
}

/** Catalog description used when chunks are thin but the book is clearly identified. */
async function buildCatalogDescriptionChunks(bookIds: string[]): Promise<MatchedChunk[]> {
  if (!supabaseAdmin || bookIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('id, title, description')
    .in('id', bookIds);

  if (error) {
    console.warn('[chat-rag] katalog description:', error.message);
    return [];
  }

  const out: MatchedChunk[] = [];
  for (const row of data ?? []) {
    const description = String(row.description ?? '').trim();
    if (!description) continue;
    out.push({
      id: `catalog-desc:${row.id}`,
      book_id: row.id as string,
      book_file_id: row.id as string,
      page_number: null,
      chunk_index: -1,
      content: `Book title: ${row.title}\n\n${description}`,
      similarity: 0.99,
    });
  }
  return out;
}

async function searchOneBatchTask(
  embedding: number[],
  task: BatchSearchTask,
): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  if (task.slice) {
    const result = await withTimeout(
      supabaseAdmin.rpc('match_book_chunks_slice', {
        query_embedding: embedding,
        p_book_id: task.slice.book_id,
        p_id_min: task.slice.id_min,
        p_id_max: task.slice.id_max,
        p_limit: PER_BATCH_MATCH_LIMIT,
      }),
      PER_BATCH_TIMEOUT_MS,
    );

    if (!result) {
      console.warn(`[chat-rag] batch ${task.batch_no} slice timeout (client), atlanıyor`);
      return [];
    }

    const { data, error } = result;
    if (error) {
      if (/match_book_chunks_slice|could not find the function/i.test(error.message)) {
        throw new Error(
          "match_book_chunks_slice fonksiyonu yok. Supabase SQL Editor'da docs/rag-setup-match-fix.sql çalıştırın.",
        );
      }
      if (isTimeoutError(error.message)) {
        console.warn(`[chat-rag] batch ${task.batch_no} slice timeout, atlanıyor`);
        return [];
      }
      throw new Error(`Slice araması başarısız (batch ${task.batch_no}): ${error.message}`);
    }

    return (data ?? []) as MatchedChunk[];
  }

  const result = await withTimeout(
    supabaseAdmin.rpc('match_book_chunks_batch', {
      query_embedding: embedding,
      p_book_ids: task.book_ids,
      p_slice_filters: null,
      p_limit: PER_BATCH_MATCH_LIMIT,
    }),
    PER_BATCH_TIMEOUT_MS,
  );

  if (!result) {
    console.warn(`[chat-rag] batch ${task.batch_no} timeout (client), atlanıyor`);
    return [];
  }

  const { data, error } = result;
  if (error) {
    if (/match_book_chunks_batch|could not find the function/i.test(error.message)) {
      throw new Error(
        "match_book_chunks_batch fonksiyonu yok. Supabase SQL Editor'da docs/rag-setup-match-fix.sql çalıştırın.",
      );
    }
    if (isTimeoutError(error.message)) {
      console.warn(`[chat-rag] batch ${task.batch_no} timeout, atlanıyor`);
      return [];
    }
    throw new Error(`Batch araması başarısız (batch ${task.batch_no}): ${error.message}`);
  }

  return (data ?? []) as MatchedChunk[];
}

async function searchChunksInBatches(
  embedding: number[],
  language: string | null,
  priorityBookIds: string[] = [],
): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const { batches, allowedBooks } = await fetchReadyIndexBatches(language);
  if (batches.length === 0) return [];

  const allTasks = expandBatchesToTasks(batches);
  const tasks =
    priorityBookIds.length > 0
      ? prioritizeTasksForBooks(allTasks, priorityBookIds)
      : allTasks.slice(0, MAX_BATCH_TASKS);
  const candidates: MatchedChunk[] = [];
  const searchStart = Date.now();

  for (let i = 0; i < tasks.length; i += BATCH_SEARCH_CONCURRENCY) {
    if (Date.now() - searchStart > TOTAL_SEARCH_BUDGET_MS) {
      console.warn(`[chat-rag] toplam arama bütçesi aşıldı, ${candidates.length} sonuçla durduruluyor`);
      break;
    }

    const wave = tasks.slice(i, i + BATCH_SEARCH_CONCURRENCY);
    const waveResults = await Promise.all(wave.map((task) => searchOneBatchTask(embedding, task)));

    for (const rows of waveResults) candidates.push(...rows);

    const ranked = rankMatchedChunks(candidates, language, allowedBooks);
    const topScore = ranked[0]?.similarity ?? 0;
    if (
      ranked.length >= MATCH_COUNT &&
      topScore >= EARLY_EXIT_THRESHOLD &&
      i + BATCH_SEARCH_CONCURRENCY >= Math.max(1, Math.ceil(tasks.length * 0.25))
    ) {
      return ranked;
    }
  }

  return rankMatchedChunks(candidates, language, allowedBooks);
}

async function searchChunksLegacy(embedding: number[], language: string | null): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const { data, error } = await supabaseAdmin.rpc('match_book_chunks', {
    query_embedding: embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
    filter_language: language,
  });

  if (error) {
    const detail = error.message || 'bilinmeyen hata';
    if (/statement timeout|canceling statement/i.test(detail)) {
      throw new Error(
        `Vektör araması zaman aşımı: docs/rag-setup-match-fix.sql çalıştırın ve batch indekslerinin tamamlandığından emin olun. (${detail})`,
      );
    }
    throw new Error(`Vektör araması başarısız: ${detail}`);
  }
  return (data ?? []) as MatchedChunk[];
}

async function searchChunks(
  embedding: number[],
  language: string | null,
  message: string,
): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const catalogBookIds = await findCatalogBookIds(message, language);
  if (catalogBookIds.length > 0) {
    console.info(`[chat-rag] katalog eşleşmesi: ${catalogBookIds.length} kitap`);
    const namedChunks = await loadNamedBookChunks(catalogBookIds, message, embedding);
    const descChunks = await buildCatalogDescriptionChunks(catalogBookIds);
    const merged = dedupeChunksById([...descChunks, ...namedChunks])
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, MATCH_COUNT);

    if (merged.length > 0) {
      // Named book wins over weak cross-corpus matches (e.g. "Thursday" in Al-Khisal)
      return merged;
    }
  }

  if (await hasReadyIndexBatches()) {
    const batchResults = await searchChunksInBatches(embedding, language, catalogBookIds);
    if (batchResults.length > 0) return batchResults;

    console.warn('[chat-rag] Batch sonuç vermedi, legacy fallback');
  }

  try {
    return await searchChunksLegacy(embedding, language);
  } catch (err) {
    if (err instanceof Error && isTimeoutError(err.message)) {
      console.warn('[chat-rag] Legacy timeout, dilsiz tekrar deneniyor');
      try {
        return await searchChunksLegacy(embedding, null);
      } catch (err2) {
        if (err2 instanceof Error && isTimeoutError(err2.message)) {
          console.warn('[chat-rag] Legacy dilsiz de timeout');
          return [];
        }
        throw err2;
      }
    }
    throw err;
  }
}

async function fetchBookMeta(bookIds: string[]): Promise<Map<string, BookMeta>> {
  const map = new Map<string, BookMeta>();
  if (!supabaseAdmin || bookIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('id, title, description')
    .in('id', bookIds);

  if (error) throw new Error(`Kitap bilgisi alınamadı: ${error.message}`);

  for (const row of data ?? []) {
    map.set(row.id as string, {
      id: row.id as string,
      title: (row.title as string) || 'Kitap',
      description: (row.description as string | null) ?? null,
    });
  }
  return map;
}

function buildSourcesContext(chunks: MatchedChunk[], books: Map<string, BookMeta>): string {
  return chunks
    .map((chunk, i) => {
      const title = books.get(chunk.book_id)?.title ?? 'Kitap';
      const page =
        chunk.page_number != null && chunk.page_number > 0 ? ` (sayfa ${chunk.page_number})` : '';
      return `[Kaynak ${i + 1}] «${title}»${page}\n${chunk.content}`;
    })
    .join('\n\n---\n\n');
}

function buildSystemPrompt(language: string | null): string {
  const langHint =
    language === 'tr'
      ? 'Türkçe'
      : language === 'en'
        ? 'English'
        : language === 'ru'
          ? 'русском'
          : language === 'az'
            ? 'Azərbaycan dilində'
            : 'kullanıcının diliyle';

  return `Sen Hikme adlı bir İslami kütüphane asistanısın. Yalnızca sana verilen kitap parçalarına dayanarak cevap ver.

Kurallar:
- Cevabını ${langHint} yaz.
- Verilen kaynaklarda olmayan bilgiyi uydurma; emin değilsen bunu açıkça söyle.
- Mümkün olduğunda hangi kitaptan ve sayfadan yararlandığını belirt.
- Kısa, anlaşılır ve saygılı bir üslup kullan.
- Fetva veya kişisel dini hüküm verme; kaynakları özetle ve kullanıcıyı katalogdaki eserlere yönlendir.
- Arapça ayet veya hadis alıntısı gerekiyorsa Arapça metni de ekle.`;
}

function trimHistory(history: ChatHistoryTurn[]): ChatHistoryTurn[] {
  return history
    .filter((h) => h.content.trim().length > 0)
    .slice(-MAX_HISTORY)
    .map((h) => ({
      role: h.role,
      content: h.content.slice(0, MAX_MESSAGE_LEN),
    }));
}

function noSourcesBlocks(language: string | null): ChatBlock[] {
  const text =
    language === 'en'
      ? 'I couldn\'t find a specific answer to this question in the library. You can try rephrasing your question or browse our catalog to find related books.'
      : language === 'ru'
        ? 'К сожалению, я не смог найти точный ответ на этот вопрос в библиотеке. Попробуйте переформулировать вопрос или загляните в каталог — возможно, там есть подходящие книги.'
        : language === 'az'
          ? 'Təəssüf ki, bu suala kitabxanada dəqiq cavab tapa bilmədim. Sualı fərqli şəkildə formalaşdırmağı və ya kataloqumuza göz atmağı tövsiyə edirəm.'
          : 'Maalesef bu soruya kütüphanede tam bir cevap bulamadım. Sorunuzu farklı kelimelerle tekrar deneyebilir veya kataloğumuza göz atarak ilgili kitaplara ulaşabilirsiniz.';

  return [{ type: 'text', content: text }];
}

export async function generateChatBlocks(params: {
  message: string;
  language?: string | null;
  history?: ChatHistoryTurn[];
}): Promise<ChatBlock[]> {
  const message = params.message.trim().slice(0, MAX_MESSAGE_LEN);
  if (!message) throw new Error('Mesaj boş olamaz');

  const language = normalizeLanguage(params.language);
  const history = trimHistory(params.history ?? []);

  const embedding = await embedQuery(message);
  const chunks = await searchChunks(embedding, language, message);

  if (chunks.length === 0) {
    return noSourcesBlocks(language);
  }

  const bookIds = [...new Set(chunks.map((c) => c.book_id))];
  const books = await fetchBookMeta(bookIds);
  const sourcesContext = buildSourcesContext(chunks, books);

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(language) },
    {
      role: 'system',
      content: `Aşağıdaki kitap parçalarını kullan:\n\n${sourcesContext}`,
    },
    ...history.map((turn) => ({
      role: turn.role as 'user' | 'assistant',
      content: turn.content,
    })),
    { role: 'user', content: message },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model: CHAT_MODEL,
    messages: openaiMessages,
    temperature: 0.4,
    max_tokens: 1200,
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) throw new Error('Model cevap üretmedi');

  const blocks: ChatBlock[] = [{ type: 'text', content: answer }];
  if (bookIds.length > 0) {
    blocks.push({ type: 'books', bookIds });
  }
  return blocks;
}
