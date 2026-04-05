#!/usr/bin/env node

/**
 * 📚 Toplu Kitap Yükleme Script'i
 * 
 * Bu script, local klasörlerdeki kitapları Supabase'e yükler.
 * Detaylı kullanım için: docs/BULK-BOOK-UPLOAD-GUIDE.md
 * 
 * Kullanım:
 *   node upload-books.js                    # Normal çalıştırma
 *   node upload-books.js --dry-run          # Test modu
 *   node upload-books.js --book "Book Name" # Tek kitap yükle
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  booksFolder: process.env.BOOKS_FOLDER_PATH || './Books_en',
  language: process.env.LANGUAGE || 'en',
  dryRun: process.env.DRY_RUN === 'true',
  batchSize: parseInt(process.env.BATCH_SIZE || '1'),
  logFolder: './logs'
};

// Kategori mapping (Klasör adı → Supabase slug)
const CATEGORY_MAPPING = {
  'Beliefs and Theology': 'beliefs',
  'Biography': 'biography',
  'Children\'s Books': 'childrens-books',
  'Ethics': 'ethics',
  'Family and Social Relations': 'family',
  'Fiction': 'fiction',
  'Hadith': 'hadith',
  'History': 'history',
  'Imam Mahdi (a)': 'imam-mahdi',
  'Jurisprudence and Law': 'jurisprudence',
  'Mysticism and Irfan': 'mysticism',
  'Philosophy, Sociology, and Politics': 'philosophy',
  'Poetry, Ghazals and Elegies': 'poetry',
  'Quran and Exegesis': 'quran',
  'Self-Improvement': 'self-improvement',
  'Supplications and Ziyarahs': 'supplications',
  'Takfirism': 'takfirism',
  'The Infallibles (a)': 'infallibles'
};

// ============================================================================
// GLOBALS
// ============================================================================

let supabase;
let stats = {
  totalBooks: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Log helper with colors
 */
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  debug: (msg) => console.log(`🔍 ${msg}`),
  progress: (current, total, msg) => {
    const percent = Math.round((current / total) * 100);
    console.log(`[${current}/${total}] ${percent}% - ${msg}`);
  }
};

/**
 * Log'u dosyaya yaz
 */
function writeLog(type, data) {
  if (!fs.existsSync(CONFIG.logFolder)) {
    fs.mkdirSync(CONFIG.logFolder, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logFile = path.join(CONFIG.logFolder, `${type}.log`);
  const logLine = `[${timestamp}] ${JSON.stringify(data)}\n`;

  fs.appendFileSync(logFile, logLine);
}

/**
 * Klasör isminden kitap adı ve yazar adını parse et
 */
function parseBookFolderName(folderName) {
  // Son tire işaretini bul
  const lastDashIndex = folderName.lastIndexOf(' - ');

  if (lastDashIndex === -1) {
    log.warn(`No author found in folder name: ${folderName}`);
    return {
      bookTitle: folderName.trim(),
      authorName: 'Unknown Author'
    };
  }

  const bookTitle = folderName.substring(0, lastDashIndex).trim();
  const authorName = folderName.substring(lastDashIndex + 3).trim();

  return { bookTitle, authorName };
}

/**
 * RTF dosyasını okuyup açıklamayı çıkar
 */
function readRTFDescription(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      log.warn(`RTF file not found: ${filePath}`);
      return '';
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // RTF formatını basitçe temizle
    let cleanText = content
      .replace(/\\[a-z]+\d*\s?/gi, ' ')  // RTF komutlarını kaldır
      .replace(/[{}]/g, '')              // Süslü parantezleri kaldır
      .replace(/\\\\/g, '')              // Backslash'leri kaldır
      .replace(/\s+/g, ' ')              // Çoklu boşlukları tek boşluğa indir
      .trim();

    // İlk 500 karakteri al
    if (cleanText.length > 500) {
      cleanText = cleanText.substring(0, 497) + '...';
    }

    return cleanText;
  } catch (error) {
    log.warn(`Failed to read RTF: ${error.message}`);
    return '';
  }
}

/**
 * Dosya MIME type'ını al
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.epub': 'application/epub+zip',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Slug oluştur (URL-safe string)
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Dosya boyutunu human-readable formata çevir
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// SUPABASE FUNCTIONS
// ============================================================================

/**
 * Supabase'e bağlan
 */
async function connectToSupabase() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env');
  }

  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  log.success('Connected to Supabase');
}

