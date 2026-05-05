import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl;
    
    // Catch requests to /api/workflow, /api/app, and /api/v1
    const isMuApi = url.pathname.startsWith('/api/workflow') || 
                    url.pathname.startsWith('/api/app') || 
                    url.pathname.startsWith('/api/v1');

    if (isMuApi) {
        // Remap /api/v1 ONLY if it's not handled by a specific route.
        // Actually, we'll let existing remapping for /api/v1 stay if needed,
        // but we'll remove app/workflow as they need special handling.
        if (url.pathname.startsWith('/api/v1')) {
            const targetUrl = new URL(url.pathname + url.search, 'https://api.muapi.ai');
            return NextResponse.rewrite(targetUrl);
        }
    }

    return NextResponse.next();
}

// Match the paths we want to proxy
export const config = {
    matcher: [
        '/api/workflow/:path*', 
        '/api/app/:path*',
        '/api/v1/:path*'
    ],
};
