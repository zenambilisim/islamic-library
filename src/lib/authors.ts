import { randomBytes } from 'crypto';
import { supabase, supabaseAdmin } from './supabase-server';
import { convertSupabaseAuthorToAuthor } from './converters-server';
import { convertSupabaseBookToBook } from './converters-server';
import type { Author } from '@/types';
import type { Book } from '@/types';
import type { SupabaseAuthor, SupabaseBook } from './supabase';
import { normalizeAuthorTranslations, slugifyAuthorName } from './author-db';

/**
 * Tüm yazarları getirir (authors_view veya books tablosundan türetilmiş)
 */
export async function getAuthors(): Promise<{ authors: Author[]; error: Error | null }> {
  try {
    let { data, error: supabaseError } = await supabase
      .from('authors_view')
      .select('*')
      .order('book_count', { ascending: false });

    if (supabaseError?.message?.includes('does not exist')) {
      const { data: tableAuthors, error: tableAuthorsError } = await supabase
        .from('authors')
        .select('*')
        .order('name');

      if (!tableAuthorsError && tableAuthors?.length) {
        data = tableAuthors.map((row: any) => ({
          id: row.id,
          name: row.name,
          name_translations: row.name_translations || {},
          biography: row.biography || '',
          biography_translations: row.biography_translations || {},
          book_count: 0,
          total_downloads: 0,
          first_publish_year: undefined,
          last_publish_year: undefined,
          categories: [],
          languages: [],
          profile_image_url: row.profile_image_url ?? undefined,
          first_book_created_at: row.created_at ?? new Date().toISOString(),
          last_updated_at: row.updated_at ?? new Date().toISOString(),
        })) as SupabaseAuthor[];
      } else {
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('author, author_translations, description, description_translations');

        if (booksError) return { authors: [], error: booksError };

        if (!booksData?.length) return { authors: [], error: null };

        const authorsMap = new Map<string, {
          name: string;
          name_translations: Record<string, string>;
          book_count: number;
          biography?: string;
          biography_translations?: Record<string, string>;
        }>();

        booksData.forEach((book: any) => {
          if (!book.author) return;
          if (!authorsMap.has(book.author)) {
            authorsMap.set(book.author, {
              name: book.author,
              name_translations: book.author_translations || {},
              book_count: 1,
              biography: book.description,
              biography_translations: book.description_translations || {}
            });
          } else {
            const existing = authorsMap.get(book.author)!;
            existing.book_count += 1;
          }
        });

        data = Array.from(authorsMap.values()).map((author, index) => ({
          id: `author-${index}`,
          name: author.name,
          name_translations: author.name_translations,
          biography: author.biography || '',
          biography_translations: author.biography_translations || {},
          book_count: author.book_count,
          total_downloads: 0,
          first_publish_year: undefined,
          last_publish_year: undefined,
          categories: [],
          languages: [],
          profile_image: undefined,
          first_book_created_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString()
        })) as SupabaseAuthor[];

        (data as SupabaseAuthor[]).sort((a, b) => b.book_count - a.book_count);
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
      .select(`
        *,
        book_files (*),
        book_authors!inner (
          author_order,
          role,
          authors!inner (
            id,
            name,
            name_translations
          )
        ),
        book_categories (
          is_primary,
          categories (
            id,
            name,
            name_translations
          )
        )
      `)
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
 * ID'ye göre tek yazar getirir (authors_view)
 */
export async function getAuthorById(id: string): Promise<{ author: Author | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('authors_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return { author: null, error: error || null };
    return { author: convertSupabaseAuthorToAuthor(data), error: null };
  } catch (err) {
    return { author: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export interface CreateAuthorPayload {
  name: string;
  biography?: string;
  name_translations?: Record<string, string>;
  biography_translations?: Record<string, string>;
  profile_image_url?: string;
}

/** Yazar kaydı oluşturur (authors tablosu: slug, name_translations, biography_translations). */
export async function createAuthor(payload: CreateAuthorPayload) {
  const db = supabaseAdmin ?? supabase;
  const name = payload.name.trim();
  const biography = (payload.biography ?? '').trim();

  const name_translations = normalizeAuthorTranslations(payload.name_translations, name);
  const biography_translations = normalizeAuthorTranslations(
    payload.biography_translations,
    biography
  );

  let slug = slugifyAuthorName(name);
  const row = {
    name,
    slug,
    biography,
    name_translations,
    biography_translations,
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
  name_translations?: Record<string, string>;
  biography_translations?: Record<string, string>;
  profile_image_url?: string | null;
}

/** authors tablosunda güncelleme; isim değişince slug yenilenir. */
export async function updateAuthor(id: string, payload: UpdateAuthorPayload) {
  const db = supabaseAdmin ?? supabase;
  const name = payload.name.trim();
  const biography = (payload.biography ?? '').trim();
  if (!name) return { author: null, error: new Error('Ad zorunludur') };

  const name_translations = normalizeAuthorTranslations(payload.name_translations, name);
  const biography_translations = normalizeAuthorTranslations(
    payload.biography_translations,
    biography
  );

  const { data: current, error: fetchErr } = await db
    .from('authors')
    .select('name, slug')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return { author: null, error: fetchErr };
  if (!current) return { author: null, error: new Error('Yazar bulunamadı') };

  let slug = (current as { slug?: string }).slug ?? slugifyAuthorName(name);
  if ((current as { name: string }).name !== name) {
    slug = slugifyAuthorName(name);
  }

  const row: Record<string, unknown> = {
    name,
    slug,
    biography,
    name_translations,
    biography_translations,
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
