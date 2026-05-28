'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BookCard from '@/components/books/BookCard';
import BookGridSkeleton from '@/components/books/BookGridSkeleton';
import FilterSidebar from '@/components/books/FilterSidebar';
import HikmeChatPanel from '@/components/chat/HikmeChatPanel';
import ChatPearl from '@/components/chat/ChatPearl';
import HomeHero from '@/components/home/HomeHero';
import FeaturedBooksSlider from '@/components/home/FeaturedBooksSlider';
import HomeFiltersPanel from '@/components/home/HomeFiltersPanel';
import CategoryTabs from '@/components/home/CategoryTabs';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseBooks } from '@/hooks/useSupabaseBooks';
import { useSupabaseCategories } from '@/hooks/useSupabaseCategories';
import { useLoadMoreOnScroll } from '@/hooks/useLoadMoreOnScroll';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import type { SearchFilters } from '@/types';
import { resolveSearchLocale, textIncludesSearch, normalizeForSearch } from '@/lib/search-utils';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
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
      books = books.filter((book) => textIncludesSearch(book.title, searchTerm, searchLocale));
    }

    if (categorySlug) {
      const fc = normalizeForSearch(categorySlug, searchLocale);
      books = books.filter(
        (book) => normalizeForSearch(book.categorySlug ?? '', searchLocale) === fc,
      );
    }

    return books;
  }, [supabaseBooks, searchTerm, categorySlug, activeLanguage]);

  const awaitingFirstBooks = loading && supabaseBooks.length === 0;

  if (!isMounted) {
    return <div className="min-h-screen bg-cream" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="home-layout">
        {/* Sol — Hikme sohbet */}
        <div className="col-chat">
          <HikmeChatPanel books={supabaseBooks} />
        </div>

        {/* Orta — Katalog */}
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
            <div className="section-head mb-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
                  {searchTerm
                    ? t('search.resultsFor', {
                        count: filteredBooks.length,
                        word: searchTerm,
                      })
                    : t('hero.catalogTitle', 'Katalog')}
                </h2>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  {searchTerm
                    ? undefined
                    : t('hero.catalogSubtitle', { count: filteredBooks.length })}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!searchTerm && categories.length > 0 && (
                  <CategoryTabs
                    categories={categories}
                    value={categorySlug}
                    onChange={setCategorySlug}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="inline-flex h-8 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm font-medium text-ink xl:hidden"
                >
                  {t('search.filters')}
                </button>
              </div>
            </div>

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
            ) : awaitingFirstBooks ? (
              <BookGridSkeleton count={10} />
            ) : (searchTerm || categorySlug) && (
              <div className="py-16 text-center">
                <p className="font-display text-xl font-medium text-ink">{t('search.noResults')}</p>
                <p className="mt-2 text-ink-muted">{t('search.tryDifferentKeywords')}</p>
              </div>
            )}

            {hasMore && <div ref={booksLoadMoreRef} className="h-10 w-full shrink-0" aria-hidden />}
            {loadingMore && (
              <p className="mt-8 text-center text-sm text-ink-muted">{t('common.loading')}…</p>
            )}
          </section>
        </div>

        {/* Sağ — Filtreler (masaüstü) */}
        <div className="col-filters">
          <HomeFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            activeCategorySlug={categorySlug}
            onCategorySelect={setCategorySlug}
          />
        </div>
      </div>

      {/* Mobil filtre çekmecesi */}
      <div className="xl:hidden">
        <FilterSidebar
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
          onCategoryNavigate={() => setIsFilterOpen(false)}
        />
      </div>

      {/* Mobil Hikme */}
      <ChatPearl onClick={() => setMobileChatOpen(true)} />
      {mobileChatOpen && (
        <div className="mobile-chat-overlay fixed inset-0 z-[100] flex flex-col bg-cream p-3 pt-[calc(var(--header-h)+8px)] xl:hidden">
          <HikmeChatPanel
            books={supabaseBooks}
            isMobile
            onClose={() => setMobileChatOpen(false)}
            className="h-full"
          />
        </div>
      )}
    </div>
  );
};

export default HomePage;
