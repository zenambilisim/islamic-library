-- ============================================
-- SUPABASE'E KİTAP EKLEME REHBERİ
-- ============================================
-- Bu SQL scriptini Supabase Dashboard > SQL Editor'da çalıştırın
-- ============================================

-- ADIM 1: Mevcut kategorileri kontrol et
SELECT id, name_tr, name_en FROM categories ORDER BY name_tr;

-- ADIM 2: Mevcut yazarları kontrol et
SELECT DISTINCT author FROM books ORDER BY author;

-- ============================================
-- ÖRNEK KİTAP EKLEME ŞABLONları
-- ============================================

-- ŞABLON 1: Temel Kitap Bilgileri (Storage'da dosyalar YOK)
-- Bu şekilde eklerseniz, daha sonra dosyaları Storage'a yükleyip güncellersiniz
INSERT INTO books (
  title,
  title_tr,
  title_en,
  title_ru,
  title_az,
  author,
  author_tr,
  author_en,
  author_ru,
  author_az,
  description,
  description_tr,
  description_en,
  description_ru,
  description_az,
  category_id,
  cover_image
) VALUES (
  'Sahih-i Buhari', -- title (fallback)
  'Sahih-i Buhari', -- title_tr
  'Sahih al-Bukhari', -- title_en
  'Сахих аль-Бухари', -- title_ru
  'Səhih Buxari', -- title_az
  'İmam Buhari', -- author (fallback)
  'İmam Buhari', -- author_tr
  'Imam Bukhari', -- author_en
  'Имам Бухари', -- author_ru
  'İmam Buxari', -- author_az
  'İslam''ın en sahih hadis kitabı olarak kabul edilen eser.', -- description
  'İslam''ın en sahih hadis kitabı olarak kabul edilen eser.', -- description_tr
  'The most authentic collection of hadith in Islam.', -- description_en
  'Самый достоверный сборник хадисов в исламе.', -- description_ru
  'İslamda ən etibarlı hədis toplusu.', -- description_az
  (SELECT id FROM categories WHERE name_tr = 'Hadis' LIMIT 1), -- category_id
  '/images/books/sahih-buhari.jpg' -- cover_image (placeholder)
);

-- ŞABLON 2: PDF, EPUB, DOC Dosyalarıyla Birlikte
-- Storage'a dosyaları yükledikten SONRA bu şekilde ekleyin
INSERT INTO books (
  title,
  title_tr,
  title_en,
  title_ru,
  title_az,
  author,
  author_tr,
  author_en,
  author_ru,
  author_az,
  description,
  description_tr,
  description_en,
  description_ru,
  description_az,
  category_id,
  cover_image,
  pdf_url,
  epub_url,
  doc_url
) VALUES (
  'Riyazus Salihin', 
  'Riyazus Salihin', 
  'The Gardens of the Righteous', 
  'Райзуз Салихин', 
  'Riyazus Salihin', 
  'İmam Nevevi',
  'İmam Nevevi',
  'Imam Nawawi',
  'Имам Навави',
  'İmam Nəvəvi',
  'Seçilmiş hadislerin toplandığı önemli bir eser.',
  'Seçilmiş hadislerin toplandığı önemli bir eser.',
  'A collection of selected hadith.',
  'Сборник избранных хадисов.',
  'Seçilmiş hədislərin toplandığı əsər.',
  (SELECT id FROM categories WHERE name_tr = 'Hadis' LIMIT 1),
  '/images/books/riyazus-salihin.jpg',
  'https://[SUPABASE_URL]/storage/v1/object/public/books/riyazus-salihin.pdf',
  'https://[SUPABASE_URL]/storage/v1/object/public/books/riyazus-salihin.epub',
  'https://[SUPABASE_URL]/storage/v1/object/public/books/riyazus-salihin.docx'
);

-- ============================================
-- ÖNEMLİ NOTLAR:
-- ============================================
-- 1. category_id: Kategori ID'sini şu şekilde bulun:
--    SELECT id, name_tr FROM categories;
--
-- 2. cover_image: 
--    - Supabase Storage'a yükleyin (books/covers/ klasörüne)
--    - URL formatı: https://[PROJECT].supabase.co/storage/v1/object/public/books/covers/kitap-adi.jpg
--    - Veya placeholder kullanın: '/placeholder-book.jpg'
--
-- 3. PDF/EPUB/DOC URL'leri:
--    - Önce dosyaları Supabase Storage'a yükleyin
--    - Public URL'i alın
--    - Bu SQL'de güncelleyin
--
-- 4. Çoklu dil:
--    - Tüm dilleri doldurmak ZORUNLU DEĞİL
--    - En az title, author, description ve bir dil (TR) yeterli
--    - Diğer diller NULL olabilir
-- ============================================

-- HIZLI TEST: 5 Örnek Kitap Ekleyelim
-- Bu kitaplar gerçek dosya URL'leri OLMADAN eklenecek
-- Sadece test amaçlıdır, daha sonra gerçek dosyaları ekleyebilirsiniz

INSERT INTO books (
  title, title_tr, title_en, title_ru, title_az,
  author, author_tr, author_en, author_ru, author_az,
  description, description_tr, description_en, description_ru, description_az,
  category_id, cover_image
) VALUES 
-- Kitap 1: Kuran-ı Kerim Tefsiri
(
  'Kuran-ı Kerim Tefsiri',
  'Kuran-ı Kerim Tefsiri',
  'Quran Commentary',
  'Толкование Корана',
  'Quran Təfsiri',
  'Elmalılı Hamdi Yazır',
  'Elmalılı Hamdi Yazır',
  'Elmalili Hamdi Yazir',
  'Эльмалылы Хамди Язир',
  'Əlmalılı Həmdi Yazır',
  'Türkçe''nin en kapsamlı Kuran tefsirlerinden biri.',
  'Türkçe''nin en kapsamlı Kuran tefsirlerinden biri.',
  'One of the most comprehensive Quran commentaries in Turkish.',
  'Один из самых полных комментариев к Корану на турецком языке.',
  'Türk dilində ən əhatəli Quran təfsirlərindən biri.',
  (SELECT id FROM categories WHERE name_tr = 'Tefsir' LIMIT 1),
  '/placeholder-book.jpg'
),

-- Kitap 2: İhya-u Ulumiddin
(
  'İhya-u Ulumiddin',
  'İhya-u Ulumiddin',
  'The Revival of Religious Sciences',
  'Возрождение религиозных наук',
  'İhya-u Ulumiddin',
  'İmam Gazali',
  'İmam Gazali',
  'Imam Ghazali',
  'Имам Газали',
  'İmam Qəzali',
  'İslam düşüncesinin en önemli eserlerinden biri.',
  'İslam düşüncesinin en önemli eserlerinden biri.',
  'One of the most important works of Islamic thought.',
  'Одно из важнейших произведений исламской мысли.',
  'İslam düşüncəsinin ən mühüm əsərlərindən biri.',
  (SELECT id FROM categories WHERE name_tr = 'Tasavvuf' LIMIT 1),
  '/placeholder-book.jpg'
),

-- Kitap 3: Fıkıh Usulü
(
  'Fıkıh Usulü',
  'Fıkıh Usulü',
  'Principles of Islamic Jurisprudence',
  'Принципы исламской юриспруденции',
  'Fiqh Əsasları',
  'İmam Şafii',
  'İmam Şafii',
  'Imam Shafi''i',
  'Имам Шафии',
  'İmam Şafii',
  'İslam hukukunun temel prensiplerini anlatan klasik eser.',
  'İslam hukukunun temel prensiplerini anlatan klasik eser.',
  'Classical work explaining the fundamental principles of Islamic law.',
  'Классическое произведение, объясняющее основные принципы исламского права.',
  'İslam hüququnun əsas prinsiplərini izah edən klassik əsər.',
  (SELECT id FROM categories WHERE name_tr = 'Fıkıh' LIMIT 1),
  '/placeholder-book.jpg'
),

-- Kitap 4: Muhtasar İlmihal
(
  'Muhtasar İlmihal',
  'Muhtasar İlmihal',
  'Concise Islamic Catechism',
  'Краткий исламский катехизис',
  'Qısa İlmihal',
  'Ömer Nasuhi Bilmen',
  'Ömer Nasuhi Bilmen',
  'Omer Nasuhi Bilmen',
  'Омер Насухи Билмен',
  'Ömər Nasuhi Bilmən',
  'İslam dininin temel bilgilerini öğreten pratik bir rehber.',
  'İslam dininin temel bilgilerini öğreten pratik bir rehber.',
  'A practical guide teaching the basics of Islam.',
  'Практическое руководство, обучающее основам ислама.',
  'İslam dininin əsas bilgilərini öyrədən praktik təlimat.',
  (SELECT id FROM categories WHERE name_tr = 'İlmihal' LIMIT 1),
  '/placeholder-book.jpg'
),

-- Kitap 5: Siyer-i Nebi
(
  'Siyer-i Nebi',
  'Siyer-i Nebi',
  'The Life of the Prophet',
  'Жизнь Пророка',
  'Peyğəmbər Həyatı',
  'İbn İshak',
  'İbn İshak',
  'Ibn Ishaq',
  'Ибн Исхак',
  'İbn İshaq',
  'Hz. Muhammed''in hayatını anlatan en eski kaynaklardan biri.',
  'Hz. Muhammed''in hayatını anlatan en eski kaynaklardan biri.',
  'One of the oldest sources narrating the life of Prophet Muhammad.',
  'Один из древнейших источников, повествующих о жизни Пророка Мухаммеда.',
  'Peyğəmbər Məhəmmədin həyatını nəql edən ən qədim mənbələrdən biri.',
  (SELECT id FROM categories WHERE name_tr = 'Siyer' LIMIT 1),
  '/placeholder-book.jpg'
);

-- Eklenen kitapları kontrol et
SELECT 
  id,
  title_tr as başlık,
  author_tr as yazar,
  (SELECT name_tr FROM categories WHERE id = books.category_id) as kategori,
  created_at
FROM books
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- DOSYA URL'LERİNİ SONRADAN GÜNCELLEMEK İÇİN
-- ============================================
-- Storage'a dosyaları yükledikten sonra:

-- Örnek güncelleme:
-- UPDATE books 
-- SET 
--   pdf_url = 'https://[PROJECT].supabase.co/storage/v1/object/public/books/kitap-adi.pdf',
--   epub_url = 'https://[PROJECT].supabase.co/storage/v1/object/public/books/kitap-adi.epub',
--   doc_url = 'https://[PROJECT].supabase.co/storage/v1/object/public/books/kitap-adi.docx',
--   cover_image = 'https://[PROJECT].supabase.co/storage/v1/object/public/books/covers/kitap-adi.jpg'
-- WHERE title_tr = 'Sahih-i Buhari';
