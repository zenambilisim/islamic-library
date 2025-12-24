import { useState, useEffect } from 'react';
import { getBooks, getBooksByCategory, getCategories } from '../lib/books';
import { convertSupabaseBookToBook } from '../lib/converters';
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
        
        // Check if Supabase is configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('Supabase not configured, returning empty data');
          setBooks([]);
          return;
        }

        console.log('Fetching books with filters:', filters);
        
        let result;
        if (filters?.category) {
          result = await getBooksByCategory(filters.category);
        } else {
          result = await getBooks();
        }
        
        console.log('Supabase result:', result);
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        const convertedBooks = result.books.map(convertSupabaseBookToBook);
        console.log('Converted books:', convertedBooks.length);
        setBooks(convertedBooks);
        
      } catch (err) {
        console.error('Error fetching books:', err);
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
        
        // Check if Supabase is configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          console.warn('Supabase not configured, returning empty data');
          setCategories([]);
          setAuthors([]);
          return;
        }

        console.log('Fetching categories and authors...');
        
        const categoriesResult = await getCategories();
        
        console.log('Categories result:', categoriesResult);
        
        if (categoriesResult.error) {
          throw new Error(categoriesResult.error.message);
        }
        
        setCategories(categoriesResult.categories || []);
        setAuthors([]);
        
      } catch (err) {
        console.error('Error fetching data:', err);
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
    authors: { authors, loading, error }
  };
};
