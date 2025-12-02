import { supabase, type SupabaseBook, type BookFile, type Category } from './supabase'

// ***** BOOK OPERATIONS *****

// Tüm kitapları getir (sayfalama ile)
export async function getBooks(page = 0, limit = 20) {
  console.log('🚀 Fetching books from Supabase...')
  
  const { data, error, count } = await supabase
    .from('books')
    .select(`
      *,
      book_files (
        id,
        format,
        file_url,
        file_size_text
      )
    `, { count: 'exact' })
    .range(page * limit, (page + 1) * limit - 1)
    .order('created_at', { ascending: false })

  console.log('📊 Raw Supabase response:', { data, error, count })

  if (error) {
    console.error('❌ Error fetching books:', error)
    return { books: [], error, total: 0 }
  }

  return { 
    books: data || [], 
    error: null, 
    total: count || 0,
    hasMore: (count || 0) > (page + 1) * limit
  }
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

// Kategoriye göre kitaplar
export async function getBooksByCategory(categoryName: string) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      book_files (*)
    `)
    .eq('category', categoryName)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching books by category:', error)
    return { books: [], error }
  }

  return { books: data || [], error: null }
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

// Dosya upload (kapak resmi için)
export async function uploadBookCover(file: File, bookId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${bookId}-cover.${fileExt}`
  const filePath = `covers/${fileName}`

  const { data, error } = await supabase.storage
    .from('book-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Error uploading cover:', error)
    return { url: null, error }
  }

  // Public URL al
  const { data: { publicUrl } } = supabase.storage
    .from('book-assets')
    .getPublicUrl(data.path)

  return { url: publicUrl, error: null }
}

// Kitap dosyası upload
export async function uploadBookFile(file: File, bookId: string, format: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${bookId}.${fileExt}`
  const filePath = `books/${bookId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('book-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Error uploading book file:', error)
    return { url: null, error }
  }

  // Public URL al
  const { data: { publicUrl } } = supabase.storage
    .from('book-assets')
    .getPublicUrl(data.path)

  // Database'e file record ekle
  const fileSizeMB = file.size / (1024 * 1024)
  const { error: dbError } = await supabase
    .from('book_files')
    .insert({
      book_id: bookId,
      format,
      file_url: publicUrl,
      file_size_mb: fileSizeMB,
      file_size_text: formatFileSize(file.size)
    })

  if (dbError) {
    console.error('Error saving file record:', dbError)
  }

  return { url: publicUrl, error: null }
}

// ***** KİTAP EKLEME FONKSİYONLARI *****

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
