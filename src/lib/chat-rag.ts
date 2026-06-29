import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { ChatBlock } from '@/lib/hikme-chat';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const MATCH_THRESHOLD = 0.15;
const MATCH_COUNT = 8;
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

async function searchChunks(embedding: number[], language: string | null): Promise<MatchedChunk[]> {
  if (!supabaseAdmin) throw new Error('Supabase service role yapılandırılmamış');

  const { data, error } = await supabaseAdmin.rpc('match_book_chunks', {
    query_embedding: embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: MATCH_COUNT,
    filter_language: language,
  });

  if (error) throw new Error(`Vektör araması başarısız: ${error.message}`);
  return (data ?? []) as MatchedChunk[];
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
      ? 'I could not find indexed passages in the library for this question yet. Try rephrasing, or browse the catalog directly.'
      : language === 'ru'
        ? 'По этому вопросу в библиотеке пока нет проиндексированных фрагментов. Попробуйте переформулировать или откройте каталог.'
        : language === 'az'
          ? 'Bu sual üçün kitabxanada hələ indekslənmiş parçalar tapılmadı. Sualı yenidən formalaşdırın və ya kataloqa baxın.'
          : 'Bu soru için kütüphanede henüz indekslenmiş bir pasaj bulamadım. Soruyu farklı kelimelerle deneyebilir veya kataloğa göz atabilirsiniz.';

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
