# 📚 Kategori Entegrasyonu - Kurulum Rehberi

Bu rehber, İslamic Library projesine kategorilerin nasıl entegre edileceğini adım adım açıklar.

## 🎯 Genel Bakış

Kategoriler artık Supabase'den dinamik olarak çekiliyor. Her kategori:
- Çoklu dil desteği (TR, EN, RU, AZ)
- Özel ikon
- Otomatik kitap sayısı güncelleme
- Kitaplarla otomatik eşleşme

## 📋 Kurulum Adımları

### 1. Kategorileri Supabase'e Ekleyin

Supabase Dashboard → SQL Editor'e gidin ve `insert-categories.sql` dosyasını çalıştırın:

```bash
# Dosya içeriği otomatik olarak 10 ana kategori ekler:
- Akaid (İslam İnancı)
- Hadis
- Tefsir (Kur'an Tefsiri)
- Fıkıh (İslam Hukuku)
- Siyer (Peygamber Biyografisi)
- Tasavvuf
- İslam Tarihi
- Dua ve Zikir
- Kur'an İlimleri
- Ahlak ve Edep
```

### 2. Mevcut Kitap Kategorilerini Normalize Edin

Eğer veritabanında zaten kitaplar varsa ve kategorileri farklı şekilde yazılmışsa:

```bash
# normalize-categories.sql dosyasını çalıştırın
# Bu, tüm kitap kategorilerini standart kategori isimleriyle eşleştirir
```

Örnek eşleştirmeler:
- "hadis", "hadith", "sünnet" → "Hadis"
- "tefsir", "tafsir", "kuran tefsiri" → "Tefsir"
- "fıkıh", "fiqh", "hukuk" → "Fıkıh"

### 3. Otomatik Güncelleme Trigger'larını Kurun

Kategorilerin `book_count` değerini otomatik güncellemek için:

```bash
# setup-category-triggers.sql dosyasını çalıştırın
# Bu, kitap eklendiğinde/silindiğinde otomatik güncelleme yapar
```

Trigger'lar şu durumlarda çalışır:
- ✅ Yeni kitap eklendiğinde
- ✅ Kitap kategorisi değiştirildiğinde
- ✅ Kitap silindiğinde

### 4. Mevcut Durumu Kontrol Edin

```bash
# check-categories.sql dosyasını çalıştırın
# Bu, kategorileri ve kitap sayılarını gösterir
```

## 🧪 Test Etme

### Frontend'de Test

1. **Uygulamayı başlatın:**
```bash
npm run dev
```

2. **Kategoriler sayfasına gidin:**
   - http://localhost:5173/categories (veya ilgili route)

3. **Kontrol edin:**
   - ✅ Kategoriler görünüyor mu?
   - ✅ Kitap sayıları doğru mu?
   - ✅ Kategori açıklamaları çoklu dilde görünüyor mu?
   - ✅ Kategoriye tıklayınca kitaplar listeleniyor mu?

### Konsol Log'larını İzleyin

Tarayıcı konsolunda şu mesajları göreceksiniz:

```
📂 Fetching categories from Supabase...
✅ Fetched 10 categories from Supabase
🔍 Sample category: { name: 'Akaid', bookCount: 5, icon: '📿' }
```

## 🔍 Veritabanı Yapısı

### `categories` Tablosu

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_translations JSONB NOT NULL,
  description TEXT,
  description_translations JSONB,
  icon TEXT NOT NULL,
  book_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### `books` Tablosu İlişkisi

Kitaplar, `category` alanıyla kategorilere bağlanır:

```sql
books.category = categories.name
```

**Önemli:** İlişki `category.id` değil, `category.name` ile kurulur.

## 🚨 Sorun Giderme

### Kategoriler Görünmüyor

1. **Supabase bağlantısını kontrol edin:**
```bash
# .env dosyasında:
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. **RLS politikalarını kontrol edin:**
```sql
-- Kategorilere okuma izni var mı?
SELECT * FROM categories; -- Bu sorgu başarılı olmalı
```

3. **Konsol hatalarını kontrol edin:**
```javascript
// Tarayıcı konsolunda hata var mı?
// Network tabında Supabase istekleri başarılı mı?
```

### Kitap Sayıları Yanlış

```sql
-- Manuel güncelleme:
UPDATE categories c
SET book_count = (
  SELECT COUNT(*) FROM books b WHERE b.category = c.name
);
```

### Kategori İkonları Görünmüyor

Emoji'ler desteklenmelidir. Eğer görünmüyorsa:
- Tarayıcınızın emoji desteğini kontrol edin
- Farklı emoji setleri deneyin

## 📊 Kategori İstatistikleri

Kategoriler sayfası şu istatistikleri gösterir:

- **Toplam Kategori Sayısı**: Aktif kategorilerin sayısı
- **Toplam Kitap Sayısı**: Tüm kitapların toplamı
- **Toplam İndirme**: Tüm kitapların indirme sayıları toplamı

## 🔄 Güncellemeler

### Yeni Kategori Eklemek

```sql
INSERT INTO categories (name, name_translations, description, description_translations, icon, book_count)
VALUES (
  'Yeni Kategori',
  '{"tr": "Yeni Kategori", "en": "New Category", "ru": "Новая категория", "az": "Yeni Kateqoriya"}',
  'Açıklama',
  '{"tr": "Türkçe açıklama", "en": "English description", "ru": "Русское описание", "az": "Azərbaycan təsviri"}',
  '🆕',
  0
);
```

### Kategori Silmek

```sql
-- Önce o kategorideki kitapları başka bir kategoriye taşıyın
UPDATE books SET category = 'Akaid' WHERE category = 'Eski Kategori';

-- Sonra kategoriyi silin
DELETE FROM categories WHERE name = 'Eski Kategori';
```

## 📝 Notlar

- Kategoriler `name` ile eşleşir (ID ile değil)
- Tüm kategoriler çoklu dil desteğine sahip
- `book_count` otomatik güncellenir (trigger sayesinde)
- RLS politikaları sadece okuma izni verir (güvenlik)

## 🎨 Özelleştirme

### Kategori İkonlarını Değiştirmek

```sql
UPDATE categories 
SET icon = '🕌' 
WHERE name = 'Tasavvuf';
```

### Kategori Açıklamalarını Güncellemek

```sql
UPDATE categories 
SET 
  description = 'Yeni açıklama',
  description_translations = '{
    "tr": "Türkçe açıklama",
    "en": "English description",
    "ru": "Русское описание",
    "az": "Azərbaycan təsviri"
  }'::jsonb
WHERE name = 'Hadis';
```

## ✅ Başarı Kontrol Listesi

- [ ] `insert-categories.sql` çalıştırıldı
- [ ] `normalize-categories.sql` çalıştırıldı (eğer gerekiyorsa)
- [ ] `setup-category-triggers.sql` çalıştırıldı
- [ ] `check-categories.sql` ile veriler kontrol edildi
- [ ] Frontend'de kategoriler görünüyor
- [ ] Kitap sayıları doğru
- [ ] Kategori detayları açılıyor
- [ ] Çoklu dil çalışıyor

## 🆘 Yardım

Sorun yaşıyorsanız:
1. Konsol log'larını kontrol edin
2. Supabase Dashboard'da verileri kontrol edin
3. Network tabında API çağrılarını kontrol edin
4. SQL script'lerini sırasıyla tekrar çalıştırın

---

**Son Güncelleme:** 2024
**Durum:** ✅ Tam entegre, test edilmiş
