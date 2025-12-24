import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { convertSupabaseAuthorToAuthor } from '../lib/converters';
import type { Author } from '../types';
import type { SupabaseAuthor } from '../lib/supabase';

interface UseSupabaseAuthorsReturn {
  authors: Author[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Supabase'den yazarları çeken custom hook
 * authors_view'dan yazarları çeker (books tablosundan otomatik türetilmiş)
 */
export function useSupabaseAuthors(): UseSupabaseAuthorsReturn {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);

      // Önce authors_view'ı dene
      let { data, error: supabaseError } = await supabase
        .from('authors_view')
        .select('*')
        .order('book_count', { ascending: false });

      // Eğer view yoksa, books tablosundan yazarları çıkar
      if (supabaseError && supabaseError.message.includes('does not exist')) {
        // Books'tan tüm yazarları çek
        const { data: booksData, error: booksError } = await supabase
          .from('books')
          .select('author, author_translations, description, description_translations');

        if (booksError) {
          throw booksError;
        }

        if (!booksData || booksData.length === 0) {
          setAuthors([]);
          return;
        }

        // Yazarları unique hale getir ve grupla
        const authorsMap = new Map<string, {
          name: string;
          name_translations: any;
          book_count: number;
          biography?: string;
          biography_translations?: any;
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

        // Map'i array'e çevir ve SupabaseAuthor formatına dönüştür
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

        // Kitap sayısına göre sırala
        data.sort((a, b) => b.book_count - a.book_count);
      } else if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      if (!data || data.length === 0) {
        setAuthors([]);
        return;
      }

      // Supabase formatından frontend formatına dönüştür
      const convertedAuthors = data.map((supabaseAuthor: SupabaseAuthor) => 
        convertSupabaseAuthorToAuthor(supabaseAuthor)
      );

      setAuthors(convertedAuthors);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Yazarlar yüklenirken bir hata oluştu';
      console.error('❌ Error fetching authors:', err);
      setError(errorMessage);
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda yazarları çek
  useEffect(() => {
    fetchAuthors();
  }, []);

  return {
    authors,
    loading,
    error,
    refetch: fetchAuthors
  };
}

/**
 * Tek bir yazarı ID'ye göre getirir
 */
export async function getAuthorById(id: string): Promise<Author | null> {
  try {
    console.log(`👤 Fetching author with ID: ${id}`);

    const { data, error } = await supabase
      .from('authors_view')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching author:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return convertSupabaseAuthorToAuthor(data);
  } catch (err) {
    console.error('❌ Error fetching author by ID:', err);
    return null;
  }
}

/**
 * Yazar adına göre kitapları getirir (belirli bir dilde)
 * @param authorName - Yazar adı
 * @param language - Dil kodu (tr, en, ru, az)
 */
export async function getBooksByAuthor(authorName: string, language?: string) {
  try {
    let query = supabase
      .from('books')
      .select(`
        id,
        title,
        title_translations,
        author,
        author_translations,
        category,
        category_translations,
        description,
        description_translations,
        cover_image_url,
        publish_year,
        pages,
        language,
        file_size,
        download_count,
        tags,
        created_at,
        updated_at,
        book_files (
          id,
          format,
          file_url,
          file_size_mb,
          file_size_text
        )
      `)
      .eq('author', authorName);

    // Eğer dil belirtilmişse filtrele
    if (language) {
      query = query.eq('language', language);
    }

    const { data, error } = await query.order('publish_year', { ascending: false });

    if (error) {
      console.error('❌ Error fetching books by author:', error);
      return { books: [], error };
    }

    return { books: data || [], error: null };
  } catch (err) {
    console.error('❌ Error fetching books by author:', err);
    return { books: [], error: err as Error };
  }
}

/**
 * Popüler yazarları getirir (en çok indirilen)
 */
export async function getPopularAuthors(limit: number = 10): Promise<Author[]> {
  try {
    const { data, error } = await supabase
      .from('popular_authors')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching popular authors:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((author: SupabaseAuthor) => convertSupabaseAuthorToAuthor(author));
  } catch (err) {
    console.error('❌ Error fetching popular authors:', err);
    return [];
  }
}

/**
 * Son kitap ekleyen yazarları getirir
 */
export async function getRecentAuthors(limit: number = 10): Promise<Author[]> {
  try {
    const { data, error } = await supabase
      .from('recent_authors')
      .select('*')
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching recent authors:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((author: SupabaseAuthor) => convertSupabaseAuthorToAuthor(author));
  } catch (err) {
    console.error('❌ Error fetching recent authors:', err);
    return [];
  }
}

/**
 * Harfe göre yazarları getirir (alfabetik)
 */
export async function getAuthorsByLetter(letter: string): Promise<Author[]> {
  try {
    const { data, error } = await supabase
      .from('authors_view')
      .select('*')
      .ilike('name', `${letter}%`)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Error fetching authors by letter:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((author: SupabaseAuthor) => convertSupabaseAuthorToAuthor(author));
  } catch (err) {
    console.error('❌ Error fetching authors by letter:', err);
    return [];
  }
}

/**
 * Hangi harflerde yazar olduğunu getirir
 */
export async function getAvailableLetters(): Promise<string[]> {
  try {
    console.log('🔤 Fetching available letters...');

    const { data, error } = await supabase
      .from('authors_by_letter')
      .select('letter')
      .order('letter', { ascending: true });

    if (error) {
      console.error('❌ Error fetching available letters:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row: { letter: string }) => row.letter);
  } catch (err) {
    console.error('❌ Error fetching available letters:', err);
    return [];
  }
}
