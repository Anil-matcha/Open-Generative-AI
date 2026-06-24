import { NextResponse } from 'next/server';

// Edge runtime can't use better-sqlite3, so we only check cookie presence here.
// The full session validation happens in pages/route handlers (Node runtime).
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/me'];

function isPublic(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // Static assets and Next internals
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/favicon.ico' || pathname === '/logo.webp') return true;
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|map)$/i.test(pathname)) return true;
  return false;
}

export function middleware(request) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // MuAPI proxy (unchanged)
  const isMuApi = pathname.startsWith('/api/workflow') ||
                  pathname.startsWith('/api/app') ||
                  pathname.startsWith('/api/v1');

  if (isMuApi) {
    const isHandledByRoute = pathname.startsWith('/api/v1/creative-agent') ||
                            pathname.startsWith('/api/v1/get_upload_url') ||
                            pathname.startsWith('/api/v1/upload-binary');

    if (pathname.startsWith('/api/v1') && !isHandledByRoute) {
      const targetUrl = new URL(pathname + url.search, 'https://api.muapi.ai');
      return NextResponse.rewrite(targetUrl);
    }
  }

  if (isPublic(pathname)) return NextResponse.next();

  // Auth gate: just check cookie presence here
  const sessionId = request.cookies.get('admin_session')?.value;
  if (!sessionId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|map)$).*)',
  ],
};
