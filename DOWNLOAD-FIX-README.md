# 📥 İndirme Butonu Düzeltme Kılavuzu

## 🔍 Sorun Neydi?

1. ✅ Fotoğraflar görünüyor (Çözüldü!)
2. ❌ İndirme butonları tıklanınca dosya açılmıyor/indirilmiyor

## 🛠️ Yapılan Düzeltmeler

### 1. BookDetailModal ve BookCard Güncellenmiş
- ✅ `download={filename}` attribute eklendi
- ✅ `target="_blank"` eklendi
- ✅ `rel="noopener noreferrer"` güvenlik için eklendi

### 2. Database Path'leri Kontrol
- ⚠️ `book_files` tablosundaki path'ler kontrol edilmeli
- ⚠️ `books/` prefix'i olmalı

---

## 📋 YAPILACAKLAR

### Adım 1: File Path'lerini Kontrol Et
**Dosya:** `check-file-paths.sql`

1. Supabase Dashboard → SQL Editor
2. `check-file-paths.sql` dosyasını çalıştır
3. Sonuçtaki `tam_url`'leri tara yıcıda aç
4. Eğer dosya açılıyorsa ✅ path doğru
5. Eğer 404 hatası alıyorsan ❌ path yanlış

---

### Adım 2: Path'leri Düzelt (Gerekirse)
**Dosya:** `fix-file-paths.sql`

Eğer Adım 1'de 404 hatası aldıysanız:
1. `fix-file-paths.sql` dosyasını çalıştır
2. Bu script otomatik olarak `books/` prefix'i ekleyecek
3. Kontrol sorgusunu çalıştır

---

### Adım 3: Uygulamayı Test Et

```bash
npm run dev
```

**Tarayıcıda:**
1. Ana sayfaya git
2. Bir kitap kartına tıkla
3. Modal'da indirme butonlarını test et
4. Tarayıcı console'unu aç (F12)

**Beklenen Davranış:**
- ✅ Butona tıklanınca dosya indirilmeli
- ✅ Dosya adı: `Ağır İtki.pdf` (veya epub/docx)
- ✅ Console'da hata olmamalı

---

## 🔍 Troubleshooting

### Dosya hala indirilmiyor

**1. Console'da 404 hatası varsa:**
```
Problem: Storage'da dosya yok veya path yanlış
Çözüm: Storage'ı kontrol et:
  - Supabase → Storage → book-assets → books
  - agir-itki-said-ellamin klasörü var mı?
  - İçinde PDF, EPUB, DOCX var mı?
```

**2. CORS hatası varsa:**
```
Problem: Storage bucket ayarları yanlış
Çözüm: 
  - Storage → book-assets → Configuration
  - Public bucket olarak işaretle
  - CORS ayarlarını kontrol et
```

**3. Dosya açılıyor ama indirilmiyor:**
```
Problem: Tarayıcı PDF'i inline gösteriyor
Çözüm: Bu normaldir! Kullanıcı tarayıcıda sağ tık → "Farklı Kaydet" yapabilir
VEYA: Content-Disposition header'ı "attachment" olarak ayarlanmalı (Storage ayarları)
```

---

## 📊 Database Path Formatı

### ✅ DOĞRU Format:
```sql
file_url: 'books/agir-itki-said-ellamin/agir-itki-said-ellamin.pdf'
```

### ❌ YANLIŞ Formatlar:
```sql
file_url: 'agir-itki-said-ellamin/agir-itki-said-ellamin.pdf'  -- books/ yok
file_url: '/books/agir-itki-said-ellamin/...'                   -- Başta / var
file_url: 'https://....supabase.co/storage/...'                 -- Tam URL
```

---

## 🎯 Beklenen Sonuç URL'leri

**PDF için:**
```
https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/books/agir-itki-said-ellamin/agir-itki-said-ellamin.pdf
```

**EPUB için:**
```
https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/books/agir-itki-said-ellamin/agir-itki-said-ellamin.epub
```

**DOCX için:**
```
https://ntwmbiorpdzpyfhglptr.supabase.co/storage/v1/object/public/book-assets/books/agir-itki-said-ellamin/agir-itki-said-ellamin.docx
```

---

## ✅ Kontrol Listesi

- [ ] `check-file-paths.sql` çalıştırıldı
- [ ] URL'ler tarayıcıda test edildi
- [ ] Gerekirse `fix-file-paths.sql` çalıştırıldı
- [ ] Uygulama yeniden başlatıldı (`npm run dev`)
- [ ] İndirme butonları tıklandı
- [ ] Dosyalar başarıyla indirildi ✅

---

**💡 Not:** Bazı tarayıcılar PDF dosyalarını otomatik olarak açar. Bu normaldir ve sorun değildir. Kullanıcı isterse "Farklı Kaydet" yapabilir.

**🎉 Başarılar!**
