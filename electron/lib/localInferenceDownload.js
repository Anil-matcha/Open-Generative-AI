const fs = require('fs');
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');

const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; open-generative-ai/1.0)',
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
};

function parseContentLength(value) {
    if (value === null) return null;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) ? parsed : null;
}

function parseContentRange(value) {
    const match = /^bytes\s+(\d+)-(\d+)\/(\d+)$/i.exec(value || '');
    if (!match) return null;
    const start = Number(match[1]);
    const end = Number(match[2]);
    const total = Number(match[3]);
    if (![start, end, total].every(Number.isSafeInteger)) return null;
    if (start > end || end >= total) return null;
    return { start, end, total };
}

function parseStrongEtag(value) {
    if (typeof value !== 'string') return null;
    const etag = value.trim();
    if (/^W\//i.test(etag)) return null;
    return /^"[\x21\x23-\x7E\u0080-\u00FF]*"$/.test(etag) ? etag : null;
}

function normalizeSourceUrl(url) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`Unsupported download protocol: ${parsed.protocol}`);
    }
    parsed.hash = '';
    return parsed.toString();
}

function getPaths(destPath) {
    const partPath = destPath + '.part';
    return {
        partPath,
        metadataPath: partPath + '.meta.json',
        freshPath: partPath + '.fresh',
    };
}

function removeIfExists(filePath) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function writeMetadata(metadataPath, sourceUrl, etag) {
    const temporaryPath = `${metadataPath}.tmp-${process.pid}-${Date.now()}`;
    try {
        fs.writeFileSync(temporaryPath, JSON.stringify({ version: 1, sourceUrl, etag }), 'utf8');
        removeIfExists(metadataPath);
        fs.renameSync(temporaryPath, metadataPath);
    } finally {
        removeIfExists(temporaryPath);
    }
}

function readResumeState(paths, sourceUrl) {
    try {
        const stat = fs.statSync(paths.partPath);
        const metadata = JSON.parse(fs.readFileSync(paths.metadataPath, 'utf8'));
        const etag = parseStrongEtag(metadata.etag);
        if (!stat.isFile() || stat.size <= 0) return null;
        if (metadata.version !== 1 || metadata.sourceUrl !== sourceUrl || !etag) return null;
        return { size: stat.size, etag };
    } catch {
        return null;
    }
}

function getFetch(options) {
    const fetchImpl = options.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== 'function') throw new Error('This runtime does not provide fetch');
    return fetchImpl;
}

function createInactivityTimeout(controller, timeoutMs, label) {
    let timer;
    const arm = () => {
        clearTimeout(timer);
        timer = setTimeout(() => controller.abort(new Error(`${label} timed out`)), timeoutMs);
    };
    const clear = () => clearTimeout(timer);
    arm();
    return { arm, clear };
}

