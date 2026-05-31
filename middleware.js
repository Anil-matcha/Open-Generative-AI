import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl;

    // Proxy /api/mf/* → https://memefast.top/*
    // Exclude /api/mf/workflow/* and /api/mf/agents/* — those are handled by local Next.js routes
    if (url.pathname.startsWith('/api/mf/') &&
        !url.pathname.startsWith('/api/mf/workflow') &&
        !url.pathname.startsWith('/api/mf/agents')) {
        const targetPath = url.pathname.replace('/api/mf', '');
        const targetUrl = new URL(targetPath + url.search, 'https://memefast.top');
        return NextResponse.rewrite(targetUrl);
    }

    // Catch requests to /api/workflow, /api/app, and /api/v1 (legacy Muapi paths)
    const isMuApi = url.pathname.startsWith('/api/workflow') ||
                    url.pathname.startsWith('/api/app') ||
                    url.pathname.startsWith('/api/v1');

    if (isMuApi) {
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

export const config = {
    matcher: [
        '/api/mf/:path*',
        '/api/workflow/:path*',
        '/api/app/:path*',
        '/api/v1/:path*'
    ],
};
