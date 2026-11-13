import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase-server';
import { getUserFromRequest } from '@/lib/user-auth';
import {
  dbUserToPublic,
  ensureUserProfile,
  normalizeBio,
  normalizeDisplayName,
  updateUserProfile,
} from '@/lib/user-profile';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/user/profile
 * Body: { displayName?: string, bio?: string }
 * Auth: `Authorization: Bearer <access_token>` veya `sb-user-token` cookie.
 *
 * `displayName` gönderilirse boş olamaz. `bio` boş string ise temizlenir.
 */
export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  const auth = await getUserFromRequest(request);
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const hasDisplayName = Object.prototype.hasOwnProperty.call(body, 'displayName');
    const hasBio = Object.prototype.hasOwnProperty.call(body, 'bio');

    if (!hasDisplayName && !hasBio) {
      return NextResponse.json(
        { error: 'displayName veya bio gerekli.' },
        { status: 400 }
      );
    }

    const patch: { displayName?: string | null; bio?: string | null } = {};

    if (hasDisplayName) {
      const displayName = normalizeDisplayName(body.displayName);
      if (!displayName) {
        return NextResponse.json({ error: 'Kullanıcı adı gerekli.' }, { status: 400 });
      }
      patch.displayName = displayName;
    }

    if (hasBio) {
      patch.bio = normalizeBio(body.bio);
    }

    await ensureUserProfile({
      id: auth.user.id,
      email: auth.user.email,
      displayName: patch.displayName ?? undefined,
    });

    const { profile, error } = await updateUserProfile(auth.user.id, patch);
    if (error || !profile) {
      return NextResponse.json(
        { error: error?.message || 'Profil güncellenemedi.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: dbUserToPublic(profile, { id: auth.user.id, email: auth.user.email }),
    });
  } catch (err) {
    console.error('PATCH /api/user/profile error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Profil güncellenemedi.' },
      { status: 500 }
    );
  }
}
