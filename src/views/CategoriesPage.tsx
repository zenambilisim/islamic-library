'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Grid3X3, Folder } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';

const CategoriesPage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();

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
            <Link
              key={category.id}
              href={`/categories/${encodeURIComponent(category.slug)}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group block"
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
            </Link>
          ))}
        </div>

        {searchTerm && filteredCategories.length === 0 && (
          <div className="text-center py-16">
            <Grid3X3 size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">{t('categories.categoryNotFound')}</h3>
            <p className="text-gray-600">
              {t('categories.categoryNotFoundDesc')}
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
