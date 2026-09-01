import { evaluateJsonSafety } from '../../../../../src/lib/contentSafety.js';
import {
    authorizeCreatorRequest,
    creatorJson,
} from '../../../../../src/lib/creatorProviderGateway.js';
import {
    createMuapiSocialConnectUrl,
    disconnectMuapiSocialAccount,
    getMuapiSocialPostStatus,
    listMuapiSocialAccounts,
    muapiSocialProviderStatus,
    publishMuapiSocial,
} from '../../../../../src/lib/muapiSocialPublishing.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BODY_BYTES = 64 * 1024;

async function parseBody(request) {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_BODY_BYTES) return { response: creatorJson({ error: 'Request body is too large.' }, 413) };
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return { response: creatorJson({ error: 'Request body is too large.' }, 413) };
    }
    let value;
    try {
        value = JSON.parse(raw);
    } catch {
        return { response: creatorJson({ error: 'A valid JSON request body is required.' }, 400) };
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { response: creatorJson({ error: 'The request body must be a JSON object.' }, 400) };
    }
    const safety = evaluateJsonSafety(raw, { env: process.env });
    if (!safety.allowed) {
        return { response: creatorJson({ error: 'Request blocked by content safety policy.', reason: safety.reason }, 422) };
    }
    return { value };
}

function resultResponse(result, successStatus = 200) {
    if (result.ok) {
        const { ok, status, ...body } = result;
        return creatorJson(body, status || successStatus);
    }
    const { ok, status, ...body } = result;
    return creatorJson(body, status || 500);
}

async function socialStatus(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'muapi-social-status',
        statusRequest: true,
    });
    if (auth.response) return auth.response;
    return creatorJson(muapiSocialProviderStatus(process.env));
}

async function socialAccounts(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'muapi-social-accounts',
        statusRequest: true,
    });
    if (auth.response) return auth.response;
    return resultResponse(await listMuapiSocialAccounts(auth.user, { env: process.env }));
}

async function socialConnect(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'muapi-social-connect',
    });
    if (auth.response) return auth.response;
    const parsed = await parseBody(request);
    if (parsed.response) return parsed.response;
    return resultResponse(await createMuapiSocialConnectUrl(auth.user, parsed.value, {
        requestUrl: request.url,
        env: process.env,
    }));
}

async function socialPublish(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'muapi-social-publish',
    });
    if (auth.response) return auth.response;
    const parsed = await parseBody(request);
    if (parsed.response) return parsed.response;
    return resultResponse(await publishMuapiSocial(auth.user, parsed.value, { env: process.env }), 202);
}

async function socialDisconnect(request) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'muapi-social-disconnect',
    });
    if (auth.response) return auth.response;
    const parsed = await parseBody(request);
    if (parsed.response) return parsed.response;
    return resultResponse(await disconnectMuapiSocialAccount(auth.user, parsed.value, { env: process.env }));
}

async function postStatus(request, jobId) {
    const auth = authorizeCreatorRequest(request, {
        env: process.env,
        action: 'muapi-social-post-status',
        statusRequest: true,
    });
    if (auth.response) return auth.response;
    return resultResponse(await getMuapiSocialPostStatus(jobId, { env: process.env }));
}

async function dispatch(request, context, method) {
    const { path = [] } = await context.params;
    const route = `${method}:${path.join('/')}`;
    if (method === 'GET' && path[0] === 'posts' && path.length === 2) {
        return postStatus(request, path[1]);
    }
    switch (route) {
        case 'GET:status':
            return socialStatus(request);
        case 'GET:accounts':
            return socialAccounts(request);
        case 'POST:connect':
            return socialConnect(request);
        case 'POST:publish':
            return socialPublish(request);
        case 'POST:disconnect':
            return socialDisconnect(request);
        default:
            return creatorJson({ error: 'Social publishing route not found.' }, 404);
    }
}

export function GET(request, context) {
    return dispatch(request, context, 'GET');
}

export function POST(request, context) {
    return dispatch(request, context, 'POST');
}

