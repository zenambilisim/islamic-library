# 📚 Toplu Kitap Yükleme Rehberi (Bulk Book Upload Guide)

## 📖 İçindekiler
- [Genel Bakış](#genel-bakış)
- [Ön Hazırlık](#ön-hazırlık)
- [Klasör Yapısı](#klasör-yapısı)
- [Kategori Mapping](#kategori-mapping)
- [Script Kurulumu](#script-kurulumu)
- [Script Mantığı](#script-mantığı)
- [Adım Adım Kullanım](#adım-adım-kullanım)
- [Hata Yönetimi](#hata-yönetimi)
- [İleri Seviye Özellikler](#ileri-seviye-özellikler)

---

## 🎯 Genel Bakış

Bu rehber, yüzlerce kitabı **local klasörlerden** **Supabase** veritabanına ve Storage'a otomatik olarak yüklemek için hazırlanmıştır.

### Ne Yapılacak?
1. **Klasörlerdeki kitapları tara** (PDF, EPUB, DOCX, PNG)
2. **Metadata'yı parse et** (Kitap adı, yazar, açıklama)
3. **Dosyaları Supabase Storage'a yükle**
4. **Veritabanına kayıt ekle** (books ve book_files tablolarına)

### Neden Bu Yöntem?
- ✅ **Otomatik:** Yüzlerce kitabı manuel girmek yerine tek komutla yükle
- ✅ **Hatasız:** Dosya yolları, ID eşlemeleri otomatik
- ✅ **Çok Dilli:** 4 dil için ayrı klasörler (en, tr, ru, az)
- ✅ **Güvenli:** Hata durumunda log tutar, rollback yapar

---

## 🛠️ Ön Hazırlık

### 1. Gerekli Bilgiler

#### Supabase Credentials
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **ÖNEMLİ:** Service Role Key kullan, Anon Key değil!
> - Service Role Key: RLS kurallarını bypass eder (toplu yükleme için gerekli)
> - Anon Key: Public erişim için, script çalışmaz
> - **ASLA** Service Role Key'i production koduna ekleme!

**Service Role Key'i Nerede Bulursun?**
1. Supabase Dashboard → Settings → API
2. "Service Role" başlığı altında "secret" key'i kopyala

---

### 2. Veritabanı Şeması

Script'in çalışabilmesi için şu tabloların olması gerekli:

#### `categories` Tablosu
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name_translations JSONB NOT NULL,
  description_translations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Örnek kategori kaydı:
INSERT INTO categories (slug, name_translations) VALUES
('beliefs', '{
  "en": "Beliefs and Theology",
  "tr": "İnanç ve Teoloji",
  "ru": "Убеждения и теология",
  "az": "İnanc və İlahiyyat"
}');
```

#### `books` Tablosu
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_translations JSONB,
  author TEXT NOT NULL,
  author_translations JSONB,
  category UUID REFERENCES categories(id),
  category_translations JSONB,
  description TEXT,
  description_translations JSONB,
  publish_year INTEGER,
  pages INTEGER,
  language TEXT NOT NULL,
  cover_image_url TEXT,
  file_size TEXT,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `book_files` Tablosu
```sql
CREATE TABLE book_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  format TEXT NOT NULL, -- 'pdf', 'epub', 'docx'
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Storage Buckets
```sql
-- Supabase Dashboard → Storage → Create Bucket
-- Bucket name: book-assets
-- Public: true
-- File size limit: 100MB (veya daha yüksek)

-- Klasör yapısı:
-- book-assets/
--   covers/        (Kapak resimleri)
--   books/         (PDF, EPUB, DOCX dosyaları)
```

---

## 📁 Klasör Yapısı

### Beklenen Yapı

```
Books_en/                                    ← Ana dil klasörü
  ├── Beliefs and Theology/                 ← Kategori klasörü
  │   ├── 82 Questions - Sayyid Abdul Husayn Dastghaib/    ← Kitap klasörü
  │   │   ├── 82 Questions - Sayyid Abdul Husayn Dastghaib.rtf   ← Açıklama
  │   │   ├── 82 Questions - Sayyid Abdul Husayn Dastghaib.pdf   ← PDF
  │   │   ├── 82 Questions - Sayyid Abdul Husayn Dastghaib.epub  ← EPUB
  │   │   ├── 82 Questions - Sayyid Abdul Husayn Dastghaib.docx  ← DOCX
  │   │   └── 82 Questions - Sayyid Abdul Husayn Dastghaib.png   ← Kapak
  │   └── Another Book - Author Name/
  │       └── ...
  ├── Biography/
  │   └── ...
  └── Ethics/
      └── ...
```

### Dosya İsimlendirme Kuralı

Her kitap klasöründeki dosyalar **aynı isimde** olmalı (uzantı hariç):

```
[KITAP ADI] - [YAZAR ADI].[uzantı]
```

**Örnekler:**
```
✅ 82 Questions - Sayyid Abdul Husayn Dastghaib.pdf
✅ Islamic Ethics - Muhammad Taqi Misbah Yazdi.epub
✅ History of Islam - Multiple Authors.docx

❌ 82-questions.pdf                    (Tire ile yazar ayrılmamış)
❌ Book1.pdf                           (Kitap adı ve yazar yok)
❌ 82 Questions.pdf                    (Yazar eksik)
```

### Özel Durumlar

#### 1. Birden Fazla Tire Var
```
180 Questions - Volume 1 - Sayyid Husain.pdf
```
**Çözüm:** Script **son tire**'yi baz alır:
- Kitap Adı: `180 Questions - Volume 1`
- Yazar: `Sayyid Husain`

#### 2. Yazar Bilgisi Bilinmiyor
```
Islamic History - Unknown.pdf
```
veya klasör içinde `author.txt` dosyası ekle:
```
Muhammad Ali
```

#### 3. Bazı Formatlar Eksik
Her kitap için **en az PDF ve PNG** olmalı. EPUB ve DOCX opsiyonel.

---

## 🗺️ Kategori Mapping

Klasör isimleri ile Supabase'deki kategori slug'ları eşleştirilmelidir.

### Manuel Mapping Tablosu

| Klasör Adı (İngilizce)               | Slug              | TR                      | RU                        | AZ                     |
|--------------------------------------|-------------------|-------------------------|---------------------------|------------------------|
| `Beliefs and Theology`               | `beliefs`         | İnanç ve Teoloji        | Убеждения и теология      | İnanc və İlahiyyat     |
| `Biography`                          | `biography`       | Biyografi               | Биография                 | Bioqrafiya             |
| `Children's Books`                   | `childrens-books` | Çocuk Kitapları         | Детские книги             | Uşaq Kitabları         |
| `Ethics`                             | `ethics`          | Ahlak                   | Этика                     | Əxlaq                  |
| `Family and Social Relations`        | `family`          | Aile ve Sosyal İlişkiler| Семья и социальные отношения | Ailə və Sosial Əlaqələr|
| `Fiction`                            | `fiction`         | Kurgu                   | Художественная литература | Bədii Ədəbiyyat        |
| `Hadith`                             | `hadith`          | Hadis                   | Хадис                     | Hədis                  |
| `History`                            | `history`         | Tarih                   | История                   | Tarix                  |
| `Imam Mahdi (a)`                     | `imam-mahdi`      | İmam Mehdi (a.s)        | Имам Махди (а)            | İmam Mehdi (ə)         |
| `Jurisprudence and Law`              | `jurisprudence`   | Fıkıh ve Hukuk          | Юриспруденция и право     | Fiqh və Hüquq          |
| `Mysticism and Irfan`                | `mysticism`       | Tasavvuf ve İrfan       | Мистицизм и Ирфан         | Təsəvvüf və İrfan      |
| `Philosophy, Sociology, and Politics`| `philosophy`      | Felsefe, Sosyoloji, Siyaset | Философия, социология, политика | Fəlsəfə, Sosiologiya, Siyasət |
| `Poetry, Ghazals and Elegies`        | `poetry`          | Şiir ve Mersiye         | Поэзия, газели и элегии   | Şeir və Mərsiyə        |
| `Quran and Exegesis`                 | `quran`           | Kuran ve Tefsir         | Коран и толкование        | Quran və Təfsir        |
| `Self-Improvement`                   | `self-improvement`| Kişisel Gelişim         | Самосовершенствование     | Özünütəkmilləşdirmə    |
| `Supplications and Ziyarahs`         | `supplications`   | Dualar ve Ziyaretler    | Мольбы и зиярат           | Dualar və Ziyarətlər   |
| `Takfirism`                          | `takfirism`       | Tekfircilik             | Такфиризм                 | Təkfirçilik            |
| `The Infallibles (a)`                | `infallibles`     | Masum İmamlar (a.s)     | Непогрешимые (а)          | Məsum İmamlar (ə)      |

### Script'te Kullanım

```javascript
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
```

---

## 🚀 Script Kurulumu

### 1. Proje Klasörü Oluştur

```bash
cd /path/to/Books_en  # Kitapların olduğu klasörün üst dizini
mkdir book-uploader
cd book-uploader
```

### 2. NPM Projesini Başlat

```bash
npm init -y
```

### 3. Gerekli Paketleri Yükle

```bash
npm install @supabase/supabase-js dotenv
npm install --save-dev @types/node
```

**Paket Açıklamaları:**
- `@supabase/supabase-js`: Supabase client library
- `dotenv`: .env dosyasından environment variables okumak için
- `@types/node`: TypeScript type definitions (opsiyonel)

### 4. `.env` Dosyası Oluştur

```bash
touch .env
```

`.env` içeriği:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BOOKS_FOLDER_PATH=../Books_en
LANGUAGE=en
DRY_RUN=true
```

**Parametre Açıklamaları:**
- `SUPABASE_URL`: Supabase proje URL'i
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (dashboard'dan al)
- `BOOKS_FOLDER_PATH`: Kitapların olduğu klasörün yolu
- `LANGUAGE`: Hangi dil klasörü işlenecek (en, tr, ru, az)
- `DRY_RUN`: Test modu (true = hiçbir şey yüklenmez, sadece log)

### 5. `.gitignore` Oluştur

```bash
echo "node_modules/
.env
logs/
*.log" > .gitignore
```

---

## 🧠 Script Mantığı

### Ana Akış Diyagramı

```
START
  ↓
[1. .env dosyasını oku]
  ↓
[2. Supabase'e bağlan]
  ↓
[3. Kategorileri veritabanından çek]
  ↓
[4. Books_en klasöründeki kategori klasörlerini tara]
  ↓
FOR her kategori klasörü:
  ├─ Kategori slug'ını mapping'den bul
  ├─ Supabase'den kategori ID'sini al
  │
  └─ FOR her kitap klasörü:
      ├─ [Dosya Parse] Klasör isminden kitap adı ve yazar adını ayır
      ├─ [RTF Okuma] .rtf dosyasını oku → description
      ├─ [Dosya Bulma] .pdf, .epub, .docx, .png dosyalarını bul
      │
      ├─ IF DRY_RUN = false:
      │   ├─ [Storage Upload] Dosyaları Supabase Storage'a yükle
      │   ├─ [Database Insert] books tablosuna kayıt ekle
      │   └─ [File Links] book_files tablosuna format kayıtları ekle
      │
      └─ [Log] Başarılı/Başarısız durumu logla
END
```

### Detaylı Adımlar

#### Adım 1: Klasör İsimlendirme Parse
```javascript
// Input: "82 Questions - Sayyid Abdul Husayn Dastghaib"
function parseBookFolderName(folderName) {
  const lastDashIndex = folderName.lastIndexOf(' - ');
  
  if (lastDashIndex === -1) {
    // Tire yoksa, klasör isminin tamamı kitap adı
    return {
      bookTitle: folderName,
      authorName: 'Unknown'
    };
  }
  
  const bookTitle = folderName.substring(0, lastDashIndex).trim();
  const authorName = folderName.substring(lastDashIndex + 3).trim();
  
  return { bookTitle, authorName };
}

// Output: 
// bookTitle: "82 Questions"
// authorName: "Sayyid Abdul Husayn Dastghaib"
```

#### Adım 2: RTF Dosyasını Okuma
```javascript
const fs = require('fs');

function readRTFDescription(filePath) {
  try {
    // RTF dosyasını text olarak oku
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // RTF formatını temizle (basit yöntem)
    let cleanText = content
      .replace(/\\[a-z]+\d*\s?/g, '')  // RTF komutlarını kaldır
      .replace(/[{}]/g, '')             // Süslü parantezleri kaldır
      .replace(/\\/g, '')               // Backslash'leri kaldır
      .trim();
    
    // İlk 500 karakteri al (çok uzunsa)
    return cleanText.substring(0, 500);
  } catch (error) {
    console.warn(`⚠️ RTF okunamadı: ${filePath}`);
    return '';
  }
}
```

#### Adım 3: Dosyaları Supabase Storage'a Yükleme
```javascript
async function uploadFileToStorage(filePath, storagePath, bucketName = 'book-assets') {
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: getMimeType(filePath),
      upsert: false  // Üzerine yazma, varsa hata ver
    });
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  return data.path;  // Yüklenen dosyanın storage path'i
}

function getMimeType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'epub': 'application/epub+zip',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'png': 'image/png',
    'jpg': 'image/jpeg'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
```

#### Adım 4: Veritabanına Kayıt
```javascript
async function insertBookToDatabase(bookData) {
  // 1. books tablosuna insert
  const { data: newBook, error: bookError } = await supabase
    .from('books')
    .insert({
      title: bookData.title,
      title_translations: { [bookData.language]: bookData.title },
      author: bookData.author,
      author_translations: { [bookData.language]: bookData.author },
      category: bookData.categoryId,
      description: bookData.description,
      description_translations: { [bookData.language]: bookData.description },
      language: bookData.language,
      cover_image_url: bookData.coverPath,
      publish_year: 2024,
      pages: 0,
      download_count: 0
    })
    .select()
    .single();
  
  if (bookError) throw bookError;
  
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
    
    if (filesError) throw filesError;
  }
  
  return newBook;
}
```

---

## 📝 Adım Adım Kullanım

### 1. Hazırlık Kontrolü

```bash
# Klasör yapısını kontrol et
ls -la Books_en/

# Örnek bir kategoriyi kontrol et
ls -la "Books_en/Beliefs and Theology/"

# Örnek bir kitabı kontrol et
ls -la "Books_en/Beliefs and Theology/82 Questions - Sayyid Abdul Husayn Dastghaib/"
```

**Beklenen Çıktı:**
```
82 Questions - Sayyid Abdul Husayn Dastghaib.rtf
82 Questions - Sayyid Abdul Husayn Dastghaib.pdf
82 Questions - Sayyid Abdul Husayn Dastghaib.epub
82 Questions - Sayyid Abdul Husayn Dastghaib.docx
82 Questions - Sayyid Abdul Husayn Dastghaib.png
```

### 2. Script Dosyasını Oluştur

`upload-books.js` dosyası oluştur (detaylı kod bir sonraki bölümde)

### 3. Dry-Run Modu ile Test Et

```bash
# .env dosyasında DRY_RUN=true olduğundan emin ol
node upload-books.js
```

**Beklenen Çıktı:**
```
🚀 Book Uploader Started
📁 Books Folder: /path/to/Books_en
🌐 Language: en
🧪 Dry Run Mode: ON (No uploads will happen)

✅ Connected to Supabase
✅ Fetched 18 categories from database

📂 Processing Category: Beliefs and Theology
  ├─ Slug: beliefs
  ├─ Category ID: abc-123-def
  │
  ├─ 📖 Book: 82 Questions
  │   ├─ Author: Sayyid Abdul Husayn Dastghaib
  │   ├─ Description: (500 chars)
  │   ├─ Files: PDF ✅, EPUB ✅, DOCX ✅, PNG ✅
  │   └─ [DRY RUN] Would upload to Storage
  │
  └─ ✅ Category processed: 15 books

📊 Summary:
  ✅ Total books found: 245
  ✅ Ready to upload: 245
  ⚠️ Missing files: 0
  ❌ Errors: 0

💡 Set DRY_RUN=false to start real upload
```

### 4. Gerçek Yüklemeyi Başlat

```bash
# .env dosyasını düzenle
nano .env
# DRY_RUN=false olarak değiştir

# Script'i çalıştır
node upload-books.js
```

**Progress Çıktısı:**
```
🚀 Book Uploader Started
⚠️  DRY_RUN=false - Real uploads will happen!

[1/245] Uploading: 82 Questions - Sayyid Abdul Husayn Dastghaib
  ├─ Cover uploaded: covers/82-questions-sayyid-abdul.png
  ├─ PDF uploaded: books/82-questions-sayyid-abdul/book.pdf
  ├─ EPUB uploaded: books/82-questions-sayyid-abdul/book.epub
  ├─ DOCX uploaded: books/82-questions-sayyid-abdul/book.docx
  ├─ Database record created: abc-123-xyz
  └─ ✅ Success (took 3.5s)

[2/245] Uploading: 180 Questions Volume 1...
  ...

⏱️  Estimated time remaining: 12 minutes
```

### 5. Log Dosyalarını Kontrol Et

```bash
# Başarılı yüklemeler
cat logs/success.log

# Hatalı yüklemeler
cat logs/errors.log

# Detaylı log
cat logs/upload-2024-12-19.log
```

---

## 🛡️ Hata Yönetimi

### Otomatik Hata Yakalama

Script şu hataları yakalar ve loglar:

1. **Dosya Bulunamadı**
   - Eksik PDF, PNG dosyaları
   - RTF dosyası okunamıyor

2. **Storage Upload Hataları**
   - Dosya boyutu limiti aşımı
   - Network timeout
   - Duplicate file names

3. **Database Hataları**
   - Foreign key constraint
   - Unique constraint violation
   - Connection timeout

### Hata Log Formatı

```json
{
  "timestamp": "2024-12-19T10:30:45.123Z",
  "bookFolder": "82 Questions - Sayyid Abdul Husayn Dastghaib",
  "category": "Beliefs and Theology",
  "error": "Storage upload failed: File size exceeds 100MB",
  "errorCode": "STORAGE_SIZE_LIMIT",
  "retryable": false
}
```

### Manuel Hata Düzeltme

#### Senaryo 1: Bazı Kitaplar Yüklenmedi

```bash
# Hatalı kitapları listele
cat logs/errors.log | grep "bookFolder"

# Sadece hatalı kitapları tekrar yükle
node upload-books.js --retry-failed
```

#### Senaryo 2: Duplicate Hatası

```bash
# Veritabanından kitabı sil
psql -d your_db -c "DELETE FROM books WHERE title='82 Questions'"

# Tekrar yükle
node upload-books.js --book "82 Questions - Sayyid Abdul Husayn Dastghaib"
```

#### Senaryo 3: Storage'da Dosya Var Ama Database'de Yok

```bash
# Storage'dan dosyayı sil (Supabase Dashboard veya SQL)
-- Storage → book-assets → covers → dosyayı sil

# Tekrar yükle
node upload-books.js --book "Book Name"
```

### Rollback İşlemi

Script başarısız olursa:

```bash
# Son yüklenen kitapları sil (timestamp'e göre)
node cleanup-uploads.js --since "2024-12-19T10:00:00Z"

# Tüm yüklemeyi geri al
node cleanup-uploads.js --all --confirm
```

---

## 🎨 İleri Seviye Özellikler

### 1. Batch Upload (Paralel Yükleme)

```javascript
// 5 kitabı aynı anda yükle (daha hızlı)
const BATCH_SIZE = 5;

async function uploadBooksInBatches(books) {
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(book => uploadBook(book)));
  }
}
```

### 2. Resume (Kaldığı Yerden Devam)

```javascript
// En son yüklenen kitabı tespit et
const lastUploadedBook = await getLastUploadedBook();

// Sonraki kitaplardan devam et
const booksToUpload = allBooks.slice(lastUploadedBook.index + 1);
```

### 3. Metadata Enrichment

```javascript
// PDF'den sayfa sayısını otomatik çıkar
const pdfParser = require('pdf-parse');

async function extractPageCount(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParser(dataBuffer);
  return data.numpages;
}
```

### 4. Cover Image Optimization

```javascript
// Kapak resmini optimize et (boyutunu küçült)
const sharp = require('sharp');

async function optimizeCover(imagePath) {
  await sharp(imagePath)
    .resize(400, 600, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(imagePath.replace('.png', '-optimized.jpg'));
}
```

### 5. Multi-Language Support

```javascript
// 4 dil için aynı script'i çalıştır
const languages = ['en', 'tr', 'ru', 'az'];

for (const lang of languages) {
  console.log(`📚 Processing ${lang.toUpperCase()} books...`);
  process.env.LANGUAGE = lang;
  process.env.BOOKS_FOLDER_PATH = `./Books_${lang}`;
  await uploadBooks();
}
```

### 6. Web UI Dashboard

```javascript
// Express.js ile basit web arayüz
const express = require('express');
const app = express();

app.get('/upload-status', (req, res) => {
  res.json({
    totalBooks: 245,
    uploaded: 120,
    failed: 3,
    remaining: 122,
    estimatedTime: '8 minutes'
  });
});

app.listen(3000);
// http://localhost:3000/upload-status
```

---

## 🔒 Güvenlik Notları

### 1. Service Role Key Güvenliği

```bash
# ❌ ASLA yapma:
git add .env
git commit -m "Add env file"

# ✅ Yapılacak:
echo ".env" >> .gitignore
git add .gitignore
```

### 2. Storage Public Access

```sql
-- Supabase Storage → book-assets → Policies
-- PDF/EPUB dosyaları için public read izni ver

CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'book-assets');
```

### 3. RLS (Row Level Security)

```sql
-- books tablosuna RLS ekle
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Public read, admin write
CREATE POLICY "Public read books" ON books
FOR SELECT USING (true);

CREATE POLICY "Admin insert books" ON books
FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## 📊 Performans İpuçları

### 1. Upload Süresi Hesaplaması

- Ortalama kitap boyutu: ~5 MB (PDF + EPUB + DOCX + PNG)
- Ortalama upload süresi: ~2 saniye/kitap
- 245 kitap için: ~8-10 dakika

### 2. Network Optimizasyonu

```javascript
// Timeout değerlerini artır
const supabase = createClient(url, key, {
  global: {
    headers: { 'x-request-timeout': '60000' }  // 60 saniye
  }
});
```

### 3. Storage Bucket Ayarları

- File size limit: En az 50MB
- Allowed MIME types: `application/pdf, application/epub+zip, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/png, image/jpeg`

---

## ✅ Son Kontrol Listesi

Upload'a başlamadan önce:

- [ ] Supabase Service Role Key doğru mu?
- [ ] Kategoriler veritabanında mevcut mu?
- [ ] Storage bucket oluşturulmuş mu?
- [ ] Klasör yapısı doğru mu?
- [ ] Tüm kitaplarda gerekli dosyalar var mı (PDF, PNG)?
- [ ] `.env` dosyası doğru yapılandırılmış mı?
- [ ] Dry-run modu ile test edildi mi?
- [ ] Log klasörü oluşturulmuş mu?
- [ ] Disk alanı yeterli mi?
- [ ] Internet bağlantısı stabil mi?

---

## 🆘 Sorun Giderme

### Sık Karşılaşılan Hatalar

#### 1. "Connection timeout"
```bash
# Çözüm: Internet bağlantınızı kontrol edin
ping supabase.co

# Veya Supabase status sayfasını kontrol edin
# https://status.supabase.com
```

#### 2. "Invalid API key"
```bash
# Service Role Key'i doğru kopyaladığınızdan emin olun
echo $SUPABASE_SERVICE_ROLE_KEY

# Supabase Dashboard → Settings → API → Service Role
```

#### 3. "Foreign key constraint violation"
```bash
# Kategori ID'si yanlış veya kategori veritabanında yok
# Önce kategorileri kontrol edin:
SELECT * FROM categories;
```

#### 4. "File already exists"
```bash
# Storage'da dosya zaten var
# Üzerine yazmak için upsert: true kullanın
# Veya önce dosyayı silin
```

---

## 📚 Ek Kaynaklar

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Node.js File System](https://nodejs.org/api/fs.html)
- [RTF Parsing Libraries](https://www.npmjs.com/package/rtf-parser)

---

## 📝 Notlar

- Bu rehber **Books_en** klasörü için hazırlanmıştır
- Diğer diller için (tr, ru, az) aynı mantık geçerlidir
- Script tamamen özelleştirilebilir
- Production'da kullanmadan önce mutlaka test edin

---

**Son Güncelleme:** 19 Aralık 2024
**Versiyon:** 1.0.0
**Yazar:** Islamic Library Project Team
