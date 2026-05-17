import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/user-auth';
import { dbUserToPublic, ensureUserProfile, getUserById } from '@/lib/user-profile';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/session
 */
export async function GET(request: NextRequest) {
  const result = await getUserFromRequest(request);
  if ('error' in result) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  const { user } = result;
  const metaName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name.trim() || undefined
      : undefined;

  let profile = await getUserById(user.id);
  if (!profile) {
    profile = await ensureUserProfile({
      id: user.id,
      email: user.email,
      displayName: metaName,
    });
  }

  return NextResponse.json({
    user: dbUserToPublic(profile, { id: user.id, email: user.email }),
  });
}
