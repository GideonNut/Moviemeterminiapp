/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Allow 'unsafe-eval' in development for Next.js hot reloading
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${isDev ? 'data: blob:' : ''} https: http:`,
      "style-src 'self' 'unsafe-inline' https: http:",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' data: https: http:",
      `connect-src 'self' ${isDev ? 'ws: wss:' : ''} https: http:`,
      "media-src 'self' data: blob: https: http:",
      "frame-src 'self' https: http:",
      // Required for webpack hot reload in development
      ...(isDev ? ["worker-src 'self' blob:"] : [])
    ].join('; ')
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  }
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      },
      // TMDB images
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      // Farcaster avatars and common social/CDN hosts
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.farcaster.xyz',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'warpcast.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'abs.twimg.com',
        port: '',
        pathname: '/**',
      },
      // Add other remote patterns if needed
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig; 