export const CREATOR_TIMELINE_VERSION = 1;

const ASPECT_RATIOS = new Set(['16:9', '9:16', '1:1']);
const TRANSITIONS = new Set(['cut', 'dissolve', 'fade', 'dip-black', 'match', 'whip']);

function boundedDuration(value, fallback = 5) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(12, Math.max(0.1, Math.round(parsed * 10) / 10));
}

function sourceForScene(scene, assets) {
    const url = typeof scene?.videoUrl === 'string' && scene.videoUrl
        ? scene.videoUrl
        : typeof scene?.imageUrl === 'string'
            ? scene.imageUrl
            : '';
    if (!url) return null;
    const asset = assets.find((item) => item?.url === url) || null;
    return {
        assetId: asset?.id || null,
        url,
        type: scene.videoUrl ? 'video' : 'image',
    };
}

export function createEmptyTimeline({ aspectRatio = '16:9' } = {}) {
    return {
        version: CREATOR_TIMELINE_VERSION,
        aspectRatio: ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : '16:9',
        resolution: { width: 1920, height: 1080 },
        clips: [],
        voiceTrack: null,
        musicTrack: null,
        captions: [],
        overlays: [],
        render: {
            status: 'not-requested',
            jobId: null,
            outputAssetId: null,
            error: null,
        },
    };
}

export function storyboardToTimeline(storyboard = {}, assets = []) {
    const scenes = Array.isArray(storyboard?.scenes) ? storyboard.scenes.slice(0, 100) : [];
    const aspectRatio = scenes.find((scene) => ASPECT_RATIOS.has(scene?.aspectRatio))?.aspectRatio || '16:9';
    const timeline = createEmptyTimeline({ aspectRatio });
    timeline.clips = scenes.map((scene, index) => ({
        id: `clip-${String(scene.id || index + 1).slice(0, 120)}`,
        sceneId: String(scene.id || '').slice(0, 120) || null,
        title: String(scene.title || `Scene ${index + 1}`).slice(0, 120),
        order: index,
        source: sourceForScene(scene, assets),
        trim: { start: 0, end: null },
        duration: boundedDuration(scene.duration),
        transition: {
            type: TRANSITIONS.has(scene.transition) ? scene.transition : 'cut',
            duration: null,
            rendered: false,
        },
    }));
    return timeline;
}

export function normalizeTimelineManifest(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Timeline manifest must be an object.');
    }
    if (value.version !== CREATOR_TIMELINE_VERSION) {
        throw new Error(`Timeline manifest version must be ${CREATOR_TIMELINE_VERSION}.`);
    }
    const timeline = createEmptyTimeline({ aspectRatio: value.aspectRatio });
    const clips = Array.isArray(value.clips) ? value.clips : [];
    if (clips.length > 100) throw new Error('Timeline supports at most 100 clips.');
    timeline.clips = clips.map((clip, index) => {
        const transition = TRANSITIONS.has(clip?.transition?.type) ? clip.transition.type : 'cut';
        const source = clip?.source && typeof clip.source === 'object'
            ? {
                assetId: typeof clip.source.assetId === 'string' ? clip.source.assetId.slice(0, 120) : null,
                url: typeof clip.source.url === 'string' ? clip.source.url.slice(0, 4096) : '',
                type: clip.source.type === 'video' ? 'video' : 'image',
            }
            : null;
        return {
            id: typeof clip?.id === 'string' ? clip.id.slice(0, 140) : `clip-${index + 1}`,
            sceneId: typeof clip?.sceneId === 'string' ? clip.sceneId.slice(0, 120) : null,
            title: typeof clip?.title === 'string' ? clip.title.slice(0, 120) : `Scene ${index + 1}`,
            order: index,
            source,
            trim: {
                start: Math.max(0, Number(clip?.trim?.start) || 0),
                end: Number.isFinite(Number(clip?.trim?.end)) ? Math.max(0, Number(clip.trim.end)) : null,
            },
            duration: boundedDuration(clip?.duration),
            transition: {
                type: transition,
                duration: Number.isFinite(Number(clip?.transition?.duration))
                    ? Math.max(0, Number(clip.transition.duration))
                    : null,
                rendered: false,
            },
        };
    });
    timeline.voiceTrack = value.voiceTrack && typeof value.voiceTrack === 'object' ? value.voiceTrack : null;
    timeline.musicTrack = value.musicTrack && typeof value.musicTrack === 'object' ? value.musicTrack : null;
    timeline.captions = Array.isArray(value.captions) ? value.captions.slice(0, 1000) : [];
    timeline.overlays = Array.isArray(value.overlays) ? value.overlays.slice(0, 500) : [];
    return timeline;
}
