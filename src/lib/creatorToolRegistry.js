export const BRAIN_REASONING_TOOL_ID = 'brain_reasoning';
export const ANTHROPIC_ASSISTANT_TOOL_ID = 'anthropic_assistant';
export const OPENAI_IMAGE_TOOL_ID = 'openai_image';
export const ELEVENLABS_VOICE_TOOL_ID = 'elevenlabs_voice';
export const HEYGEN_AVATAR_VIDEO_TOOL_ID = 'heygen_avatar_video';
export const RUNWAY_VIDEO_TOOL_ID = 'runway_video';
export const YOUTUBE_PUBLISH_TOOL_ID = 'youtube_publish';

export const BRAIN_REASONING_TOOL = Object.freeze({
    id: BRAIN_REASONING_TOOL_ID,
    provider: 'brain-router',
    label: 'Selena Brain Router',
    purpose: 'Give existing agents provider-neutral planning, routing, strategy, and creative reasoning.',
    asynchronous: false,
    executesExternalActions: false,
    accepts: Object.freeze([
        'task',
        'instructions',
        'context',
        'mode',
        'tools',
        'sensitivity',
        'desiredOutput',
    ]),
    returns: Object.freeze([
        'provider',
        'model',
        'text',
        'structuredOutput',
        'toolCalls',
        'usage',
        'finishReason',
        'error',
    ]),
});

export const ANTHROPIC_ASSISTANT_TOOL = Object.freeze({
    id: ANTHROPIC_ASSISTANT_TOOL_ID,
    provider: 'anthropic',
    label: 'Anthropic Creative Assistant',
    purpose: 'Turn a creative brief into production strategy, plans, prompts, or scripts.',
    asynchronous: false,
    accepts: Object.freeze(['prompt', 'mode']),
    returns: Object.freeze(['provider', 'toolId', 'model', 'text', 'stopReason', 'usage', 'error']),
});

export const OPENAI_IMAGE_TOOL = Object.freeze({
    id: OPENAI_IMAGE_TOOL_ID,
    provider: 'openai',
    label: 'OpenAI Image Generation',
    purpose: 'Generate one approved image asset from a validated prompt.',
    asynchronous: false,
    accepts: Object.freeze(['prompt', 'size', 'quality']),
    returns: Object.freeze(['provider', 'toolId', 'contentType', 'image', 'error']),
});

export const ELEVENLABS_VOICE_TOOL = Object.freeze({
    id: ELEVENLABS_VOICE_TOOL_ID,
    provider: 'elevenlabs',
    label: 'ElevenLabs Voice',
    purpose: 'Generate a branded speech asset from an approved script.',
    asynchronous: false,
    accepts: Object.freeze(['text', 'stability', 'similarityBoost']),
    returns: Object.freeze(['provider', 'toolId', 'contentType', 'audio', 'error']),
});

export const HEYGEN_AVATAR_VIDEO_TOOL = Object.freeze({
    id: HEYGEN_AVATAR_VIDEO_TOOL_ID,
    provider: 'heygen',
    label: 'HeyGen Avatar Video',
    purpose: 'Turn an approved script into presenter video using Greg\'s Digital Twin.',
    asynchronous: true,
    defaultIdentity: Object.freeze({
        name: 'Greg',
        type: 'Digital Twin',
        avatarEnvironmentVariable: 'HEYGEN_AVATAR_ID',
        voiceEnvironmentVariable: 'HEYGEN_VOICE_ID',
    }),
    currentInputMode: 'script',
    futureInputModes: Object.freeze(['audio_url', 'audio_asset']),
    accepts: Object.freeze([
        'script',
        'title',
        'aspectRatio',
        'resolution',
        'avatarId',
        'voiceId',
        'background',
        'captions',
        'motionPrompt',
        'expressiveness',
    ]),
    returns: Object.freeze([
        'provider',
        'toolId',
        'jobId',
        'status',
        'videoUrl',
        'thumbnailUrl',
        'duration',
        'error',
    ]),
});

export const RUNWAY_VIDEO_TOOL = Object.freeze({
    id: RUNWAY_VIDEO_TOOL_ID,
    provider: 'runway',
    label: 'Runway Video',
    purpose: 'Create a cinematic video job from text and an optional first-frame image.',
    asynchronous: true,
    accepts: Object.freeze(['prompt', 'firstFrameUrl', 'ratio', 'duration']),
    returns: Object.freeze(['provider', 'toolId', 'jobId', 'status', 'output', 'failure', 'error']),
});

export const YOUTUBE_PUBLISH_TOOL = Object.freeze({
    id: YOUTUBE_PUBLISH_TOOL_ID,
    provider: 'youtube',
    label: 'YouTube Private Publishing',
    purpose: 'Publish an explicitly approved, privately staged video to YouTube as private.',
    asynchronous: true,
    requiresExplicitApproval: true,
    forcedPrivacyStatus: 'private',
    accepts: Object.freeze([
        'pathname',
        'title',
        'description',
        'tags',
        'madeForKids',
        'containsSyntheticMedia',
        'approved',
    ]),
    returns: Object.freeze([
        'provider',
        'toolId',
        'videoId',
        'privacyStatus',
        'url',
        'studioUrl',
        'historyRecorded',
        'cleanupPending',
        'error',
    ]),
});

const CREATOR_TOOL_REGISTRY = Object.freeze({
    [BRAIN_REASONING_TOOL_ID]: BRAIN_REASONING_TOOL,
    [ANTHROPIC_ASSISTANT_TOOL_ID]: ANTHROPIC_ASSISTANT_TOOL,
    [OPENAI_IMAGE_TOOL_ID]: OPENAI_IMAGE_TOOL,
    [ELEVENLABS_VOICE_TOOL_ID]: ELEVENLABS_VOICE_TOOL,
    [HEYGEN_AVATAR_VIDEO_TOOL_ID]: HEYGEN_AVATAR_VIDEO_TOOL,
    [RUNWAY_VIDEO_TOOL_ID]: RUNWAY_VIDEO_TOOL,
    [YOUTUBE_PUBLISH_TOOL_ID]: YOUTUBE_PUBLISH_TOOL,
});

export function getCreatorToolDefinition(toolId) {
    return CREATOR_TOOL_REGISTRY[toolId] || null;
}

export function listCreatorToolDefinitions() {
    return Object.values(CREATOR_TOOL_REGISTRY);
}
