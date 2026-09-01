import { handleUpload } from '@vercel/blob/client';

import { evaluateJsonSafety } from './contentSafety.js';
import { authorizeCreatorRequest, creatorJson } from './creatorProviderGateway.js';
import {
    CreatorProjectError,
    addCreatorAsset,
    createCreatorProject,
    creatorAssetStorageConfiguration,
    creatorAssetUploadPrefix,
    creatorProjectConfiguration,
    deleteCreatorAsset,
    getCreatorProject,
    listCreatorProjects,
    renameCreatorProject,
    saveCreatorConversation,
    saveCreatorStoryboard,
} from './creatorProjectStore.js';

const MAX_PROJECT_REQUEST_BYTES = 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = Object.freeze([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
]);

function uploadLimit(env) {
    const parsed = Number(env.CREATOR_ASSET_UPLOAD_MAX_BYTES);
    if (!Number.isFinite(parsed)) return 250 * 1024 * 1024;
    return Math.min(1024 * 1024 * 1024, Math.max(1024 * 1024, Math.round(parsed)));
}

function projectFailure(error) {
    if (error instanceof CreatorProjectError) {
        return creatorJson({ error: error.message, code: error.code }, error.status);
    }
    return creatorJson({ error: 'Project storage is temporarily unavailable.' }, 503);
}

async function parseProjectJson(request, env) {
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > MAX_PROJECT_REQUEST_BYTES) {
        throw new CreatorProjectError('request_too_large', 'Project request is too large.', 413);
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_PROJECT_REQUEST_BYTES) {
        throw new CreatorProjectError('request_too_large', 'Project request is too large.', 413);
    }
    let value;
    try {
        value = JSON.parse(raw);
    } catch {
        throw new CreatorProjectError('invalid_json', 'A valid JSON request body is required.');
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new CreatorProjectError('invalid_json', 'Project request must be a JSON object.');
    }
    const safety = evaluateJsonSafety(raw, { env });
    if (!safety.allowed) {
        throw new CreatorProjectError('content_safety', 'Project request was blocked by the content safety policy.', 422);
    }
    return value;
}

function uploadPathAllowed(pathname, projectId) {
    if (typeof pathname !== 'string' || pathname.length > 512) return false;
    const prefix = creatorAssetUploadPrefix(projectId);
    const suffix = pathname.slice(prefix.length);
    return pathname.startsWith(prefix) && /^[A-Za-z0-9][A-Za-z0-9._-]{0,220}$/.test(suffix);
}

async function authorizeAssetUpload(request, user, {
    env,
    blobStore,
    handleUploadImpl,
}) {
    const configuration = creatorProjectConfiguration(env);
    if (!configuration.configured) {
        return creatorJson({
            error: 'Durable Project storage is not configured.',
            missing: configuration.missing,
        }, 503);
    }
    const assetConfiguration = creatorAssetStorageConfiguration(env);
    if (!assetConfiguration.configured) {
        return creatorJson({
            error: 'Public Creator Asset storage is not configured.',
            missing: assetConfiguration.missing,
        }, 503);
    }
    let body;
    try {
        body = await request.json();
    } catch {
        return creatorJson({ error: 'A valid Blob upload request is required.' }, 400);
    }
    if (body?.type !== 'blob.generate-client-token') {
        return creatorJson({ error: 'Unsupported Blob upload event.' }, 400);
    }

    try {
        const result = await handleUploadImpl({
            token: assetConfiguration.blobToken,
            request,
            body,
            onBeforeGenerateToken: async (pathname, clientPayload) => {
                let payload;
                try {
                    payload = JSON.parse(clientPayload || '{}');
                } catch {
                    throw new Error('invalid_project_upload_payload');
                }
                const project = await getCreatorProject(user, payload.projectId, { env, blobStore });
                if (!uploadPathAllowed(pathname, project.id)) throw new Error('invalid_project_upload_path');
                return {
                    allowedContentTypes: [...ALLOWED_UPLOAD_TYPES],
                    maximumSizeInBytes: uploadLimit(env),
                    validUntil: Date.now() + 10 * 60 * 1000,
                    addRandomSuffix: true,
                    allowOverwrite: false,
                    cacheControlMaxAge: 60,
                };
            },
        });
        return creatorJson(result);
    } catch {
        return creatorJson({ error: 'Creator Studio could not authorize the Project Asset upload.' }, 502);
    }
}

export async function handleCreatorProjectRoute(request, {
    path = [],
    method = request.method,
    env = process.env,
    blobStore,
    now = Date.now(),
    idGenerator,
    handleUploadImpl = handleUpload,
} = {}) {
    const normalizedMethod = String(method || 'GET').toUpperCase();
    const action = `projects-${normalizedMethod.toLowerCase()}-${path.slice(0, 3).join('-') || 'list'}`;
    const auth = authorizeCreatorRequest(request, {
        env,
        action,
        statusRequest: normalizedMethod === 'GET',
    });
    if (auth.response) return auth.response;

    try {
        if (normalizedMethod === 'POST' && path.length === 1 && path[0] === 'blob-upload') {
            return authorizeAssetUpload(request, auth.user, { env, blobStore, handleUploadImpl });
        }
        if (normalizedMethod === 'GET' && path.length === 0) {
            const projects = await listCreatorProjects(auth.user, { env, blobStore });
            return creatorJson({ projects, configured: true });
        }
        if (normalizedMethod === 'POST' && path.length === 0) {
            const input = await parseProjectJson(request, env);
            const project = await createCreatorProject(auth.user, input, { env, blobStore, now, idGenerator });
            return creatorJson({ project }, 201);
        }
        if (normalizedMethod === 'GET' && path.length === 1) {
            const project = await getCreatorProject(auth.user, path[0], { env, blobStore });
            return creatorJson({ project });
        }
        if (normalizedMethod === 'PATCH' && path.length === 1) {
            const input = await parseProjectJson(request, env);
            const project = await renameCreatorProject(auth.user, path[0], input, { env, blobStore, now });
            return creatorJson({ project });
        }
        if (normalizedMethod === 'POST' && path.length === 2 && path[1] === 'assets') {
            const input = await parseProjectJson(request, env);
            const result = await addCreatorAsset(auth.user, path[0], input, { env, blobStore, now, idGenerator });
            return creatorJson(result, result.created ? 201 : 200);
        }
        if (normalizedMethod === 'DELETE' && path.length === 3 && path[1] === 'assets') {
            const input = await parseProjectJson(request, env);
            const result = await deleteCreatorAsset(auth.user, path[0], path[2], input, { env, blobStore, now });
            return creatorJson(result);
        }
        if (normalizedMethod === 'PUT' && path.length === 2 && path[1] === 'storyboard') {
            const input = await parseProjectJson(request, env);
            const project = await saveCreatorStoryboard(auth.user, path[0], input, { env, blobStore, now });
            return creatorJson({ project });
        }
        if (normalizedMethod === 'PUT' && path.length === 2 && path[1] === 'conversation') {
            const input = await parseProjectJson(request, env);
            const project = await saveCreatorConversation(auth.user, path[0], input, { env, blobStore, now });
            return creatorJson({ project });
        }
        return creatorJson({ error: 'Creator Project route not found.' }, 404);
    } catch (error) {
        return projectFailure(error);
    }
}
