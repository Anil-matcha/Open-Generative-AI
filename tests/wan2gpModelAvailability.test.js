const test = require('node:test');
const assert = require('node:assert/strict');

const { withWan2gpAvailability } = require('../electron/lib/wan2gpModelAvailability');

const fluxModel = {
    id: 'wan2gp:flux-dev',
    name: 'Flux.1 Dev (Wan2GP)',
    fn: 'flux',
};

test('withWan2gpAvailability marks models unavailable when the server probe fails', () => {
    const model = withWan2gpAvailability(fluxModel, { ok: false, error: 'Request timed out' });

    assert.equal(model.ready, false);
    assert.equal(model.unavailableReason, 'Request timed out');
});

test('withWan2gpAvailability uses resolved api_name when endpoint metadata matches', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: ['flux_image'],
            resolved: new Map([['wan2gp:flux-dev', 'flux_image']]),
        }
    );

    assert.equal(model.ready, true);
    assert.equal(model.fn, 'flux_image');
});

test('withWan2gpAvailability keeps default api_name available when Gradio omits endpoint metadata', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: [],
            resolved: new Map([['wan2gp:flux-dev', null]]),
        }
    );

    assert.equal(model.ready, true);
    assert.equal(model.fn, 'flux');
    assert.match(model.availabilityNote, /default api_name/);
});

test('withWan2gpAvailability rejects unmatched models when endpoint metadata is present', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: ['qwen_image'],
            resolved: new Map([['wan2gp:flux-dev', null]]),
        }
    );

    assert.equal(model.ready, false);
    assert.match(model.unavailableReason, /no api_name matching "flux"/);
});
