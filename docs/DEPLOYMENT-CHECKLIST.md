# ✅ Deployment Checklist - Hızlı Başlangıç

Bu checklist'i kullanarak adım adım deployment yapabilirsin. Her adımı tamamladıkça işaretle!

---

## 📋 ÖN HAZIRLIK (15 dakika)

### Proje Testi
- [ ] `npm run build` çalıştır → Hatasız build oldu mu?
- [ ] `npm run preview` çalıştır → Site açıldı mı?
- [ ] Ana sayfa yükleniyor mu?
- [ ] Kitaplar görünüyor mu?
- [ ] Arama çalışıyor mu?

### Environment Variables
- [ ] `.env.local` dosyası var mı?
- [ ] `VITE_SUPABASE_URL` doğru mu?
- [ ] `VITE_SUPABASE_ANON_KEY` doğru mu?

### .gitignore Kontrolü
- [ ] `.gitignore` dosyası var mı?
- [ ] `node_modules/` içinde mi?
- [ ] `dist/` içinde mi?
- [ ] `.env*` içinde mi?

---

## 🐙 GITHUB'A YÜKLEME (10 dakika)

### Terminal Komutları
```bash
cd /Users/aliosmancitak_/development/react/İslamicLibrary
```

- [ ] `git status` çalıştır → Dosyalar göründü mü?
- [ ] `git add .` çalıştır
- [ ] `git commit -m "Initial commit: Islamic Library v1.0"` çalıştır
- [ ] **GitHub'da yeni repo oluştur** → https://github.com/new
  - Repository name: `islamic-library`
  - Public seç
  - README ekleme!
- [ ] `git remote add origin https://github.com/KULLANICI-ADIN/islamic-library.git`
  - ⚠️ **KULLANICI-ADIN** yerine kendi GitHub kullanıcı adını yaz!
- [ ] `git push -u origin main` çalıştır
- [ ] **GitHub'da kontrol et** → Dosyalar görünüyor mu?

---

## 🚀 VERCEL DEPLOYMENT (10 dakika)

### Vercel Hesabı
- [ ] https://vercel.com/signup adresine git
- [ ] **Continue with GitHub** ile giriş yap
- [ ] GitHub'a erişim izni ver

### Proje Import
- [ ] **Add New...** → **Project** tıkla
- [ ] `islamic-library` repo'sunu bul ve **Import** tıkla
- [ ] **Framework Preset:** Vite olarak algılandı mı? ✅

### Environment Variables Ekle
- [ ] **Add Environment Variable** tıkla
- [ ] **Key:** `VITE_SUPABASE_URL`
- [ ] **Value:** `https://hwtwmbjorpdzpyfbhptr.supabase.co`
- [ ] **Add** tıkla
- [ ] Tekrar **Add Environment Variable** tıkla
- [ ] **Key:** `VITE_SUPABASE_ANON_KEY`
- [ ] **Value:** `sb_publishable_CkKJW-5Ltlt5hkl4lkRvrg_YU-nD3Gj`
- [ ] **Add** tıkla

### Deploy
- [ ] **Deploy** butonuna bas
- [ ] ☕ 2-3 dakika bekle
- [ ] ✅ **Deployment Complete!** göründü mü?
- [ ] **Visit** butonuna bas
- [ ] Vercel URL'de site açıldı mı? (örn: `islamic-library-abc123.vercel.app`)
- [ ] Kitaplar yükleniyor mu?

---

## 🌐 DOMAIN BAĞLAMA (15 dakika)

### Vercel'de Domain Ekle
- [ ] Vercel Dashboard → Proje seç
- [ ] **Settings** → **Domains** git
- [ ] **Add Domain** tıkla
- [ ] `islamiclibrary.net` yaz ve **Add** tıkla

### DNS Kayıtlarını Kopyala
Vercel'den şu bilgileri kopyala:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
```
- [ ] Kopyaladın mı?

**CNAME Record:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```
- [ ] Kopyaladın mı?

### Hostinger DNS Ayarları
- [ ] https://hpanel.hostinger.com 'a giriş yap
- [ ] **Domains** bölümüne git
- [ ] `islamiclibrary.net` seç
- [ ] **DNS / Name Servers** → **DNS Zone** → **Manage**

**Eski Kayıtları Sil:**
- [ ] Eski A record (@) → **Delete**
- [ ] Eski CNAME record (www) → **Delete**

