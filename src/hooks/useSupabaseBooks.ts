import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { convertSupabaseBookToBook } from '../lib/converters';
import type { Book } from '../types';
import type { SupabaseBook } from '../lib/supabase';

interface UseSupabaseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Supabase'den kitapları çeken custom hook
 * Otomatik olarak book_files ile join yapar
 * Seçili dile göre kitapları filtreler
 * LIMIT ekleyerek ilk yüklemede sadece 20 kitap çeker (performans için)
 */
export function useSupabaseBooks(): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentLanguage = i18n.language;

      // Supabase'den kitapları ve dosyalarını çek - dil filtrelemesi ile
      // İlk yüklemede performans için sadece 20 kitap (hızlı yükleme)
      const { data, error: supabaseError } = await supabase
        .from('books')
        .select(`
          *,
          book_files (*)
        `)
        .eq('language', currentLanguage)
        .order('created_at', { ascending: false })
        .limit(20);

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      if (!data) {
        setBooks([]);
        return;
      }

      // Supabase formatından frontend formatına dönüştür
      const convertedBooks = data.map((supabaseBook: SupabaseBook) => 
        convertSupabaseBookToBook(supabaseBook)
      );

      setBooks(convertedBooks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
      console.error('❌ Error fetching books:', err);
      setError(errorMessage);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda ve dil değiştiğinde kitapları çek
  useEffect(() => {
    fetchBooks();
  }, [i18n.language]); // Dil değiştiğinde yeniden fetch et

  return {
    books,
    loading,
    error,
    refetch: fetchBooks
  };
}

/**
 * Belirli bir kategoriye göre kitapları filtreler (dil ile birlikte)
 */
export function useSupabaseBooksByCategory(category: string): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooksByCategory = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentLanguage = i18n.language;
      console.log(`📚 Fetching books for category: ${category}, language: ${currentLanguage}`);

      const { data, error: supabaseError } = await supabase
        .from('books')
        .select(`
          *,
          book_files (*)
        `)
        .eq('category', category)
        .eq('language', currentLanguage)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      if (!data) {
        setBooks([]);
        return;
      }

      const convertedBooks = data.map((supabaseBook: SupabaseBook) => 
        convertSupabaseBookToBook(supabaseBook)
      );

      setBooks(convertedBooks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
      console.error('❌ Error fetching books by category:', err);
      setError(errorMessage);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      fetchBooksByCategory();
    }
  }, [category, i18n.language]); // Kategori veya dil değiştiğinde yeniden fetch et

  return {
    books,
    loading,
    error,
    refetch: fetchBooksByCategory
  };
}

/**
 * Tek bir kitabı ID'ye göre getirir
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    console.log(`📖 Fetching book with ID: ${id}`);

    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        book_files (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching book:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return convertSupabaseBookToBook(data);
  } catch (err) {
    console.error('❌ Error in getBookById:', err);
    return null;
  }
}
