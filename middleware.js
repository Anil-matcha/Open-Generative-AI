import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl;

    // /api/mf/* → https://memefast.top/* (strips /api/mf prefix)
    if (url.pathname.startsWith('/api/mf/')) {
        const targetPath = url.pathname.replace('/api/mf', '');
        const targetUrl = new URL(targetPath + url.search, 'https://memefast.top');
        return NextResponse.rewrite(targetUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/mf/:path*'],
};
