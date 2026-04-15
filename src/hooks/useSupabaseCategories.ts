import { useState, useEffect } from 'react';
import type { Category } from '../types';

interface UseSupabaseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const lang = normalizeQueryLanguage(language);
      const qs = lang ? `?language=${encodeURIComponent(lang)}` : '';
      const res = await fetch(`/api/categories${qs}`);
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
  };

  useEffect(() => {
    fetchCategories();
  }, [language]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
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
