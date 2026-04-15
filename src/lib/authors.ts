import { randomBytes } from 'crypto';
import { supabase, supabaseAdmin } from './supabase-server';
import { convertSupabaseAuthorToAuthor } from './converters-server';
import { convertSupabaseBookToBook } from './converters-server';
import type { Author } from '@/types';
import type { Book } from '@/types';
import type { SupabaseAuthor, SupabaseBook } from './supabase';
import { normalizeLanguageCode, slugifyAuthorName } from './author-db';

/**
 * Yazarları getirir (authors_view veya authors tablosu), opsiyonel dil filtresi ile.
 */
export async function getAuthors(language?: string): Promise<{ authors: Author[]; error: Error | null }> {
  try {
    let query = supabase
      .from('authors_view')
      .select('*')
      .order('book_count', { ascending: false });
    if (language?.trim()) {
      query = query.eq('language_code', language.trim().toLowerCase());
    }
    let { data, error: supabaseError } = await query;

    if (supabaseError?.message?.includes('does not exist')) {
      let fallbackQuery = supabase
        .from('authors')
        .select('*')
        .order('name');
      if (language?.trim()) {
        fallbackQuery = fallbackQuery.eq('language_code', language.trim().toLowerCase());
      }
      const { data: tableAuthors, error: tableAuthorsError } = await fallbackQuery;

      if (!tableAuthorsError && tableAuthors?.length) {
        data = tableAuthors.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          name: String(row.name),
          language_code: String(row.language_code ?? 'tr'),
          biography: String(row.biography ?? ''),
          book_count: 0,
          total_downloads: 0,
          first_publish_year: undefined,
          last_publish_year: undefined,
          categories: [] as string[],
          languages: [] as string[],
          profile_image_url:
            row.profile_image_url != null ? String(row.profile_image_url) : undefined,
          first_book_created_at: String(row.created_at ?? new Date().toISOString()),
          last_updated_at: String(row.updated_at ?? new Date().toISOString()),
        })) as unknown as SupabaseAuthor[];
      } else {
        // authors tablosu / view yok; kitaplarda artık düz yazar alanı yok — boş liste
        data = [] as SupabaseAuthor[];
      }
    } else if (supabaseError) {
      return { authors: [], error: supabaseError };
    }

    const authors = (data || []).map((a: SupabaseAuthor) => convertSupabaseAuthorToAuthor(a));
    return { authors, error: null };
  } catch (err) {
    return { authors: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

const BOOKS_BY_AUTHOR_SELECT = `
  *,
  book_files (*),
  book_authors!inner (
    author_order,
    role,
    authors!inner (
      id,
      name,
      language_code
    )
  ),
  book_categories (
    is_primary,
    categories (
      id,
      name,
      slug,
      language_code
    )
  )
`;

/**
 * Yazar adına göre kitapları getirir
 */
export async function getBooksByAuthor(
  authorName: string,
  language?: string
): Promise<{ books: Book[]; error: Error | null }> {
  try {
    let query = supabase
      .from('books')
      .select(BOOKS_BY_AUTHOR_SELECT)
      .eq('book_authors.authors.name', authorName);

    if (language) query = query.eq('language_code', language);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { books: [], error };

    const books = (data || []).map((b: SupabaseBook) => convertSupabaseBookToBook(b));
    return { books, error: null };
  } catch (err) {
    return { books: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * Yazar UUID'sine göre kitapları getirir (aynı isimde farklı dil satırlarını ayırt etmek için)
 */
export async function getBooksByAuthorId(
  authorId: string
): Promise<{ books: Book[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select(BOOKS_BY_AUTHOR_SELECT)
      .eq('book_authors.author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) return { books: [], error };

    const books = (data || []).map((b: SupabaseBook) => convertSupabaseBookToBook(b));
    return { books, error: null };
  } catch (err) {
    return { books: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/**
 * ID'ye göre tek yazar getirir (authors_view, yoksa authors)
 */
export async function getAuthorById(id: string): Promise<{ author: Author | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from('authors_view').select('*').eq('id', id).single();

    if (!error && data) {
      return { author: convertSupabaseAuthorToAuthor(data as SupabaseAuthor), error: null };
    }

    const { data: row, error: rowErr } = await supabase.from('authors').select('*').eq('id', id).maybeSingle();

    if (rowErr) return { author: null, error: rowErr };
    if (!row) return { author: null, error: error || null };

    const a = row as Record<string, unknown>;
    return {
      author: convertSupabaseAuthorToAuthor({
        id: a.id as string,
        name: a.name as string,
        language_code: (a.language_code as string) || 'tr',
        biography: (a.biography as string) || '',
        book_count: 0,
        total_downloads: 0,
        categories: [],
        languages: [],
        profile_image_url: a.profile_image_url as string | undefined,
        first_book_created_at: (a.created_at as string) ?? new Date().toISOString(),
        last_updated_at: (a.updated_at as string) ?? new Date().toISOString(),
      } as SupabaseAuthor),
      error: null,
    };
  } catch (err) {
    return { author: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface CreateAuthorPayload {
  name: string;
  biography?: string;
  language_code?: string;
  profile_image_url?: string;
}

/** Yazar kaydı oluşturur (slug + language_code benzersiz) */
export async function createAuthor(payload: CreateAuthorPayload) {
  const db = supabaseAdmin ?? supabase;
  const name = payload.name.trim();
  const biography = (payload.biography ?? '').trim();
  const language_code = normalizeLanguageCode(payload.language_code, 'tr');

  let slug = slugifyAuthorName(name);
  const row = {
    name,
    slug,
    language_code,
    biography,
    profile_image_url: payload.profile_image_url?.trim() || null,
  };

  let { data, error } = await db.from('authors').insert(row).select('*').single();

  if (error?.code === '23505') {
    slug = `${slugifyAuthorName(name)}-${randomBytes(3).toString('hex')}`;
    const retry = await db.from('authors').insert({ ...row, slug }).select('*').single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return { author: null, error };
  return { author: data, error: null };
}

export interface UpdateAuthorPayload {
  name: string;
  biography?: string;
  language_code?: string;
  profile_image_url?: string | null;
}

/** authors tablosunda güncelleme */
export async function updateAuthor(id: string, payload: UpdateAuthorPayload) {
  const db = supabaseAdmin ?? supabase;
  const name = payload.name.trim();
  const biography = (payload.biography ?? '').trim();
  if (!name) return { author: null, error: new Error('Ad zorunludur') };

  const language_code = normalizeLanguageCode(payload.language_code, 'tr');

  const { data: current, error: fetchErr } = await db
    .from('authors')
    .select('name, slug, language_code')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return { author: null, error: fetchErr };
  if (!current) return { author: null, error: new Error('Yazar bulunamadı') };

  const cur = current as { name: string; slug?: string; language_code?: string };
  let slug = cur.slug ?? slugifyAuthorName(name);
  if (cur.name !== name) {
    slug = slugifyAuthorName(name);
  }

  const row: Record<string, unknown> = {
    name,
    slug,
    language_code,
    biography,
  };
  if (payload.profile_image_url !== undefined) {
    row.profile_image_url = payload.profile_image_url?.trim() || null;
  }

  let { error } = await db.from('authors').update(row).eq('id', id);
  if (error?.code === '23505') {
    slug = `${slugifyAuthorName(name)}-${randomBytes(3).toString('hex')}`;
    ({ error } = await db.from('authors').update({ ...row, slug }).eq('id', id));
  }

  if (error) return { author: null, error };

  const { author, error: viewErr } = await getAuthorById(id);
  if (author) return { author, error: null };
  if (viewErr) return { author: null, error: viewErr };

  const { data: rowAgain } = await db.from('authors').select('*').eq('id', id).single();
  if (!rowAgain) return { author: null, error: new Error('Yazar güncellendi ama okunamadı') };
  return {
    author: convertSupabaseAuthorToAuthor({
      ...rowAgain,
      book_count: 0,
      total_downloads: 0,
      categories: [],
      languages: [],
      first_book_created_at: rowAgain.created_at ?? new Date().toISOString(),
      last_updated_at: rowAgain.updated_at ?? new Date().toISOString(),
    } as SupabaseAuthor),
    error: null,
  };
}

/** Yazar silinir; book_authors kaydı varsa silinmez. */
export async function deleteAuthor(id: string) {
  const db = supabaseAdmin ?? supabase;
  const { count, error: countErr } = await db
    .from('book_authors')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', id);

  if (countErr) return { error: countErr };
  if ((count ?? 0) > 0) {
    return {
      error: new Error(
        'Bu yazara bağlı kitaplar var. Önce ilgili kitaplarda yazarı değiştirin veya kitapları silin.'
      ),
    };
  }

  const { error } = await db.from('authors').delete().eq('id', id);
  if (error) return { error };
  return { error: null };
}
