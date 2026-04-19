import { randomBytes } from 'crypto'
import sharp from 'sharp'
import { countPdfPages } from './pdf-page-count'
import { normalizeLanguageCode, slugifyAuthorName } from './author-db'
import { isR2Configured, r2DeleteBookObjects, r2DeleteKeys, r2PutObject, tryExtractStorageKey } from './r2-storage'
import { supabase, supabaseAdmin } from './supabase-server'

/** Yazma işlemleri için: service role varsa RLS bypass, yoksa anon (RLS gerekir). */
const db = () => supabaseAdmin ?? supabase

async function resolveOrCreateAuthorId(
  client: ReturnType<typeof db>,
  opts: { author_id?: string | null; authorName: string; language_code: string }
): Promise<{ id: string } | { error: Error }> {
  const lang = normalizeLanguageCode(opts.language_code, 'tr');
  const idIn = opts.author_id?.trim();
  if (idIn) {
    const { data: byId, error: e1 } = await client
      .from('authors')
      .select('id, language_code')
      .eq('id', idIn)
      .maybeSingle();
    if (e1) return { error: e1 as Error };
    if (!byId?.id) return { error: new Error('Seçilen yazar bulunamadı') };
    const row = byId as { id: string; language_code?: string };
    if (row.language_code && row.language_code !== lang) {
      return {
        error: new Error(
          `Yazar kaydının dili (${row.language_code}) ile kitap dili (${lang}) uyuşmuyor. Aynı dilde bir yazar seçin veya yeni yazar ekleyin.`
        ),
      };
    }
    return { id: row.id };
  }

  const name = opts.authorName.trim();
  if (!name) return { error: new Error('Yazar zorunludur') };

  const { data: existingAuthor, error: existingAuthorError } = await client
    .from('authors')
    .select('id')
    .eq('name', name)
    .eq('language_code', lang)
    .limit(1)
    .maybeSingle();
  if (existingAuthorError) return { error: existingAuthorError as Error };
  if (existingAuthor?.id) return { id: existingAuthor.id as string };

  let slug = slugifyAuthorName(name);
  let { data: createdAuthor, error: createdAuthorError } = await client
    .from('authors')
    .insert({
      name,
      biography: '',
      language_code: lang,
      slug,
    })
    .select('id')
    .single();

  if (createdAuthorError?.code === '23505') {
    slug = `${slugifyAuthorName(name)}-${randomBytes(3).toString('hex')}`;
    const retry = await client
      .from('authors')
      .insert({ name, biography: '', language_code: lang, slug })
      .select('id')
      .single();
    createdAuthor = retry.data;
    createdAuthorError = retry.error;
  }
  if (createdAuthorError) return { error: createdAuthorError as Error };
  if (!createdAuthor?.id) return { error: new Error('Yazar oluşturulamadı') };
  return { id: createdAuthor.id as string };
}

/** API / form: authors[] veya tek author + author_id */
export type BookAuthorInput = { name: string; author_id?: string | null };

