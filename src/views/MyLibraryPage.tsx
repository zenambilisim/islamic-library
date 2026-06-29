'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { BookMarked, Loader2 } from 'lucide-react';
import type { Book, ReadingStatus } from '@/types';
import { useUserAuth } from '@/contexts/UserAuthContext';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import LibraryHero from '@/components/library/LibraryHero';
import ReadingListTabs from '@/components/library/ReadingListTabs';

const MyLibraryPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useUserAuth();
  const [activeTab, setActiveTab] = useState<ReadingStatus>('want_to_read');
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadList = useCallback(
    async (status: ReadingStatus) => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/user/reading-list?status=${encodeURIComponent(status)}`,
          { credentials: 'include' },
        );
        if (res.status === 401) {
          router.replace(`/user/login?from=${encodeURIComponent('/library')}`);
          return;
        }
        const data = await res.json();
        const items = (data.items ?? []) as { book: Book }[];
        setBooks(
          items.map((i) => ({
            ...i.book,
            createdAt: new Date(i.book.createdAt),
            updatedAt: new Date(i.book.updatedAt),
          })),
        );
      } catch {
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/user/login?from=${encodeURIComponent('/library')}`);
      return;
    }
    void loadList(activeTab);
  }, [authLoading, user, activeTab, loadList, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-cream">
        <Loader2 className="animate-spin text-ink-muted" size={40} strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        <LibraryHero
          displayName={user?.displayName}
          email={user?.email}
          onLogout={() => void handleLogout()}
        />

        <section id="library-books">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
                {t(`readingList.status.${activeTab}`)}
              </h2>
              {!isLoading && (
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  {t('readingList.booksInList', { count: books.length })}
                </p>
              )}
            </div>
            <ReadingListTabs value={activeTab} onChange={setActiveTab} />
          </div>

          {isLoading ? (
            <BookGridSkeleton
              count={8}
              className="books-grid grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"
            />
          ) : books.length === 0 ? (
            <div className="rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] py-16 text-center shadow-soft">
              <BookMarked
                className="mx-auto mb-4 text-ink-faint"
                size={40}
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="font-display text-xl font-medium text-ink">{t('readingList.emptyList')}</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-muted">
                {t('readingList.emptyListDesc')}
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-cream transition-transform hover:-translate-y-px"
              >
                {t('readingList.browseCatalog')}
              </Link>
            </div>
          ) : (
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
          )}
        </section>
      </div>
    </div>
  );
};

export default MyLibraryPage;
