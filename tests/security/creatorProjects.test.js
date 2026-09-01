import assert from 'node:assert/strict';
import test from 'node:test';

import { createCreatorSession, creatorCookieSettings } from '../../src/lib/creatorAuth.js';
import { handleCreatorProjectRoute } from '../../src/lib/creatorProjectRoutes.js';
import {
    CreatorProjectError,
    addCreatorAsset,
    createCreatorProject,
    creatorAssetUploadPrefix,
    creatorProjectStoreForTests,
    deleteCreatorAsset,
    getCreatorProject,
    listCreatorProjects,
    saveCreatorStoryboard,
} from '../../src/lib/creatorProjectStore.js';
import { resetRateLimitStore } from '../../src/lib/rateLimit.js';

const env = {
    BLOB_READ_WRITE_TOKEN: 'vercel-blob-test-token-that-is-long-enough',
    CREATOR_ASSET_BLOB_READ_WRITE_TOKEN: 'creator-public-blob-test-token-that-is-long-enough',
    CREATOR_SESSION_SECRET: 'creator-project-test-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678,87654321',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng,other-owner',
    CREATOR_STUDIO_RATE_LIMIT: '50',
    CREATOR_STUDIO_STATUS_RATE_LIMIT: '50',
    CONTENT_SAFETY_MODE: 'enforce',
};
const owner = { id: 12345678, login: 'lalambert1982-eng' };
const otherOwner = { id: 87654321, login: 'other-owner' };
const projectId = '11111111-1111-4111-8111-111111111111';
const assetId = '22222222-2222-4222-8222-222222222222';

test('durable Project manifests isolate owners even when record IDs match', async () => {
    const records = new Map();
    const blobStore = creatorProjectStoreForTests(records);
    const first = await createCreatorProject(owner, { name: 'Greg Project' }, {
        env,
        blobStore,
        idGenerator: () => projectId,
        now: Date.UTC(2026, 7, 29),
    });
    assert.equal(first.name, 'Greg Project');
    assert.equal(Object.hasOwn(first, 'ownerSubject'), false);

    await assert.rejects(
        getCreatorProject(otherOwner, projectId, { env, blobStore }),
        (error) => error instanceof CreatorProjectError && error.code === 'project_not_found' && error.status === 404,
    );

    await createCreatorProject(otherOwner, { name: 'Other Project' }, {
        env,
        blobStore,
        idGenerator: () => projectId,
        now: Date.UTC(2026, 7, 30),
    });
    assert.equal((await getCreatorProject(owner, projectId, { env, blobStore })).name, 'Greg Project');
    assert.equal((await getCreatorProject(otherOwner, projectId, { env, blobStore })).name, 'Other Project');
    assert.deepEqual((await listCreatorProjects(owner, { env, blobStore })).map((item) => item.name), ['Greg Project']);
    assert.deepEqual((await listCreatorProjects(otherOwner, { env, blobStore })).map((item) => item.name), ['Other Project']);
});

test('Asset ownership, safe URLs, and deletion approval are enforced server-side', async () => {
    const records = new Map();
    const blobStore = creatorProjectStoreForTests(records);
    await createCreatorProject(owner, { name: 'Asset Project' }, {
        env,
        blobStore,
        idGenerator: () => projectId,
    });

    await assert.rejects(
        addCreatorAsset(owner, projectId, {
            type: 'image',
            title: 'Unsafe',
            url: 'https://attacker.test/image.png',
        }, { env, blobStore, idGenerator: () => assetId }),
        (error) => error instanceof CreatorProjectError && error.code === 'invalid_asset_url',
    );

    const storagePath = `${creatorAssetUploadPrefix(projectId)}source.png`;
    records.set(storagePath, {
        pathname: storagePath,
        bytes: Buffer.from('owned-media'),
        url: 'https://creator.public.blob.vercel-storage.com/source.png',
    });
    const added = await addCreatorAsset(owner, projectId, {
        type: 'image',
        title: 'Opening Frame',
        url: 'https://creator.public.blob.vercel-storage.com/source.png',
        storagePath,
        source: 'upload',
        mimeType: 'image/png',
    }, { env, blobStore, idGenerator: () => assetId });
    assert.equal(added.asset.projectId, projectId);
    assert.equal(added.asset.id, assetId);

    await assert.rejects(
        deleteCreatorAsset(owner, projectId, assetId, { approved: false }, { env, blobStore }),
        (error) => error instanceof CreatorProjectError && error.code === 'approval_required' && error.status === 403,
    );
    assert.equal(records.has(storagePath), true);

    await assert.rejects(
        deleteCreatorAsset(otherOwner, projectId, assetId, { approved: true }, { env, blobStore }),
        (error) => error instanceof CreatorProjectError && error.code === 'project_not_found',
    );

    const deleted = await deleteCreatorAsset(owner, projectId, assetId, { approved: true }, {
        env,
        blobStore,
        assetBlobStore: blobStore,
    });
    assert.equal(deleted.deletedAssetId, assetId);
    assert.equal(deleted.project.assets.length, 0);
    assert.equal(records.has(storagePath), false);
});

