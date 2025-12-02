-- ============================================
-- BOOK FILES EKLEME
-- ============================================
-- Ağır İtki kitabı için dosyaları ekle

-- Önce kitabın ID'sini al
SELECT id, title FROM books WHERE title = 'Ağır İtki';

-- Yukarıdaki sonuçtan book_id'yi kopyala ve aşağıda kullan
-- VEYA direkt bu sorguyu çalıştır:

INSERT INTO book_files (book_id, format, file_url, file_size_mb, file_size_text)
SELECT 
  id as book_id,
  'pdf' as format,
  'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf' as file_url,
  2.5 as file_size_mb,
  '2.5 MB' as file_size_text
FROM books 
WHERE title = 'Ağır İtki';

INSERT INTO book_files (book_id, format, file_url, file_size_mb, file_size_text)
SELECT 
  id as book_id,
  'epub' as format,
  'agir-itki-said-ellamin/agir-itki-said-ellamin.epub' as file_url,
  1.8 as file_size_mb,
  '1.8 MB' as file_size_text
FROM books 
WHERE title = 'Ağır İtki';

INSERT INTO book_files (book_id, format, file_url, file_size_mb, file_size_text)
SELECT 
  id as book_id,
  'docx' as format,
  'agir-itki-said-ellamin/agir-itki-said-ellamin.docx' as file_url,
  1.2 as file_size_mb,
  '1.2 MB' as file_size_text
FROM books 
WHERE title = 'Ağır İtki';

-- Kontrol et
SELECT 
  bf.id,
  b.title,
  bf.format,
  bf.file_url,
  bf.file_size_text,
  '✅ EKLENDI' as durum
FROM book_files bf
JOIN books b ON bf.book_id = b.id
WHERE b.title = 'Ağır İtki';
