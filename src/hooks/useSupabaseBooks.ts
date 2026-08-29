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

interface UseSupabaseBooksOptions {
  /** Aramada tüm sonuçları getirmek için tüm sayfaları otomatik çeker. */
  fetchAll?: boolean;
  /** SSR ilk sayfa — ilk fetch atlanır; dil/sıralama değişince yeniden çekilir */
  initialBooks?: Book[];
  initialHasMore?: boolean;
}

const ITEMS_PER_PAGE = 10;
const SEARCH_ITEMS_PER_PAGE = 50;

/** Kategori detay sayfası — bir istekte taşınacak kitap sayısı */
const CATEGORY_ITEMS_PER_PAGE = 12;

/**
 * Sunucu API'sinden kitapları çeken custom hook
 * GET /api/books – sayfalama; seçili arayüz diline göre filtre (books.language)
 */
export function useSupabaseBooks(
  sortBy: SearchFilters['sortBy'] = 'uploadDate',
  options?: UseSupabaseBooksOptions
): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);
  const fetchAll = options?.fetchAll === true;
  const initialBooks = options?.initialBooks;
  const hasSeed = initialBooks != null;
  const skipFetchRef = useRef(hasSeed);

  const [books, setBooks] = useState<Book[]>(() => initialBooks ?? []);
  const [loading, setLoading] = useState<boolean>(() => !hasSeed);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(() =>
    hasSeed ? Boolean(options?.initialHasMore) : true
  );
  const [page, setPage] = useState<number>(() => (hasSeed ? 1 : 0));
  const pageRef = useRef(page);
  pageRef.current = page;
  const loadMoreInFlightRef = useRef(false);
  /** Tam yenileme (fetchAll / dil / sıralama) için; eski isteklerin loading'i kapatmasını engeller */
  const fetchGenerationRef = useRef(0);

  // fetchAll açılınca aynı render'da loading=true — aksi halde ilk karede "sonuç yok" flaşı olur
  const [prevFetchAll, setPrevFetchAll] = useState(fetchAll);
  if (fetchAll !== prevFetchAll) {
    setPrevFetchAll(fetchAll);
    if (fetchAll) setLoading(true);
  }

  const fetchBooks = useCallback(async (isLoadMore: boolean = false) => {
    let generation = fetchGenerationRef.current;
    const isStale = () => generation !== fetchGenerationRef.current;

    try {
      if (isLoadMore) {
        if (loadMoreInFlightRef.current) return;
        loadMoreInFlightRef.current = true;
        setLoadingMore(true);
      } else {
        generation = ++fetchGenerationRef.current;
        setLoading(true);
        setPage(0);
        pageRef.current = 0;
      }
      setError(null);

      if (!isLoadMore && fetchAll) {
        let nextPage = 0;
        const collected: Book[] = [];

        while (true) {
          if (isStale()) return;
          const params = new URLSearchParams({
            page: String(nextPage),
            limit: String(SEARCH_ITEMS_PER_PAGE),
            language,
            sortBy: sortBy ?? 'uploadDate',
          });
          const res = await fetch(`/api/books?${params}`);
          if (isStale()) return;

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || res.statusText);
          }

          const data = await res.json();
          const { books: pageBooks, hasMore: pageHasMore } = data;
          if (!Array.isArray(pageBooks)) break;

          collected.push(...pageBooks);

          const shouldLoadNext =
            typeof pageHasMore === 'boolean'
              ? pageHasMore
              : pageBooks.length >= SEARCH_ITEMS_PER_PAGE;
          if (!shouldLoadNext || pageBooks.length === 0) break;
          nextPage += 1;
        }

        if (isStale()) return;
        setBooks(collected);
        setPage(0);
        pageRef.current = 0;
        setHasMore(false);
        return;
      }

      const currentPage = isLoadMore ? pageRef.current : 0;
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        language,
        sortBy: sortBy ?? 'uploadDate',
      });
      const res = await fetch(`/api/books?${params}`);
      if (isStale()) return;

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
        const nextPage = currentPage + 1;
        setBooks(prev => [...prev, ...nextBooks]);
        setPage(nextPage);
        pageRef.current = nextPage;
      } else {
        setBooks(nextBooks);
        setPage(1);
        pageRef.current = 1;
      }
      setHasMore(
        typeof nextHasMore === 'boolean'
          ? nextHasMore
          : nextBooks.length >= ITEMS_PER_PAGE
      );
    } catch (err) {
      if (isStale()) return;
      const errorMessage = err instanceof Error ? err.message : 'Kitaplar yüklenirken bir hata oluştu';
      setError(errorMessage);
      if (!isLoadMore) setBooks([]);
    } finally {
      if (isLoadMore) {
        loadMoreInFlightRef.current = false;
        setLoadingMore(false);
      } else if (!isStale()) {
        setLoading(false);
      }
    }
  }, [fetchAll, language, sortBy]);

  const loadMore = useCallback(async () => {
    if (fetchAll || loading || loadingMore || !hasMore) return;
    await fetchBooks(true);
  }, [fetchAll, loading, loadingMore, hasMore, fetchBooks]);

  // Dil veya mount: listeyi baştan çek (SSR seed varsa ilk sefer atla)
  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
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
export function useSupabaseBooksByCategory(
  category: string,
  options?: { initialBooks?: Book[]; initialHasMore?: boolean }
): UseSupabaseBooksReturn {
  const { i18n } = useTranslation();
  const language = resolveAppLanguage(i18n.language);
  const initialBooks = options?.initialBooks;
  const hasSeed = initialBooks != null;
  const skipFetchRef = useRef(hasSeed);

  const [books, setBooks] = useState<Book[]>(() => initialBooks ?? []);
  const [loading, setLoading] = useState<boolean>(() => !hasSeed);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(() =>
    hasSeed ? Boolean(options?.initialHasMore) : true
  );
  const [page, setPage] = useState<number>(() => (hasSeed ? 1 : 0));
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
          pageRef.current = 0;
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
          const nextPage = currentPage + 1;
          setBooks((prev) => [...prev, ...nextBooks]);
          setPage(nextPage);
          pageRef.current = nextPage;
        } else {
          setBooks(nextBooks);
          setPage(1);
          pageRef.current = 1;
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
    if (!category) return;
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    void fetchBooks(false);
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