test('saving a Storyboard produces a versioned non-rendered timeline manifest', async () => {
    const blobStore = creatorProjectStoreForTests();
    await createCreatorProject(owner, { name: 'Storyboard Project' }, {
        env,
        blobStore,
        idGenerator: () => projectId,
    });
    const project = await saveCreatorStoryboard(owner, projectId, {
        storyboard: {
            selectedSceneId: 'scene-1',
            scenes: [{
                id: 'scene-1',
                title: 'Opening',
                prompt: 'Track lights at dusk.',
                imageUrl: 'https://cdn.muapi.ai/outputs/opening.png',
                videoUrl: '',
                duration: 5,
                aspectRatio: '16:9',
                transition: 'dissolve',
                status: 'ready',
            }],
        },
    }, { env, blobStore });
    assert.equal(project.timeline.version, 1);
    assert.equal(project.timeline.render.status, 'not-requested');
    assert.equal(project.timeline.clips.length, 1);
    assert.equal(project.timeline.clips[0].source.type, 'image');
    assert.deepEqual(project.timeline.clips[0].transition, {
        type: 'dissolve',
        duration: null,
        rendered: false,
    });
});

test('Project routes require owner authentication and same-origin mutation', async () => {
    resetRateLimitStore();
    const records = new Map();
    const blobStore = creatorProjectStoreForTests(records);
    const cookieName = creatorCookieSettings(env).sessionName;
    const session = createCreatorSession(owner, { env });
    const request = ({ authenticated = true, origin = 'https://local.test' } = {}) => new Request('https://local.test/api/creator/projects', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            origin,
            'sec-fetch-site': origin === 'https://local.test' ? 'same-origin' : 'cross-site',
            ...(authenticated ? { cookie: `${cookieName}=${session}` } : {}),
        },
        body: JSON.stringify({ name: 'Secure Project' }),
    });

    const unauthenticated = await handleCreatorProjectRoute(request({ authenticated: false }), {
        path: [], env, blobStore, idGenerator: () => projectId,
    });
    assert.equal(unauthenticated.status, 401);

    const crossOrigin = await handleCreatorProjectRoute(request({ origin: 'https://attacker.test' }), {
        path: [], env, blobStore, idGenerator: () => projectId,
    });
    assert.equal(crossOrigin.status, 403);
    assert.equal(records.size, 0);

    const created = await handleCreatorProjectRoute(request(), {
        path: [], env, blobStore, idGenerator: () => projectId,
    });
    assert.equal(created.status, 201);
    const body = await created.json();
    assert.equal(body.project.id, projectId);
    const serialized = JSON.stringify(body);
    assert.equal(serialized.includes(env.BLOB_READ_WRITE_TOKEN), false);
    assert.equal(serialized.includes(env.CREATOR_SESSION_SECRET), false);
    assert.equal(serialized.includes('ownerSubject'), false);
});

test('Project Asset uploads use only the separate public Blob credential', async () => {
    resetRateLimitStore();
    const records = new Map();
    const blobStore = creatorProjectStoreForTests(records);
    await createCreatorProject(owner, { name: 'Upload Project' }, {
        env,
        blobStore,
        idGenerator: () => projectId,
    });
    const cookieName = creatorCookieSettings(env).sessionName;
    const session = createCreatorSession(owner, { env });
    const pathname = `${creatorAssetUploadPrefix(projectId)}opening.png`;
    const request = new Request('https://local.test/api/creator/projects/blob-upload', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            origin: 'https://local.test',
            'sec-fetch-site': 'same-origin',
            cookie: `${cookieName}=${session}`,
        },
        body: JSON.stringify({ type: 'blob.generate-client-token' }),
    });
    let authorizedToken = '';
    const response = await handleCreatorProjectRoute(request, {
        path: ['blob-upload'],
        env,
        blobStore,
        handleUploadImpl: async (options) => {
            authorizedToken = options.token;
            const constraints = await options.onBeforeGenerateToken(pathname, JSON.stringify({ projectId }));
            assert.equal(constraints.allowedContentTypes.includes('image/png'), true);
            assert.equal(constraints.addRandomSuffix, true);
            return { type: 'blob.generate-client-token', clientToken: 'opaque-short-lived-token' };
        },
    });
    assert.equal(response.status, 200);
    assert.equal(authorizedToken, env.CREATOR_ASSET_BLOB_READ_WRITE_TOKEN);
    assert.notEqual(authorizedToken, env.BLOB_READ_WRITE_TOKEN);
    const serialized = JSON.stringify(await response.json());
    assert.equal(serialized.includes(env.CREATOR_ASSET_BLOB_READ_WRITE_TOKEN), false);
    assert.equal(serialized.includes(env.BLOB_READ_WRITE_TOKEN), false);
});

test('Project Asset uploads fail visibly closed when the public store is not configured', async () => {
    resetRateLimitStore();
    const missingAssetStoreEnv = { ...env, CREATOR_ASSET_BLOB_READ_WRITE_TOKEN: '' };
    const cookieName = creatorCookieSettings(missingAssetStoreEnv).sessionName;
    const session = createCreatorSession(owner, { env: missingAssetStoreEnv });
    const response = await handleCreatorProjectRoute(new Request('https://local.test/api/creator/projects/blob-upload', {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            origin: 'https://local.test',
            'sec-fetch-site': 'same-origin',
            cookie: `${cookieName}=${session}`,
        },
        body: JSON.stringify({ type: 'blob.generate-client-token' }),
    }), {
        path: ['blob-upload'],
        env: missingAssetStoreEnv,
        blobStore: creatorProjectStoreForTests(),
        handleUploadImpl: async () => { throw new Error('must_not_run'); },
    });
    assert.equal(response.status, 503);
    assert.deepEqual((await response.json()).missing, ['CREATOR_ASSET_BLOB_READ_WRITE_TOKEN']);
});
