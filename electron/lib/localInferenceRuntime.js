function coerceFiniteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function resolveGenerationSteps(params, model) {
    const requested = coerceFiniteNumber(params?.steps);
    if (requested !== null && requested > 0) {
        return Math.max(1, Math.round(requested));
    }

    const modelDefault = coerceFiniteNumber(model?.defaultSteps);
    if (modelDefault !== null && modelDefault > 0) {
        return Math.max(1, Math.round(modelDefault));
    }

    return 20;
}

function resolveGuidanceScale(params, model) {
    const requested = coerceFiniteNumber(params?.guidance_scale);
    if (requested !== null) return requested;

    const modelDefault = coerceFiniteNumber(model?.defaultGuidance);
    if (modelDefault !== null) return modelDefault;

    return 7.5;
}

function formatStartupProgressMessage(elapsedMs) {
    const seconds = Math.max(0, Math.floor((Number(elapsedMs) || 0) / 1000));
    if (seconds < 10) return 'Starting local model...';
    if (seconds < 60) return `Loading local model (${seconds}s)...`;

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `Loading local model (${minutes}m ${remainingSeconds}s)...`;
}

function stripAnsiSequences(text) {
    return text.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function extractProgressEvents(text) {
    const events = [];
    const patterns = [
        /step\s+(\d+)\s*\/\s*(\d+)/ig,
        /(\d+)\s*\/\s*(\d+)\s*-\s*[\d.]+s\/it/ig,
    ];

    for (const pattern of patterns) {
        let match = pattern.exec(text);
        while (match) {
            const step = Number.parseInt(match[1], 10);
            const totalSteps = Number.parseInt(match[2], 10);
            if (Number.isFinite(step) && Number.isFinite(totalSteps) && totalSteps > 0) {
                events.push({
                    step,
                    totalSteps,
                    progress: Math.min(1, step / totalSteps),
                });
            }
            match = pattern.exec(text);
        }
    }

    events.sort((left, right) => {
        if (left.totalSteps !== right.totalSteps) return left.totalSteps - right.totalSteps;
        return left.step - right.step;
    });
    return events;
}

function parseGenerationProgressChunk(chunk, state = { tail: '', lastStep: 0, lastTotalSteps: 0 }) {
    const normalizedChunk = stripAnsiSequences(String(chunk)).replace(/\r/g, '\n');
    const combined = `${state.tail}${normalizedChunk}`;
    const events = extractProgressEvents(combined);
    const freshEvents = [];

    for (const event of events) {
        if (event.totalSteps !== state.lastTotalSteps) {
            state.lastTotalSteps = event.totalSteps;
            state.lastStep = 0;
        }
        if (event.step > state.lastStep) {
            state.lastStep = event.step;
            freshEvents.push(event);
        }
    }

    state.tail = combined.slice(-1024);
    return freshEvents;
}

module.exports = {
    coerceFiniteNumber,
    extractProgressEvents,
    formatStartupProgressMessage,
    parseGenerationProgressChunk,
    resolveGenerationSteps,
    resolveGuidanceScale,
    stripAnsiSequences,
};
