import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book, Language, SearchFilters } from '../types';

export function resolveAppLanguage(i18nLng: string | undefined): Language {
  const base = (i18nLng || 'tr').split('-')[0].toLowerCase();
  if (base === 'tr' || base === 'en' || base === 'ru' || base === 'az') return base;
  return 'tr';
}

interface UseSupabaseBooksReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
}

const ITEMS_PER_PAGE = 10;

/** Kategori detay sayfası — bir istekte taşınacak kitap sayısı */
const CATEGORY_ITEMS_PER_PAGE = 12;

/**
 * Sunucu API'sinden kitapları çeken custom hook
 * GET /api/books – sayfalama; seçili arayüz diline göre filtre (books.language)
 */
export function useSupabaseBooks(sortBy: SearchFilters['sortBy'] = 'uploadDate'): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const pageRef = useRef(page);
  pageRef.current = page;
  const loadMoreInFlightRef = useRef(false);

  const fetchBooks = useCallback(async (isLoadMore: boolean = false) => {
    try {
      if (isLoadMore) {
        if (loadMoreInFlightRef.current) return;
        loadMoreInFlightRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(0);
      }
      setError(null);

      const currentPage = isLoadMore ? pageRef.current : 0;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        language,
        sortBy: sortBy ?? 'uploadDate',
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
      setHasMore(
        typeof nextHasMore === 'boolean'
          ? nextHasMore
          : nextBooks.length >= ITEMS_PER_PAGE
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
      setError(errorMessage);
      if (!isLoadMore) setBooks([]);
    } finally {
      if (isLoadMore) {
        loadMoreInFlightRef.current = false;
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [language, sortBy]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    await fetchBooks(true);
  }, [loading, loadingMore, hasMore, fetchBooks]);

  // Dil veya mount: listeyi baştan çek
  useEffect(() => {
    fetchBooks(false);
  }, [fetchBooks]);

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
 * Belirli bir kategoriye göre kitapları API'den sayfalı çeker (seçili dil).
 */
export function useSupabaseBooksByCategory(category: string): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const pageRef = useRef(page);
  pageRef.current = page;
  const loadMoreInFlightRef = useRef(false);

  const fetchBooks = useCallback(
    async (isLoadMore: boolean = false) => {
      if (!category) return;
      try {
        if (isLoadMore) {
          if (loadMoreInFlightRef.current) return;
          loadMoreInFlightRef.current = true;
          setLoadingMore(true);
        } else {
          setLoading(true);
          setPage(0);
        }
        setError(null);

        const currentPage = isLoadMore ? pageRef.current : 0;
        const params = new URLSearchParams({
          category,
          language,
          page: String(currentPage),
          limit: String(CATEGORY_ITEMS_PER_PAGE),
        });
        const res = await fetch(`/api/books?${params}`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || res.statusText);
        }

        const data = await res.json();
        const { books: nextBooks, hasMore: nextHasMore } = data;

        if (!Array.isArray(nextBooks)) {
          if (!isLoadMore) setBooks([]);
          return;
        }

        if (isLoadMore) {
          setBooks((prev) => [...prev, ...nextBooks]);
          setPage(currentPage + 1);
        } else {
          setBooks(nextBooks);
          setPage(1);
        }
        setHasMore(
          typeof nextHasMore === 'boolean'
            ? nextHasMore
            : nextBooks.length >= CATEGORY_ITEMS_PER_PAGE
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
        setError(errorMessage);
        if (!isLoadMore) setBooks([]);
      } finally {
        if (isLoadMore) {
          loadMoreInFlightRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [category, language]
  );

  useEffect(() => {
    if (category) void fetchBooks(false);
  }, [category, fetchBooks]);

  const loadMore = useCallback(async () => {
    if (!category || loading || loadingMore || !hasMore) return;
    await fetchBooks(true);
  }, [category, loading, loadingMore, hasMore, fetchBooks]);

  return {
    books,
    loading,
    error,
    refetch: () => fetchBooks(false),
    loadMore,
    hasMore,
    loadingMore,
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
