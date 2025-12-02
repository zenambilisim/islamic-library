-- ============================================
-- STEP 5: Book Files URL'lerini Kontrol Et
-- ============================================

SELECT 
  bf.id,
  b.title,
  bf.format,
  bf.file_url,
  CASE 
    WHEN bf.file_url IS NULL THEN '❌ NULL'
    WHEN bf.file_url = '' THEN '❌ BOŞ'
    WHEN bf.file_url LIKE 'http%' THEN '⚠️ TAM URL (düzeltilmeli)'
    WHEN bf.file_url LIKE 'books/%' THEN '✅ DOĞRU'
    ELSE '⚠️ PREFIX YOK (books/ eklenecek)'
  END as durum
FROM book_files bf
JOIN books b ON bf.book_id = b.id
ORDER BY bf.created_at DESC
LIMIT 10;

-- Eğer hiç sonuç dönmezse, book_files tablosu boş demektir
-- Storage'a dosya yükledikten sonra bu tabloya kayıt eklemeniz gerekir
