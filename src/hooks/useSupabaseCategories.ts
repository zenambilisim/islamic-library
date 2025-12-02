import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { convertSupabaseCategoryToCategory } from '../lib/converters';
import type { Category } from '../types';
import type { Category as SupabaseCategory } from '../lib/supabase';

interface UseSupabaseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Supabase'den kategorileri çeken custom hook
 */
export function useSupabaseCategories(): UseSupabaseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📂 Fetching categories from Supabase...');

      // Supabase'den kategorileri çek
      const { data, error: supabaseError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (supabaseError) {
        console.error('❌ Supabase error:', supabaseError);
        throw supabaseError;
      }

      if (!data) {
        console.warn('⚠️ No categories returned from Supabase');
        setCategories([]);
        return;
      }

      console.log(`✅ Fetched ${data.length} categories from Supabase`);

      // Supabase formatından frontend formatına dönüştür
      const convertedCategories = data.map((supabaseCategory: SupabaseCategory) => 
        convertSupabaseCategoryToCategory(supabaseCategory)
      );

      // Debug: İlk kategorinin bilgilerini göster
      if (convertedCategories.length > 0) {
        console.log('🔍 Sample category:', {
          name: convertedCategories[0].name,
          bookCount: convertedCategories[0].bookCount,
          icon: convertedCategories[0].icon
        });
      }

      setCategories(convertedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kategoriler yüklenirken bir hata oluştu';
      console.error('❌ Error fetching categories:', err);
      setError(errorMessage);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Component mount olduğunda kategorileri çek
  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  };
}

/**
 * Tek bir kategoriyi ID'ye göre getirir
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    console.log(`📂 Fetching category with ID: ${id}`);

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching category:', error);
      throw error;
    }

    if (!data) {
      console.warn('⚠️ Category not found');
      return null;
    }

    console.log('✅ Category fetched successfully');
    return convertSupabaseCategoryToCategory(data);
  } catch (err) {
    console.error('❌ Error in getCategoryById:', err);
    return null;
  }
}

/**
 * Kategori adına göre kitap sayısını günceller
 */
export async function updateCategoryBookCount(categoryName: string): Promise<void> {
  try {
    // Kategorideki kitap sayısını say
    const { count, error: countError } = await supabase
      .from('books')
      .select('*', { count: 'exact', head: true })
      .eq('category', categoryName);

    if (countError) throw countError;

    // Kategoriyi güncelle
    const { error: updateError } = await supabase
      .from('categories')
      .update({ book_count: count || 0 })
      .eq('name', categoryName);

    if (updateError) throw updateError;

    console.log(`✅ Updated book count for category "${categoryName}": ${count}`);
  } catch (err) {
    console.error('❌ Error updating category book count:', err);
  }
}
