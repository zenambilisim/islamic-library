-- ============================================
-- COVER IMAGE GÜNCELLEME
-- ============================================
-- Ağır İtki kitabının kapak resmini ekle

UPDATE books 
SET cover_image_url = 'Agir-Itki.png'
WHERE title = 'Ağır İtki';

-- Kontrol et (başarılı oldu mu?)
SELECT 
  id,
  title,
  cover_image_url,
  CASE 
    WHEN cover_image_url IS NOT NULL THEN '✅ EKLENDI'
    ELSE '❌ EKLENMEDİ'
  END as durum
FROM books
WHERE title = 'Ağır İtki';
