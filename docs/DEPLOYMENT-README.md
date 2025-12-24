# 🚀 Deployment Hızlı Başlangıç

## 📚 Dosyalar

Deployment için 3 farklı rehber hazırladık:

1. **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** 📖
   - Kapsamlı, detaylı rehber
   - Tüm adımlar açıklamalı
   - Sorun giderme ipuçları
   - **Kullan:** İlk defa deploy yapıyorsan

2. **[DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)** ✅
   - Adım adım checklist
   - Her adımı işaretle
   - Hızlı referans
   - **Kullan:** Hızlıca deploy yapmak için

3. **[quick-deploy.sh](../quick-deploy.sh)** ⚡
   - Otomatik script
   - Tek komutla deploy
   - Git + Build + Push
   - **Kullan:** Deneyimliysen, hızlı güncellemeler için

---

## ⚡ Hızlı Başlangıç (5 Dakika)

### Yöntem 1: Manuel (İlk Kez)

```bash
# 1. Build test
npm run build

# 2. Git hazırla
git add .
git commit -m "Deploy: Islamic Library"

# 3. GitHub'a push
git push origin main

# 4. Vercel'e git ve import et
# https://vercel.com/new
```

### Yöntem 2: Script ile (Deneyimliyse)

```bash
# Script'i çalıştırılabilir yap (sadece ilk seferde)
chmod +x quick-deploy.sh

# Deploy!
./quick-deploy.sh
```

---

## 🎯 Deployment Adımları (Özet)

### 1️⃣ GitHub'a Yükle
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/islamic-library.git
git push -u origin main
```

### 2️⃣ Vercel'e Deploy
1. https://vercel.com/new adresine git
2. GitHub repo'sunu import et
3. Environment variables ekle:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy butonuna bas

### 3️⃣ Domain Bağla
1. Vercel → Settings → Domains
2. `islamiclibrary.net` ekle
3. Hostinger DNS ayarları:
   - A Record: `@ → 76.76.21.21`
   - CNAME: `www → cname.vercel-dns.com`

---

## ✅ Pre-Deployment Checklist

Deployment yapmadan önce kontrol et:

- [ ] `npm run build` çalışıyor
- [ ] `.env.local` dosyası var
- [ ] `.gitignore` güncel
- [ ] Local test başarılı (`npm run preview`)
- [ ] Supabase credentials doğru

---

## 🔗 Faydalı Linkler

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Docs:** https://vercel.com/docs
- **GitHub:** https://github.com
- **Supabase:** https://supabase.com/dashboard

---

## 🆘 Yardım

Sorun mu yaşıyorsun?

1. **Build hatası:** [DEPLOYMENT-GUIDE.md#sorun-giderme](./DEPLOYMENT-GUIDE.md#sorun-giderme)
2. **Domain çalışmıyor:** DNS ayarlarını kontrol et
3. **Kitaplar görünmüyor:** Environment variables kontrolü

---

**Hazırlayan:** Islamic Library Team  
**Güncelleme:** 23 Aralık 2025
