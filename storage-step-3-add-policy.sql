-- ============================================
-- STEP 3: Public Read Politikası Ekle
-- ============================================
-- SADECE STEP 2'de politika yoksa çalıştırın!

CREATE POLICY "Public Read Access for book-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'book-assets');

-- Başarılı olursa şunu göreceksiniz: "Success. No rows returned"
