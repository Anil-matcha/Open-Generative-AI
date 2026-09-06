const DOWNLOAD_ICON = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
`;

function getDocument(documentRef) {
    if (!documentRef || typeof documentRef.createElement !== 'function') {
        throw new TypeError('A document with createElement is required');
    }
    return documentRef;
}

function createMediaElement({ document: documentRef, tagName, url, alt, className }) {
    const doc = getDocument(documentRef);
    if (tagName !== 'img' && tagName !== 'video') {
        throw new TypeError(`Unsupported history media element: ${tagName}`);
    }

    const media = doc.createElement(tagName);
    media.src = typeof url === 'string' ? url : '';
    media.className = className || '';

    if (tagName === 'img') {
        media.alt = typeof alt === 'string' ? alt : '';
    } else {
        media.preload = 'metadata';
        media.muted = true;
    }

    return media;
}

export function createHistoryMediaWithDownload({
    document: documentRef = globalThis.document,
    tagName,
    url,
    alt = '',
    mediaClassName,
    overlayClassName,
    buttonClassName,
    buttonTitle = 'Download',
}) {
    const doc = getDocument(documentRef);
    const media = createMediaElement({
        document: doc,
        tagName,
        url,
        alt,
        className: mediaClassName,
    });
    const overlay = doc.createElement('div');
    overlay.className = overlayClassName || '';

    const downloadButton = doc.createElement('button');
    downloadButton.className = buttonClassName || '';
    downloadButton.title = typeof buttonTitle === 'string' ? buttonTitle : '';
    downloadButton.innerHTML = DOWNLOAD_ICON;

    overlay.appendChild(downloadButton);
    return { media, overlay, downloadButton };
}

export function createHistoryImageWithLabel({
    document: documentRef = globalThis.document,
    url,
    alt = '',
    mediaClassName,
    overlayClassName,
    labelClassName,
    label,
}) {
    const doc = getDocument(documentRef);
    const media = createMediaElement({
        document: doc,
        tagName: 'img',
        url,
        alt,
        className: mediaClassName,
    });
    const overlay = doc.createElement('div');
    overlay.className = overlayClassName || '';

    const labelElement = doc.createElement('span');
    labelElement.className = labelClassName || '';
    labelElement.textContent = typeof label === 'string' ? label : '';

    overlay.appendChild(labelElement);
    return { media, overlay, labelElement };
}
