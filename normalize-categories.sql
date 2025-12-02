-- Kitaplardaki kategori isimlerini normalize et
-- Bu script, books tablosundaki category değerlerini categories tablosundaki name değerleriyle eşleştirir

-- Önce mevcut kitap kategorilerini kontrol et
SELECT DISTINCT category, COUNT(*) as book_count 
FROM books 
GROUP BY category 
ORDER BY category;

-- Kitap kategorilerini güncelle (örnek eşleştirmeler)
-- Not: Mevcut kitaplarınızın kategori isimlerine göre bu eşleştirmeleri ayarlayın

-- Örnek: Eğer kitaplarda 'akaid', 'aqidah', 'creed' gibi değerler varsa bunları 'Akaid' ile eşleştir
UPDATE books 
SET category = 'Akaid', 
    category_translations = '{"tr": "Akaid", "en": "Islamic Creed", "ru": "Исламская вера", "az": "İslam İnancı"}'
WHERE LOWER(category) IN ('akaid', 'aqidah', 'creed', 'islamic creed', 'inanç');

-- Hadis kategorisi
UPDATE books 
SET category = 'Hadis',
    category_translations = '{"tr": "Hadis", "en": "Hadith", "ru": "Хадис", "az": "Hədis"}'
WHERE LOWER(category) IN ('hadis', 'hadith', 'sünnet', 'sunnah');

-- Tefsir kategorisi
UPDATE books 
SET category = 'Tefsir',
    category_translations = '{"tr": "Tefsir", "en": "Quranic Exegesis", "ru": "Толкование Корана", "az": "Təfsir"}'
WHERE LOWER(category) IN ('tefsir', 'tafsir', 'exegesis', 'quran commentary', 'kuran tefsiri');

-- Fıkıh kategorisi
UPDATE books 
SET category = 'Fıkıh',
    category_translations = '{"tr": "Fıkıh", "en": "Islamic Jurisprudence", "ru": "Исламская юриспруденция", "az": "Fiqh"}'
WHERE LOWER(category) IN ('fıkıh', 'fiqh', 'jurisprudence', 'islamic law', 'hukuk');

-- Siyer kategorisi
UPDATE books 
SET category = 'Siyer',
    category_translations = '{"tr": "Siyer", "en": "Biography", "ru": "Биография", "az": "Sirə"}'
WHERE LOWER(category) IN ('siyer', 'seerah', 'biography', 'biyografi', 'peygamber hayatı');

-- Tasavvuf kategorisi
UPDATE books 
SET category = 'Tasavvuf',
    category_translations = '{"tr": "Tasavvuf", "en": "Sufism", "ru": "Суфизм", "az": "Təsəvvüf"}'
WHERE LOWER(category) IN ('tasavvuf', 'sufism', 'sufi', 'mysticism');

-- İslam Tarihi kategorisi
UPDATE books 
SET category = 'İslam Tarihi',
    category_translations = '{"tr": "İslam Tarihi", "en": "Islamic History", "ru": "История ислама", "az": "İslam Tarixi"}'
WHERE LOWER(category) IN ('islam tarihi', 'islamic history', 'tarih', 'history');

-- Dua ve Zikir kategorisi
UPDATE books 
SET category = 'Dua ve Zikir',
    category_translations = '{"tr": "Dua ve Zikir", "en": "Prayers & Dhikr", "ru": "Молитвы и зикр", "az": "Dua və Zikr"}'
WHERE LOWER(category) IN ('dua', 'zikir', 'dhikr', 'prayers', 'dua ve zikir');

-- Kur'an İlimleri kategorisi
UPDATE books 
SET category = 'Kur''an İlimleri',
    category_translations = '{"tr": "Kur''an İlimleri", "en": "Quranic Sciences", "ru": "Кораническая наука", "az": "Quran Elmləri"}'
WHERE LOWER(category) IN ('kuran ilimleri', 'quranic sciences', 'ulumul quran', 'kur''an');

-- Ahlak ve Edep kategorisi
UPDATE books 
SET category = 'Ahlak ve Edep',
    category_translations = '{"tr": "Ahlak ve Edep", "en": "Morals & Ethics", "ru": "Мораль и этика", "az": "Əxlaq və Ədəb"}'
WHERE LOWER(category) IN ('ahlak', 'ethics', 'morals', 'edep', 'ahlak ve edep');

-- Güncellenen kitapları kontrol et
SELECT category, COUNT(*) as book_count 
FROM books 
GROUP BY category 
ORDER BY category;

-- Kategorilerin book_count değerlerini güncelle
UPDATE categories c
SET book_count = (
  SELECT COUNT(*) FROM books b WHERE b.category = c.name
);

-- Son durumu kontrol et
SELECT 
    c.name as category,
    c.book_count,
    COUNT(b.id) as actual_books
FROM categories c
LEFT JOIN books b ON b.category = c.name
GROUP BY c.id, c.name, c.book_count
ORDER BY c.name;
