'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { Grid3X3, List, BookOpen } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useSupabaseBooks } from '@/hooks/useSupabaseBooks';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import type { Book } from '@/types';

const CategoriesPage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Supabase'den kategorileri ve kitapları çek
  const { categories: supabaseCategories, loading: categoriesLoading, error: categoriesError } = useSupabaseCategories();
  const { books: supabaseBooks, loading: booksLoading, loadMore, hasMore, loadingMore } = useSupabaseBooks();
  const booksLoadMoreRef = useLoadMoreOnScroll(loadMore, {
    hasMore,
    loading: booksLoading,
    loadingMore,
    watchKey: selectedCategory ?? 'overview',
  });
  
  const currentLang = i18n.language as 'tr' | 'en' | 'ru' | 'az';

  useEffect(() => {
    setSearchMode('categories');
    setPlaceholder(t('search.categoriesPlaceholder') || 'Kategori ara...');
  }, [setSearchMode, setPlaceholder, t]);

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  // Get books by category
  const getBooksByCategory = (categoryName: string) => {
    return supabaseBooks.filter(book => book.category === categoryName);
  };

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return supabaseCategories;
    }
    
    const term = searchTerm.toLowerCase();
    return supabaseCategories.filter(category => 
      category.name.toLowerCase().includes(term) ||
      Object.values(category.nameTranslations).some(name => 
        name.toLowerCase().includes(term)
      ) ||
      category.description.toLowerCase().includes(term) ||
      Object.values(category.descriptionTranslations).some(desc => 
        desc.toLowerCase().includes(term)
      )
    );
  }, [searchTerm, supabaseCategories]);

  // Calculate total statistics
  const totalStats = useMemo(() => {
    const totalCategories = supabaseCategories.length;
    const totalBooks = supabaseBooks.length;
    const totalDownloads = supabaseBooks.reduce((sum, book) => sum + (book.downloadCount || 0), 0);
    
    return {
      categories: totalCategories,
      books: totalBooks,
      downloads: totalDownloads
    };
  }, [supabaseCategories, supabaseBooks]);

  const booksListLoading = booksLoading && supabaseBooks.length === 0;

  if (categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('common.loading')}</h2>
          <p className="text-gray-600">{t('categories.loadingCategories')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (categoriesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">{t('categories.errorOccurred')}</h2>
          <p className="text-gray-700 mb-6">{categoriesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            {t('categories.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  // If a category is selected, show its books
  if (selectedCategory) {
    const category = supabaseCategories.find(cat => cat.name === selectedCategory);
    const categoryBooks = getBooksByCategory(selectedCategory);

    if (!category) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button & Category Header */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center space-x-2"
            >
              <span>←</span>
              <span>{t('categories.backToCategories')}</span>
            </button>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-4xl">{category.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {getLocalizedText(category.nameTranslations, category.name)}
                </h1>
                <p className="text-gray-600">
                  {getLocalizedText(category.descriptionTranslations, category.description)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {booksListLoading ? (
                  <span className="inline-block h-5 w-28 animate-pulse rounded bg-gray-200" />
                ) : (
                  <>
                    {categoryBooks.length} {t('categories.booksFound')}
                  </>
                )}
              </p>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Category Books */}
          {booksListLoading && categoryBooks.length === 0 ? (
            <BookGridSkeleton
              count={8}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
            />
          ) : categoryBooks.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
              : "space-y-4"
            }>
              {categoryBooks.map((book) => (
                <div key={book.id} className="h-full min-h-0">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {t('categories.noBooksInCategory')}
              </h3>
              <p className="text-gray-600">
                {t('categories.noBooksInCategoryDesc')}
              </p>
            </div>
          )}

          {hasMore && (
            <div ref={booksLoadMoreRef} className="h-10 w-full" aria-hidden />
          )}
          {loadingMore && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                {t('common.loading')}…
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show categories overview
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('categories.pageTitle')}
          </h1>
          <p className="text-gray-600">
            {t('categories.pageDescription')}
          </p>
        </div>

        {/* Search Results Header */}
        {searchTerm && (
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredCategories.length} {t('categories.searchResultsFor')} &quot;{searchTerm}&quot; {t('categories.searchResultsForSuffix')}
            </p>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredCategories.map((category) => {
            const categoryBooks = getBooksByCategory(category.name);
            
            return (
              <div
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-6">
                  {/* Category Icon & Title */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="text-4xl">{category.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {getLocalizedText(category.nameTranslations, category.name)}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {booksListLoading ? (
                          <span className="inline-block h-4 w-10 animate-pulse rounded bg-gray-200 align-middle" />
                        ) : (
                          <>
                            {categoryBooks.length} {t('categories.booksInCategory')}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Category Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {getLocalizedText(category.descriptionTranslations, category.description)}
                  </p>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-primary-600 font-medium text-sm group-hover:text-primary-700 transition-colors">
                      {t('categories.goToCategory')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {searchTerm && filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {t('categories.categoryNotFound')}
            </h3>
            <p className="text-gray-600">
              &quot;{searchTerm}&quot; {t('categories.categoryNotFoundDesc')}
            </p>
          </div>
        )}

        {/* Category Stats */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('categories.totalStatistics')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {totalStats.categories}
                </div>
                <div className="text-gray-600">{t('categories.totalCategories')}</div>
              </div>
              <div className="text-center">
                {booksListLoading ? (
                  <div className="mx-auto mb-1 h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
                ) : (
                  <div className="text-2xl font-bold text-primary-600">
                    {totalStats.books}
                  </div>
                )}
                <div className="text-gray-600">{t('categories.totalBooks')}</div>
              </div>
            </div>
          </div>
        </div>

        {hasMore && (
          <div ref={booksLoadMoreRef} className="h-10 w-full" aria-hidden />
        )}
        {loadingMore && (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              {t('common.loading')}…
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
