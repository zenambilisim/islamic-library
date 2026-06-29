'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ChevronLeft, User } from 'lucide-react';
import { getBooksByAuthorId as fetchBooksByAuthorId } from '@/hooks/useSupabaseAuthors';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import HeroPattern from '@/components/home/HeroPattern';
import { resolveAuthorDisplayName } from '@/lib/author-display-name';
import type { Author, Book } from '@/types';

interface AuthorDetailSectionProps {
  author: Author;
  onBack: () => void;
}

export function AuthorDetailSection({ author, onBack }: AuthorDetailSectionProps) {
  const { t } = useTranslation();
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const displayName = resolveAuthorDisplayName(author.name, t);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoadingBooks(true);
      try {
        const { books, error } = await fetchBooksByAuthorId(author.id);
        if (cancelled) return;
        setAuthorBooks(error || !books ? [] : books);
      } catch {
        if (!cancelled) setAuthorBooks([]);
      } finally {
        if (!cancelled) setLoadingBooks(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [author.id]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-ink-muted transition-colors hover:text-accent"
        >
          <ChevronLeft size={18} strokeWidth={2} aria-hidden />
          {t('authors.backToAuthors')}
        </button>

        <section className="relative overflow-hidden rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-7 md:p-8 shadow-soft">
          <HeroPattern />
          <div className="relative flex flex-wrap items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
              <User size={24} strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                {t('authors.pageTitle')}
              </p>
              <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-tight text-ink md:text-[2.25rem]">
                {displayName}
              </h1>
              {author.biography ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted md:text-[15px]">
                  {author.biography}
                </p>
              ) : null}
              <p className="mt-4 text-[12.5px] text-ink-muted">
                {loadingBooks ? (
                  <span className="inline-block h-4 w-24 animate-pulse rounded bg-cream-200" />
                ) : (
                  <>
                    <span className="font-display text-lg font-semibold tabular-nums text-ink">
                      {authorBooks.length}
                    </span>{' '}
                    {t('authors.booksFound')}
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

          {loadingBooks ? (
            <BookGridSkeleton
              count={8}
              className="books-grid grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
            />
          ) : authorBooks.length > 0 ? (
            <div className="books-grid grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
              {authorBooks.map((book, index) => (
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
                {t('authors.noBooksForAuthor')}
              </p>
              <p className="mt-2 text-ink-muted">{t('authors.noBooksMessage')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
