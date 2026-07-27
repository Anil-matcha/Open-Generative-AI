import { NextResponse } from 'next/server';

// Hostnames (or suffixes) permitted as upload targets for the S3 proxy.
// The upstream returns presigned URLs on AWS S3 / S3-compatible storage.
// We restrict the proxy to those hosts to prevent SSRF via the
// user-controllable `x-proxy-target-url` form field.
const ALLOWED_HOST_SUFFIXES = [
    '.amazonaws.com',
    '.s3.amazonaws.com',
    '.cloudfront.net',
    '.muapi.ai',
];

function isAllowedTarget(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return false;
    }
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOST_SUFFIXES.some(
        (suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix)
    );
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        
        // Extract the original S3 target URL
        const targetUrl = formData.get('x-proxy-target-url');
        
        if (!targetUrl) {
            return NextResponse.json({ error: 'Missing proxy target URL' }, { status: 400 });
        }

        if (typeof targetUrl !== 'string' || !isAllowedTarget(targetUrl)) {
            return NextResponse.json({ error: 'Invalid proxy target URL' }, { status: 400 });
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
