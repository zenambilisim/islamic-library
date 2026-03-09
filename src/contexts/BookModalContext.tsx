'use client';

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Book } from '@/types';
import { getSignedBookFileUrl } from '@/lib/supabase';

interface BookModalContextType {
  selectedBook: Book | null;
  openDetails: (book: Book) => void;
  openReader: (book: Book) => Promise<void>;
  closeDetails: () => void;
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

  const openDetails = (book: Book) => setSelectedBook(book);
  const closeDetails = () => setSelectedBook(null);

  /** PDF/kitap URL'ini alıp tarayıcının kendi görüntüleyicisinde yeni sekmede açar */
  const openReader = async (book: Book) => {
    const pdfUrl = book.formats?.pdf || book.formats?.epub || Object.values(book.formats)[0];
    if (!pdfUrl) return;
    const url = await getSignedBookFileUrl(pdfUrl, 3600);
    if (url) window.open(url, '_blank');
  };

  return (
    <BookModalContext.Provider
      value={{
        selectedBook,
        openDetails,
        openReader,
        closeDetails,
      }}
    >
      {children}
    </BookModalContext.Provider>
  );
};
