import { NextRequest, NextResponse } from 'next/server';
import {
  fetchZoneTrafficAnalytics,
  isCloudflareAnalyticsConfigured,
} from '@/lib/cloudflare-analytics';
import { isSupabaseConfigured, supabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics
 * Cloudflare zone trafiği (ziyaretçi / istek). Sadece admin oturumu.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: 'Auth yapılandırılmamış.' }, { status: 503 });
  }

  const token = request.cookies.get('sb-auth-token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Oturum açmanız gerekir.' }, { status: 401 });
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) {
    return NextResponse.json(
      { error: 'Oturum süresi dolmuş olabilir. Lütfen tekrar giriş yapın.' },
      { status: 401 }
    );
  }

  if (!isCloudflareAnalyticsConfigured()) {
    return NextResponse.json(
      { error: 'Cloudflare analytics yapılandırılmamış (ZONE_ID / ZONE_TOKEN).' },
      { status: 503 }
    );
  }

  try {
    const analytics = await fetchZoneTrafficAnalytics();
    return NextResponse.json(analytics, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (err) {
    console.error('Admin analytics API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analytics alınamadı.' },
      { status: 502 }
    );
  }
}
