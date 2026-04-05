import { supabase, supabaseAdmin } from './supabase-server';
import { convertSupabaseAuthorToAuthor } from './converters-server';
import { convertSupabaseBookToBook } from './converters-server';
import type { Author } from '@/types';
import type { Book } from '@/types';
import type { SupabaseAuthor, SupabaseBook } from './supabase';

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
      } as SupabaseAuthor));

      (data as SupabaseAuthor[]).sort((a, b) => b.book_count - a.book_count);
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

    const { data, error } = await query.order('publish_year', { ascending: false });

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

/** Yazar kaydı oluşturur (authors tablosu varsa). */
export async function createAuthor(payload: CreateAuthorPayload) {
  const db = supabaseAdmin ?? supabase;
  const name = payload.name.trim();
  const biography = (payload.biography ?? '').trim();

  const row = {
    name,
    biography,
    name_translations: payload.name_translations ?? {
      tr: name,
      en: name,
      ru: name,
      az: name,
    },
    biography_translations: payload.biography_translations ?? {
      tr: biography,
      en: biography,
      ru: biography,
      az: biography,
    },
    profile_image_url: payload.profile_image_url ?? null,
  };

  const { data, error } = await db
    .from('authors')
    .insert(row)
    .select('*')
    .single();

  if (error) return { author: null, error };
  return { author: data, error: null };
}
