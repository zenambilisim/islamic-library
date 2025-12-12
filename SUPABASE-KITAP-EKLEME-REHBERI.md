# 📚 Supabase'e Kitap Ekleme Rehberi

## 🎯 Yöntem 1: SQL ile Hızlı Ekleme (Önerilen)

### Adım 1: Supabase Dashboard'a Giriş
1. https://supabase.com/dashboard 'a gidin
2. Projenizi seçin
3. Sol menüden **SQL Editor**'ü açın

### Adım 2: Test Kitaplarını Ekleyin
1. `add-sample-books.sql` dosyasını açın
2. İçeriği kopyalayın
3. Supabase SQL Editor'a yapıştırın
4. **RUN** butonuna tıklayın

✅ Bu işlem 5 örnek kitap ekleyecek (dosyalar olmadan)

---

## 🎯 Yöntem 2: Gerçek Dosyalarla Kitap Ekleme

### Adım 1: Supabase Storage'a Dosya Yükleme

#### 1.1 Storage Bucket'ı Kontrol Et
```sql
-- Supabase SQL Editor'da çalıştırın
SELECT * FROM storage.buckets WHERE id = 'books';
```

Eğer bucket yoksa:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', true);
```

#### 1.2 Dosyaları Storage'a Yükle

**A) Supabase Dashboard ile (Kolay):**
1. Sol menüden **Storage** seçin
2. **books** bucket'ını açın
3. **Upload file** butonuna tıklayın
4. Dosyaları sürükleyip bırakın:
   - `agir-itki-said-ellamin.pdf`
   - `agir-itki-said-ellamin.epub`
   - `agir-itki-said-ellamin.docx`
   - `agir-itki-cover.jpg` (kapak resmi)

**B) Klasör Yapısı (Önerilen):**
```
books/
  ├── covers/
  │   ├── agir-itki-cover.jpg
  │   ├── sahih-buhari-cover.jpg
  │   └── ...
  ├── pdf/
  │   ├── agir-itki.pdf
  │   └── ...
  ├── epub/
  │   ├── agir-itki.epub
  │   └── ...
  └── docx/
      ├── agir-itki.docx
      └── ...
```

#### 1.3 Public URL'leri Alın
Her dosyayı yükledikten sonra:
1. Dosyaya tıklayın
2. **Copy URL** butonuna tıklayın
3. URL'i bir yere kaydedin

URL formatı:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/books/pdf/agir-itki.pdf
```

### Adım 2: SQL ile Kitabı Ekleyin

```sql
INSERT INTO books (
  -- Temel Bilgiler
  title, title_tr, title_en, title_ru, title_az,
  author, author_tr, author_en, author_ru, author_az,
  description, description_tr, description_en, description_ru, description_az,
  
  -- Kategori (ID ile)
  category_id,
  
  -- Dosya URL'leri (Storage'dan aldığınız)
  cover_image,
  pdf_url,
  epub_url,
  doc_url
) VALUES (
  -- Başlıklar
  'Ağır İtki',
  'Ağır İtki',
  'Heavy Loss',
  'Тяжелая потеря',
  'Ağır İtki',
  
  -- Yazarlar
  'Səid Əllamian',
  'Said Ellamian',
  'Said Ellamian',
  'Саид Элламиан',
  'Səid Əllamian',
  
  -- Açıklamalar
  'Derin bir düşünce eseri.',
  'Derin bir düşünce eseri.',
  'A profound work of thought.',
  'Глубокое произведение мысли.',
  'Dərin düşüncə əsəri.',
  
  -- Kategori (örnek: Düşünce/Felsefe)
  (SELECT id FROM categories WHERE name_tr ILIKE '%düşünce%' OR name_tr ILIKE '%felsefe%' LIMIT 1),
  
  -- Dosya URL'leri (KEND URL'leriNİZLE DEĞİŞTİRİN!)
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/covers/agir-itki-cover.jpg',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/pdf/agir-itki.pdf',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/epub/agir-itki.epub',
  'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/docx/agir-itki.docx'
);
```

