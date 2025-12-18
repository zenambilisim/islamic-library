-- İslamic Library - Real Categories (18 Kategori - 4 Dil)
-- Bu script tüm kategorileri 4 dilde ekler (TR, EN, AZ, RU)
-- 17 Aralık 2025

-- Önce mevcut kategorileri temizle (isteğe bağlı - dikkatli kullanın!)
-- DELETE FROM categories;

-- Kategorileri ekle
INSERT INTO categories (name, name_translations, description_translations, icon, book_count) VALUES
-- 1. Imam Mahdi (a) / Məhdəviyyat
('Imam Mahdi (a)', 
 '{"tr": "İmam Mehdi (a)", "en": "Imam Mahdi (a)", "az": "Məhdəviyyat", "ru": "Имам Махди (а)"}',
 '{"tr": "İmam Mehdi (a) ile ilgili eserler", "en": "Works about Imam Mahdi (a)", "az": "Məhdəviyyat haqqında əsərlər", "ru": "Труды об Имаме Махди (а)"}',
 '', 0),

-- 2. Tarih / History
('Tarih',
 '{"tr": "Tarih", "en": "History", "az": "Tarix", "ru": "История"}',
 '{"tr": "İslam tarihi ve tarihsel eserler", "en": "Islamic history and historical works", "az": "İslam tarixi və tarixi əsərlər", "ru": "Исламская история и исторические труды"}',
 '', 0),

-- 3. Dua ve Ziyaretler
('Dua ve Ziyaretler',
 '{"tr": "Dua ve Ziyaretler", "en": "Supplications and Ziyarahs", "az": "Dua və ziyarət", "ru": "Дуа и зияраты"}',
 '{"tr": "Dualar ve ziyaret metinleri", "en": "Supplications and pilgrimage texts", "az": "Dualar və ziyarət mətnləri", "ru": "Молитвы и тексты зиярата"}',
 '', 0),

-- 4. Edebi Eser / Fiction
('Edebi Eser',
 '{"tr": "Edebi Eser", "en": "Fiction", "az": "Bədii ədəbiyyat", "ru": "Художественная литература"}',
 '{"tr": "Edebi eserler ve romanlar", "en": "Literary works and novels", "az": "Ədəbi əsərlər və romanlar", "ru": "Литературные произведения и романы"}',
 '', 0),

-- 5. Aile ve Sosyal İlişkiler
('Aile ve Sosyal İlişkiler',
 '{"tr": "Aile ve Sosyal İlişkiler", "en": "Family and Social Relations", "az": "Ailə və münasibətlər", "ru": "Семья и социальные отношения"}',
 '{"tr": "Aile hayatı ve sosyal ilişkiler", "en": "Family life and social relations", "az": "Ailə həyatı və sosial münasibətlər", "ru": "Семейная жизнь и социальные отношения"}',
 '', 0),

-- 6. Ahlak / Ethics
('Ahlak',
 '{"tr": "Ahlak", "en": "Ethics", "az": "Əxlaq", "ru": "Этика/Нравственность"}',
 '{"tr": "İslam ahlakı ve maneviyat", "en": "Islamic ethics and morality", "az": "İslam əxlaqı və mənəviyyat", "ru": "Исламская этика и нравственность"}',
 '', 0),

-- 7. Fıkıh ve Hukuk
('Fıkıh ve Hukuk',
 '{"tr": "Fıkıh ve Hukuk", "en": "Jurisprudence and Law", "az": "Əhkam və hüquq", "ru": "Фикх и право"}',
 '{"tr": "İslam hukuku ve fıkıh meseleleri", "en": "Islamic jurisprudence and law", "az": "İslam hüququ və fiqh məsələləri", "ru": "Исламское право и фикх"}',
 '', 0),

-- 8. İnanç ve İtikad
('İnanç ve İtikad',
 '{"tr": "İnanç ve İtikad", "en": "Beliefs and Theology", "az": "Əqidə və inanc", "ru": "Вера и богословие"}',
 '{"tr": "İslam inancı ve itikadi konular", "en": "Islamic beliefs and theology", "az": "İslam inancı və etiqadi mövzular", "ru": "Исламская вера и богословие"}',
 '', 0),

-- 9. İrfan ve Tasavvuf
('İrfan ve Tasavvuf',
 '{"tr": "İrfan ve Tasavvuf", "en": "Mysticism and Irfan", "az": "İrfan", "ru": "Ирфан и мистицизм"}',
 '{"tr": "İslam tasavvufu ve irfan", "en": "Islamic mysticism and spirituality", "az": "İslam təsəvvüfü və irfan", "ru": "Исламский мистицизм и духовность"}',
 '', 0),

