-- ============================================
-- STEP 2: Storage Politikalarını Kontrol Et
-- ============================================

SELECT * FROM storage.policies 
WHERE bucket_id = 'book-assets';

-- Eğer sonuç boş ise (politika yok), STEP 3'e geçin
-- Eğer politika varsa, STEP 4'e geçin
