import { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types';

const SEARCH_DEBOUNCE_MS = 300;

interface UseSupabaseCategoriesReturn {
  categories: Category[];
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
 * Sunucu API'sinden kategorileri çeker – GET /api/categories
 */
export function useSupabaseCategories(language?: string): UseSupabaseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lang = normalizeQueryLanguage(language);
      const params = new URLSearchParams();
      if (lang) params.set('language', lang);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const qs = params.toString();
      const res = await fetch(`/api/categories${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategoriler yüklenirken bir hata oluştu');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [language, debouncedSearch]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
  };
}

/** İleride GET /api/categories/[id] ile implement edilebilir */
export async function getCategoryById(_id: string): Promise<Category | null> {
  return null;
}

/** İleride API ile implement edilebilir */
export async function updateCategoryBookCount(_categoryName: string): Promise<void> {
  // no-op
}
