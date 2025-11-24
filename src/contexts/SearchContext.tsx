import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type SearchMode = 'books' | 'categories' | 'authors';

interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('books');
  const [placeholder, setPlaceholder] = useState('Kitap, yazar veya kategori ara...');

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
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
