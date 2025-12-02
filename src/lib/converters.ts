import type { Book, Category } from '../types'
import type { SupabaseBook, BookFile, Category as SupabaseCategory } from './supabase'
import { getBookCoverUrl, getBookFileUrl } from './supabase'

/**
 * Supabase book verisini frontend Book formatına dönüştürür
 * @param supabaseBook - Supabase'den gelen kitap verisi
 * @returns Frontend Book objesi
 */
export function convertSupabaseBookToBook(supabaseBook: SupabaseBook): Book {
  // Book files'ı formats objesine dönüştür ve Storage URL'lerini al
  const formats: { epub?: string; pdf?: string; doc?: string } = {};
  
  if (supabaseBook.book_files && supabaseBook.book_files.length > 0) {
    supabaseBook.book_files.forEach((file: BookFile) => {
      const fileUrl = getBookFileUrl(file.file_url);
      
      if (file.format === 'epub') formats.epub = fileUrl;
      if (file.format === 'pdf') formats.pdf = fileUrl;
      if (file.format === 'docx') formats.doc = fileUrl;
    });
  }

  // Translation helper function
  const getTranslations = (translations: Record<string, string> | undefined, fallback: string) => ({
    tr: translations?.tr || fallback,
    en: translations?.en || fallback,
    ru: translations?.ru || fallback,
    az: translations?.az || fallback
  });

  // Kapak resmini Storage'dan al
  const coverImageUrl = getBookCoverUrl(supabaseBook.cover_image_url);

  return {
    id: supabaseBook.id,
    title: supabaseBook.title,
    titleTranslations: getTranslations(supabaseBook.title_translations, supabaseBook.title),
    author: supabaseBook.author,
    authorTranslations: getTranslations(supabaseBook.author_translations, supabaseBook.author),
    category: supabaseBook.category,
    categoryTranslations: getTranslations(supabaseBook.category_translations, supabaseBook.category),
    description: supabaseBook.description || '',
    descriptionTranslations: getTranslations(supabaseBook.description_translations, supabaseBook.description || ''),
    coverImage: coverImageUrl,
    formats,
    publishYear: supabaseBook.publish_year || new Date().getFullYear(),
    pages: supabaseBook.pages || 0,
    fileSize: supabaseBook.file_size || '0 MB',
    downloadCount: supabaseBook.download_count || 0,
    tags: supabaseBook.tags || [],
    language: (supabaseBook.language as 'tr' | 'en' | 'ru' | 'az') || 'tr',
    createdAt: new Date(supabaseBook.created_at),
    updatedAt: new Date(supabaseBook.updated_at)
  }
}

/**
 * Supabase category verisini frontend Category formatına dönüştürür
 * @param supabaseCategory - Supabase'den gelen kategori verisi
 * @returns Frontend Category objesi
 */
export function convertSupabaseCategoryToCategory(supabaseCategory: SupabaseCategory): Category {
  // Translation helper function
  const getTranslations = (translations: Record<string, string> | undefined, fallback: string) => ({
    tr: translations?.tr || fallback,
    en: translations?.en || fallback,
    ru: translations?.ru || fallback,
    az: translations?.az || fallback
  });

  return {
    id: supabaseCategory.id,
    name: supabaseCategory.name,
    nameTranslations: getTranslations(supabaseCategory.name_translations, supabaseCategory.name),
    description: supabaseCategory.description || '',
    descriptionTranslations: getTranslations(supabaseCategory.description_translations, supabaseCategory.description || ''),
    bookCount: supabaseCategory.book_count || 0,
    icon: supabaseCategory.icon
  }
}

// Birden fazla book'u dönüştür
export function convertSupabaseBooksToBooks(supabaseBooks: any[]): Book[] {
  return supabaseBooks.map(convertSupabaseBookToBook)
}
