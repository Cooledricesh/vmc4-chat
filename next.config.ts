import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@next/swc-*/**/*',
      'node_modules/lightningcss-*/**/*',
      'node_modules/@tailwindcss/oxide-*/**/*',
      'node_modules/@unrs/resolver-binding-*/**/*',
    ],
  },
};

export default nextConfig;
