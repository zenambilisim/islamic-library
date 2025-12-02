-- ============================================
-- HIZLI STORAGE DURUMU KONTROLÜ
-- ============================================
-- Bu dosya sadece KONTROL için kullanılır
-- Değişiklik yapmak için storage-step-X.sql dosyalarını kullanın

-- 1. Bucket durumunu kontrol et
SELECT 
  id, 
  name, 
  public,
  CASE 
    WHEN public = true THEN '✅ Public (Doğru)'
    ELSE '❌ Private (Public yapılmalı)'
  END as durum
FROM storage.buckets 
WHERE id = 'book-assets';

-- 2. Storage politikalarını kontrol et
SELECT 
  name,
  command,
  CASE 
    WHEN command = 'SELECT' THEN '✅ Read politikası var'
    ELSE '❓ Farklı politika'
  END as durum
FROM storage.policies 
WHERE bucket_id = 'book-assets';

-- ============================================
-- URL FORMAT KONTROLÜ
-- ============================================

-- Kapak resimlerini kontrol et
SELECT 
  id,
  title,
  cover_image_url,
  CASE 
    WHEN cover_image_url IS NULL THEN '❌ NULL'
    WHEN cover_image_url = '' THEN '❌ BOŞ'
    WHEN cover_image_url LIKE 'http%' THEN '⚠️ TAM URL (düzeltilmeli)'
    WHEN cover_image_url LIKE 'covers/%' THEN '✅ DOĞRU'
    ELSE '⚠️ PREFIX YOK (covers/ eklenecek)'
  END as durum
FROM books
ORDER BY created_at DESC
LIMIT 10;

-- Kitap dosyalarını kontrol et
SELECT 
  bf.id,
  b.title,
  bf.format,
  bf.file_url,
  CASE 
    WHEN bf.file_url IS NULL THEN '❌ NULL'
    WHEN bf.file_url = '' THEN '❌ BOŞ'
    WHEN bf.file_url LIKE 'http%' THEN '⚠️ TAM URL (düzeltilmeli)'
    WHEN bf.file_url LIKE 'books/%' THEN '✅ DOĞRU'
    ELSE '⚠️ PREFIX YOK (books/ eklenecek)'
  END as durum
FROM book_files bf
JOIN books b ON bf.book_id = b.id
ORDER BY bf.created_at DESC
LIMIT 10;

-- ============================================
-- ÖRNEK VERİ (GEREKİRSE)
-- ============================================

-- Örnek: İlk kitaba dosya ekle
-- INSERT INTO book_files (book_id, format, file_url, file_size_mb, file_size_text)
-- SELECT 
--   id as book_id,
--   'pdf' as format,
--   'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf' as file_url,
--   2.5 as file_size_mb,
--   '2.5 MB' as file_size_text
-- FROM books 
-- WHERE title LIKE '%Ağır%'
-- LIMIT 1;