async function openResponse(
    url,
    method,
    headers,
    options,
    redirectsLeft = options.maxRedirects ?? 10,
    retryState = { remaining: options.maxRetries ?? 5 }
) {
    const fetchImpl = getFetch(options);
    let response;
    let controller;
    let timeout;

    while (!response) {
        controller = new AbortController();
        timeout = createInactivityTimeout(
            controller,
            options.timeoutMs ?? 60000,
            `${method} request`
        );
        try {
            response = await fetchImpl(url, {
                method,
                redirect: method === 'HEAD' ? 'follow' : 'manual',
                signal: controller.signal,
                headers: { ...REQUEST_HEADERS, ...headers },
            });
        } catch (err) {
            timeout.clear();
            if (retryState.remaining <= 0) {
                throw new Error(`${method} ${url} failed: ${err.message}`, { cause: err });
            }
            retryState.remaining -= 1;
            const delayMs = options.retryDelayMs ?? 3000;
            if (delayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }

    try {
        timeout.arm();
        const session = { response, controller, timeout };
        if (method === 'GET' && [301, 302, 303, 307, 308].includes(response.status)) {
            if (redirectsLeft <= 0) {
                await discardResponse(session);
                throw new Error('Too many redirects');
            }
            let redirectUrl;
            try {
                const location = response.headers.get('location');
                if (!location) throw new Error('missing Location header');
                redirectUrl = normalizeSourceUrl(
                    new URL(location, url).toString()
                );
            } catch (err) {
                await discardResponse(session);
                throw new Error(`Invalid redirect Location: ${err.message}`, { cause: err });
            }
            await discardResponse(session);
            return openResponse(
                redirectUrl,
                method,
                headers,
                options,
                redirectsLeft - 1,
                retryState
            );
        }
        return session;
    } catch (err) {
        timeout.clear();
        throw new Error(`${method} ${url} failed: ${err.message}`, { cause: err });
    }
}

function waitForClose(stream) {
    if (stream.closed) return Promise.resolve();
    return new Promise((resolve) => stream.once('close', resolve));
}

async function discardResponse(session) {
    session.timeout.clear();
    session.controller.abort();
    try {
        await session.response.body?.cancel();
    } catch {
        // Abort already closed the response transport.
    }
}

async function revalidateCompletePartial(sourceUrl, resumeState, options) {
    let session;
    try {
        session = await openResponse(sourceUrl, 'HEAD', {}, options);
        const { response } = session;
        return response.status === 200
            && parseStrongEtag(response.headers.get('etag')) === resumeState.etag
            && parseContentLength(response.headers.get('content-length')) === resumeState.size;
    } catch {
        return false;
    } finally {
        if (session) await discardResponse(session);
    }
}

function promoteValidatedPartial(paths, destPath, sourceUrl, expectedState, onProgress) {
    const currentState = readResumeState(paths, sourceUrl);
    if (
        !currentState
        || currentState.etag !== expectedState.etag
        || currentState.size !== expectedState.size
    ) {
        return false;
    }
    const finalStat = fs.statSync(paths.partPath);
    if (!finalStat.isFile() || finalStat.size !== expectedState.size) return false;
    fs.renameSync(paths.partPath, destPath);
    removeIfExists(paths.metadataPath);
    onProgress(1);
    return true;
}

async function saveResponse(session, outputPath, flags, initialSize, expectedBytes, expectedSize, onProgress) {
    let responseBytes = 0;
    let output;
    let outputClosed;
    const counter = new Transform({
        transform(chunk, _encoding, callback) {
            session.timeout.arm();
            responseBytes += chunk.length;
            if (expectedSize) {
                onProgress(Math.min((initialSize + responseBytes) / expectedSize, 1));
            }
            callback(null, chunk);
        },
    });

    try {
        if (session.response.body) {
            output = fs.createWriteStream(outputPath, { flags });
            outputClosed = waitForClose(output);
            await pipeline(
                Readable.fromWeb(session.response.body),
                counter,
                output
            );
            await outputClosed;
        } else {
            fs.writeFileSync(outputPath, Buffer.alloc(0), { flag: flags });
        }
    } catch (err) {
        session.controller.abort();
        if (output) {
            output.destroy();
            await outputClosed;
        }
        throw err;
    } finally {
        session.timeout.clear();
    }

    if (expectedBytes !== null && responseBytes !== expectedBytes) {
        throw new Error(`Download received ${responseBytes} bytes, expected ${expectedBytes}`);
    }
    const finalSize = fs.statSync(outputPath).size;
    if (expectedSize !== null && finalSize !== expectedSize) {
        throw new Error(`Partial download is ${finalSize} bytes, expected ${expectedSize}`);
    }
}

async function rejectResponse(session, message) {
    await discardResponse(session);
    throw new Error(message);
}

async function validatedContentLength(session) {
    const raw = session.response.headers.get('content-length');
    const parsed = parseContentLength(raw);
    if (raw !== null && parsed === null) {
        return rejectResponse(session, 'Invalid Content-Length');
    }
    return parsed;
}

async function finishFreshDownload(sourceUrl, destPath, paths, onProgress, options, existingSession) {
    removeIfExists(paths.freshPath);
    let session = existingSession;
    try {
        if (!session) session = await openResponse(sourceUrl, 'GET', {}, options);
        if (session.response.status !== 200) {
            return await rejectResponse(session, `HTTP ${session.response.status} during fresh download`);
        }
        const contentLength = await validatedContentLength(session);
        await saveResponse(session, paths.freshPath, 'w', 0, contentLength, contentLength, onProgress);
        fs.renameSync(paths.freshPath, destPath);
        removeIfExists(paths.partPath);
        removeIfExists(paths.metadataPath);
    } catch (err) {
        if (session) await discardResponse(session);
        removeIfExists(paths.freshPath);
        throw err;
    }
}

async function downloadFileInternal(url, destPath, onProgress, options) {
    const sourceUrl = normalizeSourceUrl(url);
    const paths = getPaths(destPath);
    removeIfExists(paths.freshPath);

    const resumeState = readResumeState(paths, sourceUrl);
    const hasPartialArtifacts = fs.existsSync(paths.partPath) || fs.existsSync(paths.metadataPath);
    const headers = resumeState
        ? { Range: `bytes=${resumeState.size}-`, 'If-Range': resumeState.etag }
        : {};
    const session = await openResponse(sourceUrl, 'GET', headers, options);
    const { response } = session;

    if (response.status === 416 && resumeState) {
        await discardResponse(session);
        if (
            await revalidateCompletePartial(sourceUrl, resumeState, options)
            && promoteValidatedPartial(paths, destPath, sourceUrl, resumeState, onProgress)
        ) {
            return;
        }
        return finishFreshDownload(sourceUrl, destPath, paths, onProgress, options);
    }

    if (response.status === 206) {
        if (!resumeState) {
            return rejectResponse(session, 'Unexpected HTTP 206 without a validated partial');
        }
        const responseEtag = parseStrongEtag(response.headers.get('etag'));
        const contentRange = parseContentRange(response.headers.get('content-range'));
        if (responseEtag !== resumeState.etag || !contentRange) {
            await discardResponse(session);
            return finishFreshDownload(sourceUrl, destPath, paths, onProgress, options);
        }
        if (contentRange.start !== resumeState.size) {
            return rejectResponse(session, `HTTP 206 started at ${contentRange.start}, expected ${resumeState.size}`);
        }
        const rangeLength = contentRange.end - contentRange.start + 1;
        const contentLength = await validatedContentLength(session);
        if (contentLength !== null && contentLength !== rangeLength) {
            return rejectResponse(session, 'HTTP 206 Content-Length did not match Content-Range');
        }
        await saveResponse(
            session,
            paths.partPath,
            'a',
            resumeState.size,
            rangeLength,
            contentRange.total,
            onProgress
        );
        fs.renameSync(paths.partPath, destPath);
        removeIfExists(paths.metadataPath);
        return;
    }

    if (response.status !== 200) {
        return rejectResponse(session, `HTTP ${response.status} from ${new URL(response.url).hostname}`);
    }

    if (hasPartialArtifacts) {
        return finishFreshDownload(sourceUrl, destPath, paths, onProgress, options, session);
    }

    try {
        const contentLength = await validatedContentLength(session);
        const etag = parseStrongEtag(response.headers.get('etag'));
        removeIfExists(paths.partPath);
        removeIfExists(paths.metadataPath);
        if (etag) writeMetadata(paths.metadataPath, sourceUrl, etag);
        await saveResponse(session, paths.partPath, 'w', 0, contentLength, contentLength, onProgress);
        fs.renameSync(paths.partPath, destPath);
        removeIfExists(paths.metadataPath);
    } catch (err) {
        await discardResponse(session);
        const etag = parseStrongEtag(response.headers.get('etag'));
        if (!etag) {
            removeIfExists(paths.partPath);
            removeIfExists(paths.metadataPath);
        }
        throw err;
    }
}

function downloadFile(url, destPath, onProgress, options = {}) {
    const reportProgress = (progress) => {
        if (!onProgress) return;
        try {
            onProgress(progress);
        } catch (err) {
            console.warn(`[download] Progress listener failed: ${err.message}`);
        }
    };
    return Promise.resolve().then(() => downloadFileInternal(
        url,
        destPath,
        reportProgress,
        options
    ));
}

module.exports = { downloadFile };
