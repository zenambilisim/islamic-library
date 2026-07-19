'use client';

import { useTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import { CategoryDetailSection } from '@/components/categories/CategoryDetailSection';
import { deserializeBook, type SerializedBook } from '@/lib/serialize-book';
import type { Category } from '@/types';

export type CategoryBySlugPageProps = {
  category: Category;
  initialBooks: SerializedBook[];
  initialHasMore: boolean;
};

const CategoryBySlugPage = ({
  category,
  initialBooks,
  initialHasMore,
}: CategoryBySlugPageProps) => {
  const { t } = useTranslation();
  const { setSearchMode, setPlaceholder } = useSearch();

  const seededBooks = useMemo(
    () => initialBooks.map((b) => deserializeBook(b)),
    [initialBooks],
  );

  useEffect(() => {
    setSearchMode('categories');
    setPlaceholder(t('search.categoriesPlaceholder') || 'Kategori ara…');
  }, [setSearchMode, setPlaceholder, t]);

  return (
    <CategoryDetailSection
      category={category}
      initialBooks={seededBooks}
      initialHasMore={initialHasMore}
    />
  );
};

export default CategoryBySlugPage;
