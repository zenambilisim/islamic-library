-- ============================================
-- STORAGE'DAKİ GERÇEK DOSYA YOLLARINI KONTROL ET
-- ============================================

-- Book files'ları detaylı göster
SELECT 
  b.title,
  bf.format,
  bf.file_url,
  bf.file_size_text,
  CONCAT(
    'https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/',
    bf.file_url
  ) as tam_url
FROM book_files bf
JOIN books b ON bf.book_id = b.id
WHERE b.title = 'Ağır İtki';

-- Yukarıdaki tam_url'leri tarayıcıda test edin
-- Eğer 404 hatası alıyorsanız, path yanlış demektir
