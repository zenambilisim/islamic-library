import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, BookOpen, Calendar, Grid3X3, List } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { mockAuthors, mockBooks } from '../data/mockData';
import BookCard from '../components/books/BookCard';
import type { Book } from '../types';

interface AuthorsPageProps {
  onViewBookDetails: (book: Book) => void;
  onReadOnline: (book: Book) => void;
}

const AuthorsPage = ({ onViewBookDetails, onReadOnline }: AuthorsPageProps) => {
  const { t, i18n } = useTranslation();
  const { searchTerm, setSearchMode, setPlaceholder } = useSearch();
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const currentLang = i18n.language as keyof (typeof mockAuthors)[0]['nameTranslations'];

  useEffect(() => {
    setSearchMode('authors');
    setPlaceholder(t('search.authorsPlaceholder') || 'Yazar ara...');
  }, [setSearchMode, setPlaceholder, t]);

  const getLocalizedText = (translations: any, fallback: string) => {
    return translations[currentLang] || translations.tr || fallback;
  };

  // Get books by author
  const getBooksByAuthor = (authorName: string) => {
    return mockBooks.filter(book => 
      book.author.toLowerCase().includes(authorName.toLowerCase()) ||
      Object.values(book.authorTranslations).some(name => 
        name.toLowerCase().includes(authorName.toLowerCase())
      )
    );
  };

  // Generate alphabet for navigation
  const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
  
  // Get available letters (letters that have authors)
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    mockAuthors.forEach(author => {
      const name = getLocalizedText(author.nameTranslations, author.name);
      const firstLetter = name.charAt(0).toUpperCase();
      letters.add(firstLetter);
    });
    return Array.from(letters).sort();
  }, [currentLang]);

  // Filter authors based on search term and selected letter
  const filteredAuthors = useMemo(() => {
    let authors = mockAuthors;
    
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
  }, [searchTerm, selectedLetter, currentLang]);

  // If an author is selected, show their books
  if (selectedAuthor) {
    const author = mockAuthors.find(auth => auth.id === selectedAuthor);
    const authorBooks = author ? getBooksByAuthor(author.name) : [];

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
              <span>{t('navigation.authors')}</span>
            </button>
            
            <div className="flex items-start space-x-4 mb-4">
              <div className="bg-primary-100 p-4 rounded-full">
                <User size={48} className="text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {getLocalizedText(author.nameTranslations, author.name)}
                </h1>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {getLocalizedText(author.biographyTranslations, author.biography)}
                </p>
                
                {/* Author Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <BookOpen size={16} />
                    <span>{authorBooks.length} kitap</span>
                  </div>
                  
                  {author.birthYear && (
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>
                        {author.birthYear}
                        {author.deathYear && ` - ${author.deathYear}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {authorBooks.length} kitap bulundu
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
          {authorBooks.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {authorBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onViewDetails={onViewBookDetails}
                  onReadOnline={onReadOnline}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Bu yazarın henüz kitabı bulunmuyor
              </h3>
              <p className="text-gray-600">
                Yakında bu yazarın kitapları eklenecek.
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
            {t('navigation.authors')}
          </h1>
          <p className="text-gray-600">
            İslami eserlerin değerli müelliflerini keşfedin
          </p>
        </div>

        {/* A-Z Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('authors.browseByLetter')}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLetter(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLetter === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('authors.all')}
              </button>
              {alphabet.map((letter) => {
                const hasAuthors = availableLetters.includes(letter);
                return (
                  <button
                    key={letter}
                    onClick={() => hasAuthors && setSelectedLetter(letter)}
                    disabled={!hasAuthors}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLetter === letter
                        ? 'bg-primary-600 text-white'
                        : hasAuthors
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search Results Header */}
        {(searchTerm || selectedLetter) && (
          <div className="mb-6">
            <p className="text-gray-600">
              {searchTerm && selectedLetter 
                ? `${filteredAuthors.length} yazar "${searchTerm}" ve "${selectedLetter}" harfi için bulundu`
                : searchTerm 
                ? `${filteredAuthors.length} yazar "${searchTerm}" için bulundu`
                : `${filteredAuthors.length} yazar "${selectedLetter}" harfi ile başlıyor`
              }
            </p>
          </div>
        )}

        {/* Authors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredAuthors.map((author) => {
            const authorBooks = getBooksByAuthor(author.name);
            
            return (
              <div
                key={author.id}
                onClick={() => setSelectedAuthor(author.id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer overflow-hidden group"
              >
                <div className="p-6">
                  {/* Author Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-primary-100 p-3 rounded-full">
                      <User size={32} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {getLocalizedText(author.nameTranslations, author.name)}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {authorBooks.length} kitap
                      </p>
                    </div>
                  </div>

                  {/* Author Bio */}
                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {getLocalizedText(author.biographyTranslations, author.biography)}
                  </p>

                  {/* Author Stats */}
                  {author.birthYear && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
                      <Calendar size={14} />
                      <span>
                        {author.birthYear}
                        {author.deathYear && ` - ${author.deathYear}`}
                      </span>
                    </div>
                  )}

                  {/* Sample Books */}
                  {authorBooks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Popüler Eserleri:</p>
                      <div className="space-y-1">
                        {authorBooks.slice(0, 3).map((book) => (
                          <div key={book.id} className="text-sm text-gray-600 truncate">
                            • {book.title}
                          </div>
                        ))}
                        {authorBooks.length > 3 && (
                          <div className="text-sm text-primary-600 font-medium">
                            +{authorBooks.length - 3} eser daha
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-primary-600 font-medium text-sm group-hover:text-primary-700 transition-colors">
                      Yazarın Eserlerine Git →
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {(searchTerm || selectedLetter) && filteredAuthors.length === 0 && (
          <div className="text-center py-16">
            <User size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {t('authors.noAuthorsFound')}
            </h3>
            <p className="text-gray-600">
              {searchTerm && selectedLetter 
                ? `"${searchTerm}" ve "${selectedLetter}" harfi için herhangi bir yazar bulunamadı.`
                : searchTerm 
                ? `"${searchTerm}" için herhangi bir yazar bulunamadı. Farklı anahtar kelimeler deneyebilirsiniz.`
                : `"${selectedLetter}" harfi ile başlayan yazar bulunmuyor.`
              }
            </p>
          </div>
        )}

        {/* Author Stats */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Toplam İstatistikler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {mockAuthors.length}
                </div>
                <div className="text-gray-600">Yazar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {mockBooks.length}
                </div>
                <div className="text-gray-600">Toplam Kitap</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {mockBooks.reduce((sum, book) => sum + book.downloadCount, 0).toLocaleString()}
                </div>
                <div className="text-gray-600">Toplam İndirme</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorsPage;
