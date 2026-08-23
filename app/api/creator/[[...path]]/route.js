import {
    creatorNotFound,
    handleAnthropicAssistant,
    handleCreatorProviders,
    handleElevenLabsSpeech,
    handleHeyGenStatus,
    handleHeyGenVideo,
    handleOpenAiImage,
    handleRunwayStatus,
    handleRunwayVideo,
} from '../../../../src/lib/creatorProviderGateway.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function dispatch(request, context, method) {
    const { path = [] } = await context.params;
    const route = `${method}:${path.join('/')}`;

    switch (route) {
        case 'GET:providers':
            return handleCreatorProviders(request);
        case 'POST:assistant':
            return handleAnthropicAssistant(request);
        case 'POST:image':
            return handleOpenAiImage(request);
        case 'POST:speech':
            return handleElevenLabsSpeech(request);
        case 'POST:heygen':
            return handleHeyGenVideo(request);
        case 'GET:heygen/status':
            return handleHeyGenStatus(request);
        case 'POST:runway':
            return handleRunwayVideo(request);
        case 'GET:runway/status':
            return handleRunwayStatus(request);
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
