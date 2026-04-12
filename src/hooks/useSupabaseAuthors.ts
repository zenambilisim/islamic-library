import { useState, useEffect } from 'react';
import type { Author } from '../types';

interface UseSupabaseAuthorsReturn {
  authors: Author[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Sunucu API'sinden yazarları çeken custom hook
 * GET /api/authors – Supabase env sadece sunucuda (SUPABASE_URL, SUPABASE_ANON_KEY)
 */
export function useSupabaseAuthors(): UseSupabaseAuthorsReturn {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/authors');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setAuthors(Array.isArray(data.authors) ? data.authors : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yazarlar yüklenirken bir hata oluştu');
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  return {
    authors,
    loading,
    error,
    refetch: fetchAuthors,
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
