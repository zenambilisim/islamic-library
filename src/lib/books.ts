import { supabase, supabaseAdmin } from './supabase-server'

/** Yazma işlemleri için: service role varsa RLS bypass, yoksa anon (RLS gerekir). */
const db = () => supabaseAdmin ?? supabase

// ***** BOOK OPERATIONS *****

const BOOK_LIST_SELECT = `
  *,
  book_files (
    id,
    format,
    file_url,
    file_size_text
  )
`;

export type GetBooksOptions = {
  /** true: tam total için COUNT (yavaş); admin sayfalama için /api/books?withTotal=1 */
  includeTotal?: boolean;
};

// Tüm kitapları getir (sayfalama; varsayılan: COUNT yok, limit+1 ile hasMore — daha hızlı)
export async function getBooks(
  page = 0,
  limit = 20,
  language?: string,
  options?: GetBooksOptions
) {
  if (options?.includeTotal) {
    let query = supabase
      .from('books')
      .select(BOOK_LIST_SELECT, { count: 'exact' })
      .range(page * limit, (page + 1) * limit - 1)
      .order('created_at', { ascending: false });

    if (language) query = query.eq('language', language);

    const { data, error, count } = await query;

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Raw Supabase response (with count):', { error, count });
    }

    if (error) {
      console.error('❌ Error fetching books:', error);
      return { books: [], error, total: 0, hasMore: false };
    }

    const books = data || [];
    const total = count ?? 0;
    return {
      books,
      error: null,
      total,
      hasMore: total > (page + 1) * limit,
    };
  }

  let query = supabase
    .from('books')
    .select(BOOK_LIST_SELECT)
    .range(page * limit, page * limit + limit)
    .order('created_at', { ascending: false });

  if (language) query = query.eq('language', language);

  const { data, error } = await query;

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Raw Supabase response (fast list):', { error, rowCount: data?.length });
  }

  if (error) {
    console.error('❌ Error fetching books:', error);
    return { books: [], error, total: 0, hasMore: false };
  }

  const rows = data || [];
  const hasMore = rows.length > limit;
  const books = hasMore ? rows.slice(0, limit) : rows;

  return {
    books,
    error: null,
    total: 0,
    hasMore,
  };
}

// Tek kitap getir
export async function getBookById(id: string) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      book_files (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching book:', error)
    return { book: null, error }
  }

  return { book: data, error: null }
}

