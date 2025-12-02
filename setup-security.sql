-- ============================================
-- SUPABASE GÜVENLİK POLİTİKALARI
-- Sadece READ (Okuma) İzni - YAZMA İŞLEMLERİ ENGELLENDİ
-- ============================================

-- 1. Row Level Security'yi Aktifleştir
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 2. Sadece Okuma İzni Ver (SELECT)
CREATE POLICY "Public books read access" 
ON books FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public book_files read access" 
ON book_files FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Public categories read access" 
ON categories FOR SELECT 
TO public 
USING (true);

-- 3. Yazma İşlemlerini Engelle (INSERT, UPDATE, DELETE)
-- Bu politikalar sayesinde hiçbir kullanıcı veri ekleyemez/değiştiremez/silemez
CREATE POLICY "No insert on books" 
ON books FOR INSERT 
TO public 
WITH CHECK (false);

CREATE POLICY "No update on books" 
ON books FOR UPDATE 
TO public 
USING (false);

CREATE POLICY "No delete on books" 
ON books FOR DELETE 
TO public 
USING (false);

CREATE POLICY "No insert on book_files" 
ON book_files FOR INSERT 
TO public 
WITH CHECK (false);

CREATE POLICY "No update on book_files" 
ON book_files FOR UPDATE 
TO public 
USING (false);

CREATE POLICY "No delete on book_files" 
ON book_files FOR DELETE 
TO public 
USING (false);

CREATE POLICY "No insert on categories" 
ON categories FOR INSERT 
TO public 
WITH CHECK (false);

CREATE POLICY "No update on categories" 
ON categories FOR UPDATE 
TO public 
USING (false);

CREATE POLICY "No delete on categories" 
ON categories FOR DELETE 
TO public 
USING (false);

-- ============================================
-- KONTROL
-- ============================================
-- Aşağıdaki sorgularla politikaları kontrol edebilirsiniz:
-- SELECT * FROM pg_policies WHERE tablename IN ('books', 'book_files', 'categories');
