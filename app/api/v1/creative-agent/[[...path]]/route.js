import { proxyCreatorCreativeCanvas } from '../../../../../src/lib/creatorMuapiProxy.js';

async function proxy(request, { params }, method) {
    const { path = [] } = await params;
    return proxyCreatorCreativeCanvas(request, { prefix: 'api/v1/creative-agent', pathSegments: path, method });
}

export function GET(request, context) { return proxy(request, context, 'GET'); }
export function POST(request, context) { return proxy(request, context, 'POST'); }
export function PUT(request, context) { return proxy(request, context, 'PUT'); }
export function PATCH(request, context) { return proxy(request, context, 'PATCH'); }
export function DELETE(request, context) { return proxy(request, context, 'DELETE'); }