// Kitap arama
export async function searchBooks(query: string) {
  if (!query.trim()) return { books: [], error: null }

  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      book_files (*)
    `)
    .or(`title.ilike.%${query}%,author.ilike.%${query}%,tags.cs.{${query}}`)
    .limit(50)

  if (error) {
    console.error('Error searching books:', error)
    return { books: [], error }
  }

  return { books: data || [], error: null }
}

// Kategoriye göre kitaplar (isteğe bağlı dil filtresi)
export async function getBooksByCategory(categoryName: string, language?: string) {
  let query = supabase
    .from('books')
    .select(`
      *,
      book_files (*)
    `)
    .eq('category', categoryName)
    .order('created_at', { ascending: false });

  if (language) query = query.eq('language', language);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching books by category:', error);
    return { books: [], error };
  }

  return { books: data || [], error: null };
}

// ***** CATEGORY OPERATIONS *****

// Tüm kategorileri getir
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return { categories: [], error }
  }

  return { categories: data || [], error: null }
}

// ***** FILE OPERATIONS *****

// Dosya upload (kapak resmi için). body: Blob/File/Buffer, filename: uzantı için.
export async function uploadBookCover(
  body: Blob | File | Buffer,
  bookId: string,
  filename: string = 'cover.jpg'
) {
  const name = typeof body === 'object' && body && 'name' in body ? (body as File).name : filename;
  const fileExt = name.split('.').pop() || 'jpg';
  const fileName = `${bookId}-cover.${fileExt}`;
  const filePath = `covers/${fileName}`;

  const payload =
    body instanceof Buffer ? body : Buffer.from(await (body as Blob).arrayBuffer());

  const { data, error } = await db().storage
    .from('book-assets')
    .upload(filePath, payload, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Error uploading cover:', error)
    return { url: null, error }
  }

  // Public URL al
  const { data: { publicUrl } } = db().storage
    .from('book-assets')
    .getPublicUrl(data.path)

  return { url: publicUrl, error: null }
}

// Kitap dosyası upload. body: Blob/File/Buffer, filename: uzantı için.
export async function uploadBookFile(
  body: Blob | File | Buffer,
  bookId: string,
  format: string,
  filename: string = `file.${format}`
) {
  const name = typeof body === 'object' && body && 'name' in body ? (body as File).name : filename;
  const fileExt = name.split('.').pop() || format;
  const fileName = `${bookId}.${fileExt}`;
  const filePath = `books/${bookId}/${fileName}`;

  const payload =
    body instanceof Buffer ? body : Buffer.from(await (body as Blob).arrayBuffer());
  const size = payload.length;

  const contentType =
    format === 'pdf' ? 'application/pdf' :
    format === 'epub' ? 'application/epub+zip' :
    format === 'docx' || format === 'doc' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
    undefined;

  const { data, error } = await db().storage
    .from('book-assets')
    .upload(filePath, payload, {
      cacheControl: '3600',
      upsert: true,
      ...(contentType && { contentType }),
    })

  if (error) {
    console.error('Error uploading book file:', error)
    return { url: null, error }
  }

  // Public URL al
  const { data: { publicUrl } } = db().storage
    .from('book-assets')
    .getPublicUrl(data.path)

  // Database'e file record ekle – başarısız olursa PDF listede görünmez
  const fileSizeMB = size / (1024 * 1024)
  const { error: dbError } = await db()
    .from('book_files')
    .insert({
      book_id: bookId,
      format,
      file_url: publicUrl,
      file_size_mb: fileSizeMB,
      file_size_text: formatFileSize(size)
    })

  if (dbError) {
    console.error('Error saving file record (book_files):', dbError)
    return { url: null, error: dbError }
  }

  return { url: publicUrl, error: null }
}

// ***** KİTAP EKLEME FONKSİYONLARI *****

export interface CreateBookPayload {
  title: string;
  title_translations?: Record<string, string>;
  author: string;
  author_translations?: Record<string, string>;
  category: string;
  category_translations?: Record<string, string>;
  description?: string;
  description_translations?: Record<string, string>;
  language: string;
  pages?: number;
  publish_year?: number;
  tags?: string[];
}

/** Yeni kitap kaydı oluşturur (dosya/kapak yok). */
export async function createBook(payload: CreateBookPayload) {
  const row = {
    title: payload.title,
    title_translations: payload.title_translations ?? { tr: payload.title, en: payload.title, ru: payload.title, az: payload.title },
    author: payload.author,
    author_translations: payload.author_translations ?? { tr: payload.author, en: payload.author, ru: payload.author, az: payload.author },
    category: payload.category,
    category_translations: payload.category_translations ?? { tr: payload.category, en: payload.category, ru: payload.category, az: payload.category },
    description: payload.description ?? '',
    description_translations: payload.description_translations ?? {},
    language: payload.language,
    pages: payload.pages ?? 0,
    publish_year: payload.publish_year ?? new Date().getFullYear(),
    download_count: 0,
    tags: payload.tags ?? [],
  };

  const { data, error } = await db()
    .from('books')
    .insert(row)
    .select()
    .single();

  if (error) return { book: null, error };
  return { book: data, error: null };
}

/** Kitabın kapak resmi URL'ini günceller. */
export async function updateBookCover(bookId: string, coverUrl: string) {
  const { error } = await db()
    .from('books')
    .update({ cover_image_url: coverUrl })
    .eq('id', bookId);
  return { error };
}

// Hızlı kitap ekleme
export async function addQuickBook() {
  console.log('📚 Adding quick book...')
  
  // Önce kitabı ekle
  const { data: bookData, error: bookError } = await supabase
    .from('books')
    .insert({
      title: 'Ağır İtki',
      author: 'Said Ellamian',
      category: 'fiqh',
      description: 'İslam hukukuna dair önemli bir eser',
      language: 'tr',
      pages: 250,
      publish_year: 2024,
      download_count: 0
    })
    .select()
    .single()

  if (bookError) {
    console.error('❌ Book insert error:', bookError)
    return { error: bookError }
  }

  console.log('✅ Book inserted:', bookData)

  // Sonra dosyaları ekle
  const { data: filesData, error: filesError } = await supabase
    .from('book_files')
    .insert([
      {
        book_id: bookData.id,
        format: 'pdf',
        file_url: 'https://hwtwmbjorpdzpyfbhptr.supabase.co/storage/v1/object/public/book-assets/agir-itki-said-allamin/agir-itki-said-ellamin.pdf',
        file_size_mb: 2.5,
        file_size_text: '2.5 MB'
      },
      {
        book_id: bookData.id,
        format: 'epub',
        file_url: 'https://hwtwmbjorpdzpyfbhptr.supabase.co/storage/v1/object/public/book-assets/agir-itki-said-allamin/agir-itki-said-ellamin.epub',
        file_size_mb: 1.8,
        file_size_text: '1.8 MB'
      },
      {
        book_id: bookData.id,
        format: 'docx',
        file_url: 'https://hwtwmbjorpdzpyfbhptr.supabase.co/storage/v1/object/public/book-assets/agir-itki-said-allamin/agir-itki-said-ellamin.docx',
        file_size_mb: 1.2,
        file_size_text: '1.2 MB'
      }
    ])

  if (filesError) {
    console.error('❌ Files insert error:', filesError)
    return { error: filesError }
  }

  console.log('✅ Files inserted:', filesData)
  return { book: bookData, files: filesData }
}

/** Storage'dan kitap dosyalarını ve kapağını siler (book_files + books tablosu silinmeden önce çağrılabilir). */
async function deleteBookStorageFiles(bookId: string) {
  const storage = db().storage.from('book-assets');
  const pathsToRemove: string[] = [];

  // books/{bookId}/ altındaki tüm dosyalar (PDF, EPUB, DOCX)
  const { data: bookFiles } = await storage.list(`books/${bookId}`);
  if (bookFiles?.length) {
    for (const f of bookFiles) {
      if (f.name) pathsToRemove.push(`books/${bookId}/${f.name}`);
    }
  }

  // covers/ altında bookId ile başlayan kapak (örn. {bookId}-cover.jpg)
  const { data: coverFiles } = await storage.list('covers');
  if (coverFiles?.length) {
    const prefix = `${bookId}-cover`;
    for (const f of coverFiles) {
      if (f.name?.startsWith(prefix)) pathsToRemove.push(`covers/${f.name}`);
    }
  }

  if (pathsToRemove.length > 0) {
    const { error } = await storage.remove(pathsToRemove);
    if (error) console.error('Error deleting book files from storage:', error);
  }
}

/** Kitabı, ilişkili book_files kayıtlarını ve Storage'daki dosyaları siler. */
export async function deleteBook(bookId: string) {
  const client = db();

  const { error: filesError } = await client
    .from('book_files')
    .delete()
    .eq('book_id', bookId);

  if (filesError) {
    console.error('Error deleting book_files:', filesError);
    return { error: filesError };
  }

  const { error: bookError } = await client
    .from('books')
    .delete()
    .eq('id', bookId);

  if (bookError) {
    return { error: bookError };
  }

  await deleteBookStorageFiles(bookId);

  return { error: null };
}

// Hızlı temizleme
export async function clearAllData() {
  console.log('🗑️ Clearing all data...')
  
  await supabase.from('book_files').delete().neq('id', '0')
  await supabase.from('books').delete().neq('id', '0')
  await supabase.from('categories').delete().neq('id', '0')
  
  console.log('✅ All data cleared')
}

// ***** UTILITY FUNCTIONS *****

// Dosya boyutu formatla
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Download sayısını artır
export async function incrementDownloadCount(bookId: string, format: string) {
  // Download log ekle (trigger otomatik sayacı artıracak)
  const { error } = await supabase
    .from('download_logs')
    .insert({
      book_id: bookId,
      format,
      user_ip: null // İsteğe bağlı
    })

  if (error) {
    console.error('Error logging download:', error)
  }

  return { error }
}

// ***** TEST FUNCTIONS *****

// Test: Direkt olarak kitap ve dosyalarını çek
export async function testBookFiles() {
  console.log('🔍 Testing direct book files query...')
  
  const { data, error } = await supabase
    .from('books')
    .select(`
      id,
      title,
      book_files (
        format,
        file_url
      )
    `)
    .eq('id', '88c7c5aa-32e3-4d33-94c8-19c5f504c045')
    .single()

  console.log('📊 Direct query result:', { data, error })
  return { data, error }
}

// Test: Sadece book_files tablosunu kontrol et
export async function testBookFilesTable() {
  console.log('🗃️ Testing book_files table directly...')
  
  const { data, error } = await supabase
    .from('book_files')
    .select('*')
    .eq('book_id', '88c7c5aa-32e3-4d33-94c8-19c5f504c045')

  console.log('📋 book_files table result:', { data, error })
  return { data, error }
}