function normalizeBookAuthorsPayload(payload: {
  authors?: BookAuthorInput[] | null;
  author?: string;
  author_id?: string | null;
}): BookAuthorInput[] | { error: Error } {
  if (Array.isArray(payload.authors) && payload.authors.length > 0) {
    const out: BookAuthorInput[] = [];
    const seen = new Set<string>();
    for (const raw of payload.authors) {
      if (!raw || typeof raw !== 'object') continue;
      const aid = typeof raw.author_id === 'string' ? raw.author_id.trim() : '';
      const nm = typeof raw.name === 'string' ? raw.name.trim() : '';
      if (!aid && !nm) continue;
      const key = aid ? `id:${aid}` : `n:${nm.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name: nm, author_id: aid || undefined });
    }
    if (out.length === 0) return { error: new Error('En az bir geçerli yazar gerekir') };
    return out;
  }
  const single = (payload.author ?? '').trim();
  if (!single) return { error: new Error('Yazar zorunludur') };
  const aid = payload.author_id?.trim();
  return [{ name: single, author_id: aid || undefined }];
}

// ***** BOOK OPERATIONS *****

const BOOK_LIST_SELECT = `
  *,
  book_files (
    id,
    format,
    file_url,
    file_size_text
  ),
  book_authors (
    author_order,
    role,
    authors (
      id,
      name,
      language_code
    )
  ),
  book_categories (
    is_primary,
    categories (
      id,
      name,
      slug,
      language_code
    )
  )
`;

/** Kategori slug ile süzmek için ilişkili olmayan kitapları dışla */
const BOOK_LIST_SELECT_IN_CATEGORY = BOOK_LIST_SELECT.replace(
  'book_categories (',
  'book_categories!inner ('
).replace('categories (', 'categories!inner (');

export type GetBooksOptions = {
  /** true: tam total için COUNT (yavaş); admin sayfalama için /api/books?withTotal=1 */
  includeTotal?: boolean;
  sortBy?: BookSortBy;
  /** Başlıkta büyük/küçük harf duyarsız kısmi eşleşme (ILIKE) */
  titleSearch?: string;
};

/** ILIKE içinde % ve _ jokerlerini devre dışı bırakır */
export function sanitizeIlikeFragment(raw: string): string {
  return raw.trim().replace(/[%_\\]/g, '').slice(0, 200);
}

function applyTitleSearchFilter<T extends { ilike: (col: string, pattern: string) => T }>(
  query: T,
  titleSearch?: string
): T {
  const safe = titleSearch != null ? sanitizeIlikeFragment(titleSearch) : '';
  if (!safe) return query;
  return query.ilike('title', `%${safe}%`);
}

export type BookSortBy = 'uploadDate' | 'alphabetical' | 'mostDownloaded';

function applyBookSort<T extends { order: (column: string, options?: { ascending?: boolean }) => T }>(
  query: T,
  sortBy: BookSortBy = 'uploadDate'
): T {
  if (sortBy === 'alphabetical') {
    return query.order('title', { ascending: true }).order('created_at', { ascending: false });
  }
  if (sortBy === 'mostDownloaded') {
    return query
      .order('download_count', { ascending: false })
      .order('created_at', { ascending: false });
  }
  return query.order('created_at', { ascending: false });
}

// Tüm kitapları getir (sayfalama; varsayılan: COUNT yok, limit+1 ile hasMore — daha hızlı)
export async function getBooks(
  page = 0,
  limit = 20,
  language?: string,
  options?: GetBooksOptions
) {
  const sortBy = options?.sortBy ?? 'uploadDate';
  if (options?.includeTotal) {
    let query = applyBookSort(
      supabase
      .from('books')
      .select(BOOK_LIST_SELECT, { count: 'exact' })
      .range(page * limit, (page + 1) * limit - 1),
      sortBy
    );

    if (language) query = query.eq('language_code', language);
    query = applyTitleSearchFilter(query, options?.titleSearch);

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

  let query = applyBookSort(
    supabase
    .from('books')
    .select(BOOK_LIST_SELECT)
    .range(page * limit, page * limit + limit),
    sortBy
  );

  if (language) query = query.eq('language_code', language);
  query = applyTitleSearchFilter(query, options?.titleSearch);

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
      book_files (*),
      book_authors (
        author_order,
        role,
        authors (
          id,
          name,
          language_code
        )
      ),
      book_categories (
        is_primary,
        categories (
          id,
          name,
          slug,
          language_code
        )
      )
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
      book_files (*),
      book_authors (
        author_order,
        role,
        authors (
          id,
          name,
          language_code
        )
      ),
      book_categories (
        is_primary,
        categories (
          id,
          name,
          slug,
          language_code
        )
      )
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(50)

  if (error) {
    console.error('Error searching books:', error)
    return { books: [], error }
  }

  return { books: data || [], error: null }
}

export type GetBooksByCategoryOptions = {
  includeTotal?: boolean;
  sortBy?: BookSortBy;
  titleSearch?: string;
};

/**
 * Kategoriye göre kitaplar (slug + isteğe bağlı dil). Sayfalı; ana liste ile aynı select.
 */
export async function getBooksByCategory(
  categorySlug: string,
  language: string | undefined,
  page = 0,
  limit = 20,
  options?: GetBooksByCategoryOptions
) {
  const sortBy = options?.sortBy ?? 'uploadDate';

  let base = applyBookSort(
    supabase
    .from('books')
    .select(BOOK_LIST_SELECT_IN_CATEGORY)
    .eq('book_categories.categories.slug', categorySlug),
    sortBy
  );

  if (language) {
    base = base.eq('language_code', language).eq('book_categories.categories.language_code', language);
  }
  base = applyTitleSearchFilter(base, options?.titleSearch);

  if (options?.includeTotal) {
    let qCount = applyBookSort(
      supabase
      .from('books')
      .select(BOOK_LIST_SELECT_IN_CATEGORY, { count: 'exact' })
      .eq('book_categories.categories.slug', categorySlug),
      sortBy
    );

    if (language) {
      qCount = qCount.eq('language_code', language).eq('book_categories.categories.language_code', language);
    }
    qCount = applyTitleSearchFilter(qCount, options?.titleSearch);

    const { data, error, count } = await qCount.range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.error('Error fetching books by category (count):', error);
      return { books: [], error, total: 0, hasMore: false };
    }

    const total = count ?? 0;
    const books = data || [];
    return {
      books,
      error: null,
      total,
      hasMore: total > (page + 1) * limit,
    };
  }

  const { data, error } = await base.range(page * limit, page * limit + limit);

  if (error) {
    console.error('Error fetching books by category:', error);
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

// ***** CATEGORY OPERATIONS *****

// Tüm kategorileri getir
export async function getCategories(language?: string, nameSearch?: string) {
  let query = supabase
    .from('categories')
    .select('*')
    .order('name');
  if (language?.trim()) {
    query = query.eq('language_code', language.trim().toLowerCase());
  }
  const safeName = nameSearch != null ? sanitizeIlikeFragment(nameSearch) : '';
  if (safeName) {
    query = query.ilike('name', `%${safeName}%`);
  }
  const { data, error } = await query

  if (error) {
    console.error('Error fetching categories:', error)
    return { categories: [], error }
  }

  const rows = data || []
  if (rows.length === 0) return { categories: [], error: null }

  const ids = rows.map((r: { id: string }) => r.id)
  const { data: rels, error: relErr } = await supabase
    .from('book_categories')
    .select('category_id')
    .in('category_id', ids)

  if (relErr) {
    console.error('Error fetching category book counts:', relErr)
    const fallback = rows.map((r: any) => ({ ...r, book_count: 0 }))
    return { categories: fallback, error: null }
  }

  const countMap = new Map<string, number>()
  for (const rel of rels || []) {
    const cid = (rel as { category_id: string }).category_id
    countMap.set(cid, (countMap.get(cid) ?? 0) + 1)
  }

  const categories = rows.map((r: any) => ({
    ...r,
    book_count: countMap.get(r.id) ?? 0,
  }))

  return { categories, error: null }
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  language_code?: string
}

/** categories tablosuna kayıt (slug + language_code benzersiz). */
export async function createCategory(payload: CreateCategoryPayload) {
  const client = db()
  const name = payload.name.trim()
  if (!name) {
    return { category: null, error: new Error('name zorunludur') }
  }
  const description = (payload.description ?? '').trim()
  const language_code = normalizeLanguageCode(payload.language_code, 'tr')
  let slug = slugifyAuthorName(name)
  const row = {
    slug,
    name,
    language_code,
    description,
  }
  let { data, error } = await client.from('categories').insert(row).select('*').single()
  if (error?.code === '23505') {
    slug = `${slugifyAuthorName(name)}-${randomBytes(3).toString('hex')}`
    const retry = await client.from('categories').insert({ ...row, slug }).select('*').single()
    data = retry.data
    error = retry.error
  }
  if (error) return { category: null, error }
  return { category: data, error: null }
}

export async function getCategoryById(id: string) {
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle()
  if (error) return { category: null, error }
  if (!data) return { category: null, error: new Error('Kategori bulunamadı') }
  return { category: data, error: null }
}

export type UpdateCategoryPayload = CreateCategoryPayload

/** categories satırını günceller; isim değişince slug yenilenir, çakışmada sonek eklenir. */
export async function updateCategory(id: string, payload: UpdateCategoryPayload) {
  const client = db()
  const name = payload.name.trim()
  if (!name) {
    return { category: null, error: new Error('name zorunludur') }
  }
  const description = (payload.description ?? '').trim()
  const language_code = normalizeLanguageCode(payload.language_code, 'tr')

  const { data: current, error: fetchErr } = await client
    .from('categories')
    .select('slug, language_code')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr) return { category: null, error: fetchErr }
  if (!current) return { category: null, error: new Error('Kategori bulunamadı') }

  const cur = current as { slug: string; language_code?: string }
  let slug = slugifyAuthorName(name)
  if (slug !== cur.slug) {
    const { data: other } = await client
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .eq('language_code', cur.language_code ?? language_code)
      .neq('id', id)
      .maybeSingle()
    if (other) {
      slug = `${slugifyAuthorName(name)}-${randomBytes(3).toString('hex')}`
    }
  }

  const row = {
    slug,
    name,
    language_code,
    description,
  }

  let { data, error } = await client.from('categories').update(row).eq('id', id).select('*').single()
  if (error?.code === '23505') {
    slug = `${slugifyAuthorName(name)}-${randomBytes(3).toString('hex')}`
    const retry = await client
      .from('categories')
      .update({ ...row, slug })
      .eq('id', id)
      .select('*')
      .single()
    data = retry.data
    error = retry.error
  }
  if (error) return { category: null, error }
  return { category: data, error: null }
}

/** Kategori siler; bağlı kitap varsa silmeyi engeller. */
export async function deleteCategory(id: string) {
  const client = db()
  const { count, error: relErr } = await client
    .from('book_categories')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
  if (relErr) return { error: relErr }
  if ((count ?? 0) > 0) {
    return {
      error: new Error(
        'Bu kategoriye bağlı kitaplar var. Önce kitapların kategorisini değiştirin veya kitapları silin.'
      ),
    }
  }
  const { error } = await client.from('categories').delete().eq('id', id)
  if (error) return { error }
  return { error: null }
}

// ***** FILE OPERATIONS *****

// Dosya upload (kapak resmi için). body: Blob/File/Buffer, filename: uzantı için.
export async function uploadBookCover(
  body: Blob | File | Buffer,
  bookId: string,
  filename: string = 'cover.jpg'
) {
  const name = typeof body === 'object' && body && 'name' in body ? (body as File).name : filename;
  const fileExt = (name.split('.').pop() || 'jpg').toLowerCase();
  const payload =
    body instanceof Buffer ? body : Buffer.from(await (body as Blob).arrayBuffer());
  const convertToWebp = fileExt === 'png' || fileExt === 'jpg' || fileExt === 'jpeg';
  const outputExt = convertToWebp ? 'webp' : fileExt;
  const fileName = `${bookId}-cover.${outputExt}`;
  const filePath = `covers/${fileName}`;
  const outputPayload = convertToWebp
    ? await sharp(payload).webp({ quality: 80 }).toBuffer()
    : payload;
  const contentType =
    outputExt === 'webp' ? 'image/webp' : outputExt === 'png' ? 'image/png' : 'image/jpeg';

  if (isR2Configured()) {
    try {
      const { publicUrl } = await r2PutObject(filePath, outputPayload, {
        contentType,
        cacheControl: '3600',
      });
      return { url: publicUrl, error: null };
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error('Error uploading cover (R2):', err);
      return { url: null, error: err };
    }
  }

  const { data, error } = await db().storage
    .from('book-assets')
    .upload(filePath, outputPayload, {
      cacheControl: '3600',
      upsert: true,
      contentType,
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

  const client = db();
  const formatNorm = format === 'doc' ? 'docx' : format;
  if (formatNorm === 'docx') {
    await client.from('book_files').delete().eq('book_id', bookId).in('format', ['docx', 'doc']);
  } else {
    await client.from('book_files').delete().eq('book_id', bookId).eq('format', formatNorm);
  }

  const contentType =
    format === 'pdf' ? 'application/pdf' :
    format === 'epub' ? 'application/epub+zip' :
    format === 'docx' || format === 'doc' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
    undefined;

  let publicUrl: string;

  if (isR2Configured()) {
    try {
      const out = await r2PutObject(filePath, payload, {
        contentType,
        cacheControl: '3600',
      });
      publicUrl = out.publicUrl;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.error('Error uploading book file (R2):', err);
      return { url: null, error: err };
    }
  } else {
    const { data, error } = await client.storage
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

    const { data: pub } = client.storage.from('book-assets').getPublicUrl(data.path)
    publicUrl = pub.publicUrl
  }

  // Database'e file record ekle – başarısız olursa PDF listede görünmez
  const fileSizeMB = size / (1024 * 1024)
  const insertFormat = formatNorm === 'docx' ? 'docx' : format;
  const { error: dbError } = await client
    .from('book_files')
    .insert({
      book_id: bookId,
      format: insertFormat,
      file_url: publicUrl,
      file_size_mb: fileSizeMB,
      file_size_text: formatFileSize(size)
    })

  if (dbError) {
    console.error('Error saving file record (book_files):', dbError)
    return { url: null, error: dbError }
  }

  let pagesFromPdf: number | undefined;
  if (formatNorm === 'pdf') {
    const n = await countPdfPages(payload);
    if (n != null) {
      const { error: pageErr } = await client.from('books').update({ pages: n }).eq('id', bookId);
      if (pageErr) {
        console.error('Error updating book pages from PDF:', pageErr);
      } else {
        pagesFromPdf = n;
      }
    } else {
      console.warn('Could not determine PDF page count:', { bookId, filename: name });
    }
  }

  return { url: publicUrl, error: null, pages: pagesFromPdf }
}

// ***** KİTAP EKLEME FONKSİYONLARI *****

/**
 * Mevcut categories satırını bulur; yeni kategori oluşturmaz.
 * Öncelik: category_id (dil kitapla uyumlu olmalı) → slug → slugify(isim) → isim.
 */
async function resolveExistingCategoryId(
  client: ReturnType<typeof db>,
  opts: { category_id?: string | null; category: string; language_code: string }
): Promise<{ id: string } | { error: Error }> {
  const lang = normalizeLanguageCode(opts.language_code, 'tr');
  const idIn = opts.category_id?.trim();
  if (idIn) {
    const { data, error } = await client
      .from('categories')
      .select('id, language_code')
      .eq('id', idIn)
      .maybeSingle();
    if (error) return { error: error as Error };
    if (!data?.id) return { error: new Error('Kategori bulunamadı') };
    const row = data as { id: string; language_code?: string };
    if (row.language_code && row.language_code !== lang) {
      return {
        error: new Error(
          `Kategori dil kodu (${row.language_code}) ile kitap dili (${lang}) uyuşmuyor. Aynı dilde bir kategori seçin.`
        ),
      };
    }
    return { id: row.id };
  }

  const raw = (opts.category ?? '').trim();
  if (!raw) return { error: new Error('Kategori zorunludur') };

  const slugLower = raw.toLowerCase();
  let { data: row } = await client
    .from('categories')
    .select('id')
    .eq('slug', slugLower)
    .eq('language_code', lang)
    .maybeSingle();
  if (row?.id) return { id: row.id as string };

  const slugified = slugifyAuthorName(raw);
  ({ data: row } = await client
    .from('categories')
    .select('id')
    .eq('slug', slugified)
    .eq('language_code', lang)
    .maybeSingle());
  if (row?.id) return { id: row.id as string };

  ({ data: row } = await client
    .from('categories')
    .select('id')
    .eq('name', raw)
    .eq('language_code', lang)
    .maybeSingle());
  if (row?.id) return { id: row.id as string };

  return {
    error: new Error(
      `Kategori bulunamadı: "${raw}". Lütfen listeden seçin veya geçerli bir kategori slug/isim kullanın.`
    ),
  };
}

export interface CreateBookPayload {
  title: string;
  /** Tek yazar (authors yoksa kullanılır) */
  author?: string;
  author_id?: string | null;
  /** Birden fazla yazar; doluysa author / author_id yok sayılır */
  authors?: BookAuthorInput[];
  /** Liste dışı / toplu yükleme için slug veya tam ad */
  category?: string;
  /** Arayüzden seçim: doğrudan bu id ile bağlanır, yeni kategori oluşturulmaz */
  category_id?: string | null;
  description?: string;
  language_code: string;
  pages?: number;
}

/** Yeni kitap kaydı oluşturur (dosya/kapak yok). */
export async function createBook(payload: CreateBookPayload) {
  const authorsNorm = normalizeBookAuthorsPayload(payload);
  if ('error' in authorsNorm) return { book: null, error: authorsNorm.error };

  const row = {
    title: payload.title,
    description: payload.description ?? '',
    language_code: payload.language_code,
    pages: payload.pages ?? 0,
    download_count: 0,
  };

  const { data, error } = await db()
    .from('books')
    .insert(row)
    .select()
    .single();

  if (error) return { book: null, error };
  const bookId = data.id as string;

  const catRes = await resolveExistingCategoryId(db(), {
    category_id: payload.category_id,
    category: payload.category ?? '',
    language_code: payload.language_code,
  });
  if ('error' in catRes) {
    await db().from('books').delete().eq('id', bookId);
    return { book: null, error: catRes.error };
  }
  const categoryIdToLink = catRes.id;

  const authorRows: { book_id: string; author_id: string; author_order: number; role: string }[] = [];
  for (let i = 0; i < authorsNorm.length; i++) {
    const a = authorsNorm[i];
    const authorRes = await resolveOrCreateAuthorId(db(), {
      author_id: a.author_id,
      authorName: a.name,
      language_code: payload.language_code,
    });
    if ('error' in authorRes) {
      await db().from('books').delete().eq('id', bookId);
      return { book: null, error: authorRes.error };
    }
    authorRows.push({
      book_id: bookId,
      author_id: authorRes.id,
      author_order: i + 1,
      role: 'author',
    });
  }

  const { error: relAuthorError } = await db().from('book_authors').insert(authorRows);
  if (relAuthorError) {
    await db().from('books').delete().eq('id', bookId);
    return { book: null, error: relAuthorError };
  }

  const { error: relCategoryError } = await db()
    .from('book_categories')
    .insert({
      book_id: bookId,
      category_id: categoryIdToLink,
      is_primary: true,
    });
  if (relCategoryError) {
    await db().from('book_authors').delete().eq('book_id', bookId);
    await db().from('books').delete().eq('id', bookId);
    return { book: null, error: relCategoryError };
  }

  const { book: fullBook, error: fetchErr } = await getBookById(bookId);
  if (fetchErr || !fullBook) return { book: data, error: null };
  return { book: fullBook, error: null };
}

export interface UpdateBookPayload {
  title: string;
  author?: string;
  author_id?: string | null;
  authors?: BookAuthorInput[];
  category?: string;
  category_id?: string | null;
  description?: string;
  language_code: string;
  pages?: number;
}

/** Mevcut kitabın metadatasını ve yazar/kategori ilişkilerini günceller. */
export async function updateBook(bookId: string, payload: UpdateBookPayload) {
  const client = db();
  const title = payload.title.trim();
  if (!title) {
    return { book: null, error: new Error('Başlık zorunludur') };
  }
  const authorsNorm = normalizeBookAuthorsPayload(payload);
  if ('error' in authorsNorm) return { book: null, error: authorsNorm.error };
  const hasCategory = Boolean(payload.category_id?.trim() || payload.category?.trim());
  if (!hasCategory) {
    return { book: null, error: new Error('Kategori zorunludur') };
  }

  const description = (payload.description ?? '').trim();

  const { error: updateErr } = await client
    .from('books')
    .update({
      title,
      description,
      language_code: payload.language_code,
      pages: payload.pages ?? 0,
    })
    .eq('id', bookId);

  if (updateErr) return { book: null, error: updateErr };

  const { error: delAuthRel } = await client.from('book_authors').delete().eq('book_id', bookId);
  if (delAuthRel) return { book: null, error: delAuthRel };

  const authorRows: { book_id: string; author_id: string; author_order: number; role: string }[] = [];
  for (let i = 0; i < authorsNorm.length; i++) {
    const a = authorsNorm[i];
    const authorRes = await resolveOrCreateAuthorId(client, {
      author_id: a.author_id,
      authorName: a.name,
      language_code: payload.language_code,
    });
    if ('error' in authorRes) return { book: null, error: authorRes.error };
    authorRows.push({
      book_id: bookId,
      author_id: authorRes.id,
      author_order: i + 1,
      role: 'author',
    });
  }

  const { error: relAuthorError } = await client.from('book_authors').insert(authorRows);
  if (relAuthorError) return { book: null, error: relAuthorError };

  const catRes = await resolveExistingCategoryId(client, {
    category_id: payload.category_id,
    category: payload.category ?? '',
    language_code: payload.language_code,
  });
  if ('error' in catRes) return { book: null, error: catRes.error };

  const { error: delCatRel } = await client.from('book_categories').delete().eq('book_id', bookId);
  if (delCatRel) return { book: null, error: delCatRel };

  const { error: relCategoryError } = await client.from('book_categories').insert({
    book_id: bookId,
    category_id: catRes.id,
    is_primary: true,
  });
  if (relCategoryError) return { book: null, error: relCategoryError };

  const { data: book, error: fetchErr } = await client.from('books').select('*').eq('id', bookId).single();
  if (fetchErr) return { book: null, error: fetchErr };
  return { book, error: null };
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

  const { book: bookData, error: bookError } = await createBook({
    title: 'Ağır İtki',
    author: 'Said Ellamian',
    category: 'fiqh',
    description: 'İslam hukukuna dair önemli bir eser',
    language_code: 'tr',
    pages: 250,
  })

  if (bookError || !bookData) {
    console.error('❌ Book insert error:', bookError)
    return { error: bookError ?? new Error('Kitap oluşturulamadı') }
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

async function collectBookStorageKeys(bookId: string): Promise<string[]> {
  const client = db();
  const keys = new Set<string>();

  const { data: bookRow, error: bookRowErr } = await client
    .from('books')
    .select('cover_image_url')
    .eq('id', bookId)
    .maybeSingle();
  if (bookRowErr) {
    console.error('Error fetching book cover for storage delete:', bookRowErr);
  } else {
    const coverUrl = (bookRow as { cover_image_url?: string | null } | null)?.cover_image_url;
    if (typeof coverUrl === 'string' && coverUrl.trim()) {
      const key = tryExtractStorageKey(coverUrl);
      if (key && (key.startsWith('covers/') || key.startsWith('books/'))) keys.add(key);
    }
  }

  const { data: fileRows, error: fileRowsErr } = await client
    .from('book_files')
    .select('file_url')
    .eq('book_id', bookId);
  if (fileRowsErr) {
    console.error('Error fetching book files for storage delete:', fileRowsErr);
  } else {
    for (const row of fileRows ?? []) {
      const fileUrl = (row as { file_url?: string | null }).file_url;
      if (typeof fileUrl !== 'string' || !fileUrl.trim()) continue;
      const key = tryExtractStorageKey(fileUrl);
      if (key && (key.startsWith('covers/') || key.startsWith('books/'))) keys.add(key);
    }
  }

  return [...keys];
}

/** Storage'dan kitap dosyalarını ve kapağını siler (book_files + books tablosu silinmeden önce çağrılabilir). */
async function deleteBookStorageFiles(bookId: string, knownKeys: string[] = []) {
  if (isR2Configured()) {
    try {
      if (knownKeys.length > 0) {
        await r2DeleteKeys(knownKeys);
      }
      await r2DeleteBookObjects(bookId);
    } catch (e) {
      console.error('Error deleting book files from R2:', e);
    }
    return;
  }

  const storage = db().storage.from('book-assets');
  const pathsToRemove = [...knownKeys];

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
  const storageKeys = await collectBookStorageKeys(bookId);

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

  await deleteBookStorageFiles(bookId, storageKeys);

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
