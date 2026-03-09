import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { convertSupabaseBookToBook } from '../lib/converters';
import type { Book } from '../types';
import type { SupabaseBook } from '../lib/supabase';

interface UseSupabaseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

/**
 * Supabase'den kitapları çeken custom hook
 * Otomatik olarak book_files ile join yapar
 * Seçili dile göre kitapları filtreler
 * Progressive loading: İlk 20 kitap hızlı, sonra daha fazla yüklenebilir
 */
export function useSupabaseBooks(): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [offset, setOffset] = useState<number>(0);
  const ITEMS_PER_PAGE = 20;

  const fetchBooks = async (isLoadMore: boolean = false) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      setLoadingMore(false);
      setBooks([]);
      setError('Supabase yapılandırılmamış. .env dosyasında NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlayın.');
      return;
    }
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
      }
      setError(null);

      const currentLanguage = i18n.language;
      const currentOffset = isLoadMore ? offset : 0;

      // Supabase'den kitapları ve dosyalarını çek - dil filtrelemesi ile
      // Progressive loading: İlk 20 kitap hızlı, sonra pagination
      const { data, error: supabaseError, count } = await supabase
        .from('books')
        .select(`
          *,
          book_files (*)
        `, { count: 'exact' })
        .eq('language', currentLanguage)
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      if (!data) {
        if (isLoadMore) {
          setHasMore(false);
        } else {
          setBooks([]);
        }
        return;
      }

      // Supabase formatından frontend formatına dönüştür
      const convertedBooks = data.map((supabaseBook: SupabaseBook) => 
        convertSupabaseBookToBook(supabaseBook)
      );

      // LoadMore ise mevcut kitaplara ekle, değilse yeni liste
      if (isLoadMore) {
        setBooks(prev => [...prev, ...convertedBooks]);
        setOffset(prev => prev + ITEMS_PER_PAGE);
      } else {
        setBooks(convertedBooks);
        setOffset(ITEMS_PER_PAGE);
      }

      // Daha fazla kitap var mı kontrolü
      const totalBooks = count || 0;
      const currentTotal = isLoadMore ? books.length + convertedBooks.length : convertedBooks.length;
      setHasMore(currentTotal < totalBooks);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
      console.error('❌ Error fetching books:', err);
      setError(errorMessage);
      if (!isLoadMore) {
        setBooks([]);
      }
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) {
      await fetchBooks(true);
    }
  };

  // Component mount olduğunda ve dil değiştiğinde kitapları çek
  useEffect(() => {
    fetchBooks(false);
  }, [i18n.language]); // Dil değiştiğinde yeniden fetch et

  // Arka planda otomatik olarak kalan kitapları yükle (kullanıcı fark etmez)
  useEffect(() => {
    if (!loading && hasMore && !loadingMore) {
      // İlk yükleme bittikten 2 saniye sonra, arka planda kalan kitapları çekmeye başla
      const timer = setTimeout(() => {
        loadMore();
      }, 2000); // 2 saniye bekle

      return () => clearTimeout(timer);
    }
  }, [loading, hasMore, loadingMore, books.length])

  return {
    books,
    loading,
    error,
    refetch: () => fetchBooks(false),
    loadMore,
    hasMore,
    loadingMore
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
    refetch: fetchBooksByCategory,
    loadMore: async () => {}, // Category view doesn't need pagination
    hasMore: false,
    loadingMore: false
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
