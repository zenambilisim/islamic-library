import { useState, useEffect } from 'react';
import type { Book, Category, Author, SearchFilters } from '../types';

export const useBooks = (filters?: SearchFilters) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (filters?.category) params.set('category', filters.category);
        const res = await fetch(`/api/books?${params}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || res.statusText);
        }
        const data = await res.json();
        setBooks(Array.isArray(data.books) ? data.books : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [filters?.category]);

  return { books, loading, error };
};

export const useBooksData = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/categories');
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || res.statusText);
        }
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setAuthors([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veri yüklenirken hata oluştu');
        setCategories([]);
        setAuthors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return {
    categories: { categories, loading, error },
    authors: { authors, loading, error },
  };
};
