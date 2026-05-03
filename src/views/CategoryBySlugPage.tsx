'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { CategoryDetailSection } from '@/components/categories/CategoryDetailSection';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-6 h-32 w-32 animate-spin rounded-full border-b-4 border-primary-600" />
          <h2 className="mb-2 text-2xl font-bold text-gray-800">{t('common.loading')}</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="mb-6 text-gray-700">{error}</p>
          <Link
            href="/categories"
            className="rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 text-white shadow-lg transition hover:from-primary-700 hover:to-purple-700"
          >
            {t('categories.backToCategories')}
          </Link>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">{t('categories.categoryNotFound')}</h1>
          <p className="mb-8 text-gray-600">{t('categories.categoryNotFoundDesc')}</p>
          <Link
            href="/categories"
            className="rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 text-white shadow-lg transition hover:from-primary-700 hover:to-purple-700"
          >
            {t('categories.backToCategories')}
          </Link>
        </div>
      </div>
    );
  }

  return <CategoryDetailSection category={category} />;
};

export default CategoryBySlugPage;
