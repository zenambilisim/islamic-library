# 🔐 Supabase Güvenlik ve Entegrasyon Kılavuzu

## ✅ Tamamlanan İşlemler

### 1. Güvenlik Politikaları (RLS)
`setup-security.sql` dosyası oluşturuldu. Bu SQL komutlarını Supabase Dashboard'da çalıştırın:

**Nereye?**
- Supabase Dashboard → SQL Editor → New Query
- `setup-security.sql` dosyasındaki SQL'leri yapıştırıp çalıştırın

**Ne Yapar?**
- ✅ Tüm tablolara Row Level Security (RLS) aktifleştirir
- ✅ Sadece **SELECT (Okuma)** izni verir
- ✅ **INSERT, UPDATE, DELETE** işlemlerini engeller
- ✅ Hiçbir kullanıcı database'e yazamaz - Tamamen güvenli!

### 2. Type Converter (`src/lib/converters.ts`)
- Supabase'in `snake_case` formatını frontend'in `camelCase` formatına dönüştürür
- Çoklu dil desteği için translation mapping yapar
- Book files'ı formats objesine dönüştürür

### 3. Custom Hook (`src/hooks/useSupabaseBooks.ts`)
- `useSupabaseBooks()` - Tüm kitapları getirir
- `useSupabaseBooksByCategory(category)` - Kategoriye göre filtreler
- `getBookById(id)` - Tek kitap getirir
- Otomatik loading ve error handling

### 4. HomePage Entegrasyonu (`src/pages/HomePage.tsx`)
- Mock data kaldırıldı ✅
- Supabase'den real-time veri çekiliyor ✅
- Loading ve error state'leri eklendi ✅
- Arama ve filtreleme çalışıyor ✅

## 🚀 Kurulum Adımları

### Adım 1: Environment Variables
`.env` dosyanızı kontrol edin:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Nerede Bulunur?**
1. Supabase Dashboard → Project Settings → API
2. **Project URL** → `VITE_SUPABASE_URL`
3. **Project API Keys** → `anon` `public` → `VITE_SUPABASE_ANON_KEY`

⚠️ **UYARI**: `service_role` key'i ASLA kullanmayın! Sadece `anon` key güvenlidir.

### Adım 2: Güvenlik Politikalarını Aktifleştir
```bash
# Supabase Dashboard'da SQL Editor'ü aç
# setup-security.sql dosyasındaki SQL'leri kopyala-yapıştır
# Run tuşuna bas
```

### Adım 3: Uygulamayı Başlat
```bash
npm install
npm run dev
```

## 📊 Database Yapısı

### Books Tablosu
```sql
- id (uuid, primary key)
- title (text)
- title_translations (jsonb)
- author (text)
- author_translations (jsonb)
- category (text)
- category_translations (jsonb)
- description (text)
- description_translations (jsonb)
- publish_year (integer)
- pages (integer)
- language (text)
- cover_image_url (text)
- file_size (text)
- download_count (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

### Book_Files Tablosu
```sql
- id (uuid, primary key)
- book_id (uuid, foreign key → books.id)
- format (text: 'pdf', 'epub', 'docx')
- file_url (text)
- file_size_mb (numeric)
- file_size_text (text)
- created_at (timestamp)
```

## 🔒 Güvenlik Özellikleri

### ✅ Uygulanan Güvenlik
1. **Row Level Security (RLS)** - Aktif
2. **Sadece Okuma İzni** - SELECT only
3. **Yazma İşlemleri Engellenmiş** - INSERT/UPDATE/DELETE blocked
4. **Public Anon Key** - Güvenli frontend kullanımı
5. **Service Role Key** - Frontend'de KULLANILMIYOR

### ❌ Yapılamayan İşlemler (Frontend'den)
- ❌ Kitap ekleme
- ❌ Kitap güncelleme
- ❌ Kitap silme
- ❌ Kategori ekleme/düzenleme
- ❌ Dosya yükleme

### ✅ Yapılabilen İşlemler
- ✅ Kitapları listeleme
- ✅ Kitap detaylarını görüntüleme
- ✅ Arama yapma
- ✅ Filtreleme
- ✅ Dosya linkleri (okuma için)

## 🧪 Test Etme

### 1. Console'da Test
```javascript
// Browser Console'da test et:
const { data, error } = await supabase.from('books').select('*');
console.log(data);
```

### 2. Yazma İşlemini Test Et (Başarısız Olmalı!)
```javascript
// Bu işlem HATA vermeli:
const { error } = await supabase.from('books').insert({
  title: 'Test Book'
});
console.log(error); // RLS policy violation hatası almalısınız
```

## 📝 Sık Sorulan Sorular

### Q: Database'e nasıl veri ekleyeceğim?
**A:** Supabase Dashboard → Table Editor'den manuel olarak ekleyebilirsiniz veya backend API oluşturabilirsiniz.

### Q: Anon key güvenli mi?
**A:** Evet! RLS politikaları aktif olduğunda anon key sadece belirlediğiniz işlemleri yapabilir.

### Q: Service Role key nerede kullanılır?
**A:** Sadece backend/server-side kodlarda kullanılır. Frontend'de ASLA kullanılmamalı!

### Q: Mock data'yı nasıl Supabase'e aktarırım?
**A:** `src/data/mockData.ts` dosyasındaki verileri SQL INSERT komutlarına çevirip Supabase'de çalıştırabilirsiniz.

## 🎯 Sonraki Adımlar

1. ✅ Güvenlik SQL'lerini çalıştır
2. ✅ Environment variables'ı ayarla
3. ✅ Uygulamayı test et
4. 🔄 Kategoriler sayfasını entegre et
5. 🔄 Yazarlar sayfasını entegre et
6. 🔄 Admin paneli oluştur (opsiyonel)

## 🐛 Hata Ayıklama

### "Invalid API key" Hatası
- `.env` dosyasını kontrol et
- Uygulamayı yeniden başlat (`npm run dev`)
- Browser cache'i temizle

### "RLS policy violation" Hatası
- `setup-security.sql` çalıştırıldı mı?
- Politikalar doğru mu?
- Supabase Dashboard → Authentication → Policies'i kontrol et

### "No data returned" Hatası
- Database'de veri var mı?
- Table Editor'den kontrol et
- SQL Query test et

## 📞 Yardım

Sorun yaşarsanız:
1. Console'daki hata mesajlarını kontrol edin
2. Supabase Dashboard → Logs'u inceleyin
3. Network tab'ı kontrol edin (API çağrıları)

---

**🎉 Başarılar! Artık güvenli, read-only Supabase entegrasyonu hazır!**
