'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, BookOpen, Calendar, Grid3X3, List } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useSupabaseAuthors, getBooksByAuthor as fetchBooksByAuthor } from '@/hooks/useSupabaseAuthors';
import BookCard from '@/components/books/BookCard';
import type { Book } from '@/types';

const AuthorsPage = () => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authorBooks, setAuthorBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  
  // Supabase'den yazarları çek
  const { authors: supabaseAuthors, loading: authorsLoading, error: authorsError } = useSupabaseAuthors();
  
  const currentLang = i18n.language as 'tr' | 'en' | 'ru' | 'az';

  useEffect(() => {
    setSearchMode('authors');
    setPlaceholder(t('search.authorsPlaceholder') || 'Yazar ara...');
  }, [setSearchMode, setPlaceholder, t]);

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  // Fetch author books when author is selected (API'den zaten Book[] formatında gelir)
  useEffect(() => {
    if (selectedAuthor) {
      const fetchBooks = async () => {
        setLoadingBooks(true);
        try {
          const { books, error } = await fetchBooksByAuthor(selectedAuthor);
          setAuthorBooks(error || !books ? [] : books);
        } catch {
          setAuthorBooks([]);
        } finally {
          setLoadingBooks(false);
        }
      };
      fetchBooks();
    } else {
      setAuthorBooks([]);
    }
  }, [selectedAuthor]);

  // Generate alphabet for navigation based on current language
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
  
  // Get available letters (letters that have authors)
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    supabaseAuthors.forEach(author => {
      const name = getLocalizedText(author.nameTranslations, author.name);
      const firstLetter = name.charAt(0).toUpperCase();
      letters.add(firstLetter);
    });
    return Array.from(letters).sort();
  }, [supabaseAuthors, currentLang]);

  // Filter authors based on search term and selected letter
  const filteredAuthors = useMemo(() => {
    let authors = supabaseAuthors;
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      authors = authors.filter(author => 
        author.name.toLowerCase().includes(term) ||
        Object.values(author.nameTranslations).some(name => 
          name.toLowerCase().includes(term)
        ) ||
        author.biography.toLowerCase().includes(term) ||
        Object.values(author.biographyTranslations).some(bio => 
          bio.toLowerCase().includes(term)
        )
      );
    }
    
    // Filter by selected letter
    if (selectedLetter) {
      authors = authors.filter(author => {
        const name = getLocalizedText(author.nameTranslations, author.name);
        return name.charAt(0).toUpperCase() === selectedLetter;
      });
    }
    
    return authors;
  }, [searchTerm, selectedLetter, supabaseAuthors, currentLang]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    const totalAuthors = supabaseAuthors.length;
    const totalBooks = supabaseAuthors.reduce((sum, author) => sum + (author.bookCount || 0), 0);
    const totalDownloads = supabaseAuthors.reduce((sum, author) => sum + (author.bookCount || 0), 0);
    
    return {
      authors: totalAuthors,
      books: totalBooks,
      downloads: totalDownloads
    };
  }, [supabaseAuthors]);

  // Loading state
  if (authorsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('common.loading')}</h2>
          <p className="text-gray-600">{t('authors.loadingAuthors')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (authorsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">{t('common.error')}</h2>
          <p className="text-gray-700 mb-6">{authorsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            {t('common.showMore')}
          </button>
        </div>
      </div>
    );
  }

  // If an author is selected, show their books
  if (selectedAuthor) {
    const author = supabaseAuthors.find(auth => auth.name === selectedAuthor);

    if (!author) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button & Author Header */}
          <div className="mb-8">
            <button
              onClick={() => {
                setSelectedAuthor(null);
                setSelectedLetter(null);
              }}
              className="text-primary-600 hover:text-primary-700 font-medium mb-4 flex items-center space-x-2"
            >
              <span>←</span>
              <span>{t('authors.backToAuthors')}</span>
            </button>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                <User size={48} />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {getLocalizedText(author.nameTranslations, author.name)}
                </h1>
                <p className="text-gray-600 mt-2">
                  {getLocalizedText(author.biographyTranslations, author.biography)}
                </p>
                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <BookOpen size={16} />
                    <span>{author.bookCount} {t('authors.booksCount')}</span>
                  </div>
                  {author.birthYear && (
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>{author.birthYear}</span>
                      {author.deathYear && <span>- {author.deathYear}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {authorBooks.length} {t('authors.booksFound')}
              </p>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Author Books */}
          {loadingBooks ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('authors.loadingBooks')}</p>
            </div>
          ) : authorBooks.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch"
              : "space-y-4"
            }>
              {authorBooks.map((book) => (
                <div key={book.id} className="h-full min-h-0">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {t('authors.noBooksForAuthor')}
              </h3>
              <p className="text-gray-600">
                {t('authors.noBooksMessage')}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show authors overview
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('authors.pageTitle')}
          </h1>
          <p className="text-gray-600">
            {t('authors.pageDescription')}
          </p>
        </div>

        {/* Alphabet Navigation */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('authors.alphabetSort')}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLetter(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                !selectedLetter
                  ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('authors.all')}
            </button>
            {alphabet.map((letter) => {
              const isAvailable = availableLetters.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => isAvailable && setSelectedLetter(letter)}
                  disabled={!isAvailable}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedLetter === letter
                      ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md'
                      : isAvailable
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Results Header */}
        {(searchTerm || selectedLetter) && (
          <div className="mb-6">
            <p className="text-gray-600">
              {filteredAuthors.length} {t('authors.authorsFound')}
              {selectedLetter && ` (${selectedLetter} ${t('authors.letterFilter')})`}
              {searchTerm && ` ("${searchTerm}" ${t('authors.searchFor')})`}
            </p>
          </div>
        )}

        {/* Authors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredAuthors.map((author) => {
            return (
              <div
                key={author.id}
                onClick={() => setSelectedAuthor(author.name)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-6">
                  {/* Author Avatar */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                      <User size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {getLocalizedText(author.nameTranslations, author.name)}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {author.bookCount} {t('authors.booksCount')}
                      </p>
                    </div>
                  </div>

                  {/* Author Biography */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {getLocalizedText(author.biographyTranslations, author.biography)}
                  </p>

                  {/* Author Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {author.birthYear && (
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>{author.birthYear}</span>
                        {author.deathYear && <span>- {author.deathYear}</span>}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-primary-600 font-medium text-sm group-hover:text-primary-700 transition-colors">
                      {t('authors.viewBooks')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {filteredAuthors.length === 0 && (
          <div className="text-center py-16">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {t('authors.noAuthorsFound')}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `"${searchTerm}" ${t('authors.noAuthorsForSearch')}`
                : selectedLetter
                ? `"${selectedLetter}" ${t('authors.noAuthorsForLetter')}`
                : t('authors.noAuthorsYet')}
            </p>
          </div>
        )}

        {/* Author Stats */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('authors.totalStats')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {totalStats.authors}
                </div>
                <div className="text-gray-600">{t('authors.totalAuthors')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {totalStats.books}
                </div>
                <div className="text-gray-600">{t('authors.totalBooks')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorsPage;
