import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { ChatBlock } from '@/lib/hikme-chat';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const MATCH_THRESHOLD = 0.35;
const MATCH_COUNT = 6;
const BATCH_SEARCH_CONCURRENCY = 12;
const PER_BATCH_MATCH_LIMIT = MATCH_COUNT * 2;
const MAX_MESSAGE_LEN = 2000;
const MAX_HISTORY = 8;

const SUPPORTED_LANGS = new Set(['tr', 'en', 'ru', 'az']);

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
}

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

  for (let i = 0; i < bookIds.length; i += 100) {
    const slice = bookIds.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .from('books')
      .select('id, language_code')
      .in('id', slice);
    if (error) throw new Error(`Kitap dili alınamadı: ${error.message}`);

    for (const row of data ?? []) {
      const lang = normalizeLanguage(row.language_code as string);
      if (lang === language) allowed.add(row.id as string);
    }
  }

  return allowed;
}

async function fetchReadyIndexBatches(): Promise<IndexBatchRow[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const { data, error } = await supabaseAdmin
    .from('chunk_index_batches')
    .select('batch_no, book_ids, slice_filters')
    .eq('index_ready', true)
    .order('batch_no');

  if (error) {
    if (/chunk_index_batches|could not find the table/i.test(error.message)) return [];
    throw new Error(`Batch listesi alınamadı: ${error.message}`);
  }

  return (data ?? []) as IndexBatchRow[];
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

async function searchOneBatchTask(
  embedding: number[],
  task: BatchSearchTask,
): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  if (task.slice) {
    const { data, error } = await supabaseAdmin.rpc('match_book_chunks_slice', {
      query_embedding: embedding,
      p_book_id: task.slice.book_id,
      p_id_min: task.slice.id_min,
      p_id_max: task.slice.id_max,
      p_limit: PER_BATCH_MATCH_LIMIT,
    });

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

  const { data, error } = await supabaseAdmin.rpc('match_book_chunks_batch', {
    query_embedding: embedding,
    p_book_ids: task.book_ids,
    p_slice_filters: null,
    p_limit: PER_BATCH_MATCH_LIMIT,
  });

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

async function searchChunksInBatches(embedding: number[], language: string | null): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const batches = await fetchReadyIndexBatches();
  if (batches.length === 0) return [];

  const tasks = expandBatchesToTasks(batches);
  const candidates: MatchedChunk[] = [];

  for (let i = 0; i < tasks.length; i += BATCH_SEARCH_CONCURRENCY) {
    const wave = tasks.slice(i, i + BATCH_SEARCH_CONCURRENCY);
    const waveResults = await Promise.all(wave.map((task) => searchOneBatchTask(embedding, task)));

    for (const rows of waveResults) candidates.push(...rows);

    const ranked = rankMatchedChunks(candidates, null);
    if (ranked.length >= MATCH_COUNT && i + BATCH_SEARCH_CONCURRENCY >= tasks.length * 0.25) {
      return ranked;
    }
  }

  return rankMatchedChunks(candidates, null);
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

async function searchChunks(embedding: number[], language: string | null): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  if (await hasReadyIndexBatches()) {
    const batchResults = await searchChunksInBatches(embedding, language);
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
    .select('id, title')
    .in('id', bookIds);

  if (error) throw new Error(`Kitap bilgisi alınamadı: ${error.message}`);

  for (const row of data ?? []) {
    map.set(row.id as string, { id: row.id as string, title: (row.title as string) || 'Kitap' });
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
  const chunks = await searchChunks(embedding, language);

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
