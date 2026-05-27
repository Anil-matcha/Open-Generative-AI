import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { getUploadHistory, saveUpload, removeUpload, generateThumbnail } from '../lib/uploadHistory.js';

/**
 * Creates a self-contained upload picker: a trigger button + history panel.
 * Supports single-image (maxImages=1) and multi-image (maxImages>1) modes.
 *
 * @param {object} options
 * @param {HTMLElement} options.anchorContainer - The container element the panel is positioned relative to
 * @param {function({ url: string, urls: string[], thumbnail: string }): void} options.onSelect
 * @param {function(): void} [options.onClear]
 * @param {number} [options.maxImages=1] - Maximum number of images selectable
 * @returns {{ trigger: HTMLElement, panel: HTMLElement, reset: function, setMaxImages: function }}
 */
export function createUploadPicker({ anchorContainer, onSelect, onClear, maxImages: initialMaxImages = 1, uploadFn, requireApiKey }) {
    // uploadFn(file) → Promise<string url>. Defaults to Muapi-hosted upload.
    // requireApiKey() → boolean. Lets the caller suppress the AuthModal when
    // the active provider doesn't need a Muapi key (e.g. local Wan2GP).
    const doUpload = uploadFn || ((file) => muapi.uploadFile(file));
    const needsKey = typeof requireApiKey === 'function' ? requireApiKey : () => true;
    let panelOpen = false;
    let maxImages = initialMaxImages;
    let selectedEntries = []; // [{ url, thumbnail }, ...]

    // ── Hidden file input ─────────────────────────────────────────────────────
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';

    // ── Trigger button ────────────────────────────────────────────────────────
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.title = 'Reference image';
    trigger.className = 'w-10 h-10 shrink-0 rounded-xl border transition-all flex items-center justify-center relative overflow-hidden mt-1.5 bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/40 group';

    // State: icon
    const iconState = document.createElement('div');
    iconState.className = 'flex items-center justify-center w-full h-full';
    iconState.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-muted group-hover:text-primary transition-colors"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

    // State: spinner
    const spinnerState = document.createElement('div');
    spinnerState.className = 'hidden items-center justify-center w-full h-full';
    spinnerState.innerHTML = `<span class="animate-spin text-primary text-sm">◌</span>`;

    // State: thumbnail (first selected image + optional count badge)
    const thumbnailState = document.createElement('div');
    thumbnailState.className = 'hidden w-full h-full';
    const thumbImg = document.createElement('img');
    thumbImg.className = 'w-full h-full object-cover';
    const countBadge = document.createElement('div');
    countBadge.className = 'absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5';
    countBadge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>`;
    thumbnailState.appendChild(thumbImg);
    thumbnailState.appendChild(countBadge);

    trigger.appendChild(fileInput);
    trigger.appendChild(iconState);
    trigger.appendChild(spinnerState);
    trigger.appendChild(thumbnailState);

    // ── Trigger state helpers ─────────────────────────────────────────────────
    const showIcon = () => {
        iconState.classList.replace('hidden', 'flex');
        spinnerState.classList.add('hidden'); spinnerState.classList.remove('flex');
        thumbnailState.classList.add('hidden'); thumbnailState.classList.remove('flex');
        trigger.classList.remove('border-primary/60');
        trigger.classList.add('border-white/10');
    };

    const showSpinner = () => {
        iconState.classList.add('hidden'); iconState.classList.remove('flex');
        spinnerState.classList.replace('hidden', 'flex');
        thumbnailState.classList.add('hidden'); thumbnailState.classList.remove('flex');
    };

    const updateTrigger = () => {
        if (selectedEntries.length === 0) {
            showIcon();
            trigger.title = maxImages > 1 ? `Add up to ${maxImages} images` : 'Reference image';
            return;
        }

        // Show first image thumbnail
        thumbImg.src = selectedEntries[0].thumbnail;
        iconState.classList.add('hidden'); iconState.classList.remove('flex');
        spinnerState.classList.add('hidden'); spinnerState.classList.remove('flex');
        thumbnailState.classList.replace('hidden', 'flex');
        trigger.classList.remove('border-white/10');
        trigger.classList.add('border-primary/60');

        const count = selectedEntries.length;
        const canAddMore = maxImages > 1 && count < maxImages;

        if (count > 1) {
            // Multiple selected — show count
            countBadge.className = 'absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5';
            countBadge.innerHTML = `<span class="text-[9px] font-black text-black leading-none">${count}</span>`;
            trigger.title = `${count} of ${maxImages} images selected — click to manage`;
        } else if (canAddMore) {
            // 1 selected, multi-mode active — show "+" to invite adding more
            countBadge.className = 'absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-white/80 rounded-full flex items-center justify-center px-0.5 border border-primary/60';
            countBadge.innerHTML = `<span class="text-[9px] font-black text-black leading-none">+</span>`;
            trigger.title = `1 image selected — click to add more (up to ${maxImages})`;
        } else {
            // Single mode or at max — show checkmark
            countBadge.className = 'absolute bottom-0.5 right-0.5 min-w-[16px] h-4 bg-primary rounded-full flex items-center justify-center px-0.5';
            countBadge.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>`;
            trigger.title = count > 1 ? `${count} images selected` : 'Reference image';
        }
    };

    // ── Panel ─────────────────────────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'absolute z-50 opacity-0 pointer-events-none scale-95 origin-bottom-left glass rounded-3xl p-3 shadow-4xl border border-white/10 w-72 transition-all';

    const openPanel = () => {
        renderPanel();
        panel.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        panel.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
        const btnRect = trigger.getBoundingClientRect();
        const containerRect = anchorContainer.getBoundingClientRect();
        panel.style.left = `${btnRect.left - containerRect.left}px`;
        panel.style.bottom = `${containerRect.bottom - btnRect.top + 8}px`;
        panelOpen = true;
    };

    const closePanel = () => {
        panel.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        panel.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
        panelOpen = false;
    };

    const fireOnSelect = () => {
        if (selectedEntries.length === 0) return;
        const urls = selectedEntries.map(e => e.url);
        onSelect({
            url: urls[0],           // backward-compatible single URL
            urls,                   // full array for multi-image models
            thumbnail: selectedEntries[0].thumbnail
        });
    };

    const renderPanel = () => {
        panel.innerHTML = '';
        const history = getUploadHistory();
        const isMulti = maxImages > 1;

        // ── Header ──
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5';

        const headerLeft = document.createElement('div');
        headerLeft.className = 'flex flex-col gap-0.5';
        headerLeft.innerHTML = `<span class="text-[10px] font-bold text-secondary uppercase tracking-widest">Reference Images</span>`;
        if (isMulti) {
            const hint = document.createElement('span');
            hint.className = 'text-[9px] text-muted';
            hint.textContent = `Select up to ${maxImages} images`;
            headerLeft.appendChild(hint);
        }
        header.appendChild(headerLeft);

        const headerRight = document.createElement('div');
        headerRight.className = 'flex items-center gap-2';

        // Done button (multi-select only)
        if (isMulti && selectedEntries.length > 0) {
            const doneBtn = document.createElement('button');
            doneBtn.type = 'button';
            doneBtn.className = 'flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105';
            doneBtn.innerHTML = `✓ Done (${selectedEntries.length})`;
            doneBtn.onclick = (e) => {
                e.stopPropagation();
                closePanel();
                fireOnSelect();
            };
            headerRight.appendChild(doneBtn);
        }

        const uploadNewBtn = document.createElement('button');
        uploadNewBtn.type = 'button';
        uploadNewBtn.className = 'flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all border border-primary/20';
        const uploadLabel = isMulti ? 'Upload files' : 'Upload new';
        uploadNewBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ${uploadLabel}`;
        uploadNewBtn.onclick = (e) => { e.stopPropagation(); closePanel(); fileInput.click(); };
        headerRight.appendChild(uploadNewBtn);
        header.appendChild(headerRight);
        panel.appendChild(header);

        if (history.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'py-6 flex flex-col items-center gap-2 opacity-40';
            empty.innerHTML = `
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-secondary"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span class="text-xs text-secondary">No uploads yet</span>
            `;
            panel.appendChild(empty);
            return;
        }

        // ── Grid ──
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5';

        history.forEach(entry => {
            const selIdx = selectedEntries.findIndex(e => e.url === entry.uploadedUrl);
            const isSelected = selIdx !== -1;

            const cell = document.createElement('div');
            cell.className = `relative rounded-xl overflow-hidden border-2 cursor-pointer group/cell aspect-square transition-all ${isSelected ? 'border-primary shadow-glow' : 'border-white/10 hover:border-white/30'}`;
            cell.title = entry.name;

            const img = document.createElement('img');
            img.src = entry.thumbnail;
            img.className = 'w-full h-full object-cover';

            // Hover overlay with delete button
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 bg-black/60 opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-end justify-end p-1';

            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-md flex items-center justify-center transition-colors';
            delBtn.title = 'Remove from history';
            delBtn.innerHTML = `<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
            delBtn.onclick = (e) => {
                e.stopPropagation();
                removeUpload(entry.id);
                const idx = selectedEntries.findIndex(e => e.url === entry.uploadedUrl);
                if (idx !== -1) {
                    selectedEntries.splice(idx, 1);
                    updateTrigger();
                    if (selectedEntries.length === 0) onClear?.();
                }
                renderPanel();
            };
            overlay.appendChild(delBtn);

            // Selection badge: order number (multi) or checkmark (single)
            if (isSelected) {
                const badge = document.createElement('div');
                badge.className = 'absolute top-1 left-1 min-w-[20px] h-5 bg-primary rounded-full flex items-center justify-center px-1';
                if (isMulti) {
                    badge.innerHTML = `<span class="text-[10px] font-black text-black">${selIdx + 1}</span>`;
                } else {
                    badge.innerHTML = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="4"><polyline points="20 6 9 17 4 12"/></svg>`;
                }
                cell.appendChild(badge);
            }

            // Not-yet-reachable dim (when at max)
            const atMax = isMulti && !isSelected && selectedEntries.length >= maxImages;
            if (atMax) {
                cell.classList.add('opacity-40');
                cell.style.cursor = 'not-allowed';
            }

            cell.appendChild(img);
            cell.appendChild(overlay);

            cell.onclick = (e) => {
                e.stopPropagation();
                if (atMax) return; // can't select more

                if (!isMulti) {
                    // Single-select: select & close immediately
                    selectedEntries = [{ url: entry.uploadedUrl, thumbnail: entry.thumbnail }];
                    updateTrigger();
                    fireOnSelect();
                    closePanel();
                } else {
                    // Multi-select: toggle
                    if (isSelected) {
                        selectedEntries.splice(selIdx, 1);
                        if (selectedEntries.length === 0) onClear?.();
                    } else {
                        selectedEntries.push({ url: entry.uploadedUrl, thumbnail: entry.thumbnail });
                    }
                    updateTrigger();
                    renderPanel(); // re-render to update badges / dim state
                }
            };

            grid.appendChild(cell);
        });

        panel.appendChild(grid);

        // Bottom "Done" bar for multi-select (always visible when items selected)
        if (isMulti && selectedEntries.length > 0) {
            const bottomBar = document.createElement('div');
            bottomBar.className = 'mt-3 pt-3 border-t border-white/5 flex items-center justify-between';
            bottomBar.innerHTML = `<span class="text-xs text-secondary">${selectedEntries.length} of ${maxImages} selected</span>`;
            const doneBtn2 = document.createElement('button');
            doneBtn2.type = 'button';
            doneBtn2.className = 'px-4 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105';
            doneBtn2.textContent = 'Use Selected';
            doneBtn2.onclick = (e) => {
                e.stopPropagation();
                closePanel();
                fireOnSelect();
            };
            bottomBar.appendChild(doneBtn2);
            panel.appendChild(bottomBar);
        }
    };

    // ── Trigger click ─────────────────────────────────────────────────────────
    trigger.onclick = (e) => {
        e.stopPropagation();
        if (panelOpen) closePanel();
        else openPanel();
    };

    // Close panel on outside click
    window.addEventListener('click', closePanel);

    // ── File upload handler ───────────────────────────────────────────────────
    fileInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (needsKey()) {
            const apiKey = localStorage.getItem('muapi_key');
            if (!apiKey) {
                AuthModal(() => fileInput.click());
                return;
            }
        }

        showSpinner();

        try {
            if (maxImages === 1) {
                // Single mode: upload first file only, replace selection
                const file = files[0];
                const [uploadResult, thumbnail] = await Promise.all([
                    doUpload(file),
                    generateThumbnail(file)
                ]);
                const uploadedUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult?.url;
                const entry = { id: Date.now().toString(), name: file.name, uploadedUrl, thumbnail, timestamp: new Date().toISOString() };
                saveUpload(entry);
                selectedEntries = [{ url: uploadedUrl, thumbnail }];
                updateTrigger();
                fireOnSelect();
            } else {
                // Multi mode: upload all files (up to remaining slots)
                const slots = maxImages - selectedEntries.length;
                const toUpload = files.slice(0, Math.max(slots, 1));

                // Upload all in parallel
                const results = await Promise.all(toUpload.map(async (file) => {
                    const [uploadResult, thumbnail] = await Promise.all([
                        doUpload(file),
                        generateThumbnail(file)
                    ]);
                    const uploadedUrl = typeof uploadResult === 'string' ? uploadResult : uploadResult?.url;
                    return { id: Date.now().toString() + Math.random(), name: file.name, uploadedUrl, thumbnail, timestamp: new Date().toISOString() };
                }));

                results.forEach(entry => {
                    saveUpload(entry);
                    if (selectedEntries.length < maxImages) {
                        selectedEntries.push({ url: entry.uploadedUrl, thumbnail: entry.thumbnail });
                    }
                });

                updateTrigger();
                // In multi-mode reopen panel so user can continue selecting / see Done button
                openPanel();
            }
        } catch (err) {
            console.error('[UploadPicker] Upload failed:', err);
            updateTrigger();
            alert(`Image upload failed: ${err.message}`);
        }

        fileInput.value = '';
    };

    // ── Public API ────────────────────────────────────────────────────────────
    const reset = () => {
        selectedEntries = [];
        showIcon();
        closePanel();
    };

    const setMaxImages = (n) => {
        maxImages = n;
        // Enable multi-file selection in file picker when multi-mode
        fileInput.multiple = n > 1;
        // Trim selection if exceeding new limit
        if (selectedEntries.length > n) {
            selectedEntries = selectedEntries.slice(0, n);
            if (selectedEntries.length === 0) onClear?.();
        }
        // Always refresh trigger so badge/tooltip reflects new mode
        updateTrigger();
    };

    const getSelectedUrls = () => selectedEntries.map(e => e.url);

    // Programmatically select an image (e.g. for demo mode) without uploading
    const setImage = (url, thumbnail) => {
        selectedEntries = [{ url, thumbnail: thumbnail || url }];
        updateTrigger();
        fireOnSelect();
    };

    return { trigger, panel, reset, setMaxImages, getSelectedUrls, setImage };
}
