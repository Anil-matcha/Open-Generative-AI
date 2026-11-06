const test = require('node:test');
const assert = require('node:assert/strict');

function createFakeDocument() {
    const innerHtmlWrites = [];

    class FakeElement {
        constructor(tagName) {
            this.tagName = tagName.toUpperCase();
            this.children = [];
            this.className = '';
            this.textContent = '';
        }

        appendChild(child) {
            this.children.push(child);
            return child;
        }

        set innerHTML(value) {
            const stringValue = String(value);
            innerHtmlWrites.push({ tagName: this.tagName, value: stringValue });
            this._innerHTML = stringValue;
        }

        get innerHTML() {
            return this._innerHTML || '';
        }
    }

    return {
        document: {
            createElement: (tagName) => new FakeElement(tagName),
        },
        innerHtmlWrites,
    };
}

test('history download media keeps untrusted URL and prompt out of HTML setters', async () => {
    const { createHistoryMediaWithDownload } = await import('../src/lib/historyDom.mjs');
    const { document, innerHtmlWrites } = createFakeDocument();
    const maliciousUrl = 'https://example.invalid/x" onerror="globalThis.pwned=true';
    const maliciousPrompt = 'preview" onerror="globalThis.pwned=true';

    const { media, overlay, downloadButton } = createHistoryMediaWithDownload({
        document,
        tagName: 'img',
        url: maliciousUrl,
        alt: maliciousPrompt,
        mediaClassName: 'history-image',
        overlayClassName: 'history-overlay',
        buttonClassName: 'hist-download',
        buttonTitle: maliciousPrompt,
    });

    assert.equal(media.src, maliciousUrl);
    assert.equal(media.alt, maliciousPrompt);
    assert.equal(downloadButton.title, maliciousPrompt);
    assert.deepEqual(overlay.children, [downloadButton]);
    assert.equal(innerHtmlWrites.length, 1, 'only the static download SVG uses innerHTML');
    assert.match(innerHtmlWrites[0].value, /^\s*<svg\b/);
    assert.doesNotMatch(innerHtmlWrites[0].value, /onerror|globalThis\.pwned/);
});

test('history video URL is assigned as a property and preserves media settings', async () => {
    const { createHistoryMediaWithDownload } = await import('../src/lib/historyDom.mjs');
    const { document, innerHtmlWrites } = createFakeDocument();
    const maliciousUrl = 'https://example.invalid/video.mp4" onerror="globalThis.pwned=true';

    const { media } = createHistoryMediaWithDownload({
        document,
        tagName: 'video',
        url: maliciousUrl,
    });

    assert.equal(media.src, maliciousUrl);
    assert.equal(media.preload, 'metadata');
    assert.equal(media.muted, true);
    assert.equal(innerHtmlWrites.some(({ value }) => value.includes(maliciousUrl)), false);
});

test('history label uses textContent for localized copy', async () => {
    const { createHistoryImageWithLabel } = await import('../src/lib/historyDom.mjs');
    const { document, innerHtmlWrites } = createFakeDocument();
    const maliciousUrl = 'https://example.invalid/x" onerror="globalThis.pwned=true';
    const maliciousLabel = 'Load <img src=x onerror="globalThis.pwned=true">';

    const { media, overlay, labelElement } = createHistoryImageWithLabel({
        document,
        url: maliciousUrl,
        label: maliciousLabel,
    });

    assert.equal(media.src, maliciousUrl);
    assert.equal(labelElement.textContent, maliciousLabel);
    assert.deepEqual(overlay.children, [labelElement]);
    assert.deepEqual(innerHtmlWrites, []);
});
