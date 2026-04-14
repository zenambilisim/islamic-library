export interface Book {
  id: string;
  title: string;
  author: string;
  /** book_authors üzerinden birincil yazarın authors.id değeri */
  authorId?: string;
  description: string;
  coverImage: string;
  /** Birincil kategori adı (book_categories → categories) */
  category: string;
  /** book_categories üzerinden birincil kategorinin categories.id değeri */
  categoryId?: string;
  /** Filtreleme / API için kategori slug */
  categorySlug?: string;
  formats: {
    epub?: string;
    pdf?: string;
    doc?: string;
  };
  pages: number;
  fileSize: string;
  downloadCount: number;
  language: 'tr' | 'en' | 'ru' | 'az';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  /** Bu satırın kategori metninin dili */
  language: Language;
  description: string;
  bookCount: number;
}

export interface Author {
  id: string;
  name: string;
  /** Bu satırın yazar adının dili (aynı kişi için farklı dillerde ayrı satırlar) */
  language: Language;
  biography: string;
  photo?: string;
  bookCount: number;
  birthYear?: number;
  deathYear?: number;
}

export type Language = 'tr' | 'en' | 'ru' | 'az';

export interface SearchFilters {
  category?: string;
  author?: string;
  language?: Language;
  sortBy?: 'uploadDate' | 'alphabetical' | 'mostDownloaded';
}
