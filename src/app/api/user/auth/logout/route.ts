import { NextResponse } from 'next/server';
import { clearUserAuthCookie } from '@/lib/user-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearUserAuthCookie(res);
  return res;
}
