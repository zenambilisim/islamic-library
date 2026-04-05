/**
 * Client tarafında Supabase URL/key kullanılmıyor – tüm veri /api üzerinden gelir.
 * Sadece tipler ve sabitler. Sunucu: lib/supabase-server.ts
 * Client'ta URL oluşturulmaz; signed URL için GET /api/books/signed-url kullanın.
 */

// Storage bucket names (sabitler, env yok)
export const STORAGE_BUCKETS = {
  BOOK_ASSETS: 'book-assets',
  COVERS: 'book-assets/covers',
  BOOKS: 'book-assets/books',
} as const;

/** Client'ta kullanılmaz; API zaten tam URL döner. Eski import uyumluluğu için stub. */
export function getBookCoverUrl(_path: string | undefined | null): string {
  return '/placeholder-book.svg';
}
/** Client'ta kullanılmaz; API zaten tam URL döner. Eski import uyumluluğu için stub. */
export function getBookFileUrl(_path: string | undefined | null): string {
  return '';
}
/**
 * Signed URL alır – sunucu API'sini kullanır (client'ta Supabase key yok).
 * Eski getSignedBookFileUrl yerine bunu kullanın.
 */
export async function getSignedBookFileUrl(
  pathOrUrl: string | undefined | null,
  _expiresIn?: number
): Promise<string> {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) {
    try {
      const res = await fetch('/api/books/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathOrUrl }),
      });
      if (!res.ok) return pathOrUrl;
      const data = await res.json();
      return data.url || pathOrUrl;
    } catch {
      return pathOrUrl;
    }
  }
  try {
    const res = await fetch('/api/books/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathOrUrl }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.url || '';
  } catch {
    return '';
  }
}

// Database types - Supabase tablolarına uygun
export interface SupabaseBook {
  id: string
  title: string
  title_translations: Record<string, string>
  author?: string
  author_translations?: Record<string, string>
  category?: string
  category_translations?: Record<string, string>
  description?: string
  description_translations?: Record<string, string>
  publish_year?: number
  pages?: number
  language_code?: string
  language?: string
  cover_image_url?: string
  file_size?: string
  download_count: number
  tags?: string[]
  created_at: string
  updated_at: string
  book_files?: BookFile[]
  book_authors?: Array<{
    author_order?: number
    role?: string
    authors?: {
      id: string
      name: string
      name_translations?: Record<string, string>
    } | null
  }>
  book_categories?: Array<{
    is_primary?: boolean
    categories?: {
      id: string
      name: string
      name_translations?: Record<string, string>
    } | null
  }>
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
  profile_image_url?: string
  first_book_created_at: string
  last_updated_at: string
}