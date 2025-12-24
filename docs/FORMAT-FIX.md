# 📋 Format Sorunu ve Çözümü

## 🐛 Sorun

`book_files` tablosunda `format` kolonundaki değerler bazen **büyük harfle** yazılmış (PDF, EPUB, DOCX). Bu, frontend kodunun dosyaları bulamamasına neden oluyordu çünkü kontroller **küçük harfle** yapılıyor (pdf, epub, docx).

### Neden Oldu?

Manuel veritabanı insert'lerinde format değerleri büyük harfle yazılmıştı:

```sql
-- ❌ Hatalı (büyük harf)
INSERT INTO book_files (book_id, format, file_url) VALUES
('abc-123', 'PDF', 'books/book.pdf');

-- ✅ Doğru (küçük harf)
INSERT INTO book_files (book_id, format, file_url) VALUES
('abc-123', 'pdf', 'books/book.pdf');
```

## ✅ Çözüm

### 1. Veritabanı Düzeltmesi

Mevcut kayıtları düzelt:

```bash
# Supabase Dashboard → SQL Editor
# fix-book-files-format.sql dosyasını çalıştır
```

veya:

```sql
UPDATE book_files
SET format = LOWER(format)
WHERE format != LOWER(format);
```

### 2. Frontend Kodu (Case-Insensitive)

Format kontrolünü case-insensitive yaptık:

**Öncesi:**
```typescript
if (file.format === 'pdf') formats.pdf = fileUrl;
if (file.format === 'epub') formats.epub = fileUrl;
if (file.format === 'docx') formats.doc = fileUrl;
```

**Sonrası:**
```typescript
const formatLower = file.format.toLowerCase();

if (formatLower === 'pdf') formats.pdf = fileUrl;
if (formatLower === 'epub') formats.epub = fileUrl;
if (formatLower === 'docx' || formatLower === 'doc') formats.doc = fileUrl;
```

Bu sayede manuel yüklemelerde büyük harf kullanılsa bile çalışır.

### 3. Upload Script Standardı

`upload-books.js` script'i formatları zaten **küçük harfle** yazıyor:

```javascript
fileInserts.push({
  book_id: newBook.id,
  format: 'pdf',  // ✅ Küçük harf
  file_url: bookData.pdfPath
});
```

## 📊 Test Etmek İçin

```sql
-- Tüm formatları kontrol et
SELECT DISTINCT format FROM book_files ORDER BY format;

-- Beklenen çıktı: docx, epub, pdf (hepsi küçük harf)
```

## 🔄 Gelecekte Önlemek İçin

1. **Script Kullan:** Manuel insert yerine `upload-books.js` kullan
2. **Validation:** Database'e constraint ekle:

```sql
ALTER TABLE book_files
ADD CONSTRAINT format_lowercase_check 
CHECK (format = LOWER(format));
```

3. **TypeScript Type:** Enum kullan:

```typescript
type BookFormat = 'pdf' | 'epub' | 'docx';

interface BookFile {
  format: BookFormat; // Sadece küçük harf kabul eder
  // ...
}
```

## 📝 İlgili Dosyalar

- `/fix-book-files-format.sql` - Veritabanı düzeltme script'i
- `/src/lib/converters.ts` - Format kontrolü case-insensitive
- `/scripts/upload-books.js` - Otomatik upload (küçük harf garanti)

---

**Durum:** ✅ Çözüldü  
**Tarih:** 22 Aralık 2024  
**Etkilenen Dosyalar:** 3  
**Güncellenen Kayıtlar:** Veritabanındaki tüm büyük harfli format kayıtları
