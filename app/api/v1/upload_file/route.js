import { handleDirectUploadProxy } from '../../../../src/lib/handleDirectUploadProxy.js';

export const runtime = 'nodejs';

export async function POST(request) {
    return handleDirectUploadProxy(request);
}
