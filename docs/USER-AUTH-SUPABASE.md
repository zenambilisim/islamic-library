# Okuyucu hesapları — Supabase kurulumu

Uygulama iki katman kullanır:

| Katman | Tablo | Açıklama |
|--------|--------|----------|
| Kimlik | `auth.users` | E-posta, şifre (Supabase Auth) |
| Profil | `public.users` | Görünen ad, avatar, bio (genişletilebilir) |
| Okuma listesi | `public.user_book_entries` | Kitap durumu |

## Kurulum

1. Supabase projenizde **SQL Editor** açın.
2. `scripts/supabase-users-and-reading-list.sql` dosyasının içeriğini yapıştırıp **Run** edin.
3. `.env` içinde `SUPABASE_URL`, `SUPABASE_ANON_KEY` ve **`SUPABASE_SERVICE_ROLE_KEY`** tanımlı olsun (kayıt sonrası profil senkronu için).

## Auth ayarları

- **Authentication → Providers → Email**: açık
- **Authentication → URL configuration**: Site URL ve redirect URL’lerinizi ekleyin
- Geliştirmede e-posta onayını kapatabilirsiniz; canlıda açık tutun

## Yeni kullanıcı akışı

1. `signUp` → `auth.users` satırı oluşur.
2. Trigger `handle_new_auth_user` → `public.users` satırı oluşur (`display_name` metadata’dan).
3. API `ensureUserProfile` ile eksik satırlar tamamlanır (eski hesaplar).

## İleride profil alanları

`public.users` tablosuna sütun ekledikten sonra:

- RLS: kullanıcı kendi satırını `UPDATE` edebilir (`users_update_own`).
- Uygulamada `PATCH /api/user/profile` gibi bir route ekleyip `supabaseWithUserToken` veya service role ile güncelleyin.

## Kontrol

```sql
SELECT id, email, display_name, created_at FROM public.users LIMIT 10;
```

Authentication → Users ile `id` değerlerinin eşleştiğini doğrulayın.
