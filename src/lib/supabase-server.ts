/**
 * Sunucu tarafı Supabase client – sadece API route / server component'larda kullanın.
 * SUPABASE_URL ve SUPABASE_ANON_KEY kullanır (NEXT_PUBLIC_ değil, tarayıcıya gönderilmez).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim() ?? '';
const supabaseKey = (process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  supabaseKey.length > 0 &&
  !supabaseUrl.includes('dummy') &&
  !supabaseUrl.includes('placeholder');

const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.invalid';
const key = isSupabaseConfigured ? supabaseKey : 'placeholder';

export const supabase = createClient(url, key);

/** Service role ile client – RLS bypass. Sadece sunucuda, yazma işlemleri için kullanın. */
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
export const supabaseAdmin =
  isSupabaseConfigured && serviceRoleKey.length > 0
    ? createClient(url, serviceRoleKey)
    : null;

export const STORAGE_BUCKETS = {
  BOOK_ASSETS: 'book-assets',
  COVERS: 'book-assets/covers',
  BOOKS: 'book-assets/books',
} as const;

export function getStoragePublicUrl(bucketName: string, filePath: string): string {
  if (!filePath) return '/placeholder-book.svg';
  if (!isSupabaseConfigured) return '/placeholder-book.svg';
  try {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return '/placeholder-book.svg';
  }
}

export function getBookCoverUrl(coverPath: string | undefined | null): string {
  if (!coverPath) return '/placeholder-book.svg';
  if (coverPath.startsWith('http')) return coverPath;
  if (coverPath.startsWith('/')) return coverPath;
  const storagePath = coverPath.startsWith('covers/') ? coverPath : `covers/${coverPath}`;
  return getStoragePublicUrl('book-assets', storagePath);
}

export function getBookFileUrl(bookFilePath: string | undefined | null): string {
  if (!bookFilePath) return '';
  if (bookFilePath.startsWith('http')) return bookFilePath;
  let storagePath = bookFilePath;
  if (!storagePath.startsWith('books/') && !storagePath.includes('/')) {
    storagePath = `books/${storagePath}`;
  }
  return getStoragePublicUrl('book-assets', storagePath);
}

export async function getSignedBookFileUrl(
  bookFilePath: string | undefined | null,
  expiresIn: number = 3600
): Promise<string> {
  if (!bookFilePath || !isSupabaseConfigured) return '';
  if (bookFilePath.startsWith('http')) return bookFilePath;
  let storagePath = bookFilePath;
  if (!storagePath.startsWith('books/') && !storagePath.includes('/')) storagePath = `books/${storagePath}`;
  try {
    const { data, error } = await supabase.storage.from('book-assets').createSignedUrl(storagePath, expiresIn);
    if (error) return getStoragePublicUrl('book-assets', storagePath);
    return data.signedUrl;
  } catch {
    return getStoragePublicUrl('book-assets', storagePath);
  }
}
