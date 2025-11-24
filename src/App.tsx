import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './contexts/SearchContext';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import BookDetailModal from './components/books/BookDetailModal';
import HomePage from './pages/HomePage';
import AuthorsPage from './pages/AuthorsPage';
import CategoriesPage from './pages/CategoriesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import UsefulInfoPage from './pages/UsefulInfoPage';
import type { Book } from './types';
import './i18n';

function App() {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book);
  };

  const handleReadOnline = (book: Book) => {
    // TODO: Open online reader
    console.log('Read online:', book.title);
    alert(`${book.title} kitabını okumaya başlıyorsunuz...`);
  };

  const closeBookDetails = () => {
    setSelectedBook(null);
  };

  return (
    <SearchProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          
          <main>
            <Routes>
              <Route 
                path="/" 
                element={
                  <HomePage 
                    onViewBookDetails={handleViewDetails}
                    onReadOnline={handleReadOnline}
                  />
                } 
              />
              <Route 
                path="/authors" 
                element={
                  <AuthorsPage 
                    onViewBookDetails={handleViewDetails}
                    onReadOnline={handleReadOnline}
                  />
                } 
              />
              <Route 
                path="/categories" 
                element={
                  <CategoriesPage 
                    onViewBookDetails={handleViewDetails}
                    onReadOnline={handleReadOnline}
                  />
                } 
              />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/useful-info" element={<UsefulInfoPage />} />
            </Routes>
          </main>

          {/* Footer */}
          <Footer />

          {/* Book Details Modal */}
          {selectedBook && (
            <BookDetailModal
              book={selectedBook}
              isOpen={!!selectedBook}
              onClose={closeBookDetails}
              onReadOnline={handleReadOnline}
            />
          )}
        </div>
      </Router>
    </SearchProvider>
  );
}

export default App;
