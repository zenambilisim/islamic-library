-- Kategori kitap sayılarını otomatik güncelleyen trigger ve function
-- Bu script'i Supabase SQL Editor'de çalıştırın

-- 1. Kategori kitap sayısını güncelleyen function
CREATE OR REPLACE FUNCTION update_category_book_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Eski kategorinin book_count'unu güncelle (DELETE veya UPDATE durumunda)
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.category != NEW.category) THEN
    UPDATE categories
    SET book_count = (
      SELECT COUNT(*) FROM books WHERE category = OLD.category
    )
    WHERE name = OLD.category;
  END IF;

  -- Yeni kategorinin book_count'unu güncelle (INSERT veya UPDATE durumunda)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.category != NEW.category) THEN
    UPDATE categories
    SET book_count = (
      SELECT COUNT(*) FROM books WHERE category = NEW.category
    )
    WHERE name = NEW.category;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger'ı oluştur - INSERT durumunda
CREATE OR REPLACE TRIGGER update_category_count_on_insert
AFTER INSERT ON books
FOR EACH ROW
EXECUTE FUNCTION update_category_book_count();

-- 3. Trigger'ı oluştur - UPDATE durumunda
CREATE OR REPLACE TRIGGER update_category_count_on_update
AFTER UPDATE OF category ON books
FOR EACH ROW
EXECUTE FUNCTION update_category_book_count();

-- 4. Trigger'ı oluştur - DELETE durumunda
CREATE OR REPLACE TRIGGER update_category_count_on_delete
AFTER DELETE ON books
FOR EACH ROW
EXECUTE FUNCTION update_category_book_count();

-- 5. Mevcut kitap sayılarını güncelle (bir kerelik)
UPDATE categories c
SET book_count = (
  SELECT COUNT(*) FROM books b WHERE b.category = c.name
);

-- 6. Sonuçları kontrol et
SELECT 
    c.name as category_name,
    c.book_count as stored_count,
    COUNT(b.id) as actual_count,
    CASE 
        WHEN c.book_count = COUNT(b.id) THEN '✅ Correct'
        ELSE '❌ Mismatch'
    END as status
FROM categories c
LEFT JOIN books b ON b.category = c.name
GROUP BY c.id, c.name, c.book_count
ORDER BY c.name;

-- Test: Trigger'ı test et (opsiyonel - gerçek veri eklemeden önce test edilebilir)
-- Bu bölümü çalıştırmadan önce, gerçek bir kitap ID'si ile değiştirin
/*
-- Test için bir kitap ekle
INSERT INTO books (title, author, category, language, download_count)
VALUES ('Test Kitap', 'Test Yazar', 'Akaid', 'tr', 0);

-- Kategori sayısını kontrol et
SELECT name, book_count FROM categories WHERE name = 'Akaid';

-- Test kitabı sil
DELETE FROM books WHERE title = 'Test Kitap';

-- Tekrar kontrol et
SELECT name, book_count FROM categories WHERE name = 'Akaid';
*/
