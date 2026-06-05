import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Forward the pathname as a header so the server-rendered layout can
// highlight the active nav link without needing client-side usePathname.
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
