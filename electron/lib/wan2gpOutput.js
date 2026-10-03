// Parsing of `wgp.py --process` console output: progress phases, the saved
// media path and failure detection. Pure module — unit-tested in tests/.

// Overall progress budget per phase (0–1).
const PHASES = {
    loading: [0.02, 0.1],
    encoding: [0.1, 0.12],
    generating: [0.12, 0.9],
    decoding: [0.9, 0.99],
};

function stripAnsi(text) {
    return String(text).replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function classifyPhase(label) {
    if (/^Denoising/i.test(label)) return 'generating';
    if (/^VAE Decoding/i.test(label)) return 'decoding';
    if (/^Encoding/i.test(label)) return 'encoding';
    if (/^Loading/i.test(label)) return 'loading';
    return null;
}

function phaseProgress(status, step, total) {
    const [from, to] = PHASES[status];
    const ratio = total > 0 ? Math.min(1, step / total) : 0;
    return from + (to - from) * ratio;
}

// Stateful parser: feed it raw stdout/stderr chunks, get back progress events
// ({ status, progress, step, totalSteps }) only when something changed.
// Loading has sub-phases with their own counters (3/3 then 0/12), so overall
// progress is kept monotonic.
function createProgressParser() {
    let tail = '';
    let last = '';
    let maxProgress = 0;
    return function parse(chunk) {
        const text = tail + stripAnsi(chunk).replace(/\r/g, '\n');
        const lines = text.split('\n');
        tail = lines.pop();
        const events = [];
        for (const line of lines) {
            let event = null;
            const m = line.match(/\[(\d+)\/(\d+)\]\s+([A-Za-z][^|\[]*)/);
            const status = m ? classifyPhase(m[3].trim()) : null;
            if (status) {
                const step = Number(m[1]);
                const totalSteps = Number(m[2]);
                event = { status, step, totalSteps, progress: phaseProgress(status, step, totalSteps) };
            } else if (/^\s*Loading Model /.test(line)) {
                event = { status: 'loading', progress: PHASES.loading[0] };
            } else if (/Saving File/.test(line)) {
                event = { status: 'saving', progress: 0.99 };
            }
            if (!event) continue;
            const key = `${event.status}:${event.step ?? ''}/${event.totalSteps ?? ''}`;
            if (key === last) continue;
            last = key;
            maxProgress = Math.max(maxProgress, event.progress);
            events.push({ ...event, progress: maxProgress });
        }
        return events;
    };
}

function nonEmptyLines(output) {
    return stripAnsi(output).replace(/\r/g, '\n').split('\n').map(l => l.trimEnd()).filter(l => l.trim());
}

function tailLines(output, count = 15) {
    return nonEmptyLines(output).slice(-count).join('\n');
}

// The media path WanGP reports, e.g. "Video file saved to Path: /out/x.mp4".
// Post-processing (remux, upsampling) prints a later line; the last one wins.
function findSavedPath(output) {
    const matches = [...stripAnsi(output).matchAll(/saved to Path:\s*(.+?)\s*$/gm)];
    return matches.length ? matches[matches.length - 1][1] : null;
}

function describeFailure(output) {
    const text = stripAnsi(output);
    if (/out of memory|OutOfMemoryError/i.test(text)) {
        return 'GPU ran out of memory (VRAM). Try a lighter model, a lower resolution or fewer frames.';
    }
    const missing = text.match(/File not found for '([^']+)':\s*(.+)$/m);
    if (missing) return `Input file for "${missing[1]}" not found: ${missing[2].trim()}`;
    const errorLine = nonEmptyLines(text).reverse().find(l => /^\[ERROR\]/.test(l.trim()));
    if (errorLine) return errorLine.trim().replace(/^\[ERROR\]\s*/, '');
    if (/Traceback \(most recent call last\)/.test(text)) {
        const exceptionLine = nonEmptyLines(text).reverse().find(l => /^[A-Za-z_.]+(Error|Exception)\b/.test(l.trim()));
        if (exceptionLine) return exceptionLine.trim();
    }
    return null;
}

// Decide whether a finished `wgp.py --process` run produced media.
// Returns { ok: true, savedPath } or { ok: false, error } (error includes the log tail).
// savedPath can be null on success — the caller then scans the run's output dir.
function summarizeRun({ exitCode, signal, output }) {
    const summary = stripAnsi(output).match(/Queue completed:\s*(\d+)\/(\d+) tasks/);
    const completed = summary ? Number(summary[1]) : 0;
    const total = summary ? Number(summary[2]) : 0;

    if (!signal && exitCode === 0 && total > 0 && completed === total) {
        return { ok: true, savedPath: findSavedPath(output) };
    }

    const reason = signal
        ? `Wan2GP was stopped (${signal}).`
        : describeFailure(output)
            || (summary ? `Wan2GP finished ${completed}/${total} tasks.` : `Wan2GP exited with code ${exitCode}.`);
    return { ok: false, error: `${reason}\n\n${tailLines(output)}` };
}

module.exports = {
    createProgressParser,
    findSavedPath,
    summarizeRun,
    tailLines,
};
