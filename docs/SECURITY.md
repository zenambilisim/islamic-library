# 🔐 Güvenlik Rehberi - Islamic Library Project

## 📋 Mevcut Güvenlik Durumu

### ✅ İyi Yanlar
- Supabase RLS (Row Level Security) aktif
- Read-only public access
- HTTPS üzerinden encrypted communication
- CORS koruması Supabase tarafından

### ⚠️ Dikkat Edilmesi Gerekenler
- API anahtarları frontend'de görünür (normal anon key için)
- Rate limiting client-side (bypass edilebilir)
- IP tracking client-side'da mümkün değil

## 🛡️ Uygulanan Güvenlik Önlemleri

### 1. Rate Limiting (src/lib/security.ts)
```typescript
// Her action için farklı limitler
search: 10 requests/minute
download: 20 requests/5 minutes
general: 100 requests/minute
```

### 2. Input Sanitization
- XSS koruması
- Uzunluk sınırlaması
- Tehlikeli karakter filtreleme

### 3. Environment Validation
- Production'da config kontrolü
- Development mode ayrımı

## 🔒 Supabase RLS Kuralları

Bu SQL kurallarını Supabase Dashboard > SQL Editor'da çalıştırın:

```sql
-- Books tablosu - Public read access
CREATE POLICY "Allow public read access to books" 
ON books FOR SELECT USING (true);

-- Categories tablosu - Public read access  
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT USING (true);

-- Book files - Public read access
CREATE POLICY "Allow public read access to book files"
ON book_files FOR SELECT USING (true);

-- Download logs - Insert only
CREATE POLICY "Allow insert download logs"
ON download_logs FOR INSERT WITH CHECK (true);

-- Diğer operasyonları kısıtla
CREATE POLICY "Deny other operations on books"
ON books FOR ALL USING (false);

CREATE POLICY "Deny other operations on categories" 
ON categories FOR ALL USING (false);

-- RLS'i aktif hale getir
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;
```

## 🚨 Acil Güvenlik Kontrolleri

### 1. Anon Key Kontrolü
```bash
# .env dosyasında API key'inizi kontrol edin
# ASLA service_role key'ini frontend'de kullanmayın!
VITE_SUPABASE_ANON_KEY=eyJ... # Bu anon key olmalı
```

### 2. Supabase Dashboard Ayarları
- **Authentication** > Settings > "Enable email confirmations" ✅
- **API** > Settings > "API Keys" - Sadece anon key kullanın
- **Storage** > Policies - Public read access ayarlayın

### 3. Production Deployment
```bash
# Build öncesi kontroller
npm run build
npm run preview

# Environment variables production'da set edin
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## 📊 Güvenlik Seviyeleri

### 🟢 Seviye 1: Mevcut (Başlangıç için yeterli)
- RLS policies
- Client-side rate limiting  
- Input sanitization
- HTTPS only

### 🟡 Seviye 2: API Katmanı (Gelecek upgrade)
```typescript
// Next.js API route örneği
export default async function handler(req, res) {
  // Server-side rate limiting
  // IP-based tracking
  // Advanced validation
  // Cache control
}
```

### 🔴 Seviye 3: Full Backend (Enterprise)
- Dedicated Node.js/Express backend
- JWT authentication
- Redis caching
- Advanced monitoring

## ⚡ Hızlı Güvenlik Checklist

- [ ] RLS policies Supabase'de aktif
- [ ] Sadece anon key kullanılıyor
- [ ] Environment variables production'da set
- [ ] Rate limiting aktif
- [ ] Input sanitization çalışıyor
- [ ] HTTPS üzerinden serving
- [ ] Error messages user-friendly (internal detayları göstermiyor)
- [ ] File upload sadece admin kullanıcılar için

## 🚀 Gelecek Planı

1. **Kısa Vadeli** (1-2 ay)
   - Mevcut sistem ile live
   - Kullanıcı davranışlarını monitor et
   - Download istatistikleri topla

2. **Orta Vadeli** (3-6 ay)  
   - Next.js API routes ekle
   - Server-side rate limiting
   - Advanced analytics

3. **Uzun Vadeli** (6+ ay)
   - User authentication sistemi
   - Premium features
   - Advanced security measures

## 📞 Acil Durum Planı

Eğer güvenlik sorunu tespit ederseniz:

1. **Hemen**: Supabase Dashboard'dan API key'leri regen edin
2. **5 dakika**: RLS policies'leri kontrol edin
3. **1 saat**: Logs'ları analiz edin
4. **1 gün**: Backup'ları kontrol edin

Bu rehber projenizin güvenliğini sağlamak için temel adımları içerir. Sorularınız olursa lütfen sorun!
