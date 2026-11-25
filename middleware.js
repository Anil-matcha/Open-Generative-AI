import { NextResponse } from 'next/server';
import { getLocaleFromPathname } from './lib/locales';
import { accessConfigured, verifySession, SESSION_COOKIE } from './lib/personal/access.mjs';

function addSecurityHeaders(response) {
    // Prevent MIME type sniffing (CWE-693)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking (CWE-1021)
    response.headers.set('X-Frame-Options', 'DENY');
    // Enable XSS filter in legacy browsers
    response.headers.set('X-XSS-Protection', '1; mode=block');
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Content Security Policy - restricts script sources to prevent XSS (CWE-79).
    // connect-src covers *.muapi.ai (not just api.muapi.ai) because generated
    // media, model thumbnails, and other assets are served from cdn.muapi.ai
    // and other muapi subdomains that the renderer fetches directly.
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https://muapi.ai https://*.muapi.ai https://huggingface.co https://*.hf.space https://*.huggingface.co; font-src 'self' data:;"
    );
    return response;
}

export async function middleware(request) {
    const url = request.nextUrl;

    const publicPath = url.pathname === '/login' || url.pathname === '/api/personal/session';
    const protectedMode = process.env.NODE_ENV === 'production' || accessConfigured();
    if (!publicPath && protectedMode && (!accessConfigured() || !await verifySession(request.cookies.get(SESSION_COOKIE)?.value, process.env.STUDIO_SESSION_SECRET))) {
        if (url.pathname.startsWith('/api/')) return addSecurityHeaders(NextResponse.json({ error: 'Özel stüdyo oturumu gerekli.' }, { status: 401 }));
        return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    }
    // Existing MuAPI features remain opt-in. No hosted paid proxy is enabled by default.
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/personal/') && !url.pathname.startsWith('/api/huggingface/') && process.env.ENABLE_PAID_APIS !== 'true') {
        return addSecurityHeaders(NextResponse.json({ error: 'Ücretli API kullanımı devre dışı.' }, { status: 403 }));
    }

    // Catch requests to /api/workflow, /api/app, and /api/v1
    const isMuApi = url.pathname.startsWith('/api/workflow') ||
                    url.pathname.startsWith('/api/app') ||
                    url.pathname.startsWith('/api/v1');

    if (isMuApi) {
        // Exclude paths that have their own dedicated route handlers with custom logic
        const isHandledByRoute = url.pathname.startsWith('/api/v1/creative-agent') ||
                                url.pathname.startsWith('/api/v1/get_upload_url') ||
                                url.pathname.startsWith('/api/v1/upload-binary');

        if (url.pathname.startsWith('/api/v1') && !isHandledByRoute) {
            const targetUrl = new URL(url.pathname + url.search, 'https://api.muapi.ai');
            const rewriteResponse = NextResponse.rewrite(targetUrl);
            return addSecurityHeaders(rewriteResponse);
        }
    }

    // Plain response header carrying the locale derived from the URL path
    // (same "set in middleware, read via headers() in the root layout"
    // trick the main muapi client uses — see docs/localization.md).
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-locale', url.pathname.startsWith('/personal') || url.pathname === '/login' ? 'tr' : getLocaleFromPathname(url.pathname));
    const localizedResponse = NextResponse.next({ request: { headers: requestHeaders } });
    if (url.pathname.startsWith('/personal')) localizedResponse.headers.set('Cache-Control', 'private, no-store');
    return addSecurityHeaders(localizedResponse);
}

// Match all paths for security headers. Exclude Next.js internal paths.
export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico|__nextjs_original-stack-frame).*)',
    ],
};
