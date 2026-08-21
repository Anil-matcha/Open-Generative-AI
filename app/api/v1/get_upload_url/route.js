import { proxyUploadCredentials } from '../../../../src/lib/uploadCredentialProxy.js';

export const runtime = 'nodejs';

export async function GET(request) {
    return proxyUploadCredentials(request, {
        prefix: 'app',
        pathSegments: ['get_file_upload_url'],
        proxyUrl: '/api/v1/upload-binary',
    });
}
