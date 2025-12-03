import { createClient } from '@supabase/supabase-js'

// Supabase credentials - bunları kendi proje bilgilerinle değiştir
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy-url.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy-key'

console.log('🔧 Supabase Config:', { 
  url: supabaseUrl, 
  hasKey: !!supabaseKey,
  isReal: supabaseUrl !== 'https://dummy-url.supabase.co'
});

export const supabase = createClient(supabaseUrl, supabaseKey)

// Storage bucket names
export const STORAGE_BUCKETS = {
  BOOK_ASSETS: 'book-assets',
  COVERS: 'book-assets/covers',
  BOOKS: 'book-assets/books'
} as const;

/**
 * Supabase Storage'dan public URL oluşturur
 * @param bucketName - Bucket ismi (örn: 'book-assets')
 * @param filePath - Dosya yolu (örn: 'covers/Agir-Itki.png')
 * @returns Public URL
 */
export function getStoragePublicUrl(bucketName: string, filePath: string): string {
  if (!filePath) return '/placeholder-book.svg';
  
  try {
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('❌ Error getting storage URL:', error);
    return '/placeholder-book.svg';
  }
}

/**
 * Kitap kapak resminin public URL'ini döndürür
 * @param coverPath - Kapak resmi yolu (örn: 'Agir-Itki.png' veya 'covers/Agir-Itki.png')
 * @returns Cover image public URL
 */
export function getBookCoverUrl(coverPath: string | undefined | null): string {
  if (!coverPath) return '/placeholder-book.svg';
  
  // Eğer tam URL ise direkt dön
  if (coverPath.startsWith('http')) return coverPath;
  
  // Eğer local path ise dön
  if (coverPath.startsWith('/')) return coverPath;
  
  // Storage path'i düzenle
  let storagePath = coverPath;
  
  // 'covers/' prefix'i yoksa ekle
  if (!storagePath.startsWith('covers/')) {
    storagePath = `covers/${storagePath}`;
  }
  
  return getStoragePublicUrl('book-assets', storagePath);
}

/**
 * Kitap dosyasının public URL'ini döndürür
 * @param bookFilePath - Kitap dosya yolu (örn: 'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf')
 * @returns Book file public URL
 */
export function getBookFileUrl(bookFilePath: string | undefined | null): string {
  if (!bookFilePath) return '';
  
  // Eğer tam URL ise direkt dön
  if (bookFilePath.startsWith('http')) return bookFilePath;
  
  // Storage path'i düzenle
  let storagePath = bookFilePath;
  
  // 'books/' prefix'i yoksa ekle
  if (!storagePath.startsWith('books/') && !storagePath.includes('/')) {
    storagePath = `books/${storagePath}`;
  }
  
  return getStoragePublicUrl('book-assets', storagePath);
}

// Database types - Supabase tablolarına uygun
export interface SupabaseBook {
  id: string
  title: string
  title_translations: Record<string, string>
  author: string
  author_translations: Record<string, string>
  category: string
  category_translations: Record<string, string>
  description?: string
  description_translations?: Record<string, string>
  publish_year?: number
  pages?: number
  language: string
  cover_image_url?: string
  file_size?: string
  download_count: number
  tags?: string[]
  created_at: string
  updated_at: string
  book_files?: BookFile[]
}

export interface BookFile {
  id: string
  book_id: string
  format: 'pdf' | 'epub' | 'docx'
  file_url: string
  file_size_mb?: number
  file_size_text?: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  name_translations: Record<string, string>
  description?: string
  description_translations?: Record<string, string>
  icon: string
  book_count: number
  created_at: string
}

// Author view interface - books tablosundan türetilen
export interface SupabaseAuthor {
  id: string
  name: string
  name_translations: Record<string, string>
  biography?: string
  biography_translations?: Record<string, string>
  book_count: number
  total_downloads: number
  first_publish_year?: number
  last_publish_year?: number
  categories: string[]
  languages: string[]
  profile_image?: string
  first_book_created_at: string
  last_updated_at: string
}