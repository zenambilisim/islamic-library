import type { Book, Category, Author } from '../types'
import type { SupabaseBook, BookFile, Category as SupabaseCategory, SupabaseAuthor } from './supabase'
import { getBookCoverUrl, getBookFileUrl } from './supabase'

/**
 * Supabase book verisini frontend Book formatına dönüştürür
 * @param supabaseBook - Supabase'den gelen kitap verisi
 * @returns Frontend Book objesi
 */
export function convertSupabaseBookToBook(supabaseBook: SupabaseBook): Book {
  const authorRels = (supabaseBook.book_authors || [])
    .slice()
    .sort((a, b) => (a.author_order || 9999) - (b.author_order || 9999));
  const names = authorRels.map((r) => r.authors?.name).filter((n): n is string => Boolean(n));
  const ids = authorRels.map((r) => r.authors?.id).filter((id): id is string => Boolean(id));
  const authorName = names.length ? names.join(', ') : '';
  const primaryAuthorRel = authorRels[0];

  const primaryCategoryRel =
    (supabaseBook.book_categories || []).find((c) => c.is_primary) ||
    (supabaseBook.book_categories || [])[0];
  const cat = primaryCategoryRel?.categories;
  const categoryName = cat?.name || '';
  const categorySlug = cat?.slug;
  const categoryId = cat?.id;

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

  // Kapak resmini Storage'dan al
  const coverImageUrl = getBookCoverUrl(supabaseBook.cover_image_url);

  return {
    id: supabaseBook.id,
    title: supabaseBook.title,
    author: authorName,
    authorId: primaryAuthorRel?.authors?.id,
    authors: names.length ? names : undefined,
    authorIds: ids.length ? ids : undefined,
    category: categoryName,
    categoryId,
    categorySlug,
    description: supabaseBook.description || '',
    coverImage: coverImageUrl,
    formats,
    pages: supabaseBook.pages || 0,
    fileSize: supabaseBook.file_size || '0 MB',
    downloadCount: supabaseBook.download_count || 0,
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
  const lang = (supabaseCategory.language_code || 'tr') as Category['language'];
  return {
    id: supabaseCategory.id,
    slug: supabaseCategory.slug,
    name: supabaseCategory.name,
    language: lang,
    description: supabaseCategory.description || '',
    bookCount: supabaseCategory.book_count || 0,
  };
}

/**
 * Supabase author verisini frontend Author formatına dönüştürür
 * @param supabaseAuthor - Supabase'den gelen yazar verisi (authors_view'dan)
 * @returns Frontend Author objesi
 */
export function convertSupabaseAuthorToAuthor(supabaseAuthor: SupabaseAuthor): Author {
  const lang = (supabaseAuthor.language_code || 'tr') as Author['language'];
  return {
    id: supabaseAuthor.id,
    name: supabaseAuthor.name,
    language: lang,
    biography: supabaseAuthor.biography || '',
    photo: supabaseAuthor.profile_image_url || supabaseAuthor.profile_image || undefined,
    bookCount: supabaseAuthor.book_count || 0,
    birthYear: supabaseAuthor.first_publish_year,
    deathYear: supabaseAuthor.last_publish_year,
  };
}

// Birden fazla book'u dönüştür
export function convertSupabaseBooksToBooks(supabaseBooks: any[]): Book[] {
  return supabaseBooks.map(convertSupabaseBookToBook)
}
