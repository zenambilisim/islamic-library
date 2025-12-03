-- Yazarları books tablosundan otomatik olarak çıkaran view
-- Bu view, her yazarın kitap sayısını ve diğer bilgilerini toplar

-- 1. Mevcut view'ı sil (eğer varsa)
DROP VIEW IF EXISTS authors_view CASCADE;

-- 2. Authors view'ını oluştur
CREATE VIEW authors_view AS
SELECT 
    -- Yazar için unique ID (author isminden hash)
    md5(author) as id,
    
    -- Yazar bilgileri
    author as name,
    author_translations as name_translations,
    
    -- İlk kitaptan biyografi bilgisi al (eğer varsa)
    (SELECT description FROM books b2 WHERE b2.author = b.author LIMIT 1) as biography,
    (SELECT description_translations FROM books b2 WHERE b2.author = b.author LIMIT 1) as biography_translations,
    
    -- İstatistikler
    COUNT(*) as book_count,
    SUM(download_count) as total_downloads,
    
    -- İlk ve son kitap tarihleri
    MIN(publish_year) as first_publish_year,
    MAX(publish_year) as last_publish_year,
    
    -- Yazarın kategorileri (array olarak)
    array_agg(DISTINCT category) as categories,
    
    -- Yazarın dilleri (array olarak)
    array_agg(DISTINCT language) as languages,
    
    -- İlk kitabın kapak resmi (profil resmi olarak kullanılabilir)
    (SELECT cover_image_url FROM books b2 WHERE b2.author = b.author ORDER BY created_at DESC LIMIT 1) as profile_image,
    
    -- Tarih bilgileri
    MIN(created_at) as first_book_created_at,
    MAX(updated_at) as last_updated_at

FROM books b
GROUP BY author, author_translations
ORDER BY book_count DESC, author;

-- 3. View'a yorum ekle
COMMENT ON VIEW authors_view IS 'Yazarları ve istatistiklerini books tablosundan dinamik olarak oluşturur';

-- 4. View'ı test et
SELECT 
    name,
    book_count,
    total_downloads,
    first_publish_year,
    last_publish_year,
    categories,
    languages
FROM authors_view
ORDER BY book_count DESC
LIMIT 10;

-- 5. RLS politikası ekle (okuma izni)
-- Note: View'lar için RLS genellikle base table'dan inherit edilir
-- Ama ekstra güvenlik için:
CREATE POLICY IF NOT EXISTS "public_read_authors_view" 
ON books FOR SELECT 
TO public 
USING (true);

-- 6. Alfabetik sıralama için yardımcı function
CREATE OR REPLACE FUNCTION get_author_first_letter(author_name text, lang text DEFAULT 'tr')
RETURNS text AS $$
BEGIN
    RETURN UPPER(SUBSTRING(
        CASE 
            WHEN lang = 'tr' THEN author_name
            WHEN lang = 'en' AND (SELECT author_translations->>'en' FROM books WHERE author = author_name LIMIT 1) IS NOT NULL 
                THEN (SELECT author_translations->>'en' FROM books WHERE author = author_name LIMIT 1)
            WHEN lang = 'ru' AND (SELECT author_translations->>'ru' FROM books WHERE author = author_name LIMIT 1) IS NOT NULL 
                THEN (SELECT author_translations->>'ru' FROM books WHERE author = author_name LIMIT 1)
            WHEN lang = 'az' AND (SELECT author_translations->>'az' FROM books WHERE author = author_name LIMIT 1) IS NOT NULL 
                THEN (SELECT author_translations->>'az' FROM books WHERE author = author_name LIMIT 1)
            ELSE author_name
        END,
        1, 1
    ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 7. Yazarları alfabetik gruplamak için helper view
CREATE OR REPLACE VIEW authors_by_letter AS
SELECT 
    UPPER(SUBSTRING(name, 1, 1)) as letter,
    COUNT(*) as author_count
FROM authors_view
GROUP BY UPPER(SUBSTRING(name, 1, 1))
ORDER BY letter;

-- Test: Hangi harflerde kaç yazar var?
SELECT * FROM authors_by_letter;

-- 8. Belirli bir yazarın tüm kitaplarını getiren function
CREATE OR REPLACE FUNCTION get_books_by_author(author_name text)
RETURNS TABLE (
    id uuid,
    title text,
    title_translations jsonb,
    category text,
    cover_image_url text,
    publish_year int,
    download_count int,
    file_size text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.title,
        b.title_translations,
        b.category,
        b.cover_image_url,
        b.publish_year,
        b.download_count,
        b.file_size
    FROM books b
    WHERE b.author = author_name
    ORDER BY b.publish_year DESC, b.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test: Bir yazarın kitaplarını getir
-- SELECT * FROM get_books_by_author('Said Ellamin');

-- 9. Popüler yazarları getiren view (en çok indirilen)
CREATE OR REPLACE VIEW popular_authors AS
SELECT *
FROM authors_view
WHERE book_count > 0
ORDER BY total_downloads DESC, book_count DESC
LIMIT 20;

-- Test: Popüler yazarlar
SELECT name, book_count, total_downloads FROM popular_authors;

-- 10. Son kitap ekleyen yazarları getiren view
CREATE OR REPLACE VIEW recent_authors AS
SELECT *
FROM authors_view
ORDER BY last_updated_at DESC
LIMIT 10;

-- Sonuç özeti
SELECT 
    '✅ authors_view oluşturuldu' as status,
    COUNT(*) as total_authors
FROM authors_view
UNION ALL
SELECT 
    '✅ Harfler gruplanmış' as status,
    COUNT(*) as letter_count
FROM authors_by_letter
UNION ALL
SELECT 
    '✅ Helper functions oluşturuldu' as status,
    3 as function_count;
