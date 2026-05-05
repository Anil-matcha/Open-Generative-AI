import { localAI, isLocalAIAvailable } from '../lib/localInferenceClient.js';

// ─── Icons ────────────────────────────────────────────────────────────────────
const DownloadIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`;
const TrashIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>`;
const CheckIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtGB(gb) {
    return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(gb * 1024).toFixed(0)} MB`;
}

function tagEl(text) {
    const span = document.createElement('span');
    span.className = 'px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-muted';
    span.textContent = text;
    return span;
}

// ─── Binary Status Bar ────────────────────────────────────────────────────────
function BinaryStatusBar(onStatusChange) {
    const bar = document.createElement('div');
    bar.className = 'flex items-center justify-between gap-3 p-3 rounded-xl bg-white/3 border border-white/5';

    const label = document.createElement('div');
    label.className = 'flex flex-col gap-0.5';
    label.innerHTML = `
        <span class="text-xs font-bold text-white">sd.cpp inference engine</span>
        <span id="binary-status-text" class="text-[11px] text-muted">Checking...</span>
    `;

    const btn = document.createElement('button');
    btn.id = 'binary-action-btn';
    btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all hidden';
    btn.textContent = 'Install';

    bar.appendChild(label);
    bar.appendChild(btn);

    const progressBar = document.createElement('div');
    progressBar.className = 'h-1 rounded-full bg-white/5 mt-2 hidden overflow-hidden';
    progressBar.id = 'binary-progress-bar';
    progressBar.innerHTML = `<div id="binary-progress-fill" class="h-full bg-primary transition-all" style="width:0%"></div>`;
    bar.appendChild(progressBar);

    const refresh = async () => {
        const status = await localAI.getBinaryStatus();
        const text = bar.querySelector('#binary-status-text');
        if (status.exists) {
            text.textContent = 'Installed and ready';
            text.className = 'text-[11px] text-green-400';
            btn.classList.add('hidden');
        } else {
            text.textContent = 'Not installed — required for local generation';
            text.className = 'text-[11px] text-yellow-400';
            btn.textContent = 'Install Engine';
            btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black transition-all';
            btn.classList.remove('hidden');
        }
        if (onStatusChange) onStatusChange(status.exists);
    };

    btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = 'Downloading...';
        progressBar.classList.remove('hidden');

        const unsub = localAI.onDownloadProgress(({ id, phase, progress }) => {
            if (id !== '__binary__') return;
            const fill = document.getElementById('binary-progress-fill');
            const text = bar.querySelector('#binary-status-text');
            if (fill) fill.style.width = `${Math.round(progress * 100)}%`;
            if (text) text.textContent = phase === 'extracting' ? 'Extracting...' : `Downloading... ${Math.round(progress * 100)}%`;
        });

        try {
            await localAI.downloadBinary();
            unsub();
            progressBar.classList.add('hidden');
            await refresh();
        } catch (err) {
            unsub();
            const text = bar.querySelector('#binary-status-text');
            if (text) text.textContent = `Error: ${err.message}`;
            btn.disabled = false;
            btn.textContent = 'Retry';
        }
    };

    if (isLocalAIAvailable()) refresh();

    return bar;
}

// ─── Auxiliary file row (text encoder / VAE for Z-Image) ─────────────────────
function AuxRow(label, auxKey, initStatus, onStateChange) {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5';

    const isReady = initStatus === 'downloaded';

    row.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
            ${isReady
                ? `<span class="text-green-400 shrink-0">${CheckIcon}</span>`
                : `<span class="text-yellow-400 shrink-0">!</span>`}
            <span class="text-[11px] text-white truncate">${label}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            ${isReady
                ? `<span class="text-[10px] text-green-400">Ready</span>`
                : `<button class="aux-dl-btn flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all">${DownloadIcon} Get</button>`}
        </div>
        <div class="aux-progress hidden w-full col-span-2 mt-1">
            <div class="h-1 rounded-full bg-white/10 overflow-hidden">
                <div class="aux-fill h-full bg-primary transition-all" style="width:0%"></div>
            </div>
            <span class="aux-text text-[10px] text-muted block mt-0.5">Downloading...</span>
        </div>
    `;

    const btn = row.querySelector('.aux-dl-btn');
    if (btn) {
        btn.onclick = async () => {
            btn.disabled = true;
            btn.innerHTML = `<span class="animate-spin">◌</span>`;
            const progWrap = row.querySelector('.aux-progress');
            const progFill = row.querySelector('.aux-fill');
            const progText = row.querySelector('.aux-text');
            progWrap.classList.remove('hidden');

            const auxId = auxKey === 'llm' ? '__llm__' : '__vae__';
            const unsub = localAI.onDownloadProgress(({ id, phase, progress }) => {
                if (id !== auxId) return;
                progFill.style.width = `${Math.round(progress * 100)}%`;
                progText.textContent = phase === 'done' ? 'Complete!' : `Downloading... ${Math.round(progress * 100)}%`;
            });

            try {
                await localAI.downloadAuxiliary(auxKey);
                unsub();
                if (onStateChange) onStateChange();
            } catch (err) {
                unsub();
                progText.textContent = `Error: ${err.message}`;
                btn.disabled = false;
                btn.innerHTML = `${DownloadIcon} Retry`;
            }
        };
    }

    return row;
}

