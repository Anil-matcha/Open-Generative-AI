import {
    creatorNotFound,
    handleBrainAssistant,
    handleCreatorAgentConversation,
    handleCreatorAgentDelegate,
    handleCreatorAgentEnsure,
    handleCreatorAgents,
    handleCreatorAgentStatus,
    handleCreatorProviders,
    handleElevenLabsSpeech,
    handleHeyGenStatus,
    handleHeyGenVideo,
    handleMuapiImage,
    handleMuapiStatus,
    handleMuapiVideo,
} from '../../../../src/lib/creatorProviderGateway.js';
import { handleCreatorProjectRoute } from '../../../../src/lib/creatorProjectRoutes.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function dispatch(request, context, method) {
    const { path = [] } = await context.params;
    if (path[0] === 'projects') {
        return handleCreatorProjectRoute(request, {
            path: path.slice(1),
            method,
        });
    }
    const route = `${method}:${path.join('/')}`;

    switch (route) {
        case 'GET:providers':
            return handleCreatorProviders(request);
        case 'POST:assistant':
            return handleBrainAssistant(request);
        case 'POST:image':
            return handleMuapiImage(request);
        case 'POST:video':
            return handleMuapiVideo(request);
        case 'GET:muapi/status':
            return handleMuapiStatus(request);
        case 'POST:speech':
            return handleElevenLabsSpeech(request);
        case 'POST:heygen':
            return handleHeyGenVideo(request);
        case 'GET:heygen/status':
            return handleHeyGenStatus(request);
        case 'GET:agents':
            return handleCreatorAgents(request);
        case 'POST:agents/ensure':
            return handleCreatorAgentEnsure(request);
        case 'POST:agents/delegate':
            return handleCreatorAgentDelegate(request);
        case 'GET:agents/status':
            return handleCreatorAgentStatus(request);
        case 'GET:agents/conversation':
            return handleCreatorAgentConversation(request);
        default:
            return creatorNotFound();
    }
}

export function GET(request, context) {
    return dispatch(request, context, 'GET');
}

export function POST(request, context) {
    return dispatch(request, context, 'POST');
}

export function PUT(request, context) {
    return dispatch(request, context, 'PUT');
}

export function PATCH(request, context) {
    return dispatch(request, context, 'PATCH');
}

export function DELETE(request, context) {
    return dispatch(request, context, 'DELETE');
}
