import { proxyMuapi } from '../../../../src/lib/muapiProxy.js';
import { proxyUploadCredentials } from '../../../../src/lib/uploadCredentialProxy.js';

function effectivePath(path) {
    return path.length === 1 && path[0] === 'get_upload_file'
        ? ['get_file_upload_url']
        : path;
}

async function proxy(request, { params }, method) {
    const { path = [] } = await params;
    const normalizedPath = effectivePath(path);
    if (method === 'GET' && normalizedPath.length === 1 && normalizedPath[0] === 'get_file_upload_url') {
        return proxyUploadCredentials(request, {
            prefix: 'app',
            pathSegments: normalizedPath,
            proxyUrl: '/api/upload-binary',
        });
    }
    return proxyMuapi(request, { prefix: 'app', pathSegments: normalizedPath, method });
}

export function GET(request, context) { return proxy(request, context, 'GET'); }
export function POST(request, context) { return proxy(request, context, 'POST'); }
export function PUT(request, context) { return proxy(request, context, 'PUT'); }
export function PATCH(request, context) { return proxy(request, context, 'PATCH'); }
export function DELETE(request, context) { return proxy(request, context, 'DELETE'); }
