-- ============================================
-- BOOK FILES PATH'LERİNİ DÜZELT
-- ============================================
-- Dosyalara 'books/' prefix'ini ekle

-- Önce mevcut durumu kontrol et
SELECT 
  id,
  format,
  file_url,
  CASE 
    WHEN file_url LIKE 'books/%' THEN '✅ DOĞRU'
    ELSE '❌ BOOKS/ YOK'
  END as durum
FROM book_files;

-- Path'leri düzelt (sadece books/ ile başlamayanlar için)
UPDATE book_files 
SET file_url = 'books/' || file_url
WHERE file_url NOT LIKE 'books/%';

-- Kontrol et (düzeldi mi?)
SELECT 
  id,
  format,
  file_url,
  CASE 
    WHEN file_url LIKE 'books/%' THEN '✅ DÜZELDİ'
    ELSE '❌ HALA YANLIŞ'
  END as durum
FROM book_files;