---

## 🎯 Yöntem 3: Mevcut Bir Kitabı Güncelleme

Eğer önce kitabı eklediyseniz, dosyaları sonradan ekleyebilirsiniz:

```sql
-- Kitabın ID'sini bulun
SELECT id, title_tr FROM books WHERE title_tr ILIKE '%ağır itki%';

-- ID ile güncelleyin (örnek: id = 123)
UPDATE books 
SET 
  pdf_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/pdf/agir-itki.pdf',
  epub_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/epub/agir-itki.epub',
  doc_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/docx/agir-itki.docx',
  cover_image = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/books/covers/agir-itki-cover.jpg'
WHERE id = 123;
```

---

## ✅ Doğrulama

### Eklenen Kitapları Kontrol Et
```sql
SELECT 
  id,
  title_tr as başlık,
  author_tr as yazar,
  (SELECT name_tr FROM categories WHERE id = books.category_id) as kategori,
  CASE 
    WHEN pdf_url IS NOT NULL THEN '✓ PDF'
    ELSE '✗ PDF'
  END as pdf,
  CASE 
    WHEN epub_url IS NOT NULL THEN '✓ EPUB'
    ELSE '✗ EPUB'
  END as epub,
  CASE 
    WHEN doc_url IS NOT NULL THEN '✓ DOC'
    ELSE '✗ DOC'
  END as doc,
  created_at
FROM books
ORDER BY created_at DESC
LIMIT 10;
```

### Storage Dosyalarını Kontrol Et
```sql
SELECT 
  name,
  bucket_id,
  created_at,
  metadata->>'size' as boyut_byte
FROM storage.objects
WHERE bucket_id = 'books'
ORDER BY created_at DESC;
```

---

## 🎨 Kapak Resmi Optimizasyonu

Kapak resimleri için önerilen boyutlar:
- **Genişlik**: 400-600px
- **Yükseklik**: 600-900px
- **Format**: JPG veya WebP
- **Boyut**: Max 500KB

Online araçlar:
- TinyPNG: https://tinypng.com
- ImageOptim: https://imageoptim.com

---

## 🚨 Yaygın Hatalar ve Çözümleri

### Hata 1: "Foreign key constraint violation"
**Sebep**: Geçersiz category_id  
**Çözüm**: 
```sql
-- Mevcut kategorileri listele
SELECT id, name_tr FROM categories;

-- Doğru category_id'yi kullan
```

### Hata 2: "Storage object not found"
**Sebep**: Dosya URL'i yanlış  
**Çözüm**: 
- Storage'da dosyayı bulun
- Public URL'i kopyalayın
- SQL'de güncelleyin

### Hata 3: "Permission denied for table books"
**Sebep**: RLS (Row Level Security) aktif  
**Çözüm**: 
```sql
-- Geçici olarak RLS'i devre dışı bırak (sadece test için!)
ALTER TABLE books DISABLE ROW LEVEL SECURITY;

-- Kitap ekle...

-- RLS'i tekrar aktif et
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
```

---

## 📖 Hızlı Başlangıç Özeti

1. ✅ `add-sample-books.sql` dosyasını Supabase SQL Editor'da çalıştır
2. ✅ 5 test kitabı eklenecek (dosyalar olmadan)
3. ✅ Frontend'de kitapları görüntüle
4. ✅ Gerçek dosyaları eklemek istersen:
   - Storage'a yükle
   - Public URL'leri al
   - SQL ile güncelle

---

## 🎯 Sırada Ne Var?

Kitapları ekledikten sonra:
1. ✅ Frontend'de görüntüleme
2. ✅ PDF okuyucu testi
3. ✅ İndirme butonları testi
4. ✅ Arama ve filtreleme testi

**İlk olarak test kitaplarını ekleyelim mi?** 🚀
