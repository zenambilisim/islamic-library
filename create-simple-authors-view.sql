-- BASİT YAZAR VIEW'I OLUŞTUR
-- Bu script, authors_view'ı hızlıca oluşturur

-- 1. Mevcut view'ı sil (varsa)
DROP VIEW IF EXISTS authors_view CASCADE;

-- 2. Basit authors view oluştur
CREATE VIEW authors_view AS
SELECT 
    md5(author)::text as id,
    author as name,
    author_translations as name_translations,
    (array_agg(description ORDER BY created_at DESC))[1] as biography,
    (array_agg(description_translations ORDER BY created_at DESC))[1] as biography_translations,
    COUNT(*)::integer as book_count,
    SUM(download_count)::integer as total_downloads,
    MIN(publish_year) as first_publish_year,
    MAX(publish_year) as last_publish_year,
    array_agg(DISTINCT category) as categories,
    array_agg(DISTINCT language) as languages,
    (array_agg(cover_image_url ORDER BY created_at DESC))[1] as profile_image,
    MIN(created_at)::text as first_book_created_at,
    MAX(updated_at)::text as last_updated_at
FROM books
GROUP BY author, author_translations
ORDER BY COUNT(*) DESC;

-- 3. Test et
SELECT 
    name,
    book_count,
    total_downloads
FROM authors_view
LIMIT 5;

-- 4. RLS politikası (okuma izni)
-- Not: View'lar genellikle base table'ın RLS'ini inherit eder
-- Ama emin olmak için:
DO $$
BEGIN
    -- Books tablosunda public read zaten varsa sorun olmaz
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'books' 
        AND policyname = 'public_read_books'
    ) THEN
        CREATE POLICY "public_read_books" ON books
        FOR SELECT TO public USING (true);
    END IF;
END $$;

-- 5. Sonuç
SELECT 
    'authors_view oluşturuldu!' as status,
    COUNT(*) as total_authors
FROM authors_view;

-- 6. Alfabetik harfler view'i (opsiyonel ama faydalı)
CREATE OR REPLACE VIEW authors_by_letter AS
SELECT 
    UPPER(SUBSTRING(name, 1, 1)) as letter,
    COUNT(*) as author_count
FROM authors_view
GROUP BY UPPER(SUBSTRING(name, 1, 1))
ORDER BY letter;

-- Test: Hangi harflerde yazarlar var?
SELECT * FROM authors_by_letter;
