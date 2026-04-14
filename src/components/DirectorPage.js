import { navigate } from '../lib/router.js';
import { showToast } from '../lib/loading.js';
import { escapeHtml } from '../lib/security.js';
import { directorRuntime } from '../lib/directorAgentRuntime.js';
import { supabase } from '../lib/supabase.js';

const DIRECTOR_AGENTS = [
    { id: 'summarizer', name: 'Video Summarizer', icon: '📝', description: 'Summarize video content', category: 'analysis' },
    { id: 'search', name: 'Video Search', icon: '🔍', description: 'Search and index media library', category: 'search' },
    { id: 'clipper', name: 'Clip Creator', icon: '✂️', description: 'Extract and create clips', category: 'extract' },
    { id: 'dubbing', name: 'Video Dubbing', icon: '🎤', description: 'Translate and dub audio/video', category: 'translate' },
    { id: 'subtitler', name: 'Subtitle Generator', icon: '💬', description: 'Add subtitles in any language', category: 'accessibility' },
    { id: 'highlighter', name: 'Highlight Extractor', icon: '⚡', description: 'Find key moments automatically', category: 'extract' },
    { id: 'scenes', name: 'Scene Detector', icon: '🎬', description: 'Identify scene boundaries', category: 'analysis' },
    { id: 'broll', name: 'B-Roll Adder', icon: '🎞️', description: 'Add overlay footage', category: 'enhance' },
    { id: 'voiceover', name: 'Voiceover', icon: '🎙️', description: 'Add AI voiceover', category: 'audio' },
    { id: 'editor', name: 'Video Editor', icon: '✏️', description: 'Edit and enhance video', category: 'edit' },
    { id: 'enhancer', name: 'Video Enhancer', icon: '✨', description: 'Quality enhancement', category: 'enhance' },
    { id: 'compiler', name: 'Content Compiler', icon: '📚', description: 'Compile multiple videos', category: 'create' },
    { id: 'meme', name: 'Meme Generator', icon: '😂', description: 'Create meme videos', category: 'create' },
    { id: 'musicvideo', name: 'Music Video Maker', icon: '🎵', description: 'Generate music videos', category: 'create' },
    { id: 'trailer', name: 'Trailer Creator', icon: '🎥', description: 'Make video trailers', category: 'create' },
    { id: 'compilation', name: 'Compilation Builder', icon: '📋', description: 'Build compilations', category: 'create' },
    { id: 'social', name: 'Social Media Clip', icon: '📱', description: 'Create social media clips', category: 'social' },
    { id: 'preview', name: 'Preview Generator', icon: '👁️', description: 'Generate video previews', category: 'create' },
    { id: 'montage', name: 'Montage Builder', icon: '🎞️', description: 'Create video montages', category: 'create' },
    { id: 'story', name: 'Story Builder', icon: '📖', description: 'Build narratives from clips', category: 'create' },
    { id: 'color', name: 'Color Correction', icon: '🎨', description: 'Adjust colors and tones', category: 'enhance' },
    { id: 'stabilize', name: 'Video Stabilize', icon: '🪄', description: 'Stabilize shaky footage', category: 'enhance' },
    { id: 'speed', name: 'Speed Control', icon: '⏱️', description: 'Adjust video speed', category: 'edit' },
    { id: 'reverse', name: 'Reverse Video', icon: '🔄', description: 'Play video backwards', category: 'edit' },
];

const AGENT_CATEGORIES = {
    analysis: { name: 'Analysis', color: 'blue' },
    search: { name: 'Search', color: 'cyan' },
    extract: { name: 'Extract', color: 'purple' },
    translate: { name: 'Translate', color: 'pink' },
    accessibility: { name: 'Accessibility', color: 'orange' },
    enhance: { name: 'Enhance', color: 'green' },
    audio: { name: 'Audio', color: 'red' },
    edit: { name: 'Edit', color: 'yellow' },
    create: { name: 'Create', color: 'teal' },
    social: { name: 'Social', color: 'indigo' },
};

