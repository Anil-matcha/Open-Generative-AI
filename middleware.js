import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl;

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
            return NextResponse.rewrite(targetUrl);
        }
    }

    // Add security headers to all responses
    const response = NextResponse.next();

    // Prevent MIME type sniffing (CWE-693)
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking (CWE-1021)
    response.headers.set('X-Frame-Options', 'DENY');

    // Enable XSS filter in legacy browsers
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy - restricts script sources to prevent XSS (CWE-79)
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; connect-src 'self' https://api.muapi.ai; font-src 'self' data:;"
    );

    return response;
}

// Match the paths we want to proxy
export const config = {
    matcher: [
        '/api/workflow/:path*',
        '/api/app/:path*',
        '/api/v1/:path*'
    ],
};
