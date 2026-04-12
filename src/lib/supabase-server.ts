/**
 * Sunucu tarafı Supabase client – sadece API route / server component'larda kullanın.
 * SUPABASE_URL ve SUPABASE_ANON_KEY kullanır (NEXT_PUBLIC_ değil, tarayıcıya gönderilmez).
 */
import { createClient } from '@supabase/supabase-js';
import {
  isR2Configured,
  isR2PublicUrlConfigured,
  isSupabaseStorageUrl,
  r2KeyToProxyPath,
  normalizeAppR2ProxyPath,
  r2PublicUrlForKey,
  tryExtractStorageKey,
} from './r2-storage';

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

/** Yeni anon istemci (sunucuda ayrı oturum / şifre doğrulama zinciri için). */
export function createAnonSupabaseClient() {
  return createClient(url, key);
}

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
  const normalized = filePath.replace(/^\/+/, '');
  if (isR2Configured()) {
    if (isR2PublicUrlConfigured()) {
      try {
        return r2PublicUrlForKey(normalized);
      } catch {
        return '/placeholder-book.svg';
      }
    }
    return r2KeyToProxyPath(normalized);
  }
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

/**
 * İndirme / fetch için URL. R2 dosyalarında tarayıcı CORS hatası olmaması için
 * *.r2.cloudflarestorage.com imzalı URL yerine aynı origin /api/storage/r2/… kullanılır.
 */
export async function getSignedBookFileUrl(
  bookFilePath: string | undefined | null,
  expiresIn: number = 3600
): Promise<string> {
  if (!bookFilePath) return '';

  const selfProxy = normalizeAppR2ProxyPath(bookFilePath);
  if (selfProxy) return selfProxy;

  if (bookFilePath.startsWith('http')) {
    if (isSupabaseStorageUrl(bookFilePath) && isSupabaseConfigured) {
      const key = tryExtractStorageKey(bookFilePath);
      if (key) {
        try {
          const { data, error } = await supabase.storage
            .from('book-assets')
            .createSignedUrl(key, expiresIn);
          if (!error && data?.signedUrl) return data.signedUrl;
        } catch {
          /* fall through */
        }
      }
      return bookFilePath;
    }
    if (isR2Configured()) {
      const key = tryExtractStorageKey(bookFilePath);
      if (key && (key.startsWith('books/') || key.startsWith('covers/'))) {
        return r2KeyToProxyPath(key);
      }
    }
    return bookFilePath;
  }

  let storagePath = bookFilePath.trim();
  if (!storagePath.startsWith('books/') && !storagePath.startsWith('covers/')) {
    if (!storagePath.includes('/')) {
      storagePath = `books/${storagePath}`;
    }
  }

  if (isR2Configured()) {
    if (storagePath.startsWith('books/') || storagePath.startsWith('covers/')) {
      return r2KeyToProxyPath(storagePath);
    }
    return '';
  }

  if (!isSupabaseConfigured) return '';
  try {
    const { data, error } = await supabase.storage
      .from('book-assets')
      .createSignedUrl(storagePath, expiresIn);
    if (error) return getStoragePublicUrl('book-assets', storagePath);
    return data.signedUrl;
  } catch {
    return getStoragePublicUrl('book-assets', storagePath);
  }
}