-- 10. Hadis
('Hadis',
 '{"tr": "Hadis", "en": "Hadith", "az": "Hədis", "ru": "Хадисы"}',
 '{"tr": "Hadis külliyatı ve şerhleri", "en": "Hadith collections and commentaries", "az": "Hədis topluları və şərhləri", "ru": "Сборники хадисов и комментарии"}',
 '', 0),

-- 11. Kur'an ve Tefsir
('Kur''an ve Tefsir',
 '{"tr": "Kur''an ve Tefsir", "en": "Quran and Exegesis", "az": "Quran və təfsir", "ru": "Коран и тафсир"}',
 '{"tr": "Kur''an-ı Kerim ve tefsirleri", "en": "The Holy Quran and its exegesis", "az": "Quran və təfsirləri", "ru": "Священный Коран и его тафсир"}',
 '', 0),

-- 12. Tekfircilik
('Tekfircilik',
 '{"tr": "Tekfircilik", "en": "Takfirism", "az": "Təkfirçilik", "ru": "Такфиризм"}',
 '{"tr": "Tekfircilik ve aşırılık eleştirisi", "en": "Critique of takfirism and extremism", "az": "Təkfirçilik və ifratçılığın tənqidi", "ru": "Критика такфиризма и экстремизма"}',
 '', 0),

-- 13. Felsefe, Sosyoloji ve Siyaset
('Felsefe, Sosyoloji ve Siyaset',
 '{"tr": "Felsefe, Sosyoloji ve Siyaset", "en": "Philosophy, Sociology, and Politics", "az": "Fəlsəfə, sosiologiya və siyasət", "ru": "Философия, социология и политика"}',
 '{"tr": "İslam felsefesi, sosyoloji və siyaset", "en": "Islamic philosophy, sociology and politics", "az": "İslam fəlsəfəsi, sosiologiya və siyasət", "ru": "Исламская философия, социология и политика"}',
 '', 0),

-- 14. Masumlar (a)
('Masumlar (a)',
 '{"tr": "Masumlar (a)", "en": "The Infallibles (a)", "az": "Məsumlar (ə)", "ru": "Непогрешимые (а)"}',
 '{"tr": "On Dörd Masum (a) haqqında eserler", "en": "Works about the Fourteen Infallibles (a)", "az": "On Dörd Məsum (ə) haqqında əsərlər", "ru": "Труды о Четырнадцати Непогрешимых (а)"}',
 '', 0),

-- 15. Şiir, Gazel ve Mersiye
('Şiir, Gazel ve Mersiye',
 '{"tr": "Şiir, Gazel ve Mersiye", "en": "Poetry, Ghazals and Elegies", "az": "Şeir, qəzəl və mərsiyə", "ru": "Поэзия, газели и элегии"}',
 '{"tr": "Dini şiirler ve mersiyeler", "en": "Religious poetry and elegies", "az": "Dini şeirlər və mərsiyələr", "ru": "Религиозная поэзия и элегии"}',
 '', 0),  

-- 16. Çocuk Kitapları
('Çocuk Kitapları',
 '{"tr": "Çocuk Kitapları", "en": "Children''s Books", "az": "Uşaqlar üçün", "ru": "Детские книги"}',
 '{"tr": "Çocuklar için eğitici kitaplar", "en": "Educational books for children", "az": "Uşaqlar üçün təlim kitabları", "ru": "Образовательные книги для детей"}',
 '', 0),

-- 17. Biyografi
('Biyografi',
 '{"tr": "Biyografi", "en": "Biography", "az": "Bioqrafiya", "ru": "Биографии"}',
 '{"tr": "İslam büyüklerinin hayat hikâyeleri", "en": "Life stories of Islamic figures", "az": "İslam böyüklərinin həyat hekayələri", "ru": "Жизнеописания исламских деятелей"}',
 '', 0),

-- 18. Kişisel Gelişim ve Motivasyon
('Kişisel Gelişim ve Motivasyon',
 '{"tr": "Kişisel Gelişim ve Motivasyon", "en": "Self-Improvement", "az": "Şəxsi inkişaf və motivasiya", "ru": "Саморазвитие и мотивация"}',
 '{"tr": "Kişisel gelişim ve motivasyon", "en": "Personal development and motivation", "az": "Şəxsi inkişaf və motivasiya", "ru": "Личностное развитие и мотивация"}',
 '', 0);

-- ✅ Kategorileri kontrol et
SELECT 
  id,
  name,
  name_translations->>'tr' as name_tr,
  name_translations->>'en' as name_en,
  name_translations->>'az' as name_az,
  name_translations->>'ru' as name_ru,
  icon,
  book_count
FROM categories
ORDER BY name;

-- 📊 Kategori sayısını kontrol et
SELECT COUNT(*) as total_categories FROM categories;
