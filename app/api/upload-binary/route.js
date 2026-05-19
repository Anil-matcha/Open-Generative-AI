import { NextResponse } from 'next/server';
import { validateAndPinProxyTarget } from '../../lib/proxyTargetSafety.mjs';

export async function POST(request) {
    try {
        const formData = await request.formData();

        // Extract the original S3 target URL we injected earlier
        const rawTargetUrl = formData.get('x-proxy-target-url');

        if (!rawTargetUrl) {
            return NextResponse.json({ error: 'Missing proxy target URL' }, { status: 400 });
        }

        // Validate the URL so an attacker cannot turn this S3 helper into a
        // generic SSRF gadget pointed at cloud metadata or internal services.
        let target;
        try {
            target = await validateAndPinProxyTarget(String(rawTargetUrl));
        } catch (err) {
            return NextResponse.json(
                { error: `Invalid proxy target: ${err.message}` },
                { status: 400 }
            );
        }

        // Reconstruct the FormData for S3 (excluding our internal proxy marker)
        const s3FormData = new FormData();

        // S3 is very sensitive to field ordering. We must ensure 'file' is likely last
        // or at least that all signature fields come before what S3 expects.
        // The original library code appends 'file' last, so iterating should preserve that.
        for (const [key, value] of formData.entries()) {
            if (key !== 'x-proxy-target-url') {
                s3FormData.append(key, value);
            }
        }

        // Perform the server-to-server POST to S3
        // This bypasses browser CORS/Preflight security entirely
        const s3Response = await fetch(target.url, {
            method: 'POST',
            body: s3FormData,
            dispatcher: target.dispatcher,
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
