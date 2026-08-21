import { fetchMuapi } from './muapiProxy.js';
import { protectUploadCredentials } from './uploadTicket.js';

function json(body, status) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': 'no-store',
        },
    });
}

export async function proxyUploadCredentials(request, {
    prefix,
    pathSegments,
    proxyUrl,
    env = process.env,
} = {}) {
    const result = await fetchMuapi(request, { prefix, pathSegments, method: 'GET', env });
    if (!result.upstream || !result.upstream.ok) return result.response;

    try {
        const data = JSON.parse(new TextDecoder().decode(result.body));
        const safeCredentials = protectUploadCredentials(data, {
            apiKey: result.apiKey,
            proxyUrl,
            env,
        });
        return json(safeCredentials, result.upstream.status);
    } catch (error) {
        console.error('Unable to protect upload credentials', { error: error?.message });
        return json({ error: 'Upload proxy is not configured' }, 503);
    }
}