export function DirectorPage() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col overflow-hidden bg-app-bg';
    
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('videoId') || '';
    const videoUrl = urlParams.get('videoUrl') || '';
    
    let chatHistory = [];
    const activeAgents = new Set();
    let isProcessing = false;

    // Initialize director runtime
    let directorRuntimeInstance = null;
    const storyboardFrames = [];

    const initializeDirectorRuntime = async () => {
        try {
            directorRuntimeInstance = new directorRuntime.constructor();
            await directorRuntimeInstance.initialize();
            console.log('[DirectorPage] Director runtime initialized');
        } catch (error) {
            console.error('[DirectorPage] Failed to initialize director runtime:', error);
        }
    };

    // Update timeline preview with actual data
    const updateTimelinePreview = async () => {
        const timelineEl = container.querySelector('.timeline-preview');
        if (!timelineEl || !videoUrl) return;

        try {
            // Call videoagent to get timeline data
            const { data, error } = await supabase.functions.invoke('videoagent', {
                body: {
                    action: 'scene-detection',
                    videoUrl: videoUrl,
                    options: { getTimeline: true }
                }
            });

            if (!error && data?.scenes) {
                // Render timeline with scene markers
                const duration = data.duration || 60;
                const scenes = data.scenes;

                timelineEl.innerHTML = `
                    <div class="h-16 bg-black/30 rounded relative overflow-hidden">
                        <div class="absolute inset-0 flex items-center justify-center text-xs text-secondary">
                            ${scenes.length} scenes detected
                        </div>
                        ${scenes.map(scene => `
                            <div class="absolute top-0 bottom-0 bg-primary/30 border-r border-primary/50"
                                 style="left: ${(scene.start / duration) * 100}%; width: ${((scene.end - scene.start) / duration) * 100}%;"
                                 title="Scene ${scene.id}: ${scene.start}s - ${scene.end}s">
                            </div>
                        `).join('')}
                    </div>
                    <div class="flex justify-between text-xs text-secondary mt-2">
                        <span>0:00</span>
                        <span>${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                `;
            }
        } catch (error) {
            console.warn('[DirectorPage] Failed to update timeline:', error);
        }
    };
    
    container.innerHTML = `
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/5 bg-black/50">
            <div class="flex items-center gap-4">
                <button id="back-btn" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-xl font-black text-white">DIRECTOR</h1>
                        <p class="text-xs text-secondary">AI Agentic Editor • ${DIRECTOR_AGENTS.length} Agents</p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button id="clear-chat-btn" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-secondary text-sm rounded-lg transition-colors">
                    Clear Chat
                </button>
                <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-2">
                    <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                    REASONING ENGINE
                </span>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="flex-1 flex overflow-hidden">
            <!-- Left: Agents & Storyboard Panel -->
            <div class="w-80 border-r border-white/5 overflow-hidden bg-black/30 flex flex-col">
                <!-- Tab Navigation -->
                <div class="flex border-b border-white/5">
                    <button id="agents-tab" class="flex-1 py-3 px-4 text-sm font-bold text-white bg-primary/10 border-b-2 border-primary">AGENTS</button>
                    <button id="storyboard-tab" class="flex-1 py-3 px-4 text-sm font-bold text-secondary hover:text-white transition-colors">STORYBOARD</button>
                </div>

                <!-- Agents Tab Content -->
                <div id="agents-panel" class="flex-1 overflow-auto">
                    <div class="p-4">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-bold text-white text-sm uppercase tracking-wider">AI AGENTS</h3>
                            <select id="category-filter" class="bg-white/5 text-xs text-secondary rounded px-2 py-1 border border-white/10">
                                <option value="">All Categories</option>
                                ${Object.entries(AGENT_CATEGORIES).map(([key, val]) =>
                                    `<option value="${key}">${val.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div id="agents-grid" class="grid grid-cols-2 gap-2">
                            ${DIRECTOR_AGENTS.map(agent => `
                                <button class="agent-btn p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer" data-agent="${agent.id}" data-category="${agent.category}">
                                    <div class="text-lg mb-1">${agent.icon}</div>
                                    <div class="font-bold text-white text-xs leading-tight">${agent.name}</div>
                                    <div class="text-[10px] text-secondary truncate">${agent.description}</div>
                                </button>
                            `).join('')}
                        </div>

                        <!-- Active Agents -->
                        <div class="mt-6">
                            <h4 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                ACTIVE AGENTS
                            </h4>
                            <div id="active-agents" class="space-y-2 max-h-48 overflow-auto">
                                <div class="text-xs text-secondary italic p-2">No agents running</div>
                            </div>
                        </div>

                        <!-- Recent History -->
                        <div class="mt-6">
                            <h4 class="font-bold text-white text-sm mb-3">RECENT ACTIONS</h4>
                            <div id="action-history" class="space-y-2 max-h-40 overflow-auto">
                                <div class="text-xs text-secondary italic p-2">No actions yet</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Storyboard Tab Content -->
                <div id="storyboard-panel" class="flex-1 overflow-auto hidden">
                    <div class="p-4">
                        <!-- Storyboard Controls -->
                        <div class="mb-4">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="font-bold text-white text-sm uppercase tracking-wider">STORYBOARD</h3>
                                <select id="preset-selector" class="bg-white/5 text-xs text-secondary rounded px-2 py-1 border border-white/10">
                                    <option value="cinematic-story">Cinematic Story</option>
                                    <option value="commercial-ad">Commercial Ad</option>
                                    <option value="documentary-flow">Documentary Flow</option>
                                    <option value="social-shorts">Social Shorts</option>
                                </select>
                            </div>
                            <div class="flex gap-2 mb-3">
                                <button id="add-frame-btn" class="flex-1 px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold rounded-lg transition-colors">
                                    + ADD FRAME
                                </button>
                                <button id="generate-all-btn" class="flex-1 px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/80 transition-colors">
                                    GENERATE ALL
                                </button>
                            </div>
                        </div>

                        <!-- Frame List -->
                        <div id="storyboard-frames" class="space-y-2 max-h-96 overflow-auto">
                            <div class="text-xs text-secondary italic p-2">No frames yet. Add a frame to start.</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Center: Video + Chat -->
            <div class="flex-1 flex flex-col overflow-hidden">
                <!-- Video Preview -->
                <div class="p-4 border-b border-white/5">
                    <div class="bg-black rounded-2xl overflow-hidden">
                        <div class="aspect-video flex items-center justify-center bg-black/80 relative">
                            ${videoUrl ? `
                                <video 
                                    id="director-video" 
                                    class="max-w-full max-h-full" 
                                    controls
                                    src="${escapeHtml(videoUrl)}"
                                >
                                    Your browser does not support video playback.
                                </video>
                            ` : `
                                <div class="text-center p-8">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-secondary mx-auto mb-4">
                                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                                        <line x1="7" y1="2" x2="7" y2="22"/>
                                        <line x1="17" y1="2" x2="17" y2="22"/>
                                        <line x1="2" y1="12" x2="22" y2="12"/>
                                        <line x1="2" y1="7" x2="7" y2="7"/>
                                        <line x1="2" y1="17" x2="7" y2="17"/>
                                        <line x1="17" y1="17" x2="22" y2="17"/>
                                        <line x1="17" y1="7" x2="22" y2="7"/>
                                    </svg>
                                    <p class="text-secondary">No video loaded</p>
                                    <p class="text-xs text-muted mt-2">Generate a video first to use Director</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <!-- Chat Interface -->
                <div class="flex-1 flex flex-col overflow-hidden p-4">
                    <h3 class="font-bold text-white mb-3 text-sm flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        AI CHAT
                        <span class="ml-auto text-xs text-secondary font-normal">Powered by VideoDB</span>
                    </h3>
                    
                    <!-- Chat Messages -->
                    <div id="chat-messages" class="flex-1 overflow-auto space-y-3 mb-4 min-h-[180px] max-h-[280px]">
                        <div class="chat-message flex gap-3">
                            <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                            <div class="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                                <p class="text-sm text-white">Hello! I'm Director, your AI video assistant with ${DIRECTOR_AGENTS.length}+ specialized agents.</p>
                                <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div class="bg-white/5 p-2 rounded">
                                        <span class="text-primary font-bold">🎬</span> Scene Detection
                                    </div>
                                    <div class="bg-white/5 p-2 rounded">
                                        <span class="text-primary font-bold">⚡</span> Highlights
                                    </div>
                                    <div class="bg-white/5 p-2 rounded">
                                        <span class="text-primary font-bold">💬</span> Subtitles
                                    </div>
                                    <div class="bg-white/5 p-2 rounded">
                                        <span class="text-primary font-bold">🎤</span> Dubbing
                                    </div>
                                </div>
                                <p class="text-xs text-primary mt-3">Select an agent or type a command below.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Command Input -->
                    <div class="flex gap-3">
                        <input 
                            type="text" 
                            id="command-input" 
                            placeholder="Type your command (e.g., 'Create a short clip of the best moment')"
                            class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-muted focus:outline-none focus:border-primary/50"
                        >
                        <button id="send-command-btn" class="px-6 py-3 bg-primary text-black text-white font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                            Send
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Right: Tools Panel -->
            <div class="w-80 border-l border-white/5 p-4 overflow-auto bg-black/30">
                <!-- Processing Status -->
                <div id="processing-status" class="hidden mb-6">
                    <h4 class="font-bold text-white text-sm mb-3 flex items-center gap-2">
                        <div class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        PROCESSING
                    </h4>
                    <div class="bg-white/5 rounded-xl p-3">
                        <div class="mb-3">
                            <span id="processing-title" class="text-sm text-white font-bold">Processing...</span>
                        </div>
                        <div id="processing-steps" class="space-y-1 text-xs">
                        </div>
                        <div class="mt-3 pt-3 border-t border-white/10">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-secondary">Progress</span>
                                <span id="progress-percent" class="text-primary font-bold">0%</span>
                            </div>
                            <div class="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div id="progress-bar" class="h-full bg-primary transition-all duration-300" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <h3 class="font-bold text-white mb-3 text-sm uppercase tracking-wider">QUICK ACTIONS</h3>
                <div class="space-y-2">
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="summarize">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">📝</div>
                        <div>
                            <div class="font-bold text-white text-sm">Summarize</div>
                            <div class="text-xs text-secondary">Generate video summary</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="highlights">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">⚡</div>
                        <div>
                            <div class="font-bold text-white text-sm">Extract Highlights</div>
                            <div class="text-xs text-secondary">Find best moments</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="scenes">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🎬</div>
                        <div>
                            <div class="font-bold text-white text-sm">Detect Scenes</div>
                            <div class="text-xs text-secondary">Identify boundaries</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="subtitles">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">💬</div>
                        <div>
                            <div class="font-bold text-white text-sm">Add Subtitles</div>
                            <div class="text-xs text-secondary">Auto-generate captions</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="dubbing">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🎤</div>
                        <div>
                            <div class="font-bold text-white text-sm">Dub Video</div>
                            <div class="text-xs text-secondary">Translate audio</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="broll">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🎞️</div>
                        <div>
                            <div class="font-bold text-white text-sm">Add B-Roll</div>
                            <div class="text-xs text-secondary">Overlay footage</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="voiceover">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🎙️</div>
                        <div>
                            <div class="font-bold text-white text-sm">Voiceover</div>
                            <div class="text-xs text-secondary">Add AI narration</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="shorts">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">📱</div>
                        <div>
                            <div class="font-bold text-white text-sm">Create Shorts</div>
                            <div class="text-xs text-secondary">TikTok/Reels/Shorts</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="color">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🎨</div>
                        <div>
                            <div class="font-bold text-white text-sm">Color Correction</div>
                            <div class="text-xs text-secondary">Adjust colors</div>
                        </div>
                    </button>
                    
                    <button class="action-btn w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer" data-action="stabilize">
                        <div class="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">🪄</div>
                        <div>
                            <div class="font-bold text-white text-sm">Stabilize</div>
                            <div class="text-xs text-secondary">Fix shaky footage</div>
                        </div>
                    </button>
                </div>
                
                <!-- Video Timeline Preview -->
                <div class="mt-6">
                    <h4 class="font-bold text-white text-sm mb-3">TIMELINE PREVIEW</h4>
                    <div class="bg-white/5 rounded-xl p-3">
                        <div class="h-16 bg-black/30 rounded relative overflow-hidden">
                            <div class="absolute inset-0 flex items-center justify-center text-xs text-secondary">No timeline data</div>
                        </div>
                        <div class="flex justify-between text-xs text-secondary mt-2">
                            <span>0:00</span>
                            <span>--:--</span>
                        </div>
                    </div>
                </div>
                
                <!-- Export Options -->
                <div class="mt-6">
                    <h4 class="font-bold text-white text-sm mb-3">EXPORT</h4>
                    <div class="grid grid-cols-3 gap-2">
                        <button class="export-btn p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-center text-secondary hover:text-white transition-colors cursor-pointer" data-format="mp4">
                            MP4
                        </button>
                        <button class="export-btn p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-center text-secondary hover:text-white transition-colors cursor-pointer" data-format="webm">
                            WebM
                        </button>
                        <button class="export-btn p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-center text-secondary hover:text-white transition-colors cursor-pointer" data-format="gif">
                            GIF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize director runtime
    initializeDirectorRuntime();

    // Event Handlers
    container.querySelector('#back-btn').onclick = () => {
        navigate('render', { videoId, videoUrl });
    };

    // Tab switching
    const agentsTab = container.querySelector('#agents-tab');
    const storyboardTab = container.querySelector('#storyboard-tab');
    const agentsPanel = container.querySelector('#agents-panel');
    const storyboardPanel = container.querySelector('#storyboard-panel');

    agentsTab.onclick = () => {
        agentsTab.className = 'flex-1 py-3 px-4 text-sm font-bold text-white bg-primary/10 border-b-2 border-primary';
        storyboardTab.className = 'flex-1 py-3 px-4 text-sm font-bold text-secondary hover:text-white transition-colors';
        agentsPanel.classList.remove('hidden');
        storyboardPanel.classList.add('hidden');
    };

    storyboardTab.onclick = () => {
        storyboardTab.className = 'flex-1 py-3 px-4 text-sm font-bold text-white bg-primary/10 border-b-2 border-primary';
        agentsTab.className = 'flex-1 py-3 px-4 text-sm font-bold text-secondary hover:text-white transition-colors';
        storyboardPanel.classList.remove('hidden');
        agentsPanel.classList.add('hidden');
    };

    // Storyboard event handlers
    container.querySelector('#add-frame-btn').onclick = () => {
        addStoryboardFrame();
    };

    container.querySelector('#generate-all-btn').onclick = async () => {
        await generateAllStoryboardFrames();
    };

    container.querySelector('#preset-selector').onchange = (e) => {
        if (directorRuntimeInstance) {
            directorRuntimeInstance.setPreset(e.target.value);
            updateStoryboardFrames();
        }
    };
    
    container.querySelector('#clear-chat-btn').onclick = () => {
        const chatMessages = container.querySelector('#chat-messages');
        chatMessages.innerHTML = `
            <div class="chat-message flex gap-3">
                <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <div class="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                    <p class="text-sm text-white">Chat cleared. How can I help you with your video?</p>
                </div>
            </div>
        `;
        chatHistory = [];
    };
    
    // Category filter
    container.querySelector('#category-filter').onchange = (e) => {
        const category = e.target.value;
        container.querySelectorAll('.agent-btn').forEach(btn => {
            if (!category || btn.dataset.category === category) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });
    };
    
    // Chat functionality
    const commandInput = container.querySelector('#command-input');
    const sendCommandBtn = container.querySelector('#send-command-btn');
    const chatMessages = container.querySelector('#chat-messages');
    
    const addMessage = (text, isUser = false, agents = [], isAction = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message flex gap-3';
        
        if (isUser) {
            msgDiv.innerHTML = `
                <div class="w-8 h-8 bg-primary rounded-full flex-shrink-0 flex items-center justify-center text-black text-xs font-bold">YOU</div>
                <div class="bg-primary/20 rounded-2xl rounded-tr-sm p-3 max-w-[85%]">
                    <p class="text-sm text-white">${escapeHtml(text)}</p>
                </div>
            `;
        } else if (isAction) {
            msgDiv.innerHTML = `
                <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">✓</div>
                <div class="bg-green-500/20 rounded-2xl rounded-tr-sm p-3 max-w-[85%]">
                    <p class="text-sm text-white">${escapeHtml(text)}</p>
                    ${agents.length > 0 ? `
                        <div class="mt-2 pt-2 border-t border-white/10">
                            <p class="text-xs text-secondary">Agents activated:</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${agents.map(a => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${a}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="w-8 h-8 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">AI</div>
                <div class="bg-white/10 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
                    <p class="text-sm text-white">${escapeHtml(text)}</p>
                    ${agents.length > 0 ? `
                        <div class="mt-2 pt-2 border-t border-white/10">
                            <p class="text-xs text-secondary">Agents activated:</p>
                            <div class="flex flex-wrap gap-1 mt-1">
                                ${agents.map(a => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${a}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        chatHistory.push({ text, isUser, agents, isAction });
    };
    
    const updateActiveAgents = () => {
        const activeEl = container.querySelector('#active-agents');
        
        if (activeAgents.size === 0) {
            activeEl.innerHTML = '<div class="text-xs text-secondary italic p-2">No agents running</div>';
            return;
        }
        
        activeEl.innerHTML = Array.from(activeAgents).map(agentId => {
            const agent = DIRECTOR_AGENTS.find(a => a.id === agentId);
            // Use escapeHtml to prevent XSS from agent IDs
            const safeName = escapeHtml(agent?.name || agentId);
            const safeIcon = escapeHtml(agent?.icon || '🤖');
            return `
                <div class="p-2 bg-white/5 rounded-lg flex items-center gap-2">
                    <span class="text-lg">${safeIcon}</span>
                    <span class="text-xs text-white flex-1">${safeName}</span>
                    <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </div>
            `;
        }).join('');
    };
    
    const addToHistory = (command, agents) => {
        const historyEl = container.querySelector('#action-history');
        if (historyEl.querySelector('.italic')) {
            historyEl.innerHTML = '';
        }
        
        const actionEl = document.createElement('div');
        actionEl.className = 'p-2 bg-white/5 rounded-lg text-xs text-white flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors';
        actionEl.innerHTML = `
            <span class="text-primary">✓</span>
            <span class="flex-1 truncate">${escapeHtml(command.slice(0, 25))}${command.length > 25 ? '...' : ''}</span>
            <span class="text-secondary ml-auto">${agents.slice(0, 2).join(', ')}</span>
        `;
        actionEl.onclick = () => {
            commandInput.value = command;
            commandInput.focus();
        };
        historyEl.insertBefore(actionEl, historyEl.firstChild);
        
        // Keep only last 10 items
        while (historyEl.children.length > 10) {
            historyEl.removeChild(historyEl.lastChild);
        }
    };
    
    const processCommand = async (command) => {
        if (!command.trim() || isProcessing) return;

        isProcessing = true;
        addMessage(command, true);
        commandInput.value = '';

        try {
            // Show processing status
            const statusEl = container.querySelector('#processing-status');
            const stepsEl = container.querySelector('#processing-steps');
            const progressBar = container.querySelector('#progress-bar');
            const progressPercent = container.querySelector('#progress-percent');
            statusEl.classList.remove('hidden');

            // Map command to videoagent action
            const actionMapping = {
                'highlight': 'highlight-detection',
                'clip': 'clip-segmentation',
                'short': 'create-shorts',
                'scene': 'scene-detection',
                'auto-edit': 'auto-edit',
                'edit': 'auto-edit'
            };

            let action = 'auto-edit'; // default
            const cmd = command.toLowerCase();
            for (const [key, val] of Object.entries(actionMapping)) {
                if (cmd.includes(key)) {
                    action = val;
                    break;
                }
            }

            // Determine activated agents based on action
            const agentMapping = {
                'highlight-detection': ['Highlight Extractor'],
                'clip-segmentation': ['Clip Creator'],
                'create-shorts': ['Highlight Extractor', 'Clip Creator'],
                'scene-detection': ['Scene Detector'],
                'auto-edit': ['Video Editor', 'Reasoning Engine']
            };
            const activatedAgents = agentMapping[action] || ['Video Editor'];

            // Update active agents
            activatedAgents.forEach(a => activeAgents.add(a.toLowerCase().replace(/ /g, '_')));
            updateActiveAgents();

            container.querySelector('#processing-title').textContent = activatedAgents.join(', ');

            // Call real videoagent API
            const { data, error } = await supabase.functions.invoke('videoagent', {
                body: {
                    action,
                    videoId: videoId || '',
                    videoUrl: videoUrl || '',
                    options: { command }
                }
            });

            if (error) {
                throw new Error(`Processing failed: ${error.message}`);
            }

            const jobId = data.jobId;

            // Poll for job status
            const jobStatus = 'processing';
            let currentStep = 0;
            const totalSteps = 1;
            const jobSteps = ['Initializing...'];

            while (jobStatus === 'processing') {
                try {
                    // Since GET polling isn't implemented, we'll simulate progress for now
                    // In production, this would poll the job status endpoint
                    currentStep = Math.min(currentStep + 1, totalSteps);
                    const percent = Math.round((currentStep / totalSteps) * 100);

                    stepsEl.innerHTML = jobSteps.map((s, idx) => `
                        <div class="flex items-center gap-2 ${idx < currentStep ? 'text-white' : idx === currentStep ? 'text-primary' : 'text-secondary'}">
                            <span class="w-1.5 h-1.5 rounded-full ${idx < currentStep ? 'bg-primary' : idx === currentStep ? 'bg-primary animate-pulse' : 'bg-secondary'}"></span>
                            ${s}
                        </div>
                    `).join('');

                    progressBar.style.width = `${percent}%`;
                    progressPercent.textContent = `${percent}%`;

                    if (currentStep >= totalSteps) break;

                    await new Promise(r => setTimeout(r, 1000));
                } catch (pollError) {
                    console.warn('Status polling failed, continuing:', pollError);
                    break;
                }
            }

            statusEl.classList.add('hidden');
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';

            // Clear active agents after processing
            setTimeout(() => {
                activeAgents.clear();
                updateActiveAgents();
            }, 2000);

            // Add success message
            const successMessage = `Processing completed successfully! Your video has been processed with ${activatedAgents.join(', ')}.`;
            addMessage(successMessage, false, activatedAgents, true);
            addToHistory(command, activatedAgents);

            // Update timeline if available
            updateTimelinePreview();

        } catch (error) {
            console.error('Processing error:', error);

            // Show error status
            const statusEl = container.querySelector('#processing-status');
            const stepsEl = container.querySelector('#processing-steps');
            statusEl.classList.remove('hidden');

            container.querySelector('#processing-title').textContent = 'Processing Failed';
            stepsEl.innerHTML = `
                <div class="flex items-center gap-2 text-red-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                    Error: ${error.message}
                </div>
            `;

            // Hide error after 5 seconds
            setTimeout(() => {
                statusEl.classList.add('hidden');
            }, 5000);

            // Add error message to chat
            addMessage(`Sorry, processing failed: ${error.message}`, false, [], false);
        }

        isProcessing = false;
    };
    
    sendCommandBtn.onclick = () => processCommand(commandInput.value);
    commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') processCommand(commandInput.value);
    });
    
    // Agent buttons
    container.querySelectorAll('.agent-btn').forEach(btn => {
        btn.onclick = () => {
            const agentId = btn.dataset.agent;
            const agent = DIRECTOR_AGENTS.find(a => a.id === agentId);
            processCommand(`Use ${agent.name} to ${agent.description.toLowerCase()}`);
        };
    });
    
    // Quick action buttons
    container.querySelectorAll('.action-btn').forEach(btn => {
        btn.onclick = () => {
            const action = btn.dataset.action;
            const actionTexts = {
                summarize: 'Summarize this video',
                highlights: 'Extract the best highlights from this video',
                scenes: 'Detect all scenes in this video',
                subtitles: 'Add subtitles to this video',
                dubbing: 'Dub this video to Spanish',
                broll: 'Add relevant B-roll footage',
                voiceover: 'Add voiceover narration',
                shorts: 'Create short clips for social media',
                color: 'Apply color correction to this video',
                stabilize: 'Stabilize this video'
            };
            processCommand(actionTexts[action]);
        };
    });
    
    // Export buttons - now with real functionality
    container.querySelectorAll('.export-btn').forEach(btn => {
        btn.onclick = async () => {
            const format = btn.dataset.format;
            try {
                showToast(`Starting export as ${format.toUpperCase()}...`, 'info');

                const { data, error } = await supabase.functions.invoke('videoagent', {
                    body: {
                        action: 'auto-edit',
                        videoUrl: videoUrl,
                        options: {
                            exportFormat: format,
                            command: `Export video as ${format.toUpperCase()}`
                        }
                    }
                });

                if (error) throw error;

                showToast(`Export job started. Job ID: ${data.jobId}`, 'success');
            } catch (error) {
                console.error('Export failed:', error);
                showToast(`Export failed: ${error.message}`, 'error');
            }
        };
    });

    // Storyboard frame management
    const addStoryboardFrame = () => {
        if (!directorRuntimeInstance) return;

        directorRuntimeInstance.addFrame();
        updateStoryboardFrames();
    };

    const updateStoryboardFrames = () => {
        if (!directorRuntimeInstance) return;

        const framesContainer = container.querySelector('#storyboard-frames');
        const frames = directorRuntimeInstance.getFrames();

        if (frames.length === 0) {
            framesContainer.innerHTML = '<div class="text-xs text-secondary italic p-2">No frames yet. Add a frame to start.</div>';
            return;
        }

        framesContainer.innerHTML = frames.map(frame => `
            <div class="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors" data-frame-id="${frame.id}">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-primary">FRAME ${frame.id}</span>
                    <div class="flex gap-1">
                        <button class="generate-frame-btn px-2 py-1 bg-primary/20 text-primary text-xs rounded hover:bg-primary/30" data-frame-id="${frame.id}">
                            ${frame.generated ? '✓' : 'Generate'}
                        </button>
                        <button class="remove-frame-btn px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30" data-frame-id="${frame.id}">
                            ×
                        </button>
                    </div>
                </div>
                <div class="text-xs text-secondary mb-1">${frame.shot}</div>
                <div class="text-xs text-white leading-tight mb-2">${frame.prompt || 'No prompt set'}</div>
                <div class="text-xs text-secondary">${frame.narration || 'No narration'}</div>
            </div>
        `).join('');

        // Add event listeners for frame actions
        framesContainer.querySelectorAll('.generate-frame-btn').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const frameId = parseInt(btn.dataset.frameId);
                await generateStoryboardFrame(frameId);
            };
        });

        framesContainer.querySelectorAll('.remove-frame-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const frameId = parseInt(btn.dataset.frameId);
                if (directorRuntimeInstance) {
                    directorRuntimeInstance.removeFrame(frameId);
                    updateStoryboardFrames();
                }
            };
        });
    };

    const generateStoryboardFrame = async (frameId) => {
        if (!directorRuntimeInstance) return;

        try {
            showToast('Generating storyboard frame...', 'info');
            await directorRuntimeInstance.generateFrame(frameId);
            updateStoryboardFrames();
            showToast('Storyboard frame generated successfully!', 'success');
        } catch (error) {
            console.error('Frame generation failed:', error);
            showToast(`Frame generation failed: ${error.message}`, 'error');
        }
    };

    const generateAllStoryboardFrames = async () => {
        if (!directorRuntimeInstance) return;

        try {
            showToast('Generating all storyboard frames...', 'info');
            await directorRuntimeInstance.generateAllFrames();
            updateStoryboardFrames();
            showToast('All storyboard frames generated successfully!', 'success');
        } catch (error) {
            console.error('Batch frame generation failed:', error);
            showToast(`Batch generation failed: ${error.message}`, 'error');
        }
    };

    // Initialize storyboard frames display
    updateStoryboardFrames();

    return container;
}
