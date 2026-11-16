import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createProviderFallbackTile,
    getProviderLogo,
    getProviderLogoAlt,
    getProviderFallbackText,
    handleProviderLogoError,
    shouldInvertProviderLogo,
} from '../src/lib/providerLogos.js';

test('maps canonical video providers to logos and accessible labels', () => {
    assert.equal(getProviderLogo('google'), 'https://cdn.muapi.ai/models/gemini.png');
    assert.equal(getProviderLogoAlt({ provider: 'google', provider_name: 'Google' }), 'Google');
    assert.equal(shouldInvertProviderLogo('google'), false);
});

test('uses initials for unmapped or missing providers', () => {
    assert.equal(getProviderLogo('unknown-provider'), null);
    assert.equal(getProviderLogoAlt({ provider: 'unknown-provider' }), 'Unknown Provider');
    assert.equal(getProviderFallbackText({ name: 'Hunyuan Video' }), 'H');
    assert.equal(getProviderFallbackText({}), 'AI');
});

test('preserves canonical inverted-logo behavior', () => {
    assert.equal(shouldInvertProviderLogo('openai'), true);
    assert.equal(shouldInvertProviderLogo('runway'), true);
    assert.equal(shouldInvertProviderLogo('kling'), false);
});

test('replaces a failed logo and ignores detached image callbacks', () => {
    const documentStub = {
        createElement() {
            return { dataset: {}, className: '', textContent: '' };
        },
    };
    const fallback = createProviderFallbackTile(documentStub, 'fallback', 'G');
    const failedProviderLogos = new Set();
    const replacementParent = {
        replaceWith(node) {
            this.replacement = node;
        },
    };
    const image = { parentElement: replacementParent };

    assert.equal(handleProviderLogoError({
        image,
        failedProviderLogos,
        providerLogo: 'https://cdn.muapi.ai/models/gemini.png',
        fallback,
    }), true);
    assert.equal(failedProviderLogos.has('https://cdn.muapi.ai/models/gemini.png'), true);
    assert.equal(replacementParent.replacement, fallback);

    assert.equal(handleProviderLogoError({
        image: { parentElement: null },
        failedProviderLogos,
        providerLogo: 'https://cdn.muapi.ai/models/gemini.png',
        fallback,
    }), false);
});
