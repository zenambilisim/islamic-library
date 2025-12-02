-- ============================================
-- STEP 4: URL Formatlarını Kontrol Et
-- ============================================

-- Kapak resimlerini kontrol et
SELECT 
  id,
  title,
  cover_image_url,
  CASE 
    WHEN cover_image_url IS NULL THEN '❌ NULL'
    WHEN cover_image_url = '' THEN '❌ BOŞ'
    WHEN cover_image_url LIKE 'http%' THEN '⚠️ TAM URL (düzeltilmeli)'
    WHEN cover_image_url LIKE 'covers/%' THEN '✅ DOĞRU'
    ELSE '⚠️ PREFIX YOK (covers/ eklenecek)'
  END as durum
FROM books
ORDER BY created_at DESC
LIMIT 10;
