'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { BookOpen, Folder } from 'lucide-react';
import { useSupabaseBooksByCategory } from '@/hooks/useSupabaseBooks';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import type { Category } from '@/types';

/** Tek kategori görünümü: kitaplar sayfalı yüklenir (kaydırınca devam). */
export function CategoryDetailSection({ category }: { category: Category }) {
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
          <Link
            href="/categories"
            className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center space-x-2"
          >
            <span>←</span>
            <span>{t('categories.backToCategories')}</span>
          </Link>

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
          </div>
        </div>

        {loading && books.length === 0 ? (
          <BookGridSkeleton
            count={8}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
          />
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
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

        {hasMore && <div ref={booksLoadMoreRef} className="h-10 w-full shrink-0" aria-hidden />}
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
