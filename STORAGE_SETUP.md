# 📸 Supabase Storage Entegrasyonu

## ✅ Yapılan Değişiklikler

### 1. Storage URL Helper Fonksiyonları (`src/lib/supabase.ts`)

Üç yeni fonksiyon eklendi:

#### `getStoragePublicUrl(bucketName, filePath)`
- Supabase Storage'dan public URL oluşturur
- Genel amaçlı kullanım için

#### `getBookCoverUrl(coverPath)`
- Kitap kapak resminin URL'ini döndürür
- Otomatik olarak `covers/` prefix'i ekler (gerekiyorsa)
- Placeholder fallback desteği

#### `getBookFileUrl(bookFilePath)`
- Kitap dosyasının (PDF, EPUB, DOCX) URL'ini döndürür
- Otomatik olarak `books/` prefix'i ekler (gerekiyorsa)

### 2. Converter Güncellemesi (`src/lib/converters.ts`)

`convertSupabaseBookToBook` fonksiyonu güncellendi:
- ✅ Cover image URL'leri Storage'dan alınıyor
- ✅ Book files URL'leri Storage'dan alınıyor
- ✅ Otomatik path düzeltme

### 3. Debug Hook Güncellemesi (`src/hooks/useSupabaseBooks.ts`)

Console'da URL'leri debug etmek için log eklendi:
```javascript
console.log('🔍 Sample book URLs:', {
  title: convertedBooks[0].title,
  coverImage: convertedBooks[0].coverImage,
  formats: convertedBooks[0].formats,
  ...
});
```

## 📋 Database'de Beklenen Format

### Books Tablosu - `cover_image_url`

**Doğru formatlar:**
```
✅ 'Agir-Itki.png'                    → covers/Agir-Itki.png olarak işlenir
✅ 'covers/Agir-Itki.png'             → Direkt kullanılır
```

**Yanlış formatlar:**
```
❌ 'https://....supabase.co/storage/...'  → Tam URL olmamalı
❌ '/covers/Agir-Itki.png'                → Başta / olmamalı
```

### Book_Files Tablosu - `file_url`

**Doğru formatlar:**
```
✅ 'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf'
✅ 'books/agir-itki-said-ellamin/agir-itki-said-ellamin.pdf'
```

**Yanlış formatlar:**
```
❌ 'https://....supabase.co/storage/...'  → Tam URL olmamalı
❌ '/books/file.pdf'                      → Başta / olmamalı
```

## 🔧 Storage Yapısı

```
book-assets/ (Public Bucket)
│
├── covers/
│   ├── Agir-Itki.png
│   ├── sahih-buhari.jpg
│   └── ...
│
└── books/
    ├── agir-itki-said-ellamin/
    │   ├── agir-itki-said-ellamin.pdf
    │   ├── agir-itki-said-ellamin.epub
    │   └── agir-itki-said-ellamin.docx
    │
    └── other-book-folder/
        └── ...
```

## 🧪 Test Adımları

### 1. Console'u Aç (F12)
Uygulama yüklendiğinde şunu görmelisiniz:
```
📚 Fetching books from Supabase...
✅ Fetched X books from Supabase
🔍 Sample book URLs: {
  title: "...",
  coverImage: "https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/covers/Agir-Itki.png",
  formats: {
    pdf: "https://..../books/...",
    epub: "https://..../books/..."
  }
}
```

### 2. Kapak Resimlerini Kontrol Et
- Ana sayfada kitap kartlarına bakın
- Kapak resimleri görünüyor mu?
- Placeholder yerine gerçek resim mi var?

### 3. İndirme Linklerini Test Et
- Kitap detaylarına girin
- İndir butonlarına tıklayın
- Dosyalar doğru mu indiriliyor?

## 🐛 Sorun Giderme

### Kapak Resimleri Görünmüyor

**Sebep 1: Storage Public Değil**
```
Çözüm: 
- Supabase Dashboard → Storage → book-assets
- "Public bucket" olarak işaretleyin
- Tüm dosyalara public erişim verin
```

**Sebep 2: Database'de Yanlış Path**
```sql
-- Kontrol et:
SELECT title, cover_image_url FROM books LIMIT 5;

-- Eğer tam URL varsa düzelt:
UPDATE books 
SET cover_image_url = REPLACE(
  cover_image_url, 
  'https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/',
  ''
);
```

**Sebep 3: Dosya Storage'da Yok**
```
Çözüm:
- Supabase Dashboard → Storage → book-assets → covers
- Dosyayı upload edin
- İsim database ile eşleşmeli
```

### İndirme Linkleri Çalışmıyor

**Sebep 1: book_files Tablosu Boş**
```sql
-- Kontrol et:
SELECT * FROM book_files WHERE book_id = 'book-id-here';

-- Eğer boşsa, ekleme örneği:
INSERT INTO book_files (book_id, format, file_url, file_size_mb)
VALUES 
  ('book-id', 'pdf', 'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf', 2.5),
  ('book-id', 'epub', 'agir-itki-said-ellamin/agir-itki-said-ellamin.epub', 1.8);
```

**Sebep 2: Dosyalar Storage'da Yok**
```
Çözüm:
- Storage'da books/ klasörüne dosyaları upload edin
- Path database ile eşleşmeli
```

### Console'da 403 Hatası

**Storage politikaları eksik:**
```sql
-- Storage bucket'a public read politikası ekle
-- Supabase Dashboard → Storage → book-assets → Policies

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-assets');
```

## 📝 Database Path'lerini Kontrol Etme

`debug-storage-urls.sql` dosyasını kullanın:

1. Supabase Dashboard → SQL Editor
2. Dosyayı kopyala-yapıştır
3. Run
4. Sonuçlara bakın:
   - ✅ = Doğru format
   - ⚠️ = Çalışır ama optimize edilebilir
   - ❌ = Düzeltilmeli

## 🔄 Örnek Veri Eklemek

### Kitap Kapağı Eklemek:
1. Storage → book-assets → covers → Upload
2. Örnek: `Agir-Itki.png`
3. Database:
```sql
UPDATE books 
SET cover_image_url = 'Agir-Itki.png'
WHERE id = 'your-book-id';
```

### Kitap Dosyası Eklemek:
1. Storage → book-assets → books → Create folder: `agir-itki-said-ellamin`
2. O klasöre dosyaları upload et
3. Database:
```sql
INSERT INTO book_files (book_id, format, file_url, file_size_mb)
VALUES 
  ('book-id', 'pdf', 'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf', 2.5);
```

## ✅ Kontrol Listesi

- [ ] Storage bucket `book-assets` public mu?
- [ ] `covers/` klasöründe resimler var mı?
- [ ] `books/` klasöründe dosyalar var mı?
- [ ] Database'de `cover_image_url` doğru mu?
- [ ] Database'de `book_files.file_url` doğru mu?
- [ ] Console'da URL'ler doğru görünüyor mu?
- [ ] Kapak resimleri sayfada yükleniyor mu?
- [ ] İndirme linkleri çalışıyor mu?

---

**🎉 Tamamlandı! Artık Storage entegrasyonu hazır!**
