'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { CategoryDetailSection } from '@/components/categories/CategoryDetailSection';
import CategoriesGridSkeleton from '@/components/categories/CategoriesGridSkeleton';

type Props = { slug: string };

const CategoryBySlugPage = ({ slug }: Props) => {
  const { t, i18n } = useTranslation();
  const { setSearchMode, setPlaceholder } = useSearch();
  const activeLanguage = resolveAppLanguage(i18n.language);
  const { categories, loading, error } = useSupabaseCategories(activeLanguage);

  useEffect(() => {
    setSearchMode('categories');
    setPlaceholder(t('search.categoriesPlaceholder') || 'Kategori ara…');
  }, [setSearchMode, setPlaceholder, t]);

  const category = slug ? categories.find((c) => c.slug === slug) : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="content-layout">
          <div className="h-5 w-36 animate-pulse rounded bg-cream-200" />
          <div className="h-40 animate-pulse rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)]" />
          <CategoriesGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="content-layout">
          <div className="rounded-editorial border border-red-200 bg-red-50 p-6 text-center text-red-800">
            <p className="mb-4">{error}</p>
            <Link
              href="/categories"
              className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-cream"
            >
              {t('categories.backToCategories')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="content-layout">
          <div className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-10 text-center shadow-soft">
            <h1 className="font-display text-2xl font-medium text-ink">
              {t('categories.categoryNotFound')}
            </h1>
            <p className="mt-2 text-ink-muted">{t('categories.categoryNotFoundDesc')}</p>
            <Link
              href="/categories"
              className="mt-6 inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm font-semibold text-cream"
            >
              {t('categories.backToCategories')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <CategoryDetailSection category={category} />;
};

export default CategoryBySlugPage;
