import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAuth, isPublicStaticPath } from '@/lib/truth/access-control';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and the narrow public health API.
  if (isPublicStaticPath(pathname)) {
    return NextResponse.next();
  }

  const authFailure = requireAuth(request, pathname);
  if (authFailure) {
    return authFailure;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except pure static assets handled above
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
