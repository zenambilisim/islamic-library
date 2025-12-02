# 🚀 Hızlı Başlangıç - İslamic Library

## 5 Dakikada Kurulum

### 1️⃣ Supabase'de Kategorileri Oluşturun (2 dakika)

Supabase Dashboard'a gidin → SQL Editor → Yeni sorgu oluşturun:

```sql
-- Kopyala-yapıştır: insert-categories.sql dosyasının tamamını
-- Veya aşağıdaki komutu çalıştırın:
```

👉 Dosyayı açın: `insert-categories.sql`  
👉 Tüm içeriği kopyalayın ve SQL Editor'e yapıştırın  
👉 **Run** butonuna tıklayın  

**Sonuç:** ✅ 10 kategori oluşturuldu!

---

### 2️⃣ Kategori Trigger'larını Kurun (1 dakika)

Aynı şekilde:

```sql
-- setup-category-triggers.sql dosyasını çalıştırın
```

👉 Dosyayı açın: `setup-category-triggers.sql`  
👉 Tüm içeriği kopyalayın ve SQL Editor'e yapıştırın  
👉 **Run** butonuna tıklayın  

**Sonuç:** ✅ Otomatik güncelleme sistemi aktif!

---

### 3️⃣ Mevcut Kitapları Normalize Edin (1 dakika) *[Opsiyonel]*

Eğer zaten kitaplarınız varsa ve kategorileri farklı yazılmışsa:

```sql
-- normalize-categories.sql dosyasını çalıştırın
```

**Bu adımı atlayabilirsiniz** eğer:
- ❌ Henüz kitap eklemediniz
- ❌ Kitaplarınız zaten doğru kategori isimlerine sahip

---

### 4️⃣ Kontrol Edin (1 dakika)

```sql
-- check-categories.sql dosyasını çalıştırın
```

**Beklenen sonuç:**
```
name              | book_count
------------------|-----------
Akaid             | 0
Hadis             | 0
Tefsir            | 0
...
```

Eğer kitaplarınız varsa, `book_count` 0'dan büyük olmalı.

---

### 5️⃣ Uygulamayı Başlatın (10 saniye)

Terminal'de:

```bash
npm run dev
```

**Tarayıcıda aç:** http://localhost:5173/categories

---

## ✅ Hızlı Kontrol Listesi

Kategoriler sayfasında görecekleriniz:

### Kategoriler
- [ ] 10 kategori kartı görünüyor
- [ ] Her kartda emoji ikon var
- [ ] Kategori isimleri görünüyor
- [ ] "X kitap" yazısı görünüyor
- [ ] Açıklamalar görünüyor

### Fonksiyonellik
- [ ] Kategoriye tıklayınca kitaplar açılıyor
- [ ] "Kategorilere Dön" butonu çalışıyor
- [ ] Dil değişimi çalışıyor
- [ ] Arama fonksiyonu çalışıyor

### İstatistikler (Sayfa altında)
- [ ] Toplam kategori sayısı: 10
- [ ] Toplam kitap sayısı: X (kitap sayınıza göre)
- [ ] Toplam indirme: X

---

## 🚨 Sorun mu var?

### "Kategoriler yüklenemedi"
```bash
# Çözüm:
1. .env dosyasını kontrol edin (VITE_SUPABASE_URL ve KEY var mı?)
2. Supabase Dashboard'da categories tablosu var mı kontrol edin
3. insert-categories.sql çalıştırıldı mı kontrol edin
```

### "book_count her zaman 0"
```bash
# Çözüm:
1. setup-category-triggers.sql çalıştırıldı mı?
2. Kitaplarınızın category alanı dolu mu?
3. Kitap kategorileri, category tablosundaki name değerleriyle eşleşiyor mu?
```

### "Kategoriler boş görünüyor"
```bash
# Çözüm:
1. Tarayıcı konsolunu açın (F12)
2. Hata mesajlarını kontrol edin
3. Network tabında Supabase isteklerini kontrol edin
4. RLS politikalarının aktif olduğundan emin olun
```

---

## 🎯 Sonraki Adım

Şimdi kitap ekleyin! İki yöntem:

### Yöntem 1: SQL ile
```sql
INSERT INTO books (title, author, category, language, download_count)
VALUES ('Örnek Kitap', 'Yazar Adı', 'Hadis', 'tr', 0);
```

### Yöntem 2: Supabase Dashboard
1. Table Editor'e git
2. books tablosunu seç
3. "Insert row" tıkla
4. Bilgileri doldur
5. Kaydet

---

## 📚 Daha Fazla Bilgi

- **Detaylı kurulum:** `CATEGORIES-SETUP.md`
- **Tüm entegrasyon:** `SUPABASE-INTEGRATION.md`
- **Özet rapor:** `CATEGORY-INTEGRATION-SUMMARY.md`

---

**Kurulum Süresi:** ~5 dakika  
**Zorluk:** ⭐ Çok kolay  
**Sonuç:** 🎉 Kategoriler çalışıyor!
