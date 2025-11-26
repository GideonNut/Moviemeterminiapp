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
  // Admin page is now public and accessible as a webapp
  if (isPublicRoute || pathname === '/' || pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // For other protected routes, check authentication
  const token = await getToken({ req: request });
  
  // Add other protected routes here if needed
  // if (pathname.startsWith('/some-protected-route') && !token) {
  //   const url = new URL('/api/auth/signin', request.nextUrl.origin);
  //   url.searchParams.set('callbackUrl', pathname);
  //   return NextResponse.redirect(url);
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
