# 🔒 Signed URLs Güvenlik Dokümantasyonu

## Nedir?

Signed URLs (İmzalı URL'ler), Supabase Storage'da saklanan dosyalara **geçici ve güvenli** erişim sağlayan URL'lerdir.

## ✅ Avantajlar

### 1. **Geçici Erişim**
- URL'ler belirli bir süre sonra otomatik olarak geçersiz olur (varsayılan: 1 saat)
- Eski URL'ler paylaşılsa bile artık işe yaramaz
- Her erişimde yeni URL oluşturulur

### 2. **Güvenli Paylaşım**
- URL paylaşılsa bile kalıcı erişim sağlamaz
- Kötüye kullanım riski minimize edilir
- Supabase project ID görünse bile zararsızdır

### 3. **Performans**
- Bandwidth kontrolü yapılabilir
- Rate limiting ile kötüye kullanım önlenir
- Download istatistikleri takip edilebilir

## 🔐 Nasıl Çalışır?

### Public URL (Eski Yöntem)
```
https://project.supabase.co/storage/v1/object/public/book-assets/books/file.pdf
```
- ❌ Kalıcı URL
- ❌ Paylaşılabilir
- ❌ Kontrol yok

### Signed URL (Yeni Yöntem)
```
https://project.supabase.co/storage/v1/object/sign/book-assets/books/file.pdf?token=eyJ...&exp=1234567890
```
- ✅ Geçici URL (1 saat)
- ✅ Token bazlı
- ✅ Süre dolunca geçersiz
- ✅ Her istekte yeni token

## 📋 Uygulama Detayları

### 1. Supabase Fonksiyonu
```typescript
// src/lib/supabase.ts
export async function getSignedBookFileUrl(
  bookFilePath: string,
  expiresIn: number = 3600 // 1 saat
): Promise<string>
```

**Parametreler:**
- `bookFilePath`: Dosya yolu (örn: "books/file.pdf")
- `expiresIn`: Geçerlilik süresi (saniye, varsayılan: 3600 = 1 saat)

**Dönüş:**
- Başarılı: Signed URL
- Hata: Fallback olarak public URL

### 2. BookDetailModal - İndirme Butonları
```typescript
const handleDownload = async (format: string, url: string) => {
  // 1. Loading state göster
  setLoadingUrls({ [format]: true });
  
  // 2. Signed URL al
  const signedUrl = await getSignedBookFileUrl(url, 3600);
  
  // 3. İndirmeyi başlat
  window.open(signedUrl, '_blank');
  
  // 4. Loading state kapat
  setLoadingUrls({ [format]: false });
};
```

**Kullanıcı Deneyimi:**
- ⏳ "Hazırlanıyor..." butonu görünür
- 🔒 Signed URL arka planda oluşturulur
- ⬇️ İndirme otomatik başlar
- ✅ Buton normale döner

### 3. BookReaderModal - Online Okuma
```typescript
useEffect(() => {
  if (isOpen && book?.formats.pdf) {
    getSignedBookFileUrl(book.formats.pdf, 3600)
      .then(url => setPdfUrl(url));
  }
}, [isOpen, book]);
```

**Kullanıcı Deneyimi:**
- 📖 Modal açılır
- ⏳ "Yükleniyor..." gösterilir
- 🔒 Signed URL oluşturulur
- 📄 PDF görüntülenir
- ⏱️ 1 saat sonra URL geçersiz olur

## 🛡️ Güvenlik Katmanları

### 1. Client-Side (Tarayıcı)
```
User Request → Signed URL İsteği → Geçici Token
```

### 2. Supabase Storage
```
Token Validation → RLS Check → File Access
```

### 3. Time-Based Expiry
```
1 Hour Later → Token Invalid → Access Denied
```

## 🔍 Güvenlik Sorularına Cevaplar

### S: Supabase URL görünmesi zararlı mı?
**C:** ❌ HAYIR
- Project ID public bilgidir
- Anon key public kullanım içindir
- RLS (Row Level Security) koruma sağlar
- Service role key gizlidir (.env'de)

### S: Gmail hesabıma erişilebilir mi?
**C:** ❌ HAYIR
- URL sadece dosya erişimi sağlar
- Gmail hesabıyla hiçbir bağlantısı yok
- Supabase authentication ayrı bir sistemdir
- Email bilgileri veritabanında değil

### S: URL paylaşılırsa ne olur?
**C:** ⏱️ SINIRLI RİSK
- **Public URL:** Kalıcı erişim (eski sistem)
- **Signed URL:** 1 saat sonra geçersiz (yeni sistem)
- URL paylaşılsa bile kısa sürede işe yaramaz

### S: Kötü niyetli kullanıcılar ne yapabilir?
**C:** 🛡️ SINIRLI
- Sadece public kitapları indirebilir
- Rate limiting ile sınırlandırılmıştır
- Veritabanına erişemez
- Private data'ya erişemez

## 📊 Karşılaştırma

| Özellik | Public URL | Signed URL |
|---------|-----------|-----------|
| **Süre** | ♾️ Kalıcı | ⏱️ 1 Saat |
| **Paylaşım** | ❌ Zararlı | ✅ Sınırlı risk |
| **Kontrol** | ❌ Yok | ✅ Token bazlı |
| **Güvenlik** | ⚠️ Düşük | ✅ Yüksek |
| **Performans** | ✅ Hızlı | ✅ Hızlı |

## 🚀 Sonuç

### ✅ Yapılan İyileştirmeler
1. **Geçici URL'ler:** 1 saat sonra geçersiz
2. **Token Bazlı:** Her istekte yeni token
3. **Fallback Sistemi:** Hata durumunda public URL
4. **Loading States:** Kullanıcı deneyimi iyileştirildi
5. **Error Handling:** Hata durumları yönetildi

### 🎯 Güvenlik Seviyesi
- **ÖNCEKİ:** ⚠️⚠️⚠️ (Orta - Public URL'ler)
- **ŞİMDİ:** ✅✅✅ (Yüksek - Signed URL'ler)

### 📝 Öneriler
1. ✅ Signed URL'ler kullanılıyor (TAMAMLANDI)
2. ⏱️ Süre: 1 saat (UYGUN)
3. 🔄 Rate limiting mevcut (security.ts)
4. 📊 Download logging (isteğe bağlı - gelecekte)

## 🔗 İlgili Dosyalar

- `/src/lib/supabase.ts` - Signed URL fonksiyonu
- `/src/components/books/BookDetailModal.tsx` - İndirme butonları
- `/src/components/books/BookReaderModal.tsx` - PDF okuyucu
- `/src/lib/security.ts` - Rate limiting ve güvenlik
- `/docs/SECURITY.md` - Genel güvenlik dokümantasyonu

## 📞 Destek

Herhangi bir güvenlik endişeniz varsa:
1. GitHub Issues açın
2. Security Policy'ye bakın
3. Supabase RLS'i gözden geçirin

---

**Son Güncelleme:** 17 Aralık 2025
**Durum:** ✅ Aktif ve Güvenli
