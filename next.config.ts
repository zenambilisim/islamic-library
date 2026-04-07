import type { NextConfig } from 'next';

const r2Public = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim();
let r2Hostname: string | null = null;
if (r2Public) {
  try {
    r2Hostname = new URL(r2Public).hostname;
  } catch {
    r2Hostname = null;
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wccxajebhjdskkvacnwl.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      ...(r2Hostname
        ? [
            {
              protocol: 'https' as const,
              hostname: r2Hostname,
              pathname: '/**',
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
