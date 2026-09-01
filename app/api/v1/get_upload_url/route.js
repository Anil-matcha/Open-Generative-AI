import { proxyUploadCredentials } from '../../../../src/lib/uploadCredentialProxy.js';
import { creatorMuapiProxyCredential } from '../../../../src/lib/creatorMuapiProxy.js';

export const runtime = 'nodejs';

export async function GET(request) {
    const credential = creatorMuapiProxyCredential(request, {
        action: 'creative-canvas-upload-ticket',
        statusRequest: true,
    });
    if (credential.response) return credential.response;
    return proxyUploadCredentials(request, {
        prefix: 'app',
        pathSegments: ['get_file_upload_url'],
        proxyUrl: '/api/v1/upload-binary',
        ...(credential.creatorSession ? { apiKeyOverride: credential.apiKey } : {}),
    });
}