/**
 * Kategorileri veritabanından çek
 */
async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name_translations');

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  log.success(`Fetched ${data.length} categories from database`);
  return data;
}

/**
 * Dosyayı Supabase Storage'a yükle
 */
async function uploadToStorage(localPath, storagePath, bucketName = 'book-assets') {
  if (CONFIG.dryRun) {
    log.debug(`[DRY RUN] Would upload: ${localPath} → ${storagePath}`);
    return storagePath;
  }

  const fileBuffer = fs.readFileSync(localPath);
  const fileStats = fs.statSync(localPath);

  log.debug(`Uploading ${formatFileSize(fileStats.size)}: ${storagePath}`);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: getMimeType(localPath),
      upsert: false
    });

  if (error) {
    // Dosya zaten varsa, üzerine yaz
    if (error.message.includes('already exists')) {
      log.warn(`File already exists, updating: ${storagePath}`);
      
      const { data: updateData, error: updateError } = await supabase.storage
        .from(bucketName)
        .update(storagePath, fileBuffer, {
          contentType: getMimeType(localPath),
          upsert: true
        });

      if (updateError) throw updateError;
      return updateData.path;
    }
    
    throw error;
  }

  return data.path;
}

/**
 * Kitabı veritabanına kaydet
 */
async function insertBookToDatabase(bookData) {
  if (CONFIG.dryRun) {
    log.debug('[DRY RUN] Would insert book to database');
    return { id: 'dry-run-id-' + Date.now() };
  }

  // 1. books tablosuna insert
  const { data: newBook, error: bookError } = await supabase
    .from('books')
    .insert({
      title: bookData.title,
      title_translations: { [CONFIG.language]: bookData.title },
      author: bookData.author,
      author_translations: { [CONFIG.language]: bookData.author },
      category: bookData.categoryId,
      description: bookData.description || '',
      description_translations: bookData.description 
        ? { [CONFIG.language]: bookData.description } 
        : {},
      language: CONFIG.language,
      cover_image_url: bookData.coverPath,
      pages: 0,
      download_count: 0,
      tags: []
    })
    .select()
    .single();

  if (bookError) {
    throw new Error(`Database insert failed: ${bookError.message}`);
  }

  // 2. book_files tablosuna formatları insert
  const fileInserts = [];

  if (bookData.pdfPath) {
    fileInserts.push({
      book_id: newBook.id,
      format: 'pdf',
      file_url: bookData.pdfPath
    });
  }

  if (bookData.epubPath) {
    fileInserts.push({
      book_id: newBook.id,
      format: 'epub',
      file_url: bookData.epubPath
    });
  }

  if (bookData.docxPath) {
    fileInserts.push({
      book_id: newBook.id,
      format: 'docx',
      file_url: bookData.docxPath
    });
  }

  if (fileInserts.length > 0) {
    const { error: filesError } = await supabase
      .from('book_files')
      .insert(fileInserts);

    if (filesError) {
      log.error(`Failed to insert book_files: ${filesError.message}`);
      // Kitabı da sil (rollback)
      await supabase.from('books').delete().eq('id', newBook.id);
      throw filesError;
    }
  }

  log.success(`Book inserted: ${newBook.title} (ID: ${newBook.id})`);
  return newBook;
}

// ============================================================================
// MAIN UPLOAD LOGIC
// ============================================================================

/**
 * Tek bir kitabı işle ve yükle
 */
