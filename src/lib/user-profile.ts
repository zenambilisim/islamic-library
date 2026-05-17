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
