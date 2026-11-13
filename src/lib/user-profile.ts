import { supabaseAdmin } from './supabase-server';

/** public.users satırı */
export interface DbUser {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUserProfile {
  id: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
}

export function dbUserToPublic(
  profile: DbUser | null,
  fallback: { id: string; email?: string | null }
): PublicUserProfile {
  return {
    id: profile?.id ?? fallback.id,
    email: profile?.email ?? fallback.email ?? null,
    displayName: profile?.display_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    bio: profile?.bio ?? null,
  };
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) {
    console.error('getUserById:', error.message);
    return null;
  }
  return data;
}

/** Auth kaydı var ama users satırı yoksa oluşturur (trigger öncesi kullanıcılar için). */
export async function ensureUserProfile(params: {
  id: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<DbUser | null> {
  if (!supabaseAdmin) return null;

  const existing = await getUserById(params.id);
  if (existing) {
    const updates: Partial<Pick<DbUser, 'email' | 'display_name'>> = {};
    if (params.email && existing.email !== params.email) updates.email = params.email;
    if (params.displayName && !existing.display_name) updates.display_name = params.displayName;

    if (Object.keys(updates).length === 0) return existing;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('ensureUserProfile update:', error.message);
      return existing;
    }
    return data;
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      id: params.id,
      email: params.email ?? null,
      display_name: params.displayName ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('ensureUserProfile insert:', error.message);
    return null;
  }
  return data;
}

const DISPLAY_NAME_MAX = 80;
const BIO_MAX = 500;

export function normalizeDisplayName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, DISPLAY_NAME_MAX);
}

export function normalizeBio(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, BIO_MAX);
}

/** Profil alanlarını günceller; auth metadata display_name ile senkron tutulur. */
export async function updateUserProfile(
  userId: string,
  patch: { displayName?: string | null; bio?: string | null }
): Promise<{ profile: DbUser | null; error: Error | null }> {
  if (!supabaseAdmin) {
    return { profile: null, error: new Error('Auth yapılandırılmamış.') };
  }

  const updates: Partial<Pick<DbUser, 'display_name' | 'bio' | 'updated_at'>> = {
    updated_at: new Date().toISOString(),
  };
  if ('displayName' in patch) updates.display_name = patch.displayName ?? null;
  if ('bio' in patch) updates.bio = patch.bio ?? null;

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('updateUserProfile:', error.message);
    return { profile: null, error: new Error(error.message) };
  }

  if ('displayName' in patch) {
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { display_name: patch.displayName ?? null },
    });
    if (metaError) {
      console.error('updateUserProfile metadata:', metaError.message);
    }
  }

  return { profile: data, error: null };
}

/** Okuma listesi, profil satırı ve auth.users kaydını siler. */
export async function deleteUserAccount(userId: string): Promise<{ error: Error | null }> {
  if (!supabaseAdmin) {
    return { error: new Error('Auth yapılandırılmamış.') };
  }

  const { error: entriesError } = await supabaseAdmin
    .from('user_book_entries')
    .delete()
    .eq('user_id', userId);
  if (entriesError) {
    console.error('deleteUserAccount entries:', entriesError.message);
    return { error: new Error(entriesError.message) };
  }

  const { error: profileError } = await supabaseAdmin.from('users').delete().eq('id', userId);
  if (profileError) {
    console.error('deleteUserAccount profile:', profileError.message);
    return { error: new Error(profileError.message) };
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (authError) {
    console.error('deleteUserAccount auth:', authError.message);
    return { error: new Error(authError.message) };
  }

  return { error: null };
}
