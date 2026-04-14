import { navigate } from '../lib/router.js';
import { showToast } from '../lib/loading.js';
import { createHeroSection } from '../lib/thumbnails.js';
import { getSupabaseUrl, isSupabaseConfigured } from '../lib/supabase.js';
import { createVideoAgentWorkspace } from './video-agent-workspace.js';
import { directorRuntime } from '../lib/directorAgentRuntime.js';

const AI_TOOLS = [
    { id: 'scene-detection', name: 'Scene Detection', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5"/></svg>', thumbnail: '/thumbnails/videoagent/scene-detection.png', color: 'blue', description: 'Identify scene boundaries', category: 'understanding' },
    { id: 'clip-segmentation', name: 'Clip Segmentation', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="8" height="16" rx="1"/><rect x="14" y="4" width="8" height="16" rx="1"/><line x1="12" y1="4" x2="12" y2="20" stroke-dasharray="2 2"/></svg>', thumbnail: '/thumbnails/videoagent/clip-segmentation.png', color: 'purple', description: 'Split into clip segments', category: 'editing' },
    { id: 'highlight-detection', name: 'Highlight Detection', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', thumbnail: '/thumbnails/videoagent/highlight-detection.png', color: 'orange', description: 'Find key moments', category: 'understanding' },
    { id: 'cosyvoice', name: 'CosyVoice', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>', thumbnail: '/thumbnails/videoagent/cosyvoice.png', color: 'pink', description: 'Voice cloning & TTS', category: 'audio' },
    { id: 'fish-speech', name: 'Fish Speech', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M2 10c1.5-1 3-1.5 4.5-1s3 1.5 4.5 1 3-1.5 4.5-1 3 1 4.5 1"/></svg>', thumbnail: '/thumbnails/videoagent/fish-speech.png', color: 'cyan', description: 'Voice synthesis', category: 'audio' },
    { id: 'seed-vc', name: 'Seed-VC', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M21 3l-7 7"/><path d="M3 3l7 7"/><path d="M3 21l7-7"/><path d="M21 21l-7-7"/></svg>', thumbnail: '/thumbnails/videoagent/seed-vc.png', color: 'teal', description: 'Voice conversion', category: 'audio' },
    { id: 'whisper', name: 'Whisper', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', thumbnail: '/thumbnails/videoagent/whisper.png', color: 'green', description: 'Audio transcription', category: 'audio' },
    { id: 'imagebind', name: 'ImageBind', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>', thumbnail: '/thumbnails/videoagent/imagebind.png', color: 'indigo', description: 'Multimodal understanding', category: 'understanding' },
    { id: 'dubbing', name: 'Cross-lingual Dub', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>', thumbnail: '/thumbnails/videoagent/dubbing.png', color: 'yellow', description: 'Translate & dub video', category: 'translate' },
    { id: 'color-correct', name: 'Color Correction', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 22c-4.97 0-9-2.69-9-6v-.01C3 12.2 7.03 8.6 12 8.6s9 3.6 9 7.39V16c0 3.31-4.03 6-9 6z"/></svg>', thumbnail: '/thumbnails/videoagent/color-correct.png', color: 'rose', description: 'Adjust colors & tones', category: 'enhance' },
    { id: 'upscale', name: 'Video Upscale', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>', thumbnail: '/thumbnails/videoagent/upscale.png', color: 'emerald', description: 'Enhance resolution', category: 'enhance' },
    { id: 'stabilize', name: 'Stabilize', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>', thumbnail: '/thumbnails/videoagent/stabilize.png', color: 'violet', description: 'Fix shaky footage', category: 'enhance' },
];

const USE_CASES = [
    { id: 'standup', name: 'Stand-up Comedy', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>', thumbnail: '/thumbnails/videoagent/standup.png', description: 'Transform video with comedy timing' },
    { id: 'commentary', name: 'Commentary', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>', thumbnail: '/thumbnails/videoagent/commentary.png', description: 'Add AI commentary overlay' },
    { id: 'overview', name: 'Video Overview', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>', thumbnail: '/thumbnails/videoagent/overview.png', description: 'Generate summary overview' },
    { id: 'meme', name: 'Meme Generator', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 8h10"/><path d="M7 12h4"/><path d="M7 16h6"/></svg>', thumbnail: '/thumbnails/videoagent/meme.png', description: 'Create meme videos' },
    { id: 'music-video', name: 'Music Video', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>', thumbnail: '/thumbnails/videoagent/music-video.png', description: 'Set video to music' },
    { id: 'qa', name: 'Video Q&A', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', thumbnail: '/thumbnails/videoagent/qa.png', description: 'Interactive video Q&A' },
];

// Initialize the director runtime
let runtime = null;

export function VideoAgentPage() {
    if (!runtime) {
        runtime = directorRuntime;
        runtime.initialize();
    }
    return createVideoAgentWorkspace(runtime);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
