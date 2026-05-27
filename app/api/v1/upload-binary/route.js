import { NextResponse } from 'next/server';

// Disallow internal/reserved IP ranges to prevent SSRF abuse of the proxy.
const INTERNAL_HOST_RE = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.|0\.|::1|localhost)/i;

function isUnsafeTarget(url) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return true;
        if (INTERNAL_HOST_RE.test(parsed.hostname)) return true;
        return false;
    } catch {
        return true;
    }
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        
        // Extract the original S3 target URL
        const targetUrl = formData.get('x-proxy-target-url');
        
        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing proxy target URL' }, { status: 400 });
        }

        if (isUnsafeTarget(targetUrl)) {
            return NextResponse.json({ error: 'Invalid or unsafe proxy target URL' }, { status: 400 });
        }

        const s3FormData = new FormData();
        for (const [key, value] of formData.entries()) {
            if (key !== 'x-proxy-target-url') {
                s3FormData.append(key, value);
            }
        }

        const s3Response = await fetch(targetUrl, {
            method: 'POST',
            body: s3FormData,
        });

        if (s3Response.ok || s3Response.status === 204) {
            return new Response(null, { status: 204 });
        } else {
            const errorText = await s3Response.text();
            console.error('S3 Proxy Error:', errorText);
            return new Response(errorText, { status: s3Response.status });
        }
    } catch (error) {
        console.error('Upload Proxy Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
