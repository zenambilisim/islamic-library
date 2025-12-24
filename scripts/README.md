# 📚 Book Uploader Script

Toplu kitap yükleme script'i. Local klasörlerden Supabase'e yüzlerce kitabı otomatik yükler.

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
cd scripts
npm install
```

### 2. Yapılandırma

`.env.example` dosyasını `.env` olarak kopyala ve düzenle:

```bash
cp .env.example .env
nano .env
```

`.env` içeriği:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BOOKS_FOLDER_PATH=../Books_en
LANGUAGE=en
DRY_RUN=true
```

> ⚠️ **ÖNEMLİ:** Service Role Key kullan (Anon Key değil!)

### 3. Test Et (Dry Run)

```bash
npm run upload:dry-run
```

Bu komut:
- ✅ Klasör yapısını kontrol eder
- ✅ Dosyaları bulur
- ✅ Ne yükleneceğini gösterir
- ❌ Hiçbir şey yüklemez

### 4. Gerçek Yükleme

`.env` dosyasında `DRY_RUN=false` yap ve çalıştır:

```bash
npm run upload
```

## 📁 Klasör Yapısı

```
Books_en/
  ├── Biography/
  │   └── Prophet Muhammad - Ibn Hisham/
  │       ├── Prophet Muhammad - Ibn Hisham.rtf   ← Açıklama
  │       ├── Prophet Muhammad - Ibn Hisham.pdf
  │       ├── Prophet Muhammad - Ibn Hisham.epub
  │       ├── Prophet Muhammad - Ibn Hisham.docx
  │       └── Prophet Muhammad - Ibn Hisham.png   ← Kapak
  ├── Ethics/
  └── ...
```

**Kural:**
- Klasör adı: `[KITAP ADI] - [YAZAR ADI]`
- Dosya isimleri klasör adıyla aynı olmalı
- RTF: Açıklama (opsiyonel)
- PDF & PNG: Zorunlu
- EPUB & DOCX: Opsiyonel

## 📊 İlerleme Takibi

Script çalışırken:

```
[1/245] 4% - Uploading: 82 Questions - Sayyid Abdul Husayn Dastghaib
  ├─ Cover uploaded: covers/82-questions.png
  ├─ PDF uploaded: books/82-questions/book.pdf
  ├─ EPUB uploaded: books/82-questions/book.epub
  ├─ Database record created: abc-123-xyz
  └─ ✅ Success (took 3.5s)

⏱️  Estimated time remaining: 12 minutes
```

## 📝 Log Dosyaları

- `logs/success.log` - Başarılı yüklemeler
- `logs/errors.log` - Hatalar
- `logs/upload-YYYY-MM-DD.log` - Detaylı log

## ⚙️ Komutlar

```bash
# Normal çalıştırma
npm run upload

# Test modu (hiçbir şey yüklenmez)
npm run upload:dry-run

# Test modu (alternatif)
npm test
```

## 🔧 Sorun Giderme

### "Connection timeout"
```bash
# Internet bağlantınızı kontrol edin
ping supabase.co
```

### "Invalid API key"
```bash
# Service Role Key'i doğru kopyaladığınızdan emin olun
# Supabase Dashboard → Settings → API → Service Role
```

### "Category not found"
```bash
# Kategorilerin veritabanında olduğundan emin olun
# insert-real-categories.sql script'ini çalıştırın
```

## 📚 Detaylı Dokümantasyon

Tam rehber için: [docs/BULK-BOOK-UPLOAD-GUIDE.md](../docs/BULK-BOOK-UPLOAD-GUIDE.md)

## 🔒 Güvenlik

- ❌ ASLA `.env` dosyasını git'e commit etme
- ❌ Service Role Key'i production koduna ekleme
- ✅ Script'i sadece local'de çalıştır
- ✅ `.gitignore` dosyasında `.env` olduğundan emin ol

## 📞 Destek

Sorun mu yaşıyorsun? [Issue aç](https://github.com/your-repo/issues)
