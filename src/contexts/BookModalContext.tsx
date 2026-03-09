'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Book } from '@/types';

interface BookModalContextType {
  selectedBook: Book | null;
  readingBook: Book | null;
  /** Kullanıcı en az bir kez "Oku" açtıysa true (PDF okuyucu chunk'ı sadece o zaman yüklenir) */
  readerRequested: boolean;
  openDetails: (book: Book) => void;
  openReader: (book: Book) => void;
  closeDetails: () => void;
  closeReader: () => void;
}

const BookModalContext = createContext<BookModalContextType | undefined>(undefined);

export const useBookModal = () => {
  const context = useContext(BookModalContext);
  if (context === undefined) {
    throw new Error('useBookModal must be used within a BookModalProvider');
  }
  return context;
};

interface BookModalProviderProps {
  children: ReactNode;
}

export const BookModalProvider: React.FC<BookModalProviderProps> = ({ children }) => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [readerRequested, setReaderRequested] = useState(false);

  const openDetails = (book: Book) => setSelectedBook(book);
  const openReader = (book: Book) => {
    setReaderRequested(true);
    setSelectedBook(null);
    setReadingBook(book);
  };
  const closeDetails = () => setSelectedBook(null);
  const closeReader = () => setReadingBook(null);

  return (
    <BookModalContext.Provider
      value={{
        selectedBook,
        readingBook,
        readerRequested,
        openDetails,
        openReader,
        closeDetails,
        closeReader,
      }}
    >
      {children}
    </BookModalContext.Provider>
  );
};
