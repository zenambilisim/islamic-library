import { useState, useEffect, useCallback, useRef } from 'react';
import type { Author } from '../types';

const SEARCH_DEBOUNCE_MS = 300;

interface UseSupabaseAuthorsReturn {
  authors: Author[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  debouncedSearch: string;
}

function normalizeQueryLanguage(language?: string): string | null {
  const base = (language || '').trim().toLowerCase().split('-')[0];
  if (base === 'tr' || base === 'en' || base === 'ru' || base === 'az') return base;
  return null;
}

/**
 * Sunucu API'sinden yazarları çeken custom hook
 * GET /api/authors – Supabase env sadece sunucuda (SUPABASE_URL, SUPABASE_ANON_KEY)
 */
interface UseSupabaseAuthorsOptions {
  /** false ise istek atılmaz (ör. ana sayfa araması kapalıyken). */
  enabled?: boolean;
  /** SSR ilk liste — ilk fetch atlanır */
  initialAuthors?: Author[];
}

export function useSupabaseAuthors(
  language?: string,
  options?: UseSupabaseAuthorsOptions,
): UseSupabaseAuthorsReturn {
  const enabled = options?.enabled !== false;
  const initialAuthors = options?.initialAuthors;
  const hasSeed = initialAuthors != null;
  const skipFetchRef = useRef(hasSeed && enabled);

  const [authors, setAuthors] = useState<Author[]>(() => initialAuthors ?? []);
  const [loading, setLoading] = useState(() => !(hasSeed && enabled));
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const fetchGenerationRef = useRef(0);
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  const [prevLang, setPrevLang] = useState(language);
  const [prevDebounced, setPrevDebounced] = useState(debouncedSearch);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // enabled / dil / arama değişince aynı render'da loading=true
  if (
    enabled !== prevEnabled ||
    language !== prevLang ||
    debouncedSearch !== prevDebounced
  ) {
    setPrevEnabled(enabled);
    setPrevLang(language);
    setPrevDebounced(debouncedSearch);
    if (enabled && !skipFetchRef.current) setLoading(true);
  }

  const fetchAuthors = useCallback(async () => {
    if (!enabled) {
      fetchGenerationRef.current += 1;
      setAuthors([]);
      setLoading(false);
      setError(null);
      return;
    }
    const generation = ++fetchGenerationRef.current;
    const isStale = () => generation !== fetchGenerationRef.current;
    try {
      setLoading(true);
      setError(null);
      const lang = normalizeQueryLanguage(language);
      const params = new URLSearchParams();
      if (lang) params.set('language', lang);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const qs = params.toString();
      const res = await fetch(`/api/authors${qs ? `?${qs}` : ''}`);
      if (isStale()) return;
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setAuthors(Array.isArray(data.authors) ? data.authors : []);
    } catch (err) {
      if (isStale()) return;
      setError(err instanceof Error ? err.message : 'Yazarlar yüklenirken bir hata oluştu');
      setAuthors([]);
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [language, debouncedSearch, enabled]);

  useEffect(() => {
    if (skipFetchRef.current && enabled && !debouncedSearch) {
      skipFetchRef.current = false;
      return;
    }
    skipFetchRef.current = false;
    void fetchAuthors();
  }, [fetchAuthors, enabled, debouncedSearch]);

  return {
    authors,
    loading,
    error,
    refetch: fetchAuthors,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
  };
}

/** Sunucu API'sinden tek yazar getirir: GET /api/authors/by-id/[id] */
export async function getAuthorById(id: string): Promise<Author | null> {
  try {
    const res = await fetch(`/api/authors/by-id/${encodeURIComponent(id)}`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Yazar adına göre kitaplar: GET /api/authors/[name]/books?language=... */
export async function getBooksByAuthor(authorName: string, language?: string) {
  try {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const url = `/api/authors/${encodeURIComponent(authorName)}/books${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { books: [], error: new Error(data.error || res.statusText) };
    }
    const data = await res.json();
    return { books: Array.isArray(data.books) ? data.books : [], error: null };
  } catch (err) {
    return { books: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/** Yazar UUID’sine göre kitaplar: GET /api/authors/by-id/[id]/books */
export async function getBooksByAuthorId(authorId: string) {
  try {
    const res = await fetch(`/api/authors/by-id/${encodeURIComponent(authorId)}/books`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { books: [], error: new Error(data.error || res.statusText) };
    }
    const data = await res.json();
    return { books: Array.isArray(data.books) ? data.books : [], error: null };
  } catch (err) {
    return { books: [], error: err instanceof Error ? err : new Error(String(err)) };
  }
}

/** İleride API ile implement edilebilir */
export async function getPopularAuthors(_limit: number = 10): Promise<Author[]> {
  return [];
}

/** İleride API ile implement edilebilir */
export async function getRecentAuthors(_limit: number = 10): Promise<Author[]> {
  return [];
}

/** İleride API ile implement edilebilir */
export async function getAuthorsByLetter(_letter: string): Promise<Author[]> {
  return [];
}

/** İleride API ile implement edilebilir */
export async function getAvailableLetters(): Promise<string[]> {
  return [];
}
