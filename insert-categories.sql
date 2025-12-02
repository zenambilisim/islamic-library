-- İslami kitap kategorilerini ekle
-- Not: Bu script'i Supabase SQL Editor'de çalıştırın

-- Önce mevcut kategorileri sil (isteğe bağlı)
-- DELETE FROM categories;

-- Kategorileri ekle
INSERT INTO categories (id, name, name_translations, description, description_translations, icon, book_count)
VALUES
  (
    gen_random_uuid(),
    'Akaid',
    '{"tr": "Akaid", "en": "Islamic Creed", "ru": "Исламская вера", "az": "İslam İnancı"}',
    'İslam inancının temel prensipleri ve akaid konuları',
    '{"tr": "İslam inancının temel prensipleri ve akaid konuları", "en": "Fundamental principles of Islamic faith and creed", "ru": "Основные принципы исламской веры и убеждений", "az": "İslam inancının əsas prinsipləri və əqidə mövzuları"}',
    '📿',
    0
  ),
  (
    gen_random_uuid(),
    'Hadis',
    '{"tr": "Hadis", "en": "Hadith", "ru": "Хадис", "az": "Hədis"}',
    'Hz. Muhammed''in (s.a.v) sözleri, fiilleri ve takrirleri',
    '{"tr": "Hz. Muhammed''in (s.a.v) sözleri, fiilleri ve takrirleri", "en": "Sayings, actions and approvals of Prophet Muhammad (pbuh)", "ru": "Слова, действия и одобрения Пророка Мухаммада (мир ему)", "az": "Hz. Məhəmmədin (s.ə.v) sözləri, əməlləri və təsdiqi"}',
    '📚',
    0
  ),
  (
    gen_random_uuid(),
    'Tefsir',
    '{"tr": "Tefsir", "en": "Quranic Exegesis", "ru": "Толкование Корана", "az": "Təfsir"}',
    'Kur''an-ı Kerim''in tefsiri ve açıklaması',
    '{"tr": "Kur''an-ı Kerim''in tefsiri ve açıklaması", "en": "Exegesis and explanation of the Holy Quran", "ru": "Толкование и объяснение Священного Корана", "az": "Qurəni-Kərimin təfsiri və izahı"}',
    '📖',
    0
  ),
  (
    gen_random_uuid(),
    'Fıkıh',
    '{"tr": "Fıkıh", "en": "Islamic Jurisprudence", "ru": "Исламская юриспруденция", "az": "Fiqh"}',
    'İslam hukuku ve ibadet şekilleri',
    '{"tr": "İslam hukuku ve ibadet şekilleri", "en": "Islamic law and forms of worship", "ru": "Исламское право и формы поклонения", "az": "İslam hüququ və ibadət formaları"}',
    '⚖️',
    0
  ),
  (
    gen_random_uuid(),
    'Siyer',
    '{"tr": "Siyer", "en": "Biography", "ru": "Биография", "az": "Sirə"}',
    'Hz. Muhammed''in (s.a.v) ve sahabelerinin hayatı',
    '{"tr": "Hz. Muhammed''in (s.a.v) ve sahabelerinin hayatı", "en": "Life of Prophet Muhammad (pbuh) and his companions", "ru": "Жизнь Пророка Мухаммада (мир ему) и его сподвижников", "az": "Hz. Məhəmmədin (s.ə.v) və səhabələrinin həyatı"}',
    '👤',
    0
  ),
  (
    gen_random_uuid(),
    'Tasavvuf',
    '{"tr": "Tasavvuf", "en": "Sufism", "ru": "Суфизм", "az": "Təsəvvüf"}',
    'İslam''da manevi arınma ve tasavvuf yolu',
    '{"tr": "İslam''da manevi arınma ve tasavvuf yolu", "en": "Spiritual purification and the Sufi path in Islam", "ru": "Духовное очищение и суфийский путь в исламе", "az": "İslamda mənəvi təmizlənmə və təsəvvüf yolu"}',
    '🕌',
    0
  ),
  (
    gen_random_uuid(),
    'İslam Tarihi',
    '{"tr": "İslam Tarihi", "en": "Islamic History", "ru": "История ислама", "az": "İslam Tarixi"}',
    'İslam medeniyeti ve tarihi',
    '{"tr": "İslam medeniyeti ve tarihi", "en": "Islamic civilization and history", "ru": "Исламская цивилизация и история", "az": "İslam sivilizasiyası və tarixi"}',
    '🏛️',
    0
  ),
  (
    gen_random_uuid(),
    'Dua ve Zikir',
    '{"tr": "Dua ve Zikir", "en": "Prayers & Dhikr", "ru": "Молитвы и зикр", "az": "Dua və Zikr"}',
    'Dualar, zikirler ve tesbihler',
    '{"tr": "Dualar, zikirler ve tesbihler", "en": "Prayers, remembrance and glorification of Allah", "ru": "Молитвы, поминание и прославление Аллаха", "az": "Dualar, zikrlər və təsbihlər"}',
    '🤲',
    0
  ),
  (
    gen_random_uuid(),
    'Kur''an İlimleri',
    '{"tr": "Kur''an İlimleri", "en": "Quranic Sciences", "ru": "Кораническая наука", "az": "Quran Elmləri"}',
    'Kur''an''ın okunuşu, yazımı ve ilimleri',
    '{"tr": "Kur''an''ın okunuşu, yazımı ve ilimleri", "en": "Recitation, writing and sciences of the Quran", "ru": "Чтение, письмо и науки Корана", "az": "Quranın oxunuşu, yazılışı və elmləri"}',
    '📜',
    0
  ),
  (
    gen_random_uuid(),
    'Ahlak ve Edep',
    '{"tr": "Ahlak ve Edep", "en": "Morals & Ethics", "ru": "Мораль и этика", "az": "Əxlaq və Ədəb"}',
    'İslam ahlakı ve güzel davranışlar',
    '{"tr": "İslam ahlakı ve güzel davranışlar", "en": "Islamic morals and good conduct", "ru": "Исламская мораль и хорошее поведение", "az": "İslam əxlaqı və gözəl davranışlar"}',
    '💚',
    0
  );

-- Kategorileri kontrol et
SELECT * FROM categories ORDER BY name;

-- Not: book_count değerleri, kitaplar eklendiğinde veya bir trigger ile otomatik güncellenebilir
-- Şimdilik manuel olarak güncellemek için:
UPDATE categories c
SET book_count = (
  SELECT COUNT(*) FROM books b WHERE b.category = c.name
);

-- Güncellenmiş kategorileri kontrol et
SELECT name, book_count FROM categories ORDER BY name;
