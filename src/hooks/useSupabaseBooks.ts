import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types';

interface UseSupabaseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

const ITEMS_PER_PAGE = 20;

/**
 * Sunucu API'sinden kitapları çeken custom hook
 * GET /api/books - dil ve sayfalama ile
 */
export function useSupabaseBooks(): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  const fetchBooks = async (isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(0);
      }
      setError(null);

      const currentPage = isLoadMore ? page : 0;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        language: i18n.language,
      });
      const res = await fetch(`/api/books?${params}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }

      const data = await res.json();
      const { books: nextBooks, total, hasMore: nextHasMore } = data;

      if (!Array.isArray(nextBooks)) {
        if (!isLoadMore) setBooks([]);
        return;
      }

      if (isLoadMore) {
        setBooks(prev => [...prev, ...nextBooks]);
        setPage(currentPage + 1);
      } else {
        setBooks(nextBooks);
        setPage(1);
      }
      setHasMore(nextHasMore ?? nextBooks.length < total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
      setError(errorMessage);
      if (!isLoadMore) setBooks([]);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore) await fetchBooks(true);
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
 * Belirli bir kategoriye göre kitapları API'den çeker (dil ile birlikte)
 */
export function useSupabaseBooksByCategory(category: string): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooksByCategory = async () => {
    if (!category) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ category, language: i18n.language });
      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setBooks(Array.isArray(data.books) ? data.books : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) fetchBooksByCategory();
  }, [category, i18n.language]);

  return {
    books,
    loading,
    error,
    refetch: fetchBooksByCategory,
    loadMore: async () => {},
    hasMore: false,
    loadingMore: false,
  };
}

/**
 * Tek bir kitabı ID'ye göre sunucu API'sinden getirir
 */
export async function getBookById(id: string): Promise<Book | null> {
  try {
    const res = await fetch(`/api/books/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || res.statusText);
    }
    return res.json();
  } catch {
    return null;
  }
}
