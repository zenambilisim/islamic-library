-- ============================================
-- STORAGE URL TESTİ
-- Database'deki URL'lerin doğru formatta olup olmadığını kontrol edin
-- ============================================

-- Kitapların cover_image_url'lerini kontrol et
SELECT 
  id,
  title,
  cover_image_url,
  -- Beklenen format: 'Agir-Itki.png' veya 'covers/Agir-Itki.png'
  CASE 
    WHEN cover_image_url LIKE 'http%' THEN '❌ Tam URL (Storage path olmalı)'
    WHEN cover_image_url LIKE 'covers/%' THEN '✅ Doğru format (covers/...)'
    WHEN cover_image_url NOT LIKE '%/%' THEN '⚠️ Sadece dosya adı (covers/ eklenecek)'
    ELSE '❓ Beklenmeyen format'
  END as url_durumu
FROM books
ORDER BY created_at DESC
LIMIT 10;

-- Book files'ların file_url'lerini kontrol et
SELECT 
  bf.id,
  b.title,
  bf.format,
  bf.file_url,
  -- Beklenen format: 'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf'
  CASE 
    WHEN bf.file_url LIKE 'http%' THEN '❌ Tam URL (Storage path olmalı)'
    WHEN bf.file_url LIKE 'books/%' THEN '✅ Doğru format (books/...)'
    WHEN bf.file_url LIKE '%/%' THEN '⚠️ Path var ama books/ yok'
    ELSE '❓ Beklenmeyen format'
  END as url_durumu
FROM book_files bf
JOIN books b ON bf.book_id = b.id
ORDER BY bf.created_at DESC
LIMIT 10;

-- ============================================
-- DÜZELTME ÖRNEKLERİ (GEREKİRSE)
-- ============================================

-- Eğer cover_image_url'ler tam URL ise, sadece path'e çevir:
-- UPDATE books 
-- SET cover_image_url = REPLACE(cover_image_url, 
--   'https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/', 
--   ''
-- )
-- WHERE cover_image_url LIKE 'https://ntwmbiorpdzpyfhglptr.supabase.co/%';

-- Eğer file_url'ler tam URL ise, sadece path'e çevir:
-- UPDATE book_files 
-- SET file_url = REPLACE(file_url, 
--   'https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/', 
--   ''
-- )
-- WHERE file_url LIKE 'https://ntwmbiorpdzpyfhglptr.supabase.co/%';
