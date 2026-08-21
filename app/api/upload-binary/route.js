import { handleUploadProxy } from '../../../src/lib/handleUploadProxy.js';

export const runtime = 'nodejs';

export async function POST(request) {
    return handleUploadProxy(request);
}