async function processBook(bookFolderPath, categoryId, categoryName) {
  const bookFolderName = path.basename(bookFolderPath);
  const startTime = Date.now();

  try {
    log.info(`Processing: ${bookFolderName}`);

    // 1. Klasör isminden kitap adı ve yazar adını parse et
    const { bookTitle, authorName } = parseBookFolderName(bookFolderName);
    log.debug(`  Title: ${bookTitle}`);
    log.debug(`  Author: ${authorName}`);

    // 2. Dosyaları bul
    const files = fs.readdirSync(bookFolderPath);
    
    const rtfFile = files.find(f => f.endsWith('.rtf'));
    const pdfFile = files.find(f => f.endsWith('.pdf'));
    const epubFile = files.find(f => f.endsWith('.epub'));
    const docxFile = files.find(f => f.endsWith('.docx') || f.endsWith('.doc'));
    const coverFile = files.find(f => f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'));

    // 3. Gerekli dosyaları kontrol et
    if (!pdfFile) {
      throw new Error('PDF file not found');
    }
    if (!coverFile) {
      throw new Error('Cover image not found');
    }

    log.debug(`  Files: PDF ✅, EPUB ${epubFile ? '✅' : '❌'}, DOCX ${docxFile ? '✅' : '❌'}, Cover ✅`);

    // 4. RTF'den açıklamayı oku
    let description = '';
    if (rtfFile) {
      const rtfPath = path.join(bookFolderPath, rtfFile);
      description = readRTFDescription(rtfPath);
      log.debug(`  Description: ${description.substring(0, 50)}...`);
    }

    // 5. Slug oluştur
    const bookSlug = slugify(bookTitle);

    // 6. Dosyaları yükle
    const coverPath = await uploadToStorage(
      path.join(bookFolderPath, coverFile),
      `covers/${bookSlug}.${path.extname(coverFile).substring(1)}`
    );

    const pdfPath = await uploadToStorage(
      path.join(bookFolderPath, pdfFile),
      `books/${bookSlug}/${bookSlug}.pdf`
    );

    let epubPath = null;
    if (epubFile) {
      epubPath = await uploadToStorage(
        path.join(bookFolderPath, epubFile),
        `books/${bookSlug}/${bookSlug}.epub`
      );
    }

    let docxPath = null;
    if (docxFile) {
      docxPath = await uploadToStorage(
        path.join(bookFolderPath, docxFile),
        `books/${bookSlug}/${bookSlug}.docx`
      );
    }

    // 7. Veritabanına kaydet
    const newBook = await insertBookToDatabase({
      title: bookTitle,
      author: authorName,
      description,
      categoryId,
      coverPath,
      pdfPath,
      epubPath,
      docxPath
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.success(`✅ Book uploaded successfully in ${duration}s`);

    stats.successful++;
    writeLog('success', {
      bookTitle,
      authorName,
      category: categoryName,
      bookId: newBook.id,
      duration
    });

    return newBook;

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.error(`Failed to process book: ${error.message}`);

    stats.failed++;
    stats.errors.push({
      bookFolder: bookFolderName,
      category: categoryName,
      error: error.message,
      timestamp: new Date().toISOString()
    });

    writeLog('errors', {
      bookFolder: bookFolderName,
      category: categoryName,
      error: error.message,
      duration
    });

    throw error;
  }
}

/**
 * Bir kategoriyi işle
 */
async function processCategory(categoryFolderPath, categories) {
  const categoryName = path.basename(categoryFolderPath);
  
  log.info(`\n📂 Processing Category: ${categoryName}`);

  // Kategori slug'ını bul
  const categorySlug = CATEGORY_MAPPING[categoryName];
  if (!categorySlug) {
    log.warn(`  ⚠️  No mapping found for category: ${categoryName}`);
    stats.skipped++;
    return;
  }

  log.debug(`  Slug: ${categorySlug}`);

  // Kategori ID'sini al
  const category = categories.find(cat => cat.slug === categorySlug);
  if (!category) {
    log.error(`  ❌ Category not found in database: ${categorySlug}`);
    stats.skipped++;
    return;
  }

  log.debug(`  Category ID: ${category.id}`);

  // Kitap klasörlerini tara
  const bookFolders = fs.readdirSync(categoryFolderPath)
    .filter(name => {
      const fullPath = path.join(categoryFolderPath, name);
      return fs.statSync(fullPath).isDirectory();
    });

  log.info(`  📚 Found ${bookFolders.length} books in this category`);

  // Her kitabı işle
  for (let i = 0; i < bookFolders.length; i++) {
    const bookFolder = bookFolders[i];
    const bookFolderPath = path.join(categoryFolderPath, bookFolder);

    stats.processed++;
    log.progress(stats.processed, stats.totalBooks, bookFolder);

    try {
      await processBook(bookFolderPath, category.id, categoryName);
    } catch (error) {
      // Hata zaten loglandı, devam et
      continue;
    }
  }

  log.success(`✅ Category processed: ${categoryName}`);
}

/**
 * Ana upload fonksiyonu
 */
async function uploadBooks() {
  const startTime = Date.now();

  log.info('🚀 Book Uploader Started');
  log.info(`📁 Books Folder: ${CONFIG.booksFolder}`);
  log.info(`🌐 Language: ${CONFIG.language}`);
  log.info(`🧪 Dry Run Mode: ${CONFIG.dryRun ? 'ON (No uploads will happen)' : 'OFF (Real uploads!)'}`);
  
  if (!CONFIG.dryRun) {
    log.warn('⚠️  DRY_RUN=false - Real uploads will happen!');
  }

  // 1. Supabase'e bağlan
  await connectToSupabase();

  // 2. Kategorileri çek
  const categories = await fetchCategories();

  // 3. Kitap klasörlerini tara
  if (!fs.existsSync(CONFIG.booksFolder)) {
    throw new Error(`Books folder not found: ${CONFIG.booksFolder}`);
  }

  const categoryFolders = fs.readdirSync(CONFIG.booksFolder)
    .filter(name => {
      const fullPath = path.join(CONFIG.booksFolder, name);
      return fs.statSync(fullPath).isDirectory();
    });

  log.info(`\n📂 Found ${categoryFolders.length} categories`);

  // Toplam kitap sayısını hesapla
  for (const categoryFolder of categoryFolders) {
    const categoryPath = path.join(CONFIG.booksFolder, categoryFolder);
    const bookFolders = fs.readdirSync(categoryPath)
      .filter(name => fs.statSync(path.join(categoryPath, name)).isDirectory());
    stats.totalBooks += bookFolders.length;
  }

  log.info(`📚 Total books to process: ${stats.totalBooks}`);

  // 4. Her kategoriyi işle
  for (const categoryFolder of categoryFolders) {
    const categoryPath = path.join(CONFIG.booksFolder, categoryFolder);
    await processCategory(categoryPath, categories);
  }

  // 5. Özet göster
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  log.info('\n' + '='.repeat(60));
  log.info('📊 UPLOAD SUMMARY');
  log.info('='.repeat(60));
  log.info(`✅ Successful: ${stats.successful}`);
  log.info(`❌ Failed: ${stats.failed}`);
  log.info(`⏭️  Skipped: ${stats.skipped}`);
  log.info(`📦 Total: ${stats.totalBooks}`);
  log.info(`⏱️  Duration: ${duration}s`);
  log.info('='.repeat(60));

  if (stats.errors.length > 0) {
    log.warn('\n⚠️  Some books failed to upload:');
    stats.errors.slice(0, 5).forEach(err => {
      log.error(`  • ${err.bookFolder}: ${err.error}`);
    });
    if (stats.errors.length > 5) {
      log.warn(`  ... and ${stats.errors.length - 5} more (see logs/errors.log)`);
    }
  }

  if (CONFIG.dryRun) {
    log.info('\n💡 This was a dry run. Set DRY_RUN=false in .env to start real uploads.');
  }

  log.success('\n✅ Upload process completed!');
}

// ============================================================================
// SCRIPT ENTRY POINT
// ============================================================================

// Process command line arguments
const args = process.argv.slice(2);
if (args.includes('--dry-run')) {
  CONFIG.dryRun = true;
}

// Run the upload
uploadBooks()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    log.error(`\n💥 Fatal Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
