'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseAuthors } from '@/hooks/useSupabaseAuthors';
import { resolveAppLanguage } from '@/hooks/useSupabaseBooks';
import { resolveSearchLocale, textIncludesSearch } from '@/lib/search-utils';
import AuthorsHero from '@/components/authors/AuthorsHero';
import AuthorCard from '@/components/authors/AuthorCard';
import AuthorsGridSkeleton from '@/components/authors/AuthorsGridSkeleton';
import AuthorsAlphabetFilter from '@/components/authors/AuthorsAlphabetFilter';
import { AuthorDetailSection } from '@/components/authors/AuthorDetailSection';

const AuthorsPage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  const currentLang = resolveAppLanguage(i18n.language);
  const {
    authors: supabaseAuthors,
    loading: authorsLoading,
    error: authorsError,
    refetch,
  } = useSupabaseAuthors(currentLang);

  const localeTag =
    currentLang === 'tr'
      ? 'tr-TR'
      : currentLang === 'ru'
        ? 'ru-RU'
        : currentLang === 'az'
          ? 'az-AZ'
          : 'en-US';

  useEffect(() => {
    setSearchMode('authors');
    setPlaceholder(t('search.authorsPlaceholder') || 'Yazar ara...');
  }, [setSearchMode, setPlaceholder, t]);

  const alphabet = useMemo(() => {
    switch (currentLang) {
      case 'en':
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      case 'ru':
        return 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
      case 'az':
        return 'ABCÇDEƏFGĞHXIİJKLMNOÖPQRSŞTUÜVYZ'.split('');
      case 'tr':
      default:
        return 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
    }
  }, [currentLang]);

  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    supabaseAuthors.forEach((author) => {
      letters.add(author.name.charAt(0).toUpperCase());
    });
    return Array.from(letters).sort();
  }, [supabaseAuthors]);

  const filteredAuthors = useMemo(() => {
    let authors = supabaseAuthors;

    if (searchTerm.trim()) {
      const searchLocale = resolveSearchLocale(currentLang);
      authors = authors.filter(
        (author) =>
          textIncludesSearch(author.name, searchTerm, searchLocale) ||
          textIncludesSearch(author.biography, searchTerm, searchLocale) ||
          textIncludesSearch(author.language, searchTerm, searchLocale),
      );
    }

    if (selectedLetter) {
      authors = authors.filter(
        (author) => author.name.charAt(0).toUpperCase() === selectedLetter,
      );
    }

    return authors;
  }, [searchTerm, selectedLetter, supabaseAuthors, currentLang]);

  const totalBooks = useMemo(
    () => supabaseAuthors.reduce((sum, author) => sum + (author.bookCount || 0), 0),
    [supabaseAuthors],
  );

  const selectedAuthor = selectedAuthorId
    ? supabaseAuthors.find((a) => a.id === selectedAuthorId)
    : undefined;

  const scrollToAuthors = () => {
    document.getElementById('authors-grid')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const isFilterMode = searchTerm.trim().length > 0 || selectedLetter !== null;

  if (selectedAuthor) {
    return (
      <AuthorDetailSection
        author={selectedAuthor}
        onBack={() => {
          setSelectedAuthorId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="content-layout">
        {!isFilterMode && (
          <AuthorsHero
            totalAuthors={authorsLoading ? null : supabaseAuthors.length}
            totalBooks={authorsLoading ? null : totalBooks}
            localeTag={localeTag}
            onBrowse={scrollToAuthors}
          />
        )}

        <section id="authors-grid">
          <div className="mb-4">
            <h2 className="font-display text-[22px] font-medium tracking-tight text-ink">
              {searchTerm.trim()
                ? t('search.resultsFor', {
                    count: filteredAuthors.length,
                    word: searchTerm,
                  })
                : t('authors.pageTitle')}
            </h2>
            {!isFilterMode && (
              <p className="mt-1 text-[12.5px] text-ink-muted">{t('authors.browseByLetter')}</p>
            )}
            {isFilterMode && !searchTerm.trim() && selectedLetter && (
              <p className="mt-1 text-[12.5px] text-ink-muted">
                {filteredAuthors.length} {t('authors.authorsFound')} ({selectedLetter}{' '}
                {t('authors.letterFilter')})
              </p>
            )}
          </div>

          {!searchTerm.trim() && (
            <div className="mb-5">
              <AuthorsAlphabetFilter
                alphabet={alphabet}
                availableLetters={availableLetters}
                selectedLetter={selectedLetter}
                onSelectLetter={setSelectedLetter}
              />
            </div>
          )}

          {authorsError && !authorsLoading && (
            <div className="mb-6 rounded-editorial border border-red-200 bg-red-50 p-4 text-red-800">
              <p className="mb-3 font-medium">{authorsError}</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {t('common.retry', 'Tekrar dene')}
              </button>
            </div>
          )}

          {authorsLoading ? (
            <AuthorsGridSkeleton count={6} />
          ) : filteredAuthors.length > 0 ? (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {filteredAuthors.map((author, index) => (
                <AuthorCard
                  key={author.id}
                  author={author}
                  index={index}
                  onClick={() => setSelectedAuthorId(author.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <User size={40} className="mx-auto mb-4 text-ink-faint" strokeWidth={1.5} />
              <p className="font-display text-xl font-medium text-ink">
                {t('authors.noAuthorsFound')}
              </p>
              <p className="mt-2 text-ink-muted">
                {searchTerm
                  ? `"${searchTerm}" ${t('authors.noAuthorsForSearch')}`
                  : selectedLetter
                    ? `"${selectedLetter}" ${t('authors.noAuthorsForLetter')}`
                    : t('authors.noAuthorsYet')}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AuthorsPage;
