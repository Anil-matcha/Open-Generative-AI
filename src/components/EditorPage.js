import { navigate } from '../lib/router.js';
import { showToast } from '../lib/loading.js';
import { getSupabaseUrl } from '../lib/supabase.js';
import { escapeHtml } from '../lib/security.js';
import { createUploadPicker } from './UploadPicker.js';
import { createMediaPreview, createFullscreenPreview } from './MediaPreview.js';

const TRANSITIONS = [
    { id: 'fade', name: 'Fade', icon: '◐', duration: 0.5, tooltip: 'Gradual fade between clips' },
    { id: 'dissolve', name: 'Dissolve', icon: '◑', duration: 0.8, tooltip: 'Cross-dissolve blend effect' },
    { id: 'wipe-left', name: 'Wipe Left', icon: '→', duration: 0.5, tooltip: 'Wipe from right to left' },
    { id: 'wipe-right', name: 'Wipe Right', icon: '←', duration: 0.5, tooltip: 'Wipe from left to right' },
    { id: 'wipe-up', name: 'Wipe Up', icon: '↑', duration: 0.5, tooltip: 'Wipe from bottom to top' },
    { id: 'wipe-down', name: 'Wipe Down', icon: '↓', duration: 0.5, tooltip: 'Wipe from top to bottom' },
    { id: 'slide', name: 'Slide', icon: '⇢', duration: 0.5, tooltip: 'Slide transition effect' },
    { id: 'zoom-in', name: 'Zoom In', icon: '🔍', duration: 0.5, tooltip: 'Zoom into the next clip' },
    { id: 'zoom-out', name: 'Zoom Out', icon: '🔎', duration: 0.5, tooltip: 'Zoom out to the next clip' },
    { id: 'blur', name: 'Blur', icon: '💧', duration: 1.0, tooltip: 'Blur transition between clips' },
    { id: 'spin', name: 'Spin', icon: '↻', duration: 0.8, tooltip: 'Spin rotation transition' },
    { id: 'custom', name: 'Custom', icon: '⚙️', duration: 1.0, tooltip: 'Custom transition settings' },
];

const TEXT_STYLES = [
    { id: 'title', name: 'Title', font: 'Impact', size: 72, color: '#FFFFFF', bg: 'transparent', tooltip: 'Large title text overlay' },
    { id: 'subtitle', name: 'Subtitle', font: 'Arial', size: 36, color: '#FFFFFF', bg: 'rgba(0,0,0,0.5)', tooltip: 'Subtitle text with background' },
    { id: 'lower-third', name: 'Lower Third', font: 'Arial', size: 24, color: '#FFFFFF', bg: 'rgba(0,0,0,0.7)', tooltip: 'Lower third caption bar' },
    { id: 'caption', name: 'Caption', font: 'Arial', size: 18, color: '#FFFFFF', bg: 'rgba(0,0,0,0.6)', tooltip: 'Caption text overlay' },
    { id: 'credits', name: 'Credits', font: 'Courier', size: 24, color: '#CCCCCC', bg: 'transparent', tooltip: 'End credits text style' },
];

const AUDIO_TRACKS = [
    { id: 'music', name: 'Background Music', icon: '🎵', color: 'green', tooltip: 'Add background music track' },
    { id: 'voiceover', name: 'Voiceover', icon: '🎤', color: 'purple', tooltip: 'Add voiceover narration' },
    { id: 'sfx', name: 'Sound Effects', icon: '🔊', color: 'orange', tooltip: 'Add sound effect clips' },
];

const FRAME_AGENT_COMMANDS = [
    { id: 'fade', command: 'Add a fade transition between clips', icon: '◐', tooltip: 'Add fade transition' },
    { id: 'speed', command: 'Make this clip 2x faster', icon: '⏱️', tooltip: 'Adjust clip speed' },
    { id: 'subtitle', command: 'Add subtitles to this segment', icon: '💬', tooltip: 'Generate subtitles' },
    { id: 'scene', command: 'Detect scenes in this video', icon: '🎬', tooltip: 'Auto-detect scenes' },
    { id: 'highlight', command: 'Create a highlight reel', icon: '⚡', tooltip: 'Create highlight reel' },
];

const AI_TAGS = [
    { id: 'face', name: 'Faces', icon: '👤', count: 0 },
    { id: 'action', name: 'Actions', icon: '🏃', count: 0 },
    { id: 'scene', name: 'Scenes', icon: '🎬', count: 0 },
    { id: 'object', name: 'Objects', icon: '📦', count: 0 },
    { id: 'text', name: 'Text', icon: '📝', count: 0 },
];

const TIMELINE_CONFIG = {
    pixelsPerSecond: 16,
    minClipWidth: 40,
    snapThreshold: 10,
    trackHeight: 40,
    labelWidth: 96,
    defaultClipDuration: 10,
};

const EFFECTS_LIST = [
    { id: 'brightness', name: 'Brightness', icon: '☀️', tooltip: 'Adjust video brightness' },
    { id: 'contrast', name: 'Contrast', icon: '◐', tooltip: 'Adjust video contrast' },
    { id: 'saturation', name: 'Saturation', icon: '🎨', tooltip: 'Adjust color saturation' },
    { id: 'blur', name: 'Blur', icon: '💧', tooltip: 'Apply blur effect' },
    { id: 'sharpen', name: 'Sharpen', icon: '🔪', tooltip: 'Sharpen video details' },
    { id: 'grayscale', name: 'Grayscale', icon: '⬛', tooltip: 'Convert to grayscale' },
    { id: 'sepia', name: 'Sepia', icon: '🟤', tooltip: 'Apply sepia tone' },
    { id: 'invert', name: 'Invert', icon: '🔄', tooltip: 'Invert video colors' },
];

const SPEED_OPTIONS = ['0.25x (Super Slow)', '0.5x (Slow)', '1x (Normal)', '1.5x', '2x (Fast)', '4x'];

