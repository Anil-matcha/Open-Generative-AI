const test = require('node:test');
const assert = require('node:assert/strict');

const { WAN2GP_CATALOG, getModelById, buildWan2gpSettings } = require('../electron/lib/wan2gpCatalog');

test('catalog entries carry a real WanGP model_type and unique ids', () => {
    const ids = new Set();
    for (const model of WAN2GP_CATALOG) {
        assert.ok(model.modelType, `${model.id} has no modelType`);
        assert.equal(model.fn, undefined, `${model.id} still uses a Gradio fn`);
        assert.ok(!ids.has(model.id), `duplicate id ${model.id}`);
        ids.add(model.id);
        for (const ar of model.aspectRatios) {
            assert.match(model.resolutions[ar], /^\d+x\d+$/, `${model.id} has no resolution for ${ar}`);
        }
    }
});

test('frontend catalog (src/lib/localModels.js) mirrors the Wan2GP catalog', async () => {
    const { LOCAL_MODEL_CATALOG } = await import('../src/lib/localModels.js');
    const pick = (m) => ({ id: m.id, type: m.type, modelType: m.modelType, needsImage: !!m.needsImage, aspectRatios: m.aspectRatios });
    const frontend = LOCAL_MODEL_CATALOG.filter(m => m.provider === 'wan2gp').map(pick);
    assert.deepEqual(frontend, WAN2GP_CATALOG.map(pick));
});

test('getModelById finds catalog models and returns null otherwise', () => {
    assert.equal(getModelById('wan2gp:wan21-t2v-1.3b').modelType, 't2v_1.3B');
    assert.equal(getModelById('wan2gp:ltx-video').modelType, 'ltx2_22B_distilled');
    assert.equal(getModelById('dreamshaper-8'), null);
});

test('buildWan2gpSettings maps prompt, aspect ratio and seed onto WanGP settings', () => {
    const settings = buildWan2gpSettings(getModelById('wan2gp:wan21-t2v-1.3b'), {
        prompt: 'a fox in the snow',
        negative_prompt: 'blurry',
        aspect_ratio: '9:16',
        seed: 42,
    });

    assert.deepEqual(settings, {
        model_type: 't2v_1.3B',
        prompt: 'a fox in the snow',
        negative_prompt: 'blurry',
        resolution: '480x832',
        seed: 42,
    });
});

test('buildWan2gpSettings leaves steps and frames to the model defaults unless given', () => {
    const model = getModelById('wan2gp:ltx-video');
    const defaults = buildWan2gpSettings(model, { prompt: 'x', seed: 1 });
    assert.equal(defaults.num_inference_steps, undefined);
    assert.equal(defaults.video_length, undefined);
    assert.equal(defaults.resolution, '1280x720');

    const explicit = buildWan2gpSettings(model, { prompt: 'x', seed: 1, steps: '12', video_length: 97 });
    assert.equal(explicit.num_inference_steps, 12);
    assert.equal(explicit.video_length, 97);
});

test('buildWan2gpSettings picks a random seed when none or -1 is given', () => {
    const model = getModelById('wan2gp:wan21-t2v-1.3b');
    for (const seed of [undefined, -1, '']) {
        const settings = buildWan2gpSettings(model, { prompt: 'x', seed });
        assert.ok(Number.isInteger(settings.seed) && settings.seed >= 0);
    }
});

test('buildWan2gpSettings never sends frame counts to image models', () => {
    const settings = buildWan2gpSettings(getModelById('wan2gp:flux-dev'), { prompt: 'x', video_length: 81, aspect_ratio: '1:1', seed: 3 });
    assert.equal(settings.video_length, undefined);
    assert.equal(settings.resolution, '1024x1024');
});

test('buildWan2gpSettings passes the start frame as image_start and requires it for i2v', () => {
    const i2v = getModelById('wan2gp:wan22-i2v');
    assert.throws(() => buildWan2gpSettings(i2v, { prompt: 'x' }), /requires a start-frame image/);

    const settings = buildWan2gpSettings(i2v, { prompt: 'x', seed: 1 }, { imageStart: '/tmp/start.png' });
    assert.equal(settings.image_start, '/tmp/start.png');
    assert.equal(settings.model_type, 'i2v_2_2');
});
