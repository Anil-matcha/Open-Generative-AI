import { handleUploadProxy } from '../../../../src/lib/handleUploadProxy.js';
import { creatorMuapiProxyCredential } from '../../../../src/lib/creatorMuapiProxy.js';

export const runtime = 'nodejs';

export async function POST(request) {
    const credential = creatorMuapiProxyCredential(request, {
        action: 'creative-canvas-upload',
    });
    if (credential.response) return credential.response;
    return handleUploadProxy(request, credential.creatorSession
        ? { apiKeyOverride: credential.apiKey }
        : undefined);
}
