'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { Grid3X3, List, BookOpen, Folder } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { resolveAppLanguage, useSupabaseBooksByCategory } from '@/hooks/useSupabaseBooks';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import type { Category } from '@/types';

/** Tek kategori görünümü: kitaplar sayfalı yüklenir (kaydırınca devam). */
function CategoryDetailSection({
  category,
  viewMode,
  setViewMode,
  onBack,
}: {
  category: Category;
  viewMode: 'grid' | 'list';
  setViewMode: (m: 'grid' | 'list') => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const { books, loading, error, loadMore, hasMore, loadingMore } = useSupabaseBooksByCategory(
    category.slug
  );
  const booksLoadMoreRef = useLoadMoreOnScroll(loadMore, {
    hasMore,
    loading,
    loadingMore,
    watchKey: category.slug,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            type="button"
            onClick={onBack}
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center space-x-2"
          >
            <span>←</span>
            <span>{t('categories.backToCategories')}</span>
          </button>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <Folder size={28} strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {loading ? (
                <span className="inline-block h-5 w-28 animate-pulse rounded bg-gray-200" />
              ) : error ? (
                <span className="text-red-600 text-sm">{error}</span>
              ) : (
                <>
                  <span className="tabular-nums">{category.bookCount}</span>{' '}
                  {t('categories.booksFound')}
                </>
              )}
            </p>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 size={20} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {loading && books.length === 0 ? (
          <BookGridSkeleton
            count={8}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
          />
        ) : books.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch'
                : 'space-y-4'
            }
          >
            {books.map((book) => (
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
            <p className="text-gray-600">{t('categories.noBooksInCategoryDesc')}</p>
          </div>
        )}

        {hasMore && (
          <div ref={booksLoadMoreRef} className="h-10 w-full shrink-0" aria-hidden />
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

const CategoriesPage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const activeLanguage = resolveAppLanguage(i18n.language);
  const { categories: supabaseCategories, loading: categoriesLoading, error: categoriesError } =
    useSupabaseCategories(activeLanguage);

  const [totalBooksCount, setTotalBooksCount] = useState<number | null>(null);
  const [totalBooksLoading, setTotalBooksLoading] = useState(true);

  useEffect(() => {
    setSearchMode('categories');
    setPlaceholder(t('search.categoriesPlaceholder') || 'Kategori ara...');
  }, [setSearchMode, setPlaceholder, t]);

  useEffect(() => {
    let cancelled = false;
    const lang = resolveAppLanguage(i18n.language);
    setTotalBooksLoading(true);
    const params = new URLSearchParams({
      withTotal: '1',
      page: '0',
      limit: '1',
      language: lang,
    });
    fetch(`/api/books?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data.total === 'number') setTotalBooksCount(data.total);
        else setTotalBooksCount(null);
      })
      .catch(() => {
        if (!cancelled) setTotalBooksCount(null);
      })
      .finally(() => {
        if (!cancelled) setTotalBooksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return supabaseCategories;
    }

    const term = searchTerm.toLowerCase();
    return supabaseCategories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.slug.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term)
    );
  }, [searchTerm, supabaseCategories]);

  const totalCategoryCount = supabaseCategories.length;

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

  if (categoriesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">{t('categories.errorOccurred')}</h2>
          <p className="text-gray-700 mb-6">{categoriesError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            {t('categories.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    const category = supabaseCategories.find((cat) => cat.slug === selectedCategory);
    if (!category) return null;
    return (
      <CategoryDetailSection
        category={category}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('categories.pageTitle')}</h1>
          <p className="text-gray-600">{t('categories.pageDescription')}</p>
        </div>

        {searchTerm && (
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredCategories.length} {t('categories.searchResultsFor')} &quot;{searchTerm}&quot;{' '}
              {t('categories.searchResultsForSuffix')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCategory(category.slug)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCategory(category.slug);
                }
              }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <Folder size={24} strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {category.bookCount} {t('categories.booksInCategory')}
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{category.description}</p>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-primary-600 font-medium text-sm group-hover:text-primary-700 transition-colors">
                    {t('categories.goToCategory')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {searchTerm && filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">{t('categories.categoryNotFound')}</h3>
            <p className="text-gray-600">
              &quot;{searchTerm}&quot; {t('categories.categoryNotFoundDesc')}
            </p>
          </div>
        )}

        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('categories.totalStatistics')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{totalCategoryCount}</div>
                <div className="text-gray-600">{t('categories.totalCategories')}</div>
              </div>
              <div className="text-center">
                {totalBooksLoading ? (
                  <div className="mx-auto mb-1 h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
                ) : (
                  <div className="text-2xl font-bold text-primary-600">
                    {totalBooksCount != null ? totalBooksCount.toLocaleString() : '—'}
                  </div>
                )}
                <div className="text-gray-600">{t('categories.totalBooks')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
