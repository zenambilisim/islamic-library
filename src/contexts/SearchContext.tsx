import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type SearchMode = 'books' | 'categories' | 'authors';

interface SearchContextType {
  /** Onaylanmış arama terimi (sayfalar bunu filtreler). */
  searchTerm: string;
  /** Arama kutusundaki anlık metin. */
  searchInput: string;
  setSearchInput: (term: string) => void;
  /** searchInput değerini aramaya uygular. */
  submitSearch: () => void;
  clearSearch: () => void;
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  placeholder: string;
  setPlaceholder: (placeholder: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('books');
  const [placeholder, setPlaceholder] = useState('Kitap, yazar veya kategori ara...');

  const submitSearch = useCallback(() => {
    setSearchTerm(searchInput.trim());
  }, [searchInput]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchTerm('');
  }, []);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      clearSearch();
    }
  }, [pathname, clearSearch]);

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        searchInput,
        setSearchInput,
        submitSearch,
        clearSearch,
        searchMode,
        setSearchMode,
        placeholder,
        setPlaceholder,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