**Yeni Kayıtları Ekle:**
- [ ] **Add Record** tıkla
- [ ] Type: **A**, Name: **@**, Value: **76.76.21.21** → **Add**
- [ ] **Add Record** tıkla
- [ ] Type: **CNAME**, Name: **www**, Value: **cname.vercel-dns.com** → **Add**
- [ ] **Save Changes** tıkla

### DNS Yayılmasını Bekle
- [ ] ☕ 10-30 dakika bekle

**DNS Kontrolü:**
```bash
dig islamiclibrary.net
```
- [ ] IP adresi `76.76.21.21` gösteriyor mu?

### Vercel'de Doğrula
- [ ] Vercel → Settings → Domains
- [ ] `islamiclibrary.net` yanında **Verify** tıkla
- [ ] ✅ **Valid Configuration** göründü mü?
- [ ] SSL sertifikası oluşturuldu mu? (2 dakika)

---

## 🎉 FİNAL TEST (5 dakika)

### Site Testi
- [ ] https://islamiclibrary.net aç
- [ ] 🔒 SSL simgesi var mı?
- [ ] Site yükleniyor mu?
- [ ] Kitaplar görünüyor mu?

### Sayfa Testleri
- [ ] **Ana Sayfa** çalışıyor mu?
- [ ] **Kategoriler** çalışıyor mu?
- [ ] **Yazarlar** çalışıyor mu?
- [ ] **Hakkında** çalışıyor mu?
- [ ] **İletişim** çalışıyor mu?

### Özellik Testleri
- [ ] **Arama** çalışıyor mu?
- [ ] **Filtreleme** çalışıyor mu?
- [ ] **Kitap detayları** açılıyor mu?
- [ ] **Online okuma** çalışıyor mu?
- [ ] **İndirme** çalışıyor mu?

### Dil Testleri
- [ ] **Türkçe** çalışıyor mu?
- [ ] **English** çalışıyor mu?
- [ ] **Русский** çalışıyor mu?
- [ ] **Azərbaycanca** çalışıyor mu?

### Mobil Test
- [ ] Telefondan siteyi aç
- [ ] Mobil menü çalışıyor mu?
- [ ] Kitaplar düzgün görünüyor mu?
- [ ] Arama çalışıyor mu?

---

## ✅ OTOMATIK DEPLOYMENT TESTİ

### Test Değişikliği
```bash
# Terminal'de
cd /Users/aliosmancitak_/development/react/İslamicLibrary

# Küçük bir değişiklik yap
echo "// Auto deployment test" >> src/main.tsx

# Commit ve push
git add .
git commit -m "Test: auto deployment"
git push origin main
```

- [ ] Vercel Dashboard → **Deployments** git
- [ ] Yeni build başladı mı?
- [ ] ☕ 2 dakika bekle
- [ ] Build tamamlandı mı?
- [ ] Site güncellendi mi?

---

## 🎯 BAŞARILI! 

🎉 Tebrikler! Islamic Library artık canlıda:
- ✅ **URL:** https://islamiclibrary.net
- ✅ **HTTPS:** Güvenli
- ✅ **Hızlı:** Global CDN
- ✅ **Otomatik:** Her push → Deployment

---

## 📊 SONRAKI ADIMLAR (Opsiyonel)

### Analytics Ekle
- [ ] Google Analytics hesabı oluştur
- [ ] Tracking ID'yi projeye ekle
- [ ] Vercel Analytics'i aktifleştir

### SEO Optimization
- [ ] Meta tags ekle
- [ ] Sitemap oluştur
- [ ] robots.txt ekle
- [ ] Google Search Console'a kaydet

### Performance
- [ ] Lighthouse score kontrol et
- [ ] Image optimization yap
- [ ] Bundle size optimize et

### Security
- [ ] Security headers ekle
- [ ] CSP (Content Security Policy) ayarla
- [ ] Rate limiting ekle

### Monitoring
- [ ] Error tracking ekle (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring

---

## 🐛 SORUN MU VAR?

### Build Hatası
```bash
npm run build
# Hata mesajını oku ve düzelt
```

### Domain Açılmıyor
```bash
dig islamiclibrary.net
# IP doğru mu kontrol et: 76.76.21.21
```

### Kitaplar Görünmüyor
- Supabase URL/Key doğru mu?
- RLS politikaları aktif mi?
- Browser console'da hata var mı?

**Detaylı sorun giderme için:**
→ `docs/DEPLOYMENT-GUIDE.md` dosyasına bak

---

**Hazırlayan:** Islamic Library Team  
**Tarih:** 23 Aralık 2025  
**Versiyon:** 1.0