// ─── Wan2GP Server Config ────────────────────────────────────────────────────
function Wan2gpConfigBar(onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'flex flex-col gap-3 p-3 rounded-xl bg-white/3 border border-white/5';
    wrap.innerHTML = `
        <div class="flex flex-col gap-0.5">
            <span class="text-xs font-bold text-white">Wan2GP server (optional)</span>
            <span class="text-[11px] text-muted leading-relaxed">
                Run <a href="https://github.com/deepbeepmeep/Wan2GP" target="_blank" class="text-primary hover:underline">Wan2GP</a>
                on a CUDA box (<code class="text-primary/80">python wgp.py --listen --server-name 0.0.0.0</code>) to unlock video models from this UI.
            </span>
        </div>
        <div class="flex items-center gap-2">
            <input id="wan2gp-url" type="text" placeholder="http://127.0.0.1:7860"
                   class="flex-1 bg-white/5 border border-white/5 focus:border-primary/40 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none"/>
            <button id="wan2gp-test" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all">Test</button>
            <button id="wan2gp-save" class="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:shadow-glow transition-all">Save</button>
        </div>
        <div id="wan2gp-status" class="text-[11px] text-muted">Not configured</div>
    `;

    const input = wrap.querySelector('#wan2gp-url');
    const testBtn = wrap.querySelector('#wan2gp-test');
    const saveBtn = wrap.querySelector('#wan2gp-save');
    const statusEl = wrap.querySelector('#wan2gp-status');
    const setStatus = (text, kind = 'muted') => {
        const colorMap = { muted: 'text-muted', ok: 'text-green-400', warn: 'text-yellow-400', err: 'text-red-400' };
        statusEl.className = `text-[11px] ${colorMap[kind] || colorMap.muted}`;
        statusEl.textContent = text;
    };

    (async () => {
        const cfg = await localAI.getWan2gpConfig();
        if (cfg.url) {
            input.value = cfg.url;
            const r = await localAI.probeWan2gp(cfg.url);
            setStatus(r.ok ? `Connected · Gradio ${r.version}` : `Saved URL not reachable: ${r.error}`, r.ok ? 'ok' : 'warn');
        } else {
            setStatus('Not configured (Wan2GP models will appear offline)', 'muted');
        }
    })();

    testBtn.onclick = async () => {
        const url = input.value.trim();
        if (!url) { setStatus('Enter a URL first', 'warn'); return; }
        setStatus('Probing...', 'muted');
        testBtn.disabled = true;
        try {
            const r = await localAI.probeWan2gp(url);
            setStatus(r.ok ? `Reachable · Gradio ${r.version}` : `Unreachable: ${r.error}`, r.ok ? 'ok' : 'err');
        } finally { testBtn.disabled = false; }
    };

    saveBtn.onclick = async () => {
        const url = input.value.trim();
        saveBtn.disabled = true;
        try {
            await localAI.setWan2gpUrl(url);
            const r = url ? await localAI.probeWan2gp(url) : { ok: false, error: 'cleared' };
            setStatus(r.ok ? `Saved · Connected to Gradio ${r.version}` : (url ? `Saved, not reachable: ${r.error}` : 'Cleared'), r.ok ? 'ok' : 'warn');
            onChange?.();
        } finally { saveBtn.disabled = false; }
    };

    return wrap;
}

