/**
 * Sunucu tarafında kullanılan converter'lar (Supabase URL'leri server env ile oluşturulur).
 * Sadece API route veya server-only kodda import edin.
 */
import type { Book, Category, Author } from '@/types';
import type { SupabaseBook, BookFile, Category as SupabaseCategory, SupabaseAuthor } from './supabase';
import { getBookCoverUrl, getBookFileUrl } from './supabase-server';

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

  const formats: { epub?: string; pdf?: string; doc?: string } = {};
  if (supabaseBook.book_files?.length) {
    supabaseBook.book_files.forEach((file: BookFile) => {
      const fileUrl = getBookFileUrl(file.file_url);
      const formatLower = file.format.toLowerCase();
      if (formatLower === 'epub') formats.epub = fileUrl;
      if (formatLower === 'pdf') formats.pdf = fileUrl;
      if (formatLower === 'docx' || formatLower === 'doc') formats.doc = fileUrl;
    });
  }
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
    updatedAt: new Date(supabaseBook.updated_at),
  };
}

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