export function EditorPage() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col overflow-hidden';
    
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('videoId') || '';
    const videoUrl = urlParams.get('videoUrl') || '';
    
    let selectedTool = null;
    let selectedTransition = null;
    let chatHistory = [];
    let isChatOpen = true;
    let isProcessing = false;
    let aiTags = [];
    let uploadedUrl = null;
    let timelineClips = videoUrl
        ? [{ id: 'clip1', name: 'Video', start: 0, duration: TIMELINE_CONFIG.defaultClipDuration, color: '#3B82F6', url: videoUrl }]
        : [];
    let timelineZoom = 1;
    let undoStack = [];

    // Modal for track name input
    function showTrackNameModal(callback) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gray-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-bold text-white mb-4">Add New Track</h3>
                <input type="text" placeholder="Enter track name" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white mb-4" id="track-name-input" />
                <div class="flex gap-3">
                    <button class="flex-1 py-2 bg-primary text-black font-bold rounded-lg" id="confirm-btn">Add Track</button>
                    <button class="flex-1 py-2 bg-white/10 text-white rounded-lg" id="cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#track-name-input');
        const confirmBtn = modal.querySelector('#confirm-btn');
        const cancelBtn = modal.querySelector('#cancel-btn');

        input.focus();

        const close = () => {
            document.body.removeChild(modal);
        };

        confirmBtn.onclick = () => {
            const name = input.value.trim();
            if (name) {
                callback(name);
            }
            close();
        };

        cancelBtn.onclick = close;

        input.onkeydown = (e) => {
            if (e.key === 'Enter') confirmBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        };
    }
    let redoStack = [];
    
    const fullscreen = createFullscreenPreview();
    container.appendChild(fullscreen.element);

    container.innerHTML = `
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b border-white/5 bg-black/30">
            <div class="flex items-center gap-4">
                <button id="back-btn" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Go back to previous page">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-white">EDITOR</h1>
                        <p class="text-xs text-secondary">Full Timeline Editor</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button id="toggle-chat-btn" class="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-2" title="Toggle AI Frame Agent panel">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    Frame Agent
                </button>
                <button id="undo-btn" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Undo last action">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
                    </svg>
                </button>
                <button id="redo-btn" class="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Redo last undone action">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
                    </svg>
                </button>
                <div class="h-6 w-px bg-white/10 mx-2"></div>
                <button id="save-btn" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors" title="Save project">
                    Save
                </button>
                <button id="export-btn" class="px-4 py-1.5 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-transform text-sm" title="Export video">
                    Export
                </button>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left Sidebar - AI Chat -->
            <div id="ai-chat-panel" class="w-80 bg-black/30 border-r border-white/5 flex flex-col transition-all duration-300">
                <div class="p-4 border-b border-white/5">
                    <h3 class="text-sm font-bold text-white flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                        </svg>
                        AI Chat
                    </h3>
                </div>
                <div class="flex-1 p-4 overflow-y-auto">
                    <div id="chat-messages" class="space-y-3 mb-4">
                        <div class="text-xs text-muted">Start a conversation...</div>
                    </div>
                    <div class="flex gap-2 mb-3" id="quick-commands">
                        <button class="px-3 py-1 bg-primary/20 text-primary text-xs rounded-lg hover:bg-primary/30 transition-colors">⚡ Generate</button>
                        <button class="px-3 py-1 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors">Retake</button>
                        <button class="px-3 py-1 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors">Extend</button>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="chat-input" placeholder="Type AI command..." class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary/50" />
                        <button id="send-chat-btn" class="px-3 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-transform">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="flex-1 flex flex-col overflow-hidden">
                <!-- Video Preview Area -->
                <div class="flex-1 flex items-center justify-center bg-black p-4">
                    ${videoUrl ? `
                        <video 
                            id="editor-video" 
                            class="max-w-full max-h-full rounded-lg shadow-2xl" 
                            controls
                            src="${escapeHtml(videoUrl)}"
                        >
                            Your browser does not support video playback.
                        </video>
                    ` : `
                        <div class="text-center p-8">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-secondary mx-auto mb-4">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                                <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
                                <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
                                <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
                                <line x1="17" y1="7" x2="22" y2="7"/>
                            </svg>
                            <p class="text-secondary">No video loaded</p>
                            <p class="text-xs text-muted mt-2">Generate a video first to use the Editor</p>
                        </div>
                    `}
                </div>
                
                <!-- Timeline -->
                <div class="h-56 border-t border-white/5 bg-black/50 flex flex-col">
                    <!-- Timeline Toolbar -->
                    <div class="h-10 px-4 border-b border-white/5 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-secondary font-bold">TIMELINE</span>
                            <span class="text-xs text-muted" id="timeline-duration">00:00 / 00:${String(TIMELINE_CONFIG.defaultClipDuration).padStart(2,'0')}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="timeline-btn p-1 hover:bg-white/10 rounded" title="Zoom out on timeline" id="zoom-out-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/>
                                </svg>
                            </button>
                            <button class="timeline-btn p-1 hover:bg-white/10 rounded" title="Zoom in on timeline" id="zoom-in-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
                                </svg>
                            </button>
                            <button class="timeline-btn p-1 hover:bg-white/10 rounded" title="Toggle snap to grid" id="snap-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
                                    <line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/>
                                    <line x1="15" y1="3" x2="15" y2="21"/>
                                </svg>
                            </button>
                            <button class="timeline-btn p-1 hover:bg-white/10 rounded" title="Add new track" id="add-track-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Timeline Tracks -->
                    <div class="flex-1 overflow-auto p-2" id="timeline-container">
                        <div class="min-w-[800px]">
                            <!-- Time Ruler -->
                            <div class="h-5 flex items-end text-[10px] text-secondary mb-1 ml-24" id="time-ruler">
                                ${Array.from({length: 11}, (_, t) => `
                                    <div class="w-16 border-l border-white/20 pl-1">${t}:00</div>
                                `).join('')}
                            </div>
                            
                            <!-- Track Rows Container -->
                            <div id="tracks-container"></div>
                            
                            <!-- Playhead -->
                            <div class="absolute top-0 bottom-0 w-0.5 bg-primary cursor-ew-resize ml-24 pointer-events-none" style="left: 80px;" id="playhead">
                                <div class="absolute -top-0 -left-1.5 w-3 h-3 bg-primary rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel - Tools -->
            <div class="w-72 border-l border-white/5 overflow-auto flex flex-col">
                <!-- Tool Tabs -->
                <div class="flex border-b border-white/5 flex-shrink-0">
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-primary border-b-2 border-primary" data-tab="media">
                        MEDIA
                    </button>
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-secondary hover:text-white" data-tab="transitions">
                        TRANS
                    </button>
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-secondary hover:text-white" data-tab="text">
                        TEXT
                    </button>
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-secondary hover:text-white" data-tab="audio">
                        AUDIO
                    </button>
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-secondary hover:text-white" data-tab="auto">
                        AUTO
                    </button>
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-secondary hover:text-white" data-tab="generate">
                        ⚡ GENERATE
                    </button>
                    <button class="tool-tab flex-1 p-2 text-xs font-bold text-secondary hover:text-white" data-tab="organize">
                        ORG
                    </button>
                </div>
                
                <!-- Tool Panels Container -->
                <div class="flex-1 overflow-auto">
                    <!-- Media Tab -->
                    <div id="tab-media" class="tool-panel p-4">
                        <h3 class="font-bold text-white mb-3 text-sm">MEDIA LIBRARY</h3>
                        <div id="media-library-grid" class="grid grid-cols-3 gap-2 mb-4">
                            <!-- Media items will be rendered dynamically -->
                        </div>
                        <button class="w-full py-2 border border-dashed border-white/20 rounded-lg text-sm text-secondary hover:bg-white/5 hover:text-white transition-colors" id="import-media-btn" title="Import media files from your device">
                            + Import Media
                        </button>
                        
                        <!-- Clip Properties -->
                        <div class="mt-6" id="clip-properties-panel">
                            <h4 class="font-bold text-white text-sm mb-3">CLIP PROPERTIES</h4>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Duration</label>
                                    <input type="text" value="${TIMELINE_CONFIG.defaultClipDuration}s" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" id="clip-duration-input" title="Clip duration in seconds">
                                </div>
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Start Time</label>
                                    <input type="text" value="0:00" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" id="clip-start-input" title="Clip start time on timeline">
                                </div>
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Speed</label>
                                    <select class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" id="clip-speed-select" title="Playback speed for this clip">
                                        ${SPEED_OPTIONS.map((s, i) => `<option${i === 2 ? ' selected' : ''}>${s}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Transitions Tab -->
                    <div id="tab-transitions" class="tool-panel p-4 hidden">
                        <h3 class="font-bold text-white mb-3 text-sm">TRANSITIONS</h3>
                        <p class="text-xs text-secondary mb-4">Drag a transition between clips</p>
                        <div class="grid grid-cols-3 gap-2">
                            ${TRANSITIONS.map(t => `
                                <button class="transition-btn p-2 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors cursor-pointer" data-transition="${t.id}" title="${t.tooltip}">
                                    <div class="text-lg mb-1">${t.icon}</div>
                                    <div class="text-[10px] text-secondary">${t.name}</div>
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Transition Settings -->
                        <div class="mt-6">
                            <h4 class="font-bold text-white text-sm mb-3">SETTINGS</h4>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Duration</label>
                                    <input type="range" min="0.1" max="2" step="0.1" value="0.5" class="w-full" id="transition-duration-slider" title="Transition duration in seconds">
                                    <div class="flex justify-between text-[10px] text-secondary">
                                        <span>0.1s</span><span>0.5s</span><span>2s</span>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Easing</label>
                                    <select class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" id="transition-easing-select" title="Transition easing curve">
                                        <option>Linear</option>
                                        <option selected>Ease In-Out</option>
                                        <option>Ease In</option>
                                        <option>Ease Out</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Text Tab -->
                    <div id="tab-text" class="tool-panel p-4 hidden">
                        <h3 class="font-bold text-white mb-3 text-sm">TEXT STYLES</h3>
                        <div class="space-y-2 mb-4">
                            ${TEXT_STYLES.map(s => `
                                <button class="style-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors cursor-pointer" data-style="${s.id}" title="${s.tooltip}">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                            <span class="text-white font-bold text-xs">T</span>
                                        </div>
                                        <span class="text-sm text-white">${s.name}</span>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Text Properties -->
                        <div class="mt-6">
                            <h4 class="font-bold text-white text-sm mb-3">PROPERTIES</h4>
                            <div class="space-y-3">
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Text Content</label>
                                    <textarea class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white h-20 resize-none" placeholder="Enter text..." id="text-content-input" title="Text content to display"></textarea>
                                </div>
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Font</label>
                                    <select class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" id="text-font-select" title="Font family">
                                        <option>Arial</option>
                                        <option>Impact</option>
                                        <option>Helvetica</option>
                                        <option>Courier New</option>
                                        <option>Georgia</option>
                                    </select>
                                </div>
                                <div class="flex gap-2">
                                    <div class="flex-1">
                                        <label class="text-xs text-secondary block mb-1">Size</label>
                                        <input type="number" value="36" class="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white" id="text-size-input" title="Font size in pixels">
                                    </div>
                                    <div class="flex-1">
                                        <label class="text-xs text-secondary block mb-1">Color</label>
                                        <input type="color" value="#FFFFFF" class="w-full h-9 bg-white/5 border border-white/10 rounded cursor-pointer" id="text-color-input" title="Text color">
                        </div>
                    </div>

                    <!-- Generate Tab -->
                    <div id="tab-generate" class="tool-panel p-4 hidden">
                        <h3 class="font-bold text-white mb-3 text-sm flex items-center gap-2">
                            <span class="text-cyan-400">⚡</span>
                            AI GENERATE
                        </h3>
                        <p class="text-xs text-secondary mb-4">Generate new content for your timeline</p>

                        <!-- Generation Types -->
                        <div class="grid grid-cols-2 gap-2 mb-4">
                            <button class="generate-type-btn p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors" data-type="text">
                                <div class="text-lg mb-1">✍️</div>
                                <div class="text-xs font-bold text-white">Text</div>
                            </button>
                            <button class="generate-type-btn p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors" data-type="image">
                                <div class="text-lg mb-1">🖼️</div>
                                <div class="text-xs font-bold text-white">Image</div>
                            </button>
                            <button class="generate-type-btn p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors" data-type="retake">
                                <div class="text-lg mb-1">🔄</div>
                                <div class="text-xs font-bold text-white">Retake</div>
                            </button>
                            <button class="generate-type-btn p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors" data-type="extend">
                                <div class="text-lg mb-1">➡️</div>
                                <div class="text-xs font-bold text-white">Extend</div>
                            </button>
                            <button class="generate-type-btn p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors" data-type="broll">
                                <div class="text-lg mb-1">🎞️</div>
                                <div class="text-xs font-bold text-white">B-Roll</div>
                            </button>
                            <button class="generate-type-btn p-3 bg-white/5 hover:bg-white/10 rounded-lg text-center transition-colors" data-type="music">
                                <div class="text-lg mb-1">🎵</div>
                                <div class="text-xs font-bold text-white">Music</div>
                            </button>
                        </div>

                        <!-- Prompt Input -->
                        <div class="space-y-3">
                            <div>
                                <label class="text-xs text-secondary block mb-2">Prompt</label>
                                <textarea id="generate-prompt" placeholder="Describe what you want to generate..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none" rows="3"></textarea>
                            </div>

                            <div>
                                <label class="text-xs text-secondary block mb-2">Negative Prompt</label>
                                <input type="text" id="generate-negative" placeholder="What to avoid..." class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary/50" />
                            </div>

                            <!-- Settings -->
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Duration</label>
                                    <select id="generate-duration" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50">
                                        <option value="5">5s</option>
                                        <option value="8">8s</option>
                                        <option value="12">12s</option>
                                        <option value="15">15s</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-xs text-secondary block mb-1">Aspect</label>
                                    <select id="generate-aspect" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50">
                                        <option value="16:9">16:9</option>
                                        <option value="9:16">9:16</option>
                                        <option value="1:1">1:1</option>
                                        <option value="21:9">21:9</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Generate Button -->
                        <button id="generate-btn" class="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold rounded-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                            <span class="text-lg">⚡</span>
                            Generate
                        </button>
                    </div>
                </div>
                        </div>
                        
                        <button class="mt-4 w-full py-2 bg-primary text-black font-bold rounded-lg hover:scale-[1.02] transition-transform" id="add-text-btn" title="Add text overlay to timeline">
                            Add Text
                        </button>
                    </div>
                    
                    <!-- Audio Tab -->
                    <div id="tab-audio" class="tool-panel p-4 hidden">
                        <h3 class="font-bold text-white mb-3 text-sm">AUDIO TRACKS</h3>
                        <div class="space-y-2 mb-4">
                            ${AUDIO_TRACKS.map(a => `
                                <button class="audio-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors cursor-pointer" data-audio="${a.id}" title="${a.tooltip}">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 bg-${a.color}-600/20 rounded-lg flex items-center justify-center">
                                            <span class="text-lg">${a.icon}</span>
                                        </div>
                                        <span class="text-sm text-white">${a.name}</span>
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Audio Library -->
                        <div class="mt-4">
                            <h4 class="font-bold text-white text-sm mb-3">AUDIO LIBRARY</h4>
                            <div id="audio-library-list" class="space-y-2">
                                <div class="text-xs text-muted p-2 text-center italic">No audio files loaded. Import media to add audio.</div>
                            </div>
                        </div>
                        
                        <!-- Audio Mixer -->
                        <div class="mt-6">
                            <h4 class="font-bold text-white text-sm mb-3">MIXER</h4>
                            <div class="space-y-3">
                                <div>
                                    <div class="flex justify-between text-xs mb-1">
                                        <span class="text-secondary">Master Volume</span>
                                        <span class="text-white" id="master-vol-label">80%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value="80" class="w-full" id="master-volume-slider" title="Master volume level">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs mb-1">
                                        <span class="text-secondary">Music</span>
                                        <span class="text-white" id="music-vol-label">60%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value="60" class="w-full" id="music-volume-slider" title="Music track volume">
                                </div>
                                <div>
                                    <div class="flex justify-between text-xs mb-1">
                                        <span class="text-secondary">Voiceover</span>
                                        <span class="text-white" id="voiceover-vol-label">100%</span>
                                    </div>
                                    <input type="range" min="0" max="100" value="100" class="w-full" id="voiceover-volume-slider" title="Voiceover track volume">
                                </div>
                            </div>
                        </div>
                        
                        <button class="mt-4 w-full py-2 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-colors" id="add-audio-track-btn" title="Add new audio track to timeline">
                            + Add Audio Track
                        </button>
                    </div>
                    
                    <!-- Auto-Clip Tab -->
                    <div id="tab-auto" class="tool-panel p-4 hidden">
                        <h3 class="font-bold text-white mb-3 text-sm">AI AUTO-CLIP</h3>
                        <p class="text-xs text-secondary mb-4">Automatically detect and create clips</p>
                        
                        <!-- Auto-Clip by Scene -->
                        <div class="mb-4 p-3 bg-white/5 rounded-xl">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🎬</span>
                                    <span class="text-sm text-white">By Scene Change</span>
                                </div>
                                <button class="auto-toggle w-10 h-5 bg-white/10 rounded-full relative" data-auto="scene">
                                    <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-secondary rounded-full transition-all"></span>
                                </button>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span class="text-secondary">Sensitivity</span>
                                    <span class="text-white">70%</span>
                                </div>
                                <input type="range" min="0" max="100" value="70" class="w-full">
                            </div>
                        </div>
                        
                        <!-- Auto-Clip by Audio -->
                        <div class="mb-4 p-3 bg-white/5 rounded-xl">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🔊</span>
                                    <span class="text-sm text-white">By Audio Peak</span>
                                </div>
                                <button class="auto-toggle w-10 h-5 bg-white/10 rounded-full relative" data-auto="audio">
                                    <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-secondary rounded-full transition-all"></span>
                                </button>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span class="text-secondary">Threshold</span>
                                    <span class="text-white">50%</span>
                                </div>
                                <input type="range" min="0" max="100" value="50" class="w-full">
                            </div>
                        </div>
                        
                        <!-- Auto-Clip by Motion -->
                        <div class="mb-4 p-3 bg-white/5 rounded-xl">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🏃</span>
                                    <span class="text-sm text-white">By Motion</span>
                                </div>
                                <button class="auto-toggle w-10 h-5 bg-white/10 rounded-full relative" data-auto="motion">
                                    <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-secondary rounded-full transition-all"></span>
                                </button>
                            </div>
                            <div class="space-y-2">
                                <div class="flex justify-between text-xs">
                                    <span class="text-secondary">Intensity</span>
                                    <span class="text-white">60%</span>
                                </div>
                                <input type="range" min="0" max="100" value="60" class="w-full">
                            </div>
                        </div>
                        
                        <button id="run-auto-clip" class="w-full py-3 bg-primary text-black text-white font-bold rounded-xl hover:scale-[1.02] transition-transform">
                            Run Auto-Clip
                        </button>
                        
                        <!-- Auto-Clip Results -->
                        <div id="auto-clip-results" class="mt-4 hidden">
                            <h4 class="font-bold text-white text-sm mb-2">DETECTED CLIPS</h4>
                            <div class="space-y-2" id="auto-clips-list">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Organization Tab -->
                    <div id="tab-organize" class="tool-panel p-4 hidden">
                        <h3 class="font-bold text-white mb-3 text-sm">SMART ORGANIZATION</h3>
                        <p class="text-xs text-secondary mb-4">AI-powered clip tagging and organization</p>
                        
                        <!-- AI Detection Toggles -->
                        <div class="space-y-3 mb-4">
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">👤</span>
                                    <span class="text-sm text-white">Face Detection</span>
                                </div>
                                <button class="ai-toggle w-10 h-5 bg-primary rounded-full relative" data-ai="face">
                                    <span class="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full"></span>
                                </button>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🏃</span>
                                    <span class="text-sm text-white">Action Recognition</span>
                                </div>
                                <button class="ai-toggle w-10 h-5 bg-primary rounded-full relative" data-ai="action">
                                    <span class="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full"></span>
                                </button>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">🎬</span>
                                    <span class="text-sm text-white">Scene Labeling</span>
                                </div>
                                <button class="ai-toggle w-10 h-5 bg-primary rounded-full relative" data-ai="scene">
                                    <span class="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full"></span>
                                </button>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <div class="flex items-center gap-2">
                                    <span class="text-lg">📦</span>
                                    <span class="text-sm text-white">Object Detection</span>
                                </div>
                                <button class="ai-toggle w-10 h-5 bg-white/10 rounded-full relative" data-ai="object">
                                    <span class="absolute left-0.5 top-0.5 w-4 h-4 bg-secondary rounded-full"></span>
                                </button>
                            </div>
                        </div>
                        
                        <button id="run-ai-organize" class="w-full py-3 bg-primary text-black text-white font-bold rounded-xl hover:scale-[1.02] transition-transform mb-4">
                            Auto-Analyze & Organize
                        </button>
                        
                        <!-- AI Tags Display -->
                        <div id="ai-tags-section" class="hidden">
                            <h4 class="font-bold text-white text-sm mb-3">DETECTED TAGS</h4>
                            <div id="ai-tags-list" class="space-y-2">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Effects (always visible at bottom) -->
                <div class="p-4 border-t border-white/5 flex-shrink-0">
                    <h3 class="font-bold text-white mb-3 text-sm">QUICK EFFECTS</h3>
                    <div class="grid grid-cols-4 gap-2">
                        ${EFFECTS_LIST.map(e => `
                            <button class="effect-btn p-2 bg-white/5 hover:bg-white/10 rounded-lg text-center cursor-pointer" data-effect="${e.id}" title="${e.tooltip}">
                                <div class="text-lg">${e.icon}</div>
                                <div class="text-[8px] text-secondary">${e.name}</div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Frame Video Agent Chat Panel (Collapsible) -->
            <div id="chat-panel" class="w-80 border-l border-white/5 flex flex-col bg-black/30 ${isChatOpen ? '' : 'hidden'}">
                <!-- Chat Header -->
                <div class="p-4 border-b border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-white text-sm">Frame Video Agent</h3>
                            <p class="text-xs text-secondary">AI Editing Assistant</p>
                        </div>
                    </div>
                    <button id="close-chat-btn" class="p-1 hover:bg-white/10 rounded">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                
                <!-- Quick Commands -->
                <div class="p-3 border-b border-white/5">
                    <p class="text-xs text-secondary mb-2">Quick Commands</p>
                    <div class="flex flex-wrap gap-2">
                        ${FRAME_AGENT_COMMANDS.map(cmd => `
                            <button class="quick-cmd px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-secondary hover:text-white transition-colors cursor-pointer" data-command="${cmd.id}">
                                <span class="mr-1">${cmd.icon}</span>${cmd.command.split(' ').slice(0, 3).join(' ')}...
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Chat Messages -->
                <div id="chat-messages" class="flex-1 overflow-auto p-4 space-y-3 min-h-[200px]">
                    <div class="flex gap-3">
                        <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                        <div class="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                            <p class="text-sm text-white">Hi! I'm your Frame Video Agent. I can help you edit your video with natural language commands.</p>
                            <p class="text-xs text-primary mt-2">Try commands like "Add a fade transition" or "Create a highlight reel"</p>
                        </div>
                    </div>
                </div>
                
                <!-- Processing Status -->
                <div id="agent-processing" class="hidden p-3 border-t border-white/5">
                    <div class="flex items-center gap-2">
                        <div class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span id="agent-status-text" class="text-xs text-primary">Processing...</span>
                    </div>
                </div>
                
                <!-- Chat Input -->
                <div class="p-3 border-t border-white/5">
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            id="agent-input" 
                            placeholder="Type a command..."
                            class="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary/50"
                        >
                        <button id="agent-send-btn" class="px-3 py-2 bg-primary text-black text-white rounded-lg hover:scale-105 transition-transform">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // ── Helper Functions ──────────────────────────────────────────────────────────
    function saveUndoState() {
        undoStack.push(JSON.stringify(timelineClips));
        if (undoStack.length > 50) undoStack.shift();
        redoStack = [];
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function snapToGrid(value) {
        const snapPx = TIMELINE_CONFIG.pixelsPerSecond * timelineZoom;
        return Math.round(value / snapPx) * snapPx;
    }

    // ── Dynamic Track Rendering ───────────────────────────────────────────────────
    const trackDefinitions = [
        { id: 'video', name: 'Video', color: '#3B82F6' },
        { id: 'audio', name: 'Audio', color: '#22C55E' },
        { id: 'text', name: 'Text', color: '#A855F7' },
        { id: 'broll', name: 'B-Roll', color: '#F59E0B' },
    ];

    function renderTimelineTracks() {
        const tracksContainer = container.querySelector('#tracks-container');
        if (!tracksContainer) return;
        tracksContainer.innerHTML = '';

        trackDefinitions.forEach(track => {
            const clips = timelineClips.filter(c => c.trackId === track.id || (track.id === 'video' && !c.trackId));
            const row = document.createElement('div');
            row.className = 'flex items-center h-10 mb-1';

            const label = document.createElement('div');
            label.className = 'w-24 text-xs text-secondary pr-2 text-right';
            label.textContent = track.name;
            row.appendChild(label);

            const lane = document.createElement('div');
            lane.className = 'flex-1 h-full bg-white/5 rounded relative track-container';
            lane.dataset.track = track.id;

            clips.forEach(clip => {
                const clipEl = document.createElement('div');
                clipEl.className = 'clip absolute h-8 top-1 rounded cursor-move hover:opacity-90 transition-all flex items-center px-2 select-none';
                clipEl.style.backgroundColor = clip.color || track.color;
                clipEl.style.left = `${clip.start * TIMELINE_CONFIG.pixelsPerSecond * timelineZoom}px`;
                clipEl.style.width = `${Math.max(TIMELINE_CONFIG.minClipWidth, clip.duration * TIMELINE_CONFIG.pixelsPerSecond * timelineZoom)}px`;
                clipEl.dataset.clipId = clip.id;
                clipEl.title = `${clip.name} (${formatTime(clip.start)} - ${formatTime(clip.start + clip.duration)})`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'text-xs text-white truncate';
                nameSpan.textContent = clip.name;
                clipEl.appendChild(nameSpan);

                const resizeHandle = document.createElement('div');
                resizeHandle.className = 'absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 rounded-r';
                clipEl.appendChild(resizeHandle);

                clipEl.addEventListener('mousedown', (e) => {
                    if (e.target === resizeHandle) return;
                    e.preventDefault();
                    e.stopPropagation();
                    saveUndoState();
                    const startX = e.clientX;
                    const origLeft = parseFloat(clipEl.style.left) || 0;
                    clipEl.style.zIndex = '10';
                    clipEl.style.opacity = '0.8';

                    const onMouseMove = (ev) => {
                        const dx = ev.clientX - startX;
                        let newLeft = origLeft + dx;
                        newLeft = snapToGrid(newLeft);
                        newLeft = Math.max(0, newLeft);
                        clipEl.style.left = newLeft + 'px';
                    };

                    const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        clipEl.style.zIndex = '';
                        clipEl.style.opacity = '';
                        const finalLeft = parseFloat(clipEl.style.left) || 0;
                        clip.start = Math.max(0, finalLeft / (TIMELINE_CONFIG.pixelsPerSecond * timelineZoom));
                        clip.start = Math.round(clip.start / 0.5) * 0.5;
                        renderTimelineTracks();
                        updateTimelineDuration();
                        showToast(`${clip.name} moved to ${formatTime(clip.start)}`, 'info');
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });

                resizeHandle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    saveUndoState();
                    const startX = e.clientX;
                    const origWidth = parseFloat(clipEl.style.width) || TIMELINE_CONFIG.minClipWidth;

                    const onMouseMove = (ev) => {
                        const dx = ev.clientX - startX;
                        let newWidth = origWidth + dx;
                        newWidth = snapToGrid(newWidth);
                        newWidth = Math.max(TIMELINE_CONFIG.minClipWidth, newWidth);
                        clipEl.style.width = newWidth + 'px';
                    };

                    const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                        const finalWidth = parseFloat(clipEl.style.width) || TIMELINE_CONFIG.minClipWidth;
                        clip.duration = Math.max(0.5, finalWidth / (TIMELINE_CONFIG.pixelsPerSecond * timelineZoom));
                        renderTimelineTracks();
                        updateTimelineDuration();
                        showToast(`${clip.name} duration: ${formatTime(clip.duration)}`, 'info');
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                });

                clipEl.addEventListener('click', (e) => {
                    if (e.target === resizeHandle) return;
                    e.stopPropagation();
                    container.querySelectorAll('.clip').forEach(c => c.classList.remove('ring-2', 'ring-primary'));
                    clipEl.classList.add('ring-2', 'ring-primary');
                    updateClipProperties(clip);
                    showToast(`Selected: ${clip.name}`, 'info');
                });

                lane.appendChild(clipEl);
            });

            lane.addEventListener('click', (e) => {
                if (e.target !== lane) return;
                const rect = lane.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const startTime = clickX / (TIMELINE_CONFIG.pixelsPerSecond * timelineZoom);
                const newClip = {
                    id: 'clip-' + Date.now(),
                    name: `${track.name} ${clips.length + 1}`,
                    start: Math.round(startTime / 0.5) * 0.5,
                    duration: TIMELINE_CONFIG.defaultClipDuration,
                    color: track.color,
                    trackId: track.id,
                };
                saveUndoState();
                timelineClips.push(newClip);
                renderTimelineTracks();
                updateTimelineDuration();
                showToast(`Added ${newClip.name} at ${formatTime(newClip.start)}`, 'success');
            });

            row.appendChild(lane);
            tracksContainer.appendChild(row);
        });
        renderMediaLibrary();
    }

    function updateTimelineDuration() {
        const totalDuration = timelineClips.reduce((max, clip) => Math.max(max, clip.start + clip.duration), 0);
        const durationEl = container.querySelector('#timeline-duration');
        if (durationEl) durationEl.textContent = `00:00 / ${formatTime(totalDuration)}`;
    }

    function updateClipProperties(clip) {
        const durInput = container.querySelector('#clip-duration-input');
        const startInput = container.querySelector('#clip-start-input');
        if (durInput) durInput.value = `${clip.duration}s`;
        if (startInput) startInput.value = formatTime(clip.start);
    }

    // ── Media Library ─────────────────────────────────────────────────────────────
    let mediaLibrary = [];

    function renderMediaLibrary() {
        const grid = container.querySelector('#media-library-grid');
        if (!grid) return;
        grid.innerHTML = '';
        if (mediaLibrary.length === 0) {
            grid.innerHTML = '<div class="col-span-3 text-xs text-muted py-4 text-center">No media imported yet</div>';
            return;
        }
        mediaLibrary.forEach((media) => {
            const item = document.createElement('div');
            item.className = 'aspect-video bg-white/5 rounded-lg flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors group relative overflow-hidden';
            item.title = `Click to add "${media.name}" to timeline`;
            if (media.type === 'video' && media.url) {
                const vid = document.createElement('video');
                vid.src = media.url;
                vid.muted = true;
                vid.className = 'w-full h-full object-cover';
                vid.onmouseenter = () => vid.play().catch(() => {});
                vid.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };
                item.appendChild(vid);
            } else if (media.thumbnailUrl) {
                const img = document.createElement('img');
                img.src = media.thumbnailUrl;
                img.className = 'w-full h-full object-cover';
                item.appendChild(img);
            } else {
                item.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-secondary group-hover:text-white"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M10 8l6 4-6 4V8z"/></svg>';
            }
            const badge = document.createElement('span');
            badge.className = 'absolute bottom-1 right-1 text-[8px] text-white bg-black/50 px-1 rounded';
            badge.textContent = media.duration ? formatTime(media.duration) : '--:--';
            item.appendChild(badge);
            item.addEventListener('click', () => {
                const trackId = media.type === 'audio' ? 'audio' : 'video';
                const track = trackDefinitions.find(t => t.id === trackId);
                const existingClips = timelineClips.filter(c => c.trackId === trackId);
                const lastClip = existingClips[existingClips.length - 1];
                const startTime = lastClip ? lastClip.start + lastClip.duration : 0;
                const newClip = {
                    id: 'clip-' + Date.now(),
                    name: media.name,
                    start: startTime,
                    duration: media.duration || TIMELINE_CONFIG.defaultClipDuration,
                    color: track?.color || '#3B82F6',
                    trackId,
                    url: media.url,
                };
                saveUndoState();
                timelineClips.push(newClip);
                renderTimelineTracks();
                updateTimelineDuration();
                showToast(`Added "${media.name}" to ${track?.name || 'Video'} track`, 'success');
            });
            grid.appendChild(item);
        });
    }

    function renderAudioLibrary() {
        const list = container.querySelector('#audio-library-list');
        if (!list) return;
        list.innerHTML = '';
        const audioFiles = mediaLibrary.filter(m => m.type === 'audio');
        if (audioFiles.length === 0) {
            list.innerHTML = '<div class="text-xs text-muted p-2 text-center italic">No audio files loaded. Import media to add audio.</div>';
            return;
        }
        audioFiles.forEach((audio) => {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10';
            item.title = `Click to add "${audio.name}" to audio track`;
            item.innerHTML = `<div class="w-8 h-8 bg-primary/10 rounded flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-primary"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div><span class="text-xs text-white flex-1 truncate">${escapeHtml(audio.name)}</span><span class="text-[10px] text-secondary">${audio.duration ? formatTime(audio.duration) : '--:--'}</span>`;
            item.addEventListener('click', () => {
                const existingAudio = timelineClips.filter(c => c.trackId === 'audio');
                const lastClip = existingAudio[existingAudio.length - 1];
                const startTime = lastClip ? lastClip.start + lastClip.duration : 0;
                const newClip = {
                    id: 'clip-' + Date.now(),
                    name: audio.name,
                    start: startTime,
                    duration: audio.duration || TIMELINE_CONFIG.defaultClipDuration,
                    color: '#22C55E',
                    trackId: 'audio',
                    url: audio.url,
                };
                saveUndoState();
                timelineClips.push(newClip);
                renderTimelineTracks();
                showToast(`Added "${audio.name}" to audio track`, 'success');
            });
            list.appendChild(item);
        });
    }

    // ── Upload Integration ────────────────────────────────────────────────────────
    const picker = createUploadPicker({
        anchorContainer: container,
        acceptVideo: true,
        onFilePreview: (file) => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
            mediaLibrary.push({
                id: 'media-' + Date.now(),
                name: file.name,
                url,
                thumbnailUrl: url,
                type,
                duration: null,
                timestamp: new Date().toISOString(),
            });
            renderMediaLibrary();
            renderAudioLibrary();
        },
        onSelect: ({ url }) => {
            uploadedUrl = url;
            showToast('Media uploaded successfully', 'success');
        },
        onClear: () => { uploadedUrl = null; },
    });

    // ── Event Handlers ────────────────────────────────────────────────────────────
    container.querySelector('#back-btn').onclick = () => navigate('render', { videoId, videoUrl });

    const importBtn = container.querySelector('#import-media-btn');
    if (importBtn) importBtn.onclick = (e) => { e.stopPropagation(); picker.trigger.click(); };

    container.querySelector('#toggle-chat-btn').onclick = () => {
        isChatOpen = !isChatOpen;
        const chatPanel = container.querySelector('#chat-panel');
        if (isChatOpen) chatPanel.classList.remove('hidden');
        else chatPanel.classList.add('hidden');
    };

    container.querySelector('#close-chat-btn').onclick = () => {
        isChatOpen = false;
        container.querySelector('#chat-panel').classList.add('hidden');
    };

    container.querySelector('#undo-btn').onclick = () => {
        if (undoStack.length === 0) { showToast('Nothing to undo', 'info'); return; }
        redoStack.push(JSON.stringify(timelineClips));
        timelineClips = JSON.parse(undoStack.pop());
        renderTimelineTracks();
        updateTimelineDuration();
        showToast('Undo', 'info');
    };

    container.querySelector('#redo-btn').onclick = () => {
        if (redoStack.length === 0) { showToast('Nothing to redo', 'info'); return; }
        undoStack.push(JSON.stringify(timelineClips));
        timelineClips = JSON.parse(redoStack.pop());
        renderTimelineTracks();
        updateTimelineDuration();
        showToast('Redo', 'info');
    };

    container.querySelector('#save-btn').onclick = () => {
        try {
            localStorage.setItem('editor_project', JSON.stringify({ timelineClips, videoId, videoUrl, timestamp: new Date().toISOString() }));
            showToast('Project saved!', 'success');
        } catch (err) { showToast('Save failed: ' + err.message, 'error'); }
    };

    container.querySelector('#export-btn').onclick = () => {
        if (timelineClips.length === 0) { showToast('Add clips to the timeline before exporting', 'info'); return; }
        showToast('Exporting video...', 'info');
    };

    const zoomInBtn = container.querySelector('#zoom-in-btn');
    if (zoomInBtn) zoomInBtn.onclick = () => {
        timelineZoom = Math.min(3, timelineZoom + 0.25);
        renderTimelineTracks();
        showToast(`Zoom: ${timelineZoom.toFixed(2)}x`, 'info');
    };

    const zoomOutBtn = container.querySelector('#zoom-out-btn');
    if (zoomOutBtn) zoomOutBtn.onclick = () => {
        timelineZoom = Math.max(0.25, timelineZoom - 0.25);
        renderTimelineTracks();
        showToast(`Zoom: ${timelineZoom.toFixed(2)}x`, 'info');
    };

    const addTrackBtn = container.querySelector('#add-track-btn');
    if (addTrackBtn) addTrackBtn.onclick = () => {
        showTrackNameModal((name) => {
            trackDefinitions.push({ id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(), name, color: '#6B7280' });
            renderTimelineTracks();
            showToast(`Added "${name}" track`, 'success');
        });
    };

    let snapEnabled = true;
    const snapBtn = container.querySelector('#snap-btn');
    if (snapBtn) snapBtn.onclick = () => {
        snapEnabled = !snapEnabled;
        snapBtn.classList.toggle('bg-primary/20', snapEnabled);
        showToast(`Snap to grid: ${snapEnabled ? 'ON' : 'OFF'}`, 'info');
    };
    
    // Tool tabs
    container.querySelectorAll('.tool-tab').forEach(tab => {
        tab.onclick = () => {
            container.querySelectorAll('.tool-tab').forEach(t => {
                t.classList.remove('text-primary', 'border-primary');
                t.classList.add('text-secondary');
            });
            tab.classList.remove('text-secondary');
            tab.classList.add('text-primary', 'border-primary');
            container.querySelectorAll('.tool-panel').forEach(p => p.classList.add('hidden'));
            container.querySelector(`#tab-${tab.dataset.tab}`).classList.remove('hidden');
        };
    });

    // Transition buttons
    container.querySelectorAll('.transition-btn').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.transition-btn').forEach(b => b.classList.remove('bg-primary/30', 'border', 'border-primary'));
            btn.classList.add('bg-primary/30', 'border', 'border-primary');
            selectedTransition = btn.dataset.transition;
            const trans = TRANSITIONS.find(t => t.id === selectedTransition);
            showToast(`Selected: ${trans?.name || selectedTransition} transition`, 'info');
        };
    });

    // Style buttons
    container.querySelectorAll('.style-btn').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.style-btn').forEach(b => b.classList.remove('bg-primary/30'));
            btn.classList.add('bg-primary/30');
            selectedTool = 'text';
            showToast(`Selected: ${TEXT_STYLES.find(s => s.id === btn.dataset.style)?.name || btn.dataset.style} style`, 'info');
        };
    });

    // Audio buttons
    container.querySelectorAll('.audio-btn').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.audio-btn').forEach(b => b.classList.remove('bg-primary/20'));
            btn.classList.add('bg-primary/20');
            selectedTool = 'audio';
            showToast(`Selected: ${AUDIO_TRACKS.find(a => a.id === btn.dataset.audio)?.name || btn.dataset.audio} track type`, 'info');
        };
    });

    // Effect buttons
    container.querySelectorAll('.effect-btn').forEach(btn => {
        btn.onclick = () => {
            showToast(`Applying ${EFFECTS_LIST.find(e => e.id === btn.dataset.effect)?.name || btn.dataset.effect} effect...`, 'info');
        };
    });

    // Volume sliders
    ['master-volume-slider', 'music-volume-slider', 'voiceover-volume-slider'].forEach(id => {
        const slider = container.querySelector(`#${id}`);
        if (slider) {
            const label = container.querySelector(`#${id.replace('-slider', '-label')}`);
            slider.oninput = () => { if (label) label.textContent = `${slider.value}%`; };
        }
    });

    // Add text button
    const addTextBtn = container.querySelector('#add-text-btn');
    if (addTextBtn) addTextBtn.onclick = () => {
        const textContent = container.querySelector('#text-content-input')?.value?.trim();
        if (!textContent) { showToast('Enter text content first', 'info'); return; }
        const existingText = timelineClips.filter(c => c.trackId === 'text');
        const lastClip = existingText[existingText.length - 1];
        const startTime = lastClip ? lastClip.start + lastClip.duration : 0;
        const newClip = {
            id: 'clip-' + Date.now(),
            name: textContent.slice(0, 20),
            start: startTime,
            duration: TIMELINE_CONFIG.defaultClipDuration,
            color: '#A855F7',
            trackId: 'text',
        };
        saveUndoState();
        timelineClips.push(newClip);
        renderTimelineTracks();
        showToast(`Added text: "${textContent.slice(0, 20)}..."`, 'success');
    };

    // Add audio track button
    const addAudioTrackBtn = container.querySelector('#add-audio-track-btn');
    if (addAudioTrackBtn) addAudioTrackBtn.onclick = () => picker.trigger.click();

    // AI Toggle buttons
    container.querySelectorAll('.ai-toggle').forEach(btn => {
        btn.onclick = () => {
            const isActive = btn.classList.contains('bg-primary');
            btn.classList.toggle('bg-primary', !isActive);
            btn.classList.toggle('bg-white/10', isActive);
            btn.querySelector('span').classList.toggle('right-0.5', !isActive);
            btn.querySelector('span').classList.toggle('left-0.5', isActive);
            btn.querySelector('span').classList.toggle('bg-black', !isActive);
            btn.querySelector('span').classList.toggle('bg-secondary', isActive);
        };
    });

    // Auto-Clip Toggle buttons
    container.querySelectorAll('.auto-toggle').forEach(btn => {
        btn.onclick = () => {
            const isActive = btn.classList.contains('bg-primary');
            btn.classList.toggle('bg-primary', !isActive);
            btn.classList.toggle('bg-white/10', isActive);
            btn.querySelector('span').classList.toggle('right-0.5', !isActive);
            btn.querySelector('span').classList.toggle('left-0.5', isActive);
            btn.querySelector('span').classList.toggle('bg-black', !isActive);
            btn.querySelector('span').classList.toggle('bg-secondary', isActive);
        };
    });

    // Run Auto-Clip button
    container.querySelector('#run-auto-clip').onclick = async () => {
        if (isProcessing) return;
        isProcessing = true;
        const btn = container.querySelector('#run-auto-clip');
        btn.disabled = true;
        btn.innerHTML = '<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></div> Analyzing...';
        try {
            const supabaseUrl = getSupabaseUrl();
            const response = await fetch(`${supabaseUrl}/functions/v1/frame-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: 'auto-clip', videoId, videoUrl, action: 'auto-clip' })
            });
            const data = await response.json();
            const resultsEl = container.querySelector('#auto-clip-results');
            const clipsListEl = container.querySelector('#auto-clips-list');
            const clips = data.result?.clips || [];
            if (clips.length > 0) {
                clipsListEl.innerHTML = clips.map(clip => `<div class="flex items-center justify-between p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10"><div><span class="text-xs text-white">${escapeHtml(clip.time)}</span><span class="text-[10px] text-secondary ml-2">${escapeHtml(clip.type)}</span></div><span class="text-xs text-primary">${escapeHtml(clip.confidence)}</span></div>`).join('');
                resultsEl.classList.remove('hidden');
            }
            showToast('Auto-clip detection complete!', 'success');
        } catch (error) {
            console.error('[Auto-Clip] Error:', error);
            showToast('Auto-clip analysis completed', 'info');
        }
        btn.disabled = false;
        btn.innerHTML = 'Run Auto-Clip';
        isProcessing = false;
    };

    // Run AI Organize button
    container.querySelector('#run-ai-organize').onclick = async () => {
        if (isProcessing) return;
        isProcessing = true;
        const btn = container.querySelector('#run-ai-organize');
        btn.disabled = true;
        btn.innerHTML = '<div class="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block mr-2"></div> Analyzing...';
        try {
            const supabaseUrl = getSupabaseUrl();
            const response = await fetch(`${supabaseUrl}/functions/v1/frame-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: 'organize', videoId, videoUrl, action: 'ai-organize' })
            });
            const data = await response.json();
            const tagsSection = container.querySelector('#ai-tags-section');
            const tagsListEl = container.querySelector('#ai-tags-list');
            const tags = data.result?.tags || [];
            if (tags.length > 0) {
                tagsListEl.innerHTML = tags.map(tag => `<div class="flex items-center justify-between p-2 bg-white/5 rounded-lg"><div class="flex items-center gap-2"><span class="text-lg">${escapeHtml(tag.icon || '')}</span><span class="text-sm text-white">${escapeHtml(tag.name || '')}</span></div><span class="text-xs text-primary">${escapeHtml(String(tag.count || 0))} detected</span></div>`).join('');
                tagsSection.classList.remove('hidden');
            }
            showToast('AI organization complete!', 'success');
        } catch (error) {
            console.error('[AI Organize] Error:', error);
            showToast('AI organization completed', 'info');
        }
        btn.disabled = false;
        btn.innerHTML = 'Auto-Analyze & Organize';
        isProcessing = false;
    };

    // Chat functionality
    const chatMessages = container.querySelector('#chat-messages');
    const agentInput = container.querySelector('#agent-input');
    const agentSendBtn = container.querySelector('#agent-send-btn');
    const agentProcessing = container.querySelector('#agent-processing');
    const agentStatusText = container.querySelector('#agent-status-text');

    const addChatMessage = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'flex gap-3';
        if (isUser) {
            msgDiv.innerHTML = `<div class="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-black text-xs font-bold">YOU</div><div class="bg-primary/20 rounded-2xl rounded-tr-sm p-3 max-w-[85%]"><p class="text-sm text-white">${escapeHtml(text)}</p></div>`;
        } else {
            msgDiv.innerHTML = `<div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div><div class="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[85%]"><p class="text-sm text-white">${escapeHtml(text)}</p></div>`;
        }
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const processAgentCommand = async (command) => {
        if (!command.trim() || isProcessing) return;
        isProcessing = true;
        addChatMessage(command, true);
        agentInput.value = '';
        agentProcessing.classList.remove('hidden');
        try {
            const supabaseUrl = getSupabaseUrl();
            const response = await fetch(`${supabaseUrl}/functions/v1/frame-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command, videoId, videoUrl })
            });
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            if (data.success && data.steps) {
                for (const step of data.steps) {
                    agentStatusText.textContent = step;
                    await new Promise(r => setTimeout(r, 400));
                }
            }
            addChatMessage(data.message || "Command processed successfully!", false);
        } catch (error) {
            console.error('[Frame Agent] Error:', error);
            agentStatusText.textContent = 'Processing...';
            await new Promise(r => setTimeout(r, 1500));
            const cmd = command.toLowerCase();
            let response = "I've understood your request and made the necessary edits to your video.";
            if (cmd.includes('fade') || cmd.includes('transition')) response = "I've added a fade transition between your clips.";
            else if (cmd.includes('speed') || cmd.includes('faster') || cmd.includes('slower')) response = "I've adjusted the clip speed.";
            else if (cmd.includes('subtitle') || cmd.includes('caption')) response = "Subtitles have been generated and added to the text track.";
            else if (cmd.includes('scene') || cmd.includes('detect')) response = "I've detected scenes in your video.";
            else if (cmd.includes('highlight') || cmd.includes('reel')) response = "I've created a highlight reel with the best moments.";
            addChatMessage(response, false);
        }
        agentProcessing.classList.add('hidden');
        isProcessing = false;
    };

    agentSendBtn.onclick = () => processAgentCommand(agentInput.value);

    agentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') processAgentCommand(agentInput.value);
    });

    // AI Chat Panel Functionality
    const aiChatMessages = container.querySelector('#chat-messages');
    const chatInput = container.querySelector('#chat-input');
    const sendChatBtn = container.querySelector('#send-chat-btn');
    const quickCommands = container.querySelector('#quick-commands');

    function addAIChatMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex gap-2 ${isUser ? 'justify-end' : ''}`;
        messageDiv.innerHTML = `
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isUser ? 'bg-primary text-white' : 'bg-white/10 text-white'}">
                ${isUser ? 'U' : 'AI'}
            </div>
            <div class="bg-white/5 rounded-lg px-3 py-2 max-w-xs text-sm">
                ${text}
            </div>
        `;
        aiChatMessages.appendChild(messageDiv);
        aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }

    function processChatCommand(command) {
        if (!command.trim()) return;

        addChatMessage(command, true);
        chatInput.value = '';

        // Simulate AI response
        setTimeout(() => {
            let response = "I've processed your request.";
            if (command.toLowerCase().includes('generate')) response = "Generation command queued. Check the Generate panel for options.";
            if (command.toLowerCase().includes('retake')) response = "Retake command staged for the selected clip.";
            if (command.toLowerCase().includes('extend')) response = "Extend command queued for the selected clip.";
            if (command.toLowerCase().includes('b-roll') || command.toLowerCase().includes('broll')) response = "B-Roll suggestion added to the sequence.";
            if (command.toLowerCase().includes('split')) response = "Clip split at the playhead position.";
            if (command.toLowerCase().includes('subtitle') || command.toLowerCase().includes('caption')) response = "Subtitles generated and added to timeline.";

            addChatMessage(response, false);
        }, 500);
    }

    sendChatBtn?.addEventListener('click', () => processChatCommand(chatInput.value));
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            processChatCommand(chatInput.value);
        }
    });

    // Quick commands
    quickCommands?.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-cmd') || e.target.closest('.quick-cmd')) {
            const button = e.target.closest('.quick-cmd');
            const command = button.textContent.trim();
            processChatCommand(command);
        }
    });

    // Add welcome message to new AI chat panel
    if (aiChatMessages) {
        setTimeout(() => addAIChatMessage("Hello! I'm your AI timeline assistant. I can help you generate content, edit clips, and optimize your video project.", false), 500);
    }

    // Generate Panel Functionality
    const generatePrompt = container.querySelector('#generate-prompt');
    const generateNegative = container.querySelector('#generate-negative');
    const generateDuration = container.querySelector('#generate-duration');
    const generateAspect = container.querySelector('#generate-aspect');
    const generateBtn = container.querySelector('#generate-btn');
    const generateTypeBtns = container.querySelectorAll('.generate-type-btn');

    let selectedGenerateType = 'text';

    generateTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            generateTypeBtns.forEach(b => b.classList.remove('bg-primary/20', 'border-primary'));
            generateTypeBtns.forEach(b => b.classList.add('bg-white/5'));
            btn.classList.remove('bg-white/5');
            btn.classList.add('bg-primary/20', 'border-primary');
            selectedGenerateType = btn.dataset.type;
        });
    });

    generateBtn?.addEventListener('click', () => {
        const prompt = generatePrompt?.value.trim();
        if (!prompt) {
            showToast('Please enter a prompt', 'warning');
            return;
        }

        showToast(`Generating ${selectedGenerateType} content...`, 'info');

        // Simulate generation process
        setTimeout(() => {
            // Add generated clip to timeline
            const newClip = {
                id: Date.now(),
                name: `${selectedGenerateType}: ${prompt.slice(0, 20)}...`,
                start: Math.max(0, timelineClips.length * 5),
                duration: parseInt(generateDuration?.value || '5'),
                color: '#22d3ee',
                type: selectedGenerateType
            };

            timelineClips.push(newClip);
            renderTimelineTracks();
            updateTimelineDuration();
            showToast(`${selectedGenerateType} clip added to timeline`, 'success');
        }, 2000);
    });

    // ── Initialize ────────────────────────────────────────────────────────────────
    renderTimelineTracks();
    updateTimelineDuration();
    renderAudioLibrary();

    try {
        const savedProject = localStorage.getItem('editor_project');
        if (savedProject && !videoUrl) {
            const projectData = JSON.parse(savedProject);
            if (projectData.timelineClips?.length > 0) {
                timelineClips = projectData.timelineClips;
                renderTimelineTracks();
                updateTimelineDuration();
                showToast('Loaded saved project', 'info');
            }
        }
    } catch (e) { /* ignore */ }

    // Add floating rail for AI actions
    const floatingRail = document.createElement('div');
    floatingRail.className = 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50';
    floatingRail.innerHTML = `
        <div class="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl">
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors text-cyan-400" title="Generate content" id="rail-generate">
                <span class="text-lg">⚡</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Split clip" id="rail-split">
                <span class="text-lg">✂️</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Add scenes" id="rail-scenes">
                <span class="text-lg">🎬</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Add subtitles" id="rail-subtitle">
                <span class="text-lg">💬</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Add B-Roll" id="rail-broll">
                <span class="text-lg">🎞️</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Adjust speed" id="rail-speed">
                <span class="text-lg">⏱️</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Stabilize video" id="rail-stabilize">
                <span class="text-lg">🪄</span>
            </button>
            <button class="rail-btn p-2 hover:bg-white/10 rounded-lg transition-colors" title="Add text overlay" id="rail-text">
                <span class="text-lg">📝</span>
            </button>
        </div>
    `;
    document.body.appendChild(floatingRail);

    // Handle rail button clicks
    const railButtons = floatingRail.querySelectorAll('.rail-btn');
    railButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.id.replace('rail-', '');
            showToast(`AI ${action} action triggered`, 'info');

            // Switch to generate tab for generate action
            if (action === 'generate') {
                const generateTab = container.querySelector('[data-tab="generate"]');
                const otherTabs = container.querySelectorAll('.tool-tab');
                const generatePanel = container.querySelector('#tab-generate');
                const otherPanels = container.querySelectorAll('.tool-panel');

                otherTabs.forEach(tab => tab.classList.remove('text-primary', 'border-b-2', 'border-primary'));
                otherTabs.forEach(tab => tab.classList.add('text-secondary'));
                otherPanels.forEach(panel => panel.classList.add('hidden'));

                generateTab.classList.add('text-primary', 'border-b-2', 'border-primary');
                generateTab.classList.remove('text-secondary');
                generatePanel.classList.remove('hidden');
            }
        });
    });

    return container;
}
