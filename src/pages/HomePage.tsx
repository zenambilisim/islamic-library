import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BookCard from '../components/books/BookCard';
import FilterSidebar from '../components/books/FilterSidebar';
import Stats from '../components/Stats';
import { useSearch } from '../contexts/SearchContext';
import { mockBooks } from '../data/mockData';
import type { Book, SearchFilters } from '../types';

interface HomePageProps {
  onViewBookDetails: (book: Book) => void;
  onReadOnline: (book: Book) => void;
}

const HomePage = ({ onViewBookDetails, onReadOnline }: HomePageProps) => {
  const { t } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    setSearchMode('books');
    setPlaceholder(t('search.placeholder'));
  }, [setSearchMode, setPlaceholder, t]);

  // Filter books based on search term and filters
  const filteredBooks = useMemo(() => {
    let books = mockBooks;

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      books = books.filter(book => 
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.category.toLowerCase().includes(term) ||
        book.description.toLowerCase().includes(term) ||
        book.tags.some(tag => tag.toLowerCase().includes(term)) ||
        Object.values(book.titleTranslations).some(title => 
          title.toLowerCase().includes(term)
        ) ||
        Object.values(book.authorTranslations).some(author => 
          author.toLowerCase().includes(term)
        )
      );
    }

    // Apply category filter
    if (filters.category) {
      books = books.filter(book => book.category === filters.category);
    }

    return books;
  }, [searchTerm, filters]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Search Results Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchTerm ? (
                  <>
                    {filteredBooks.length} {t('search.resultsFor')} "{searchTerm}"
                  </>
                ) : (
                  t('common.allBooks')
                )}
              </h2>
              
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden flex items-center space-x-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="text-sm font-medium">{t('search.filters')}</span>
              </button>
            </div>
            
            {(searchTerm || Object.keys(filters).length > 0) && filteredBooks.length === 0 && (
              <p className="text-gray-600">{t('search.noResults')}</p>
            )}
          </div>

          {/* Books Grid */}
          {filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onViewDetails={onViewBookDetails}
                  onReadOnline={onReadOnline}
                />
              ))}
            </div>
          ) : (searchTerm || Object.keys(filters).length > 0) && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">📚</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {t('search.noResults')}
              </h3>
              <p className="text-gray-600">
                {t('search.tryDifferentKeywords')}
              </p>
            </div>
          )}
        </div>

        {/* Filter Sidebar - Right Side */}
        <FilterSidebar 
          filters={filters}
          onFiltersChange={setFilters}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen(!isFilterOpen)}
        />
      </div>
    </div>
  );
};

export default HomePage;
