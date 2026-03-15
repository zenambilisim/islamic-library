import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book } from '@/types';

const DEFAULT_PAGE_SIZE = 20;

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
  refetch: () => Promise<void>;
}

/**
 * Sayfa tabanlı kitaplar listesi (user/books tablosu için).
 * API: GET /api/books?page=&limit=&language=
 */
export function useUserBooksPaginated(
  initialPageSize: number = DEFAULT_PAGE_SIZE
): UseUserBooksPaginatedReturn {
  const { i18n } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const fetchPage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        language: i18n.language,
      });
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
  }, [page, pageSize, i18n.language]);

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
    refetch: fetchPage,
  };
}
