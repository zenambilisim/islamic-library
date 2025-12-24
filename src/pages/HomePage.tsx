import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import BookCard from '../components/books/BookCard';
import FilterSidebar from '../components/books/FilterSidebar';
import { useSearch } from '../contexts/SearchContext';
import { useSupabaseBooks } from '../hooks/useSupabaseBooks';
import type { Book, SearchFilters } from '../types';

interface HomePageProps {
  onViewBookDetails: (book: Book) => void;
  onReadOnline: (book: Book) => void;
}

const HomePage = ({ onViewBookDetails, onReadOnline }: HomePageProps) => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Supabase'den kitapları çek
  const { books: supabaseBooks, loading, error } = useSupabaseBooks();

  // Dil bazlı banner resmi seç
  const getBannerImage = () => {
    const language = i18n.language;
    const bannerImages: Record<string, string> = {
      'tr': '/images/HomePage/Banner turkish.png',
      'en': '/images/HomePage/Banner english.png',
      'ru': '/images/HomePage/Banner russian.png',
      'az': '/images/HomePage/Banner azerbaijani.png'
    };
    return bannerImages[language] || bannerImages['en'];
  };

  // Dil bazlı mockup resmi seç
  const getMockupImage = () => {
    const language = i18n.language;
    const mockupImages: Record<string, string> = {
      'tr': '/images/HomePage/iPad Pro Mockup turkish.png',
      'en': '/images/HomePage/iPad Pro Mockup english.png',
      'ru': '/images/HomePage/iPad Pro Mockup russian.png',
      'az': '/images/HomePage/İPad Pro Mockup azerbaijani.png'
    };
    return mockupImages[language] || mockupImages['en'];
  };

  useEffect(() => {
    setSearchMode('books');
    setPlaceholder(t('search.placeholder'));
  }, [setSearchMode, setPlaceholder, t]);

  // Scroll to books section with smooth animation
  const scrollToBooks = () => {
    const booksSection = document.getElementById('books-section');
    if (booksSection) {
      booksSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Filter books based on search term and filters
  const filteredBooks = useMemo(() => {
    let books = supabaseBooks;

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
      books = books.filter(book => {
        // Kategori adı ile eşleştirme (case-insensitive)
        return book.category.toLowerCase() === filters.category?.toLowerCase();
      });
    }

    return books;
  }, [supabaseBooks, searchTerm, filters]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('common.loading')}</h2>
          <p className="text-gray-600">Kitaplar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-3">Hata Oluştu</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section - Always visible unless searching */}
      {!searchTerm && (
        <div className="relative overflow-hidden">
          {/* Background Banner Image - Desktop */}
          <div className="absolute inset-0 hidden lg:block">
            <img
              src={getBannerImage()}
              alt={t('hero.bannerAlt') || 'Islamic Library Banner'}
              className="w-full h-full object-cover object-center"
            />
            {/* Blur overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/30 via-purple-600/20 to-blue-600/30"></div>
          </div>

          {/* Mobile Background - Banner Image with Better Styling */}
          <div className="absolute inset-0 lg:hidden">
            <img
              src={getBannerImage()}
              alt={t('hero.bannerAlt') || 'Islamic Library Banner'}
              className="w-full h-full object-cover object-center"
              style={{ 
                filter: 'blur(1px) brightness(0.8)',
                transform: 'scale(1.05)'
              }}
            />
            {/* Enhanced gradient overlay for mobile */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/70 via-purple-900/60 to-blue-900/70"></div>
          </div>
          
          <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left order-1 lg:order-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg leading-tight">
                  <span className="bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                    {t('hero.title')}
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 leading-relaxed drop-shadow-md">
                  {t('hero.subtitle')}
                </p>
                
                {/* Stats Cards */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-lg flex-shrink-0">
                    <div className="text-xl md:text-2xl font-bold text-primary-600">{supabaseBooks.length}</div>
                    <div className="text-xs md:text-sm text-gray-600">{t('hero.booksCount')}</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-lg flex-shrink-0">
                    <div className="text-xl md:text-2xl font-bold text-purple-600">4</div>
                    <div className="text-xs md:text-sm text-gray-600">{t('hero.languagesCount')}</div>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-lg flex-shrink-0">
                    <div className="text-xl md:text-2xl font-bold text-blue-600">∞</div>
                    <div className="text-xs md:text-sm text-gray-600">{t('hero.knowledgeCount')}</div>
                  </div>
                </div>
                
                {/* CTA Button */}
                <button 
                  onClick={scrollToBooks}
                  className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-semibold text-base md:text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                >
                  {t('hero.exploreButton')}
                </button>
              </div>
              
              {/* Right Image - Mockup */}
              <div className="flex justify-center lg:justify-end order-2 lg:order-2">
                <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                  <img
                    src={getMockupImage()}
                    alt={t('hero.mockupAlt') || 'Islamic Books'}
                    className="w-full h-auto object-contain drop-shadow-2xl rounded-xl md:rounded-2xl"
                  />
                  {/* Decorative glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-purple-400/20 blur-3xl -z-10 scale-110"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8" id="books-section">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Search Results Header */}
            <div className="mb-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {searchTerm ? (
                      <>
                        <span className="text-primary-600">{filteredBooks.length}</span> {t('search.resultsFor')} 
                        <span className="text-purple-600">"{searchTerm}"</span>
                      </>
                    ) : (
                      t('common.allBooks')
                    )}
                  </h2>
                  
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="md:hidden flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    <span className="text-sm font-medium">{t('search.filters')}</span>
                  </button>
                </div>
                
                {(searchTerm || Object.keys(filters).length > 0) && filteredBooks.length === 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600 font-medium">{t('search.noResults')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Books Grid */}
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredBooks.map((book, index) => (
                  <div
                    key={book.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <BookCard
                      book={book}
                      onViewDetails={onViewBookDetails}
                      onReadOnline={onReadOnline}
                    />
                  </div>
                ))}
              </div>
            ) : (searchTerm || Object.keys(filters).length > 0) && (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-primary-100 to-purple-100 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                  <div className="text-6xl">📚</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {t('search.noResults')}
                </h3>
                <p className="text-gray-600 text-lg mb-6">
                  {t('search.tryDifferentKeywords')}
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-xl hover:from-primary-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Tüm Kitapları Görüntüle
                </button>
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
    </div>
  );
};

export default HomePage;
