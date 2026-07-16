'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Folder } from 'lucide-react';
import { useSupabaseBooksByCategory } from '@/hooks/useSupabaseBooks';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import HeroPattern from '@/components/home/HeroPattern';
import type { Category } from '@/types';

/** Tek kategori görünümü: kitaplar sayfalı yüklenir (kaydırınca devam). */
export function CategoryDetailSection({ category }: { category: Category }) {
  const { t } = useTranslation();
  const { books, loading, error, loadMore, hasMore, loadingMore } = useSupabaseBooksByCategory(
    category.slug,
  );
  const booksLoadMoreRef = useLoadMoreOnScroll(loadMore, {
    hasMore,
    loading,
    loadingMore,
    watchKey: category.slug,
  });

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        <Link
          href="/categories"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-accent"
        >
          <ChevronLeft size={18} strokeWidth={2} aria-hidden />
          {t('categories.backToCategories')}
        </Link>

        <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-7 md:p-8 shadow-soft">
          <HeroPattern />
          <div className="relative flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Folder size={24} strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-[2.25rem]">
                {category.name}
              </h1>
              {category.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-[15px]">
                  {category.description}
                </p>
              ) : null}
              <p className="mt-4 text-[12.5px] text-ink-muted">
                {loading ? (
                  <span className="inline-block h-4 w-24 animate-pulse rounded bg-cream-200" />
                ) : error ? (
                  <span className="text-red-600">{error}</span>
                ) : (
                  <>
                    <span className="font-display text-lg font-semibold tabular-nums text-ink">
                      {category.bookCount}
                    </span>{' '}
                    {t('categories.booksFound')}
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
              {t('hero.catalogTitle', 'Katalog')}
            </h2>
          </div>

          {loading && books.length === 0 ? (
            <BookGridSkeleton
              count={8}
              className="books-grid grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
            />
          ) : books.length > 0 ? (
            <div className="books-grid grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {books.map((book, index) => (
                <div
                  key={book.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <BookCard book={book} variant="compact" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] py-16 text-center shadow-soft">
              <BookOpen size={48} className="mx-auto mb-4 text-ink-faint" strokeWidth={1.5} />
              <p className="font-display text-xl font-medium text-ink">
                {t('categories.noBooksInCategory')}
              </p>
              <p className="mt-2 text-ink-muted">{t('categories.noBooksInCategoryDesc')}</p>
            </div>
          )}

          {hasMore && <div ref={booksLoadMoreRef} className="h-10 w-full shrink-0" aria-hidden />}
          {loadingMore && (
            <p className="mt-8 text-center text-sm text-ink-muted">{t('common.loading')}…</p>
          )}
        </section>
      </div>
    </div>
  );
}
