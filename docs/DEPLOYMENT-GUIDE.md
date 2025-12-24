# 🚀 Islamic Library - Deployment Rehberi

## 📖 İçindekiler
- [Giriş](#giriş)
- [Gereksinimler](#gereksinimler)
- [Deployment Öncesi Hazırlık](#deployment-öncesi-hazırlık)
- [GitHub'a Yükleme](#githuba-yükleme)
- [Vercel ile Deployment](#vercel-ile-deployment)
- [Domain Bağlama](#domain-bağlama)
- [Deployment Sonrası](#deployment-sonrası)
- [Sorun Giderme](#sorun-giderme)

---

## 🎯 Giriş

Bu rehber, **Islamic Library** projesini **Vercel** platformunda yayınlamak ve **islamiclibrary.net** domain'ini bağlamak için hazırlanmıştır.

### Neden Vercel?

✅ **Ücretsiz** (Hobby plan ile sınırsız)  
✅ **Otomatik deployment** (GitHub push → Canlıya geçer)  
✅ **Global CDN** (Dünya çapında hızlı erişim)  
✅ **SSL/HTTPS** otomatik (Güvenlik sertifikası)  
✅ **Vite/React** için optimize edilmiş  
✅ **Zero-config** (Minimal kurulum)  

### Deployment Süresi

- **İlk deployment:** ~30 dakika
- **Sonraki deploymentlar:** ~2-3 dakika (otomatik)

---

## 📋 Gereksinimler

### 1. Hesaplar

- [ ] **GitHub hesabı** (ücretsiz) → [github.com/signup](https://github.com/signup)
- [ ] **Vercel hesabı** (ücretsiz) → [vercel.com/signup](https://vercel.com/signup)
- [ ] **Domain** (islamiclibrary.net - mevcut)

### 2. Yerel Kurulum

- [ ] **Node.js** (v18 veya üzeri)
- [ ] **Git** yüklü
- [ ] **VS Code** veya herhangi bir terminal

### 3. Proje Bilgileri

- [ ] Supabase URL ve Anon Key hazır
- [ ] Tüm dosyalar commit'lendi
- [ ] Local build başarılı

---

## 🛠️ Deployment Öncesi Hazırlık

### Adım 1: Production Build Test

Önce local'de production build'in çalışıp çalışmadığını test et:

```bash
# Proje klasörüne git
cd /Users/aliosmancitak_/development/react/İslamicLibrary

# Production build yap
npm run build

# Build sonucunu test et
npm run preview
```

**Beklenen Çıktı:**
```
✓ built in 3.45s
✓ vite v5.0.0 preview server
  ➜  Local:   http://localhost:4173/
  ➜  press h to show help
```

**Test Adımları:**
1. Tarayıcıda `http://localhost:4173` aç
2. Tüm sayfaları kontrol et (Ana Sayfa, Kategoriler, Yazarlar)
3. Arama fonksiyonu çalışıyor mu?
4. Kitap detayları açılıyor mu?
5. Online okuma çalışıyor mu?
6. İndirme butonları çalışıyor mu?

✅ **Herşey OK ise devam et!**

---

### Adım 2: Environment Variables Kontrolü

`.env.local` dosyasını kontrol et:

```bash
# .env.local içeriğini görüntüle
cat .env.local
```

**Olması Gerekenler:**
```env
VITE_SUPABASE_URL=https://hwtwmbjorpdzpyfbhptr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_CkKJW-5Ltlt5hkl4lkRvrg_YU-nD3Gj
```

⚠️ **ÖNEMLİ:** 
- `.env.local` dosyası **ASLA** GitHub'a yüklenmemeli!
- Bu değerleri Vercel'de manuel gireceksin

---

### Adım 3: .gitignore Kontrolü

`.gitignore` dosyasının doğru olduğundan emin ol:

```bash
# .gitignore dosyasını kontrol et
cat .gitignore
```

**Olması Gerekenler:**
```gitignore
# dependencies
node_modules/

# production
dist/

# environment variables
.env
.env.local
.env*.local

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# misc
*.log
.cache/
```

**Eğer `.gitignore` yoksa veya eksikse:**

```bash
# .gitignore dosyası oluştur
cat > .gitignore << 'EOF'
# dependencies
node_modules/

# production
dist/

# environment variables
.env
.env.local
.env*.local

# logs
*.log

# editor
.vscode/*
!.vscode/extensions.json
.DS_Store

# misc
.cache/
EOF
```

---

### Adım 4: Console.log Temizliği (Opsiyonel)

Production'da console.log'lar görünmesin diye temizleyebilirsin:

```bash
# Tüm console.log'ları bul
grep -r "console.log" src/

# Manuel olarak gereksiz olanları sil veya comment yap
```

---

## 🔄 GitHub'a Yükleme

### Adım 1: Git Başlat (Eğer yoksa)

```bash
# Proje klasöründe
cd /Users/aliosmancitak_/development/react/İslamicLibrary

# Git durumunu kontrol et
git status

# Eğer "not a git repository" hatası alırsan:
git init
git branch -M main
```

---

### Adım 2: Dosyaları Ekle ve Commit Yap

```bash
# Tüm değişiklikleri ekle
git add .

# Commit yap
git commit -m "Initial commit: Islamic Library v1.0

- Multi-language support (TR, EN, RU, AZ)
- Supabase integration
- Book search and filtering
- Online PDF reader
- Download functionality
- Responsive design"

# Commit edildiğini kontrol et
git log --oneline
```

---

### Adım 3: GitHub Repository Oluştur

#### 3a. Tarayıcıdan (Kolay):

1. **https://github.com/new** adresine git
2. **Repository name:** `islamic-library`
3. **Description:** `Islamic book library with multi-language support`
4. **Public** seç (veya Private)
5. ❌ **Initialize repository** seçeneklerini SEÇME (README, .gitignore)
6. **Create repository** butonuna bas

#### 3b. GitHub CLI ile (Hızlı):

```bash
# GitHub CLI yüklü değilse atla, tarayıcıdan yap
gh repo create islamic-library --public --source=. --remote=origin
```

---

### Adım 4: GitHub'a Push

GitHub'da repo oluşturduktan sonra, terminal'de:

```bash
# Remote ekle (GitHub'dan aldığın URL'i kullan)
git remote add origin https://github.com/KULLANICI-ADIN/islamic-library.git

# Veya SSH (tercih edersen):
# git remote add origin git@github.com:KULLANICI-ADIN/islamic-library.git

# Remote'u kontrol et
git remote -v

# Push yap
git push -u origin main
```

**Beklenen Çıktı:**
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
...
To https://github.com/KULLANICI-ADIN/islamic-library.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **GitHub'da kodlar görünüyor mu? Tarayıcıdan kontrol et!**

---

## 🚀 Vercel ile Deployment

### Adım 1: Vercel Hesabı Oluştur

1. **https://vercel.com/signup** adresine git
2. **Continue with GitHub** butonuna bas
3. GitHub ile giriş yap
4. Vercel'e GitHub erişim izni ver
5. ✅ Hesap hazır!

---

### Adım 2: Projeyi Import Et

#### 2a. Vercel Dashboard:

1. **https://vercel.com/dashboard** 'a git
2. **Add New...** butonuna tıkla
3. **Project** seç

#### 2b. Import Repository:

1. **Import Git Repository** bölümünde:
   - `islamic-library` repo'sunu bul
   - **Import** butonuna bas

2. Eğer görünmüyorsa:
   - **Adjust GitHub App Permissions** tıkla
   - `islamic-library` repo'suna erişim ver
   - Geri dön ve Import et

---

### Adım 3: Configure Project

**Framework Preset:**
```
Detected: Vite ✅ (Otomatik algılar)
```

**Build and Output Settings:**
```
Build Command:        npm run build
Output Directory:     dist
Install Command:      npm install
Development Command:  npm run dev
```

**Root Directory:**
```
./   (Varsayılan)
```

✅ **Herşey otomatik doldurulmalı, değiştirme!**

---

### Adım 4: Environment Variables Ekle

**Environment Variables** bölümünde:

#### 4a. İlk Variable:

- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://hwtwmbjorpdzpyfbhptr.supabase.co`
- **Add** butonuna bas

#### 4b. İkinci Variable:

- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_CkKJW-5Ltlt5hkl4lkRvrg_YU-nD3Gj`
- **Add** butonuna bas

⚠️ **DİKKAT:**
- Değerleri **TAM OLARAK** kopyala (boşluk, enter olmamalı)
- `VITE_` prefix'i önemli!

---

### Adım 5: Deploy!

1. **Deploy** butonuna bas
2. ☕ Bekle (2-3 dakika)

**Progress:**
```
Running Build Command...
├─ Cloning repository
│  ✓ Repository cloned
│
├─ Installing dependencies
│  ✓ npm install (45s)
│
├─ Building project
│  ✓ npm run build (23s)
│  ✓ dist/ created
│
└─ Deploying to CDN
   ✓ Uploaded to 250+ locations
   ✓ HTTPS certificate issued
   ✓ Build completed in 1m 48s

✅ Deployment ready!
```

---

### Adım 6: İlk Test

Deployment tamamlanınca:

1. **Visit** butonuna bas
2. Vercel URL'i açılır: `https://islamic-library-abc123.vercel.app`
3. Site çalışıyor mu kontrol et:
   - ✅ Ana sayfa yükleniyor
   - ✅ Kitaplar görünüyor
   - ✅ Arama çalışıyor
   - ✅ Kategoriler çalışıyor

🎉 **Site canlı! Şimdi domain bağlayalım.**

---

## 🌐 Domain Bağlama

### Adım 1: Vercel'de Domain Ekle

1. **Vercel Dashboard** → Projeyi seç
2. **Settings** → **Domains**
3. **Add Domain** butonuna bas
4. Domain gir: `islamiclibrary.net`
5. **Add** butonuna bas

---

### Adım 2: DNS Kayıtlarını Al

Vercel sana DNS kayıtlarını verecek:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

**CNAME Record (www):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

📋 **Bu değerleri kopyala, Hostinger'de kullanacaksın!**

---

### Adım 3: Hostinger DNS Ayarları

#### 3a. Hostinger'e Giriş:

1. **https://hpanel.hostinger.com** 'a git
2. Giriş yap
3. **Domains** bölümüne git
4. `islamiclibrary.net` domain'ini seç

#### 3b. DNS Zone Editor:

1. **DNS / Name Servers** → **DNS Zone**
2. **Manage** butonuna bas

#### 3c. Eski Kayıtları Sil:

Şu kayıtları **SİL**:
- ❌ Eski A record (@)
- ❌ Eski CNAME record (www)

⚠️ **DİKKAT:** Diğer kayıtlara (MX, TXT) dokunma!

#### 3d. Yeni Kayıtları Ekle:

**A Record Ekle:**
```
Type: A
Name: @
Points to: 76.76.21.21
TTL: 14400 (veya Auto)
```
→ **Add Record**

**CNAME Record Ekle:**
```
Type: CNAME
Name: www
Points to: cname.vercel-dns.com
TTL: 14400 (veya Auto)
```
→ **Add Record**

#### 3e. Kaydet:

**Save Changes** veya **Update** butonuna bas.

---

### Adım 4: DNS Yayılmasını Bekle

DNS değişikliği **5-30 dakika** sürebilir.

**İlerlemeyi Kontrol Et:**

```bash
# A record kontrolü
dig islamiclibrary.net

# CNAME kontrolü
dig www.islamiclibrary.net

# Veya online araç:
# https://dnschecker.org
```

**Beklenen Sonuçlar:**
```
islamiclibrary.net.     300     IN      A       76.76.21.21
www.islamiclibrary.net. 300     IN      CNAME   cname.vercel-dns.com.
```

✅ **IP doğruysa, DNS yayılmış demektir!**

---

### Adım 5: Domain Doğrulama (Vercel)

1. **Vercel Dashboard** → **Settings** → **Domains**
2. `islamiclibrary.net` yanında **Verify** butonuna bas
3. Eğer DNS doğruysa: ✅ **Valid Configuration**
4. SSL sertifikası otomatik oluşturulur (~2 dakika)

---

### Adım 6: HTTPS Kontrolü

1. Tarayıcıda aç: **https://islamiclibrary.net**
2. Adres çubuğunda **🔒** simgesi var mı?
3. Site açılıyor mu?

🎉 **Canlı! Artık herkes erişebilir!**

---

## ✅ Deployment Sonrası

### Otomatik Deployment Testi

Artık her GitHub push'da otomatik deploy olacak. Test edelim:

```bash
# Bir dosyada küçük değişiklik yap
echo "// Test deployment" >> src/main.tsx

# Commit ve push
git add .
git commit -m "Test: auto deployment"
git push origin main
```

**Vercel Dashboard'da:**
1. **Deployments** sekmesinde yeni build göreceksin
2. ~2 dakika sonra site güncellenecek
3. ✅ Otomatik deployment çalışıyor!

---

### Production Checklist

- [ ] **Site açılıyor:** https://islamiclibrary.net ✅
- [ ] **HTTPS çalışıyor:** 🔒 simgesi var ✅
- [ ] **Tüm sayfalar çalışıyor**
  - [ ] Ana Sayfa
  - [ ] Kategoriler
  - [ ] Yazarlar
  - [ ] Hakkında
  - [ ] İletişim
- [ ] **Özellikler çalışıyor**
  - [ ] Arama
  - [ ] Filtreleme
  - [ ] Kitap detayları
  - [ ] Online okuma
  - [ ] İndirme
- [ ] **Mobil uyumlu:** Telefondan test et
- [ ] **Dil değiştirme:** TR/EN/RU/AZ
- [ ] **Performance:** Site hızlı yükleniyor

---

### Analytics ve Monitoring (Opsiyonel)

#### Google Analytics Ekle:

1. **Google Analytics** hesabı oluştur
2. Tracking ID al (G-XXXXXXXXXX)
3. `index.html` dosyasına ekle:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

4. Commit ve push
5. Analytics dashboard'da ziyaretçileri görürsün

---

### Vercel Analytics (Ücretsiz):

1. **Vercel Dashboard** → Proje seç
2. **Analytics** sekmesi
3. **Enable Analytics** (Ücretsiz 2,500 sayfa/ay)
4. Ziyaretçi istatistiklerini gör

---

## 🐛 Sorun Giderme

### 1. Build Hatası

**Hata:**
```
Error: Build failed
npm ERR! code ELIFECYCLE
```

**Çözüm:**
```bash
# Local'de build test et
npm run build

# Hata varsa düzelt
# Sonra push yap
git add .
git commit -m "Fix build error"
git push
```

---

### 2. Environment Variables Eksik

**Hata:**
```
Error: VITE_SUPABASE_URL is not defined
```

**Çözüm:**
1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` var mı?
3. Yoksa ekle
4. **Redeploy** butonuna bas

---

### 3. Domain Açılmıyor

**Hata:**
```
This site can't be reached
ERR_NAME_NOT_RESOLVED
```

**Çözüm:**
```bash
# DNS kontrolü
dig islamiclibrary.net

# IP doğru değilse:
# 1. Hostinger DNS ayarlarını kontrol et
# 2. A record: 76.76.21.21
# 3. 30 dakika daha bekle
```

---

### 4. SSL Sertifikası Yok

**Hata:**
```
Your connection is not private
NET::ERR_CERT_AUTHORITY_INVALID
```

**Çözüm:**
1. **Vercel Dashboard** → **Settings** → **Domains**
2. Domain yanında **Renew Certificate** veya **Issue Certificate**
3. 2 dakika bekle
4. Sayfayı yenile (hard refresh: Cmd+Shift+R)

---

### 5. Kitaplar Görünmüyor

**Hata:**
```
Error fetching books from Supabase
```

**Çözüm:**
1. **Supabase Dashboard** kontrol et
2. RLS (Row Level Security) politikaları aktif mi?
3. Anon key doğru mu?
4. Browser console'u aç (F12) → Network sekmesi
5. Supabase request'leri başarılı mı?

---

### 6. 404 Not Found (Yönlendirme)

**Hata:**
```
404 - This page could not be found
```

**Çözüm:**

Vercel'de SPA routing için config gerekli:

`vercel.json` dosyası oluştur (proje root'unda):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Commit ve push:
```bash
git add vercel.json
git commit -m "Add vercel.json for SPA routing"
git push
```

---

## 📊 Performance Optimization (İleri Seviye)

### Image Optimization

```bash
# Sharp paketi yükle (image optimization)
npm install sharp

# Vite config'e ekle
# vite.config.ts
import imagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    imagemin({
      gifsicle: { optimizationLevel: 7 },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: { plugins: [{ removeViewBox: false }] }
    })
  ]
})
```

---

### Bundle Analyzer

```bash
# Bundle size analizi
npm install --save-dev rollup-plugin-visualizer

# Vite config
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    visualizer({ open: true })
  ]
})

# Build yap
npm run build

# stats.html açılacak
```

---

## 🔄 Güncelleme Workflow'u

Artık geliştirme döngün şöyle:

```bash
# 1. Kod değişikliği yap
# örnek: src/pages/HomePage.tsx

# 2. Local test
npm run dev

# 3. Production build test
npm run build
npm run preview

# 4. Commit ve push
git add .
git commit -m "Feature: Add new book filter"
git push

# 5. Vercel otomatik deploy eder (2 dk)

# 6. Test et
open https://islamiclibrary.net
```

---

## 🆘 Destek

### Vercel Support

- **Documentation:** https://vercel.com/docs
- **Community:** https://github.com/vercel/vercel/discussions
- **Status:** https://www.vercel-status.com

### Supabase Support

- **Documentation:** https://supabase.com/docs
- **Community:** https://github.com/supabase/supabase/discussions

---

## 🎉 Tebrikler!

Artık Islamic Library projesi canlıda! 🚀

- ✅ **Site:** https://islamiclibrary.net
- ✅ **HTTPS:** Güvenli bağlantı
- ✅ **Global CDN:** Hızlı erişim
- ✅ **Otomatik Deployment:** Push → Canlı

---

**Son Güncelleme:** 23 Aralık 2025  
**Versiyon:** 1.0.0  
**Yazar:** Islamic Library Project Team
