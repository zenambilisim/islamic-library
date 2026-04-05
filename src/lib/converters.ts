import type { Book, Category, Author } from '../types'
import type { SupabaseBook, BookFile, Category as SupabaseCategory, SupabaseAuthor } from './supabase'
import { getBookCoverUrl, getBookFileUrl } from './supabase'

/**
 * Supabase book verisini frontend Book formatına dönüştürür
 * @param supabaseBook - Supabase'den gelen kitap verisi
 * @returns Frontend Book objesi
 */
export function convertSupabaseBookToBook(supabaseBook: SupabaseBook): Book {
  const primaryAuthorRel = (supabaseBook.book_authors || [])
    .slice()
    .sort((a, b) => (a.author_order || 9999) - (b.author_order || 9999))[0];
  const authorName = supabaseBook.author || primaryAuthorRel?.authors?.name || '';
  const authorTranslations = supabaseBook.author_translations || primaryAuthorRel?.authors?.name_translations;

  const primaryCategoryRel =
    (supabaseBook.book_categories || []).find((c) => c.is_primary) ||
    (supabaseBook.book_categories || [])[0];
  const categoryName = supabaseBook.category || primaryCategoryRel?.categories?.name || '';
  const categoryTranslations = supabaseBook.category_translations || primaryCategoryRel?.categories?.name_translations;

  // Book files'ı formats objesine dönüştür ve Storage URL'lerini al
  const formats: { epub?: string; pdf?: string; doc?: string } = {};
  
  if (supabaseBook.book_files && supabaseBook.book_files.length > 0) {
    supabaseBook.book_files.forEach((file: BookFile) => {
      const fileUrl = getBookFileUrl(file.file_url);
      
      // Format kontrolü case-insensitive (büyük/küçük harf duyarsız)
      const formatLower = file.format.toLowerCase();
      
      if (formatLower === 'epub') formats.epub = fileUrl;
      if (formatLower === 'pdf') formats.pdf = fileUrl;
      if (formatLower === 'docx' || formatLower === 'doc') formats.doc = fileUrl;
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
    author: authorName,
    authorTranslations: getTranslations(authorTranslations, authorName),
    category: categoryName,
    categoryTranslations: getTranslations(categoryTranslations, categoryName),
    description: supabaseBook.description || '',
    descriptionTranslations: getTranslations(supabaseBook.description_translations, supabaseBook.description || ''),
    coverImage: coverImageUrl,
    formats,
    publishYear: supabaseBook.publish_year || new Date().getFullYear(),
    pages: supabaseBook.pages || 0,
    fileSize: supabaseBook.file_size || '0 MB',
    downloadCount: supabaseBook.download_count || 0,
    tags: supabaseBook.tags || [],
    language: ((supabaseBook.language_code || supabaseBook.language) as 'tr' | 'en' | 'ru' | 'az') || 'tr',
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

/**
 * Supabase author verisini frontend Author formatına dönüştürür
 * @param supabaseAuthor - Supabase'den gelen yazar verisi (authors_view'dan)
 * @returns Frontend Author objesi
 */
export function convertSupabaseAuthorToAuthor(supabaseAuthor: SupabaseAuthor): Author {
  // Translation helper function
  const getTranslations = (translations: Record<string, string> | undefined, fallback: string) => ({
    tr: translations?.tr || fallback,
    en: translations?.en || fallback,
    ru: translations?.ru || fallback,
    az: translations?.az || fallback
  });

  return {
    id: supabaseAuthor.id,
    name: supabaseAuthor.name,
    nameTranslations: getTranslations(supabaseAuthor.name_translations, supabaseAuthor.name),
    biography: supabaseAuthor.biography || '',
    biographyTranslations: getTranslations(supabaseAuthor.biography_translations, supabaseAuthor.biography || ''),
    photo: supabaseAuthor.profile_image_url || supabaseAuthor.profile_image || undefined,
    bookCount: supabaseAuthor.book_count || 0,
    birthYear: supabaseAuthor.first_publish_year,
    deathYear: supabaseAuthor.last_publish_year
  }
}

// Birden fazla book'u dönüştür
export function convertSupabaseBooksToBooks(supabaseBooks: any[]): Book[] {
  return supabaseBooks.map(convertSupabaseBookToBook)
}
