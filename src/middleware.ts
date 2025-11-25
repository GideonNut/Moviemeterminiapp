import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public access to these routes without authentication
  const publicRoutes = [
    '/api/auth',
    '/_next',
    '/api/movies',
    '/api/comments',
    '/api/leaderboards',
    '/api/opengraph-image',
    '/api/tv',
    '/api/test',
    '/api/debug',
    '/api/import',
    '/api/fix',
    '/api/sync',
    '/api/webhook',
  ];

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // For Farcaster miniapps and public routes, allow access without authentication
  // Authentication should be handled client-side when needed
  if (isPublicRoute || pathname === '/') {
    return NextResponse.next();
  }

  // For protected routes (like admin), check authentication
  const token = await getToken({ req: request });
  
  // Only protect specific admin routes
  if (pathname.startsWith('/admin') && !token) {
    const url = new URL('/api/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
