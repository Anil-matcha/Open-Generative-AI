import { NextResponse } from 'next/server';

function buildContentSecurityPolicy(nonce) {
    const developmentEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';
    return [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentEval}`,
        "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https:",
        "connect-src 'self' https://muapi.ai https://*.muapi.ai https://*.blob.vercel-storage.com",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
    ].join('; ');
}

function addSecurityHeaders(response, contentSecurityPolicy) {
    // Prevent MIME type sniffing (CWE-693)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // Prevent clickjacking (CWE-1021)
    response.headers.set('X-Frame-Options', 'DENY');
    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    // Content Security Policy - restricts script sources to prevent XSS (CWE-79).
    // connect-src covers *.muapi.ai (not just api.muapi.ai) because generated
    // media, model thumbnails, and other assets are served from cdn.muapi.ai
    // and other muapi subdomains that the renderer fetches directly. Private
    // Vercel Blob is allowed only for authenticated Creator Studio uploads.
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);

    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    return response;
}

export function middleware(request) {
    // All MuAPI traffic now passes through route handlers that enforce authentication
    // and sanitize forwarded headers. Middleware only adds browser security headers.
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return addSecurityHeaders(response, contentSecurityPolicy);
}

// Match all paths for security headers. Exclude Next.js internal paths.
export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico|__nextjs_original-stack-frame).*)',
    ],
};
