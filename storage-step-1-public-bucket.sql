-- ============================================
-- STEP 1: Bucket'ı Public Yap
-- ============================================
-- Bu sorguyu çalıştırın, sonucu kontrol edin

SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'book-assets';

-- Eğer public = false ise, bu sorguyu çalıştırın:
-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE id = 'book-assets';
