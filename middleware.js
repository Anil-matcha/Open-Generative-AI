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
