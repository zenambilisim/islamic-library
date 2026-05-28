'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import { resolveSearchLocale, textIncludesSearch } from '@/lib/search-utils';
import CategoriesHero from '@/components/categories/CategoriesHero';
import CategoryCard from '@/components/categories/CategoryCard';
import CategoriesGridSkeleton from '@/components/categories/CategoriesGridSkeleton';

const CategoriesPage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();

  const activeLanguage = resolveAppLanguage(i18n.language);
  const {
    categories: supabaseCategories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch,
  } = useSupabaseCategories(activeLanguage);

  const [totalBooksCount, setTotalBooksCount] = useState<number | null>(null);

  const localeTag =
    activeLanguage === 'tr'
      ? 'tr-TR'
      : activeLanguage === 'ru'
        ? 'ru-RU'
        : activeLanguage === 'az'
          ? 'az-AZ'
          : 'en-US';

  useEffect(() => {
    setSearchMode('categories');
    setPlaceholder(t('search.categoriesPlaceholder') || 'Kategori ara...');
  }, [setSearchMode, setPlaceholder, t]);

  useEffect(() => {
    let cancelled = false;
    const lang = resolveAppLanguage(i18n.language);
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
      });
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return supabaseCategories;
    }

    const searchLocale = resolveSearchLocale(activeLanguage);
    return supabaseCategories.filter(
      (category) =>
        textIncludesSearch(category.name, searchTerm, searchLocale) ||
        textIncludesSearch(category.slug, searchTerm, searchLocale) ||
        textIncludesSearch(category.description, searchTerm, searchLocale),
    );
  }, [searchTerm, supabaseCategories, activeLanguage]);

  const scrollToGrid = () => {
    document.getElementById('categories-grid')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const isSearchMode = searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        {!isSearchMode && (
          <CategoriesHero
            totalCategories={categoriesLoading ? null : supabaseCategories.length}
            totalBooks={totalBooksCount}
            localeTag={localeTag}
            onBrowse={scrollToGrid}
          />
        )}

        <section id="categories-grid">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
                {isSearchMode
                  ? t('search.resultsFor', {
                      count: filteredCategories.length,
                      word: searchTerm,
                    })
                  : t('categories.pageTitle')}
              </h2>
              {!isSearchMode && (
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  {t('categories.browseByCategory')}
                </p>
              )}
            </div>
          </div>

          {categoriesError && !categoriesLoading && (
            <div className="mb-6 rounded-editorial border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="mb-3 font-medium">{categoriesError}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('categories.tryAgain')}
              </button>
            </div>
          )}

          {categoriesLoading ? (
            <CategoriesGridSkeleton count={6} />
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          ) : isSearchMode ? (
            <div className="py-16 text-center">
              <Grid3X3 size={40} className="mx-auto mb-4 text-ink-faint" strokeWidth={1.5} />
              <p className="font-display text-xl font-medium text-ink">
                {t('categories.categoryNotFound')}
              </p>
              <p className="mt-2 text-ink-muted">{t('categories.categoryNotFoundDesc')}</p>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="font-display text-xl font-medium text-ink">
                {t('categories.noCategories')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CategoriesPage;
