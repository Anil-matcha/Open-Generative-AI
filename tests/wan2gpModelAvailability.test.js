const test = require('node:test');
const assert = require('node:assert/strict');

const { withWan2gpAvailability } = require('../electron/lib/wan2gpModelAvailability');

const wanModel = {
    id: 'wan2gp:wan21-t2v-1.3b',
    name: 'Wan 2.1 1.3B (Text-to-Video)',
    modelType: 't2v_1.3B',
};

const engine = (mode, statuses) => ({ ok: true, mode, modelStatus: new Map(Object.entries(statuses)) });

test('withWan2gpAvailability marks models unavailable when the engine is not usable', () => {
    const model = withWan2gpAvailability(wanModel, { ok: false, error: 'wgp.py not found in /tmp' });

    assert.equal(model.ready, false);
    assert.equal(model.unavailableReason, 'wgp.py not found in /tmp');
});

test('withWan2gpAvailability explains a missing configuration', () => {
    const model = withWan2gpAvailability(wanModel, undefined);

    assert.equal(model.ready, false);
    assert.match(model.unavailableReason, /not configured/);
});

test('withWan2gpAvailability marks models ready when weights are on disk', () => {
    const model = withWan2gpAvailability(wanModel, engine('local', { 't2v_1.3B': 'available' }));

    assert.equal(model.ready, true);
    assert.equal(model.availabilityNote, undefined);
});

test('withWan2gpAvailability keeps models with undownloaded weights ready, with a note', () => {
    const model = withWan2gpAvailability(wanModel, engine('remote', { 't2v_1.3B': 'missing' }));

    assert.equal(model.ready, true);
    assert.match(model.availabilityNote, /first run downloads/);
});

test('withWan2gpAvailability treats a defined model with unknown weight files as ready', () => {
    const model = withWan2gpAvailability(wanModel, engine('local', { 't2v_1.3B': 'installed' }));

    assert.equal(model.ready, true);
});

test('withWan2gpAvailability rejects model types the Wan2GP install does not define', () => {
    const localModel = withWan2gpAvailability(wanModel, engine('local', {}));
    const remoteModel = withWan2gpAvailability(wanModel, engine('remote', { 't2v_1.3B': 'unknown-model' }));

    assert.equal(localModel.ready, false);
    assert.match(localModel.unavailableReason, /This Wan2GP install has no model "t2v_1.3B"/);
    assert.equal(remoteModel.ready, false);
    assert.match(remoteModel.unavailableReason, /The Wan2GP server has no model "t2v_1.3B"/);
});
