# 🔧 Storage Setup - Step by Step Kılavuz

Bu dosyalar Storage yapılandırmasını adım adım yapmak için hazırlanmıştır.

## 📋 Çalıştırma Sırası

### 1️⃣ `storage-step-1-public-bucket.sql`
**Ne yapar:** Bucket'ın public olup olmadığını kontrol eder

**Nasıl kullanılır:**
1. Supabase Dashboard → SQL Editor
2. Dosyayı aç ve çalıştır
3. Sonuca bak:
   - `public = true` ✅ Tamam, bir sonraki adıma geç
   - `public = false` ❌ Dosyadaki yorumu kaldır ve UPDATE sorgusunu çalıştır

---

### 2️⃣ `storage-step-2-check-policies.sql`
**Ne yapar:** Mevcut storage politikalarını kontrol eder

**Nasıl kullanılır:**
1. Dosyayı çalıştır
2. Sonuca bak:
   - **Sonuç varsa:** ✅ Politika zaten var, STEP 4'e geç
   - **Sonuç boşsa:** ❌ Politika yok, STEP 3'e geç

---

### 3️⃣ `storage-step-3-add-policy.sql`
**Ne yapar:** Public read politikası ekler

**Nasıl kullanılır:**
1. SADECE STEP 2'de politika yoksa çalıştır
2. "Success. No rows returned" göreceksin ✅
3. Hata alırsan (politika zaten var), STEP 4'e geç

**Olası hatalar:**
- `duplicate key value` → Politika zaten var, sorun yok!

---

### 4️⃣ `storage-step-4-check-urls.sql`
**Ne yapar:** Books tablosundaki cover_image_url formatlarını kontrol eder

**Nasıl kullanılır:**
1. Dosyayı çalıştır
2. Her kitap için durum göreceksin:
   - ✅ DOĞRU → Her şey tamam
   - ⚠️ PREFIX YOK → Çalışır ama ideal değil
   - ⚠️ TAM URL → Düzeltilmeli (aşağıdaki örneğe bak)
   - ❌ NULL/BOŞ → Storage'a resim yükle ve URL'i ekle

**TAM URL'leri düzeltmek için:**
```sql
UPDATE books 
SET cover_image_url = REPLACE(
  cover_image_url,
  'https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/',
  ''
)
WHERE cover_image_url LIKE 'https://%';
```

---

### 5️⃣ `storage-step-5-check-book-files.sql`
**Ne yapar:** book_files tablosundaki file_url formatlarını kontrol eder

**Nasıl kullanılır:**
1. Dosyayı çalıştır
2. Her dosya için durum göreceksin:
   - ✅ DOĞRU → Her şey tamam
   - ⚠️ PREFIX YOK → Çalışır ama ideal değil
   - ⚠️ TAM URL → Düzeltilmeli
   - ❌ NULL/BOŞ → Dosya ekle

**Hiç sonuç dönmezse:**
- book_files tablosu boş demektir
- Aşağıdaki örnekle dosya ekleyin

**Örnek book_file ekleme:**
```sql
INSERT INTO book_files (book_id, format, file_url, file_size_mb, file_size_text)
VALUES 
  (
    'kitap-id-buraya',  -- books tablosundan al
    'pdf',
    'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf',
    2.5,
    '2.5 MB'
  );
```

---

## 🎯 Hızlı Kontrol

`quick-storage-check.sql` dosyasını kullanarak tüm durumu tek seferde görebilirsiniz:
- Bucket public mu?
- Politikalar var mı?

Bu dosya sadece KONTROL için kullanılır, değişiklik yapmaz.

---

## ✅ Tamamlanma Kontrol Listesi

Tüm adımları tamamladıktan sonra:

- [ ] Bucket public ✅
- [ ] Read politikası var ✅
- [ ] Cover URL'leri doğru formatta ✅
- [ ] Book files URL'leri doğru formatta ✅

**Test et:**
```bash
npm run dev
```

Tarayıcıda console'u aç (F12) ve şunu gör:
```
✅ Fetched X books from Supabase
🔍 Sample book URLs: { coverImage: "https://..." }
```

---

## 🆘 Yardım

### Hata: "relation storage.policies does not exist"
**Çözüm:** Supabase Storage extension'ı kurulu değil. Otomatik kurulur, projeyi refresh edin.

### Hata: "permission denied for schema storage"
**Çözüm:** Admin yetkileri gerekiyor. Supabase Dashboard'dan çalıştırın, psql'den değil.

### Kapak resimleri görünmüyor
1. `storage-step-4` çalıştır → URL'leri kontrol et
2. Storage → book-assets → covers → Dosyalar var mı?
3. Bucket public mu?
4. Console'da 403/404 hatası var mı?

### İndirme linkleri çalışmıyor
1. `storage-step-5` çalıştır → book_files kontrol et
2. Storage → book-assets → books → Dosyalar var mı?
3. Database'de book_files kayıtları var mı?

---

**🎉 Başarılar!**