// ─── Model Card ───────────────────────────────────────────────────────────────
function Wan2gpModelCard(model) {
    const card = document.createElement('div');
    card.className = 'flex items-start justify-between gap-3 p-4 rounded-xl border border-white/5 bg-white/3';
    const ready = !!model.ready;
    card.innerHTML = `
        <div class="flex flex-col gap-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-bold text-white truncate">${model.name}</span>
                ${ready ? `<span class="text-green-400">${CheckIcon}</span>` : ''}
            </div>
            <p class="text-[11px] text-muted leading-relaxed">${model.description}</p>
            <div class="flex items-center gap-1.5 flex-wrap mt-1">
                <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold ${model.type === 'video' ? 'bg-purple-500/15 text-purple-300' : 'bg-primary/10 text-primary'}">${model.type.toUpperCase()}</span>
                <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-muted">via Wan2GP</span>
                ${(model.tags || []).filter(t => !['featured', 'remote'].includes(t)).map(t => `<span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-muted">${t}</span>`).join('')}
            </div>
        </div>
        <div class="shrink-0">
            <span class="text-[10px] font-bold ${ready ? 'text-green-400' : 'text-yellow-400'}">${ready ? 'Available' : 'Server offline'}</span>
        </div>
    `;
    return card;
}

function ModelCard(model, onStateChange) {
    if (model.provider === 'wan2gp') return Wan2gpModelCard(model);
    const card = document.createElement('div');
    card.className = 'flex flex-col gap-3 p-4 rounded-xl border border-white/5 bg-white/3 hover:border-white/10 transition-all';

    const isDownloaded = model.state === 'downloaded';
    const auxStatus = model.auxiliaryStatus || {};
    const auxReady = !model.requiresAuxiliary || (auxStatus.llm === 'downloaded' && auxStatus.vae === 'downloaded');
    const fullyReady = isDownloaded && auxReady;

    card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col gap-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-bold text-white truncate">${model.name}</span>
                    ${model.featured ? `<span class="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-primary/20 text-primary border border-primary/30">⚡ Featured</span>` : ''}
                    ${fullyReady ? `<span class="text-green-400">${CheckIcon}</span>` : ''}
                </div>
                <p class="text-[11px] text-muted leading-relaxed">${model.description}</p>
                <div class="flex items-center gap-1.5 flex-wrap mt-1">
                    <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">${model.type.toUpperCase()}</span>
                    <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-muted">${fmtGB(model.sizeGB)}</span>
                    ${(model.tags || []).filter(t => t !== 'featured').map(t => `<span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-muted">${t}</span>`).join('')}
                </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                ${isDownloaded
                    ? `<button class="delete-btn p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all">${TrashIcon}</button>`
                    : `<button class="download-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:shadow-glow transition-all">${DownloadIcon} Download</button>`
                }
            </div>
        </div>
        <div class="progress-wrap hidden">
            <div class="h-1 rounded-full bg-white/10 overflow-hidden">
                <div class="progress-fill h-full bg-primary transition-all" style="width:0%"></div>
            </div>
            <span class="progress-text text-[10px] text-muted mt-1 block">Preparing...</span>
        </div>
        ${model.requiresAuxiliary ? `<div class="aux-section flex flex-col gap-1.5 pt-1 border-t border-white/5"></div>` : ''}
    `;

    // Auxiliary files section for Z-Image
    if (model.requiresAuxiliary) {
        const auxSection = card.querySelector('.aux-section');
        auxSection.appendChild(document.createElement('span')).className = 'text-[10px] text-muted uppercase tracking-wider font-bold';
        auxSection.querySelector('span').textContent = 'Required components';
        auxSection.appendChild(AuxRow('Qwen3-4B Text Encoder (2.4 GB)', 'llm', auxStatus.llm, onStateChange));
        auxSection.appendChild(AuxRow('FLUX VAE (335 MB)', 'vae', auxStatus.vae, onStateChange));
    }

    const progressWrap = card.querySelector('.progress-wrap');
    const progressFill = card.querySelector('.progress-fill');
    const progressText = card.querySelector('.progress-text');

    const downloadBtn = card.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.onclick = async () => {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `<span class="animate-spin">◌</span> Starting...`;
            progressWrap.classList.remove('hidden');

            const unsub = localAI.onDownloadProgress(({ id, phase, progress }) => {
                if (id !== model.id) return;
                progressFill.style.width = `${Math.round(progress * 100)}%`;
                progressText.textContent = phase === 'done' ? 'Complete!' : `Downloading... ${Math.round(progress * 100)}%`;
            });

            try {
                await localAI.downloadModel(model.id);
                unsub();
                if (onStateChange) onStateChange();
            } catch (err) {
                unsub();
                progressText.textContent = `Error: ${err.message}`;
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = `${DownloadIcon} Retry`;
            }
        };
    }

    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!confirm(`Delete "${model.name}"? You'll need to re-download it to use it again.`)) return;
            await localAI.deleteModel(model.id);
            if (onStateChange) onStateChange();
        };
    }

    return card;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function LocalModelManager() {
    const root = document.createElement('div');
    root.className = 'flex flex-col gap-5';

    if (!isLocalAIAvailable()) {
        root.innerHTML = `
            <div class="flex flex-col items-center gap-3 py-8 text-center">
                <p class="text-sm font-bold text-white">Local Models</p>
                <p class="text-xs text-muted max-w-xs">Local model inference is only available in the desktop app (Electron build). Use <span class="text-primary font-bold">npm run electron:build</span> to build.</p>
            </div>
        `;
        return root;
    }

    // ── Section: engine status
    const engineSection = document.createElement('div');
    engineSection.className = 'flex flex-col gap-2';
    engineSection.innerHTML = `<h3 class="text-xs font-bold text-secondary uppercase tracking-wider">Inference Engine</h3>`;

    let binaryReady = false;
    const binaryBar = BinaryStatusBar((ready) => { binaryReady = ready; });
    engineSection.appendChild(binaryBar);

    const wan2gpBar = Wan2gpConfigBar(() => renderModels());
    engineSection.appendChild(wan2gpBar);
    root.appendChild(engineSection);

    // ── Section: models
    const modelsSection = document.createElement('div');
    modelsSection.className = 'flex flex-col gap-3';
    modelsSection.innerHTML = `
        <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-secondary uppercase tracking-wider">Local Models</h3>
            <span class="text-[10px] text-muted">Stored in your app data folder</span>
        </div>
        <div id="local-model-list" class="flex flex-col gap-3"></div>
    `;
    root.appendChild(modelsSection);

    const listEl = modelsSection.querySelector('#local-model-list');

    const renderModels = async () => {
        listEl.innerHTML = `<div class="text-xs text-muted text-center py-4">Loading...</div>`;
        try {
            const models = await localAI.listModels();
            listEl.innerHTML = '';
            models.forEach(m => {
                listEl.appendChild(ModelCard(m, renderModels));
            });
        } catch (err) {
            listEl.innerHTML = `<div class="text-xs text-red-400 text-center py-4">Error loading models: ${err.message}</div>`;
        }
    };

    renderModels();

    return root;
}
