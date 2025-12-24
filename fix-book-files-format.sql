-- ============================================================================
-- FIX BOOK_FILES FORMAT - Büyük harfleri küçük harfe çevir
-- ============================================================================
-- 
-- SORUN: 
--   book_files tablosunda format değerleri bazen büyük harfle (PDF, EPUB, DOCX)
--   yazılmış. Bu, frontend'de dosyaların görünmemesine neden oluyor çünkü
--   kod küçük harf kontrolü yapıyor (pdf, epub, docx).
--
-- ÇÖZÜM:
--   Tüm format değerlerini küçük harfe çevir.
--
-- NASIL ÇALIŞTIRILIR:
--   1. Supabase Dashboard → SQL Editor
--   2. Bu dosyanın içeriğini kopyala-yapıştır
--   3. "Run" butonuna bas
--
-- VEYA Terminal'den:
--   psql -h your-db-host -U postgres -d your-db-name -f fix-book-files-format.sql
--
-- ============================================================================

-- 1. Mevcut durumu göster
SELECT format, COUNT(*) as count
FROM book_files
GROUP BY format
ORDER BY format;

-- Beklenen çıktı (düzeltme öncesi):
--  format | count
-- --------+-------
--  PDF    |   15
--  EPUB   |   12
--  DOCX   |   10
--  pdf    |    5
--  epub   |    3
--  docx   |    2

-- 2. Format değerlerini küçük harfe çevir
UPDATE book_files
SET format = LOWER(format)
WHERE format != LOWER(format);

-- 3. Güncelleme sonrası durumu göster
SELECT format, COUNT(*) as count
FROM book_files
GROUP BY format
ORDER BY format;

-- Beklenen çıktı (düzeltme sonrası):
--  format | count
-- --------+-------
--  docx   |   12
--  epub   |   15
--  pdf    |   20

-- ✅ Tüm formatlar artık küçük harf!

-- 4. İstatistik: Kaç kayıt güncellendi?
-- (Bu SQL çalıştırıldıktan sonra çalışmaz, sadece bilgi amaçlı)
-- SELECT COUNT(*) as updated_records
-- FROM book_files
-- WHERE format != LOWER(format);
