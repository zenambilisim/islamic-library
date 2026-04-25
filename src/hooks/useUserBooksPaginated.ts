import { useState, useEffect, useCallback, useRef } from 'react';
import type { Book } from '@/types';

const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export interface UseUserBooksPaginatedReturn {
  books: Book[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  /** Başlık araması (sunucuya gecikmeli gider) */
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  /** API’ye giden gecikmeli arama metni */
  debouncedSearch: string;
  refetch: () => Promise<void>;
}

/**
 * Sayfa tabanlı kitaplar listesi (user/books tablosu için).
 * API: GET /api/books?page=&limit= (dil filtresi yok)
 */
export function useUserBooksPaginated(
  initialPageSize: number = DEFAULT_PAGE_SIZE,
  language?: string
): UseUserBooksPaginatedReturn {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const prevDebouncedRef = useRef('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    if (prevDebouncedRef.current === debouncedSearch) return;
    prevDebouncedRef.current = debouncedSearch;
    setPage(0);
  }, [debouncedSearch]);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        withTotal: '1',
      });
      const lang = (language || '').trim().toLowerCase().split('-')[0];
      if (lang === 'tr' || lang === 'en' || lang === 'ru' || lang === 'az') {
        params.set('language', lang);
      }
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      const { books: nextBooks, total: nextTotal } = data;
      setBooks(Array.isArray(nextBooks) ? nextBooks : []);
      setTotal(typeof nextTotal === 'number' ? nextTotal : 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu');
      setBooks([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, language]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setPageSize = useCallback((size: number) => {
    const next = Math.min(50, Math.max(1, size));
    setPageSizeState(next);
    setPage(0);
  }, []);

  return {
    books,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    refetch: fetchPage,
  };
}
