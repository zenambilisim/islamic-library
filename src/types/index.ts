export interface Book {
  id: string;
  /** URL yolu; paylaşım linkleri `/books/{slug}?lang=` kullanır */
  slug?: string;
  title: string;
  /** Tüm yazarların virgülle birleşik gösterimi */
  author: string;
  /** Birincil yazar (author_order en küçük) */
  authorId?: string;
  /** author_order sırasıyla yazar adları */
  authors?: string[];
  /** authors ile aynı sırada authors.id değerleri */
  authorIds?: string[];
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

/** public.users — okuyucu profili (auth.users ile aynı id) */
export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Kullanıcı okuma listesi durumu */
export type ReadingStatus = 'want_to_read' | 'reading' | 'read';

export interface UserBookEntry {
  bookId: string;
  status: ReadingStatus;
  updatedAt: string;
}

export interface SearchFilters {
  category?: string;
  author?: string;
  language?: Language;
  sortBy?: 'uploadDate' | 'alphabetical' | 'mostDownloaded';
}
