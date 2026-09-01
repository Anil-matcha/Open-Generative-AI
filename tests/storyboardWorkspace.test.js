import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
    TRANSITIONS,
    addScene,
    buildProjectMediaRequest,
    continueFromPreviousScene,
    createScene,
    deleteScene,
    duplicateScene,
} from '../packages/studio/src/components/storyboardWorkspaceModel.js';
import { normalizeMuapiVideoInput } from '../src/lib/muapiCreatorProvider.js';

const sandboxEnv = {
    MUAPI_API_KEY: 'sandbox-provider-secret',
    MUAPI_KEY_MODE: 'sandbox',
    MUAPI_ALLOW_PAID_GENERATION: 'false',
    MUAPI_IMAGE_MODEL: 'nano-banana',
    MUAPI_VIDEO_MODEL: 'seedance-lite-t2v',
    MUAPI_IMAGE_TO_VIDEO_MODEL: 'kling-v2.1-master-i2v',
};

test('scene model starts with the smallest Storyboard defaults and all transition metadata choices', () => {
    const scene = createScene(0, { id: 'scene-test' });
    assert.deepEqual(scene, {
        id: 'scene-test',
        title: 'Scene 1',
        prompt: '',
        imageUrl: '',
        videoUrl: '',
        duration: 5,
        aspectRatio: '16:9',
        transition: 'cut',
        status: 'draft',
        model: null,
        error: '',
    });
    assert.deepEqual(
        TRANSITIONS.map(({ label }) => label),
        ['Cut', 'Dissolve', 'Fade', 'Dip to black', 'Match cut', 'Whip'],
    );
});

test('adding, selecting, duplicating, and deleting scenes keeps a valid selection', () => {
    const first = createScene(0, { id: 'scene-one', title: 'Opening', prompt: 'Stadium lights.' });
    const added = addScene([first], { id: 'scene-two' });
    assert.equal(added.scenes.length, 2);
    assert.equal(added.selectedSceneId, 'scene-two');

    const duplicated = duplicateScene(added.scenes, first.id);
    assert.equal(duplicated.scenes.length, 3);
    assert.notEqual(duplicated.selectedSceneId, first.id);
    assert.equal(duplicated.scenes[1].title, 'Opening copy');
    assert.equal(duplicated.scenes[1].prompt, first.prompt);

    const removed = deleteScene(duplicated.scenes, duplicated.selectedSceneId);
    assert.equal(removed.scenes.length, 2);
    assert.equal(removed.selectedSceneId, 'scene-two');
    assert.equal(deleteScene([first], first.id).scenes.length, 1);
});

test('continue from previous scene copies only an available image reference and never generates', () => {
    const first = createScene(0, {
        id: 'scene-one',
        imageUrl: 'https://assets.example.test/opening.png',
        videoUrl: 'https://assets.example.test/opening.mp4',
        status: 'ready',
    });
    const second = createScene(1, {
        id: 'scene-two',
        videoUrl: 'https://assets.example.test/old-second.mp4',
        model: 'old-model',
    });
    const result = continueFromPreviousScene([first, second], second.id);
    assert.equal(result.continued, true);
    assert.equal(result.scenes[1].imageUrl, first.imageUrl);
    assert.equal(result.scenes[1].videoUrl, '');
    assert.equal(result.scenes[1].model, null);
    assert.equal(result.scenes[1].status, 'draft');
    assert.equal(continueFromPreviousScene([first, second], first.id).continued, false);
});

test('Storyboard media requests preserve the existing image and video Creator routes', () => {
    assert.deepEqual(buildProjectMediaRequest({
        kind: 'image',
        prompt: '  A cinematic track stadium.  ',
        aspectRatio: '16:9',
        duration: 12,
        firstFrameUrl: 'https://assets.example.test/ignored.png',
    }), {
        toolId: 'image',
        body: { prompt: 'A cinematic track stadium.', aspectRatio: '16:9' },
    });

    assert.deepEqual(buildProjectMediaRequest({
        kind: 'video',
        prompt: 'Animate the stadium lights.',
        aspectRatio: '9:16',
        duration: 5,
        firstFrameUrl: 'https://assets.example.test/opening.png',
    }), {
        toolId: 'video',
        body: {
            prompt: 'Animate the stadium lights.',
            aspectRatio: '9:16',
            duration: 5,
            firstFrameUrl: 'https://assets.example.test/opening.png',
        },
    });

    const textVideo = buildProjectMediaRequest({
        kind: 'video',
        prompt: 'Fly over an empty track.',
        aspectRatio: '16:9',
        duration: 7,
    });
    assert.equal(textVideo.toolId, 'video');
    assert.equal(Object.hasOwn(textVideo.body, 'firstFrameUrl'), false);
});

test('server Auto routing still selects configured I2V with a first frame and T2V without one', () => {
    const imageToVideo = normalizeMuapiVideoInput({
        prompt: 'Animate the starting frame.',
        firstFrameUrl: 'https://assets.example.test/opening.png',
        aspectRatio: '16:9',
        duration: 5,
    }, { env: sandboxEnv });
    assert.equal(imageToVideo.value.model, 'kling-v2.1-master-i2v');
    assert.equal(imageToVideo.value.payload.image_url, 'https://assets.example.test/opening.png');

    const textToVideo = normalizeMuapiVideoInput({
        prompt: 'Create a new stadium flyover.',
        aspectRatio: '16:9',
        duration: 5,
    }, { env: sandboxEnv });
    assert.equal(textToVideo.value.model, 'seedance-lite-t2v');
    assert.equal(Object.hasOwn(textToVideo.value.payload, 'image_url'), false);
});

test('Creator Studio keeps secure shared requests and the non-visual tools while Storyboard contains no key handling', async () => {
    const creatorSource = await readFile(new URL('../packages/studio/src/components/CreatorStudio.jsx', import.meta.url), 'utf8');
    const storyboardSource = await readFile(new URL('../packages/studio/src/components/StoryboardWorkspace.jsx', import.meta.url), 'utf8');
    const modelSource = await readFile(new URL('../packages/studio/src/components/storyboardWorkspaceModel.js', import.meta.url), 'utf8');
    const storyboardClientSource = `${storyboardSource}\n${modelSource}`;

    assert.match(creatorSource, /fetch\(`\/api\/creator\/\$\{path\}`/);
    assert.match(creatorSource, /request\(toolId, \{ method: "POST", body \}\)/);
    assert.match(creatorSource, /pollTask\("muapi", jobId, token, toolId/);
    assert.match(creatorSource, /activeTool\.id !== "storyboard" && "hidden"/);
    assert.match(storyboardSource, /onSelect=\{\(\) => setSelectedSceneId\(scene\.id\)\}/);
    for (const toolId of ['assistant', 'voice', 'avatar', 'publish']) {
        assert.match(creatorSource, new RegExp(`id: "${toolId}"`));
    }
    assert.doesNotMatch(storyboardClientSource, /MUAPI_(?:API_KEY|PRODUCTION_API_KEY)/);
    assert.doesNotMatch(storyboardClientSource, /x-api-key|authorization/i);
});
