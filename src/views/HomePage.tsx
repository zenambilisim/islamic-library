'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import FilterSidebar from '@/components/books/FilterSidebar';
import AuthorCard from '@/components/authors/AuthorCard';
import AuthorsGridSkeleton from '@/components/authors/AuthorsGridSkeleton';
import { AuthorDetailSection } from '@/components/authors/AuthorDetailSection';
import HomeHero from '@/components/home/HomeHero';
import FeaturedBooksSlider from '@/components/home/FeaturedBooksSlider';
import HomeFiltersPanel from '@/components/home/HomeFiltersPanel';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseBooks, resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import type { Author, SearchFilters } from '@/types';
import {
  authorMatchesSearch,
  bookMatchesSearch,
  normalizeForSearch,
  resolveSearchLocale,
} from '@/lib/search-utils';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const isSearchMode = searchTerm.trim().length > 0;

  const { books: supabaseBooks, loading, error, loadingMore, loadMore, hasMore, refetch } =
    useSupabaseBooks(filters.sortBy ?? 'uploadDate', { fetchAll: isSearchMode });
  const booksLoadMoreRef = useLoadMoreOnScroll(loadMore, {
    hasMore,
    loading,
    loadingMore,
    enabled: !isSearchMode,
    prefetchPx: 1200,
  });

  const activeLanguage = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const appLanguage = resolveAppLanguage(i18n.language);

  const [heroTotalBooks, setHeroTotalBooks] = useState<number | null>(null);

  const heroBooksLocaleTag =
    activeLanguage === 'tr'
      ? 'tr-TR'
      : activeLanguage === 'ru'
        ? 'ru-RU'
        : activeLanguage === 'az'
          ? 'az-AZ'
          : 'en-US';

  const { categories } = useSupabaseCategories(appLanguage);
  const {
    authors: supabaseAuthors,
    loading: authorsLoading,
  } = useSupabaseAuthors(appLanguage, { enabled: isSearchMode });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams({
          page: '0',
          limit: '1',
          sortBy: 'uploadDate',
          withTotal: '1',
        });
        const res = await fetch(`/api/books?${params}`);
        if (!res.ok) {
          if (!cancelled) setHeroTotalBooks(0);
          return;
        }
        const data = (await res.json()) as { total?: number };
        if (cancelled) return;
        setHeroTotalBooks(typeof data.total === 'number' ? data.total : 0);
      } catch {
        if (!cancelled) setHeroTotalBooks(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setSearchMode('books');
    setPlaceholder(t('search.booksPlaceholder'));
  }, [setSearchMode, setPlaceholder, t]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSelectedAuthorId(null);
    }
  }, [searchTerm]);

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: categorySlug,
    }));
  }, [categorySlug]);

  const scrollToBooks = () => {
    document.getElementById('books-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const filteredBooks = useMemo(() => {
    let books = supabaseBooks;
    const searchLocale = resolveSearchLocale(activeLanguage);

    if (searchTerm.trim()) {
      books = books.filter((book) => bookMatchesSearch(book, searchTerm, searchLocale));
    }

    if (categorySlug) {
      const fc = normalizeForSearch(categorySlug, searchLocale);
      books = books.filter(
        (book) => normalizeForSearch(book.categorySlug ?? '', searchLocale) === fc,
      );
    }

    return books;
  }, [supabaseBooks, searchTerm, categorySlug, activeLanguage]);

  const filteredAuthors = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const searchLocale = resolveSearchLocale(activeLanguage);
    return supabaseAuthors.filter((author) =>
      authorMatchesSearch(author, searchTerm, searchLocale),
    );
  }, [supabaseAuthors, searchTerm, activeLanguage]);

  const selectedAuthor = useMemo(
    () => supabaseAuthors.find((a) => a.id === selectedAuthorId) ?? null,
    [supabaseAuthors, selectedAuthorId],
  );

  const awaitingFirstBooks = loading && supabaseBooks.length === 0;
  const searchLoading = isSearchMode && (loading || authorsLoading);
  const hasSearchResults = filteredBooks.length > 0 || filteredAuthors.length > 0;
  const showSearchEmptyState =
    (searchTerm || categorySlug) && !hasSearchResults && !searchLoading;

  if (!isMounted) {
    return <div className="min-h-screen bg-cream" />;
  }

  if (selectedAuthor && isSearchMode) {
    return (
      <AuthorDetailSection
        author={selectedAuthor}
        onBack={() => setSelectedAuthorId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="home-layout">
        <div className="browse-column">
          {!searchTerm && (
            <>
              <HomeHero
                totalBooks={heroTotalBooks}
                totalCategories={categories.length > 0 ? categories.length : null}
                localeTag={heroBooksLocaleTag}
                onExplore={scrollToBooks}
              />
              {supabaseBooks.length > 0 && <FeaturedBooksSlider books={supabaseBooks} />}
            </>
          )}

          <section id="books-section">
            <div className="mb-4 flex justify-end xl:hidden">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm font-medium text-ink"
              >
                {t('search.filters')}
              </button>
            </div>

            {searchTerm && (
              <div className="section-head mb-4">
                <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
                  {t('search.resultsFor', {
                    count: filteredBooks.length + filteredAuthors.length,
                    word: searchTerm,
                  })}
                </h2>
              </div>
            )}

            {error && supabaseBooks.length === 0 && !loading && (
              <div className="mb-6 rounded-editorial border border-red-200 bg-red-50 p-4 text-red-800">
                <p className="mb-3 font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  {t('common.retry', 'Tekrar dene')}
                </button>
              </div>
            )}

            {searchTerm && (
              <>
                {authorsLoading ? (
                  <div className="mb-8">
                    <h3 className="mb-4 font-display text-lg font-medium tracking-tight text-ink">
                      {t('search.matchingAuthors')}
                    </h3>
                    <AuthorsGridSkeleton count={3} />
                  </div>
                ) : filteredAuthors.length > 0 ? (
                  <section className="mb-8">
                    <h3 className="mb-4 font-display text-lg font-medium tracking-tight text-ink">
                      {t('search.matchingAuthors')}
                      <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
                        ({filteredAuthors.length})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                      {filteredAuthors.map((author: Author, index) => (
                        <AuthorCard
                          key={author.id}
                          author={author}
                          index={index}
                          onClick={() => setSelectedAuthorId(author.id)}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            )}

            {searchTerm && filteredAuthors.length > 0 && (
              <h3 className="mb-4 font-display text-lg font-medium tracking-tight text-ink">
                {t('search.matchingBooks')}
                {!loading && (
                  <span className="ml-2 text-[13px] font-normal text-ink-muted tabular-nums">
                    ({filteredBooks.length})
                  </span>
                )}
              </h3>
            )}

            {filteredBooks.length > 0 ? (
              <div className="books-grid grid grid-cols-2 gap-[18px] sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]">
                {filteredBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <BookCard book={book} variant="compact" />
                  </div>
                ))}
              </div>
            ) : awaitingFirstBooks || searchLoading ? (
              <BookGridSkeleton count={10} />
            ) : showSearchEmptyState ? (
              <div className="py-16 text-center">
                <p className="font-display text-xl font-medium text-ink">{t('search.noResults')}</p>
                <p className="mt-2 text-ink-muted">{t('search.tryDifferentKeywords')}</p>
              </div>
            ) : null}

            {hasMore && <div ref={booksLoadMoreRef} className="h-10 w-full shrink-0" aria-hidden />}
            {loadingMore && (
              <p className="mt-8 text-center text-sm text-ink-muted">{t('common.loading')}…</p>
            )}
          </section>
        </div>

        <div className="col-filters">
          <HomeFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            activeCategorySlug={categorySlug}
            onCategorySelect={setCategorySlug}
          />
        </div>
      </div>

      <div className="xl:hidden">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
          onCategoryNavigate={() => setIsFilterOpen(false)}
        />
      </div>
    </div>
  );
};

export default HomePage;
