import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // 🛡️ Edge Verification for Administrative Control Surfaces
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('vanguard_auth_token')?.value || request.cookies.get('token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'session_required');
      return NextResponse.redirect(loginUrl);
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid JWT structural segments");
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      
      // Edge expiration verification
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new Error("Token expired");
      }
    } catch (err) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('error', 'invalid_session');
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('vanguard_auth_token');
      response.cookies.delete('token');
      return response;
    }
  }

  // Allow next for internal Next.js assets
  if (
    pathname.startsWith('/_next') || 
    pathname.includes('.')
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
