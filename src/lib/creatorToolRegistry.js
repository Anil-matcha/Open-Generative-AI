export const BRAIN_REASONING_TOOL_ID = 'brain_reasoning';
export const ANTHROPIC_ASSISTANT_TOOL_ID = 'anthropic_assistant';
export const MUAPI_IMAGE_TOOL_ID = 'muapi_image';
export const MUAPI_VIDEO_TOOL_ID = 'muapi_video';
export const OPENAI_IMAGE_TOOL_ID = 'openai_image';
export const ELEVENLABS_VOICE_TOOL_ID = 'elevenlabs_voice';
export const HEYGEN_AVATAR_VIDEO_TOOL_ID = 'heygen_avatar_video';
export const RUNWAY_VIDEO_TOOL_ID = 'runway_video';
export const YOUTUBE_PUBLISH_TOOL_ID = 'youtube_publish';
export const INSTAGRAM_PUBLISH_TOOL_ID = 'instagram_publish';
export const TIKTOK_PUBLISH_TOOL_ID = 'tiktok_publish';

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

export const MUAPI_IMAGE_TOOL = Object.freeze({
    id: MUAPI_IMAGE_TOOL_ID,
    provider: 'muapi',
    label: 'MuAPI Image Generation',
    purpose: 'Generate one approved image through the server-owned MuAPI media backbone.',
    asynchronous: true,
    accepts: Object.freeze(['prompt', 'aspectRatio']),
    returns: Object.freeze(['provider', 'toolId', 'jobId', 'status', 'url', 'model', 'keyMode', 'error']),
});

export const MUAPI_VIDEO_TOOL = Object.freeze({
    id: MUAPI_VIDEO_TOOL_ID,
    provider: 'muapi',
    label: 'MuAPI Video Generation',
    purpose: 'Create an approved text-to-video or image-to-video job through MuAPI.',
    asynchronous: true,
    accepts: Object.freeze(['prompt', 'firstFrameUrl', 'aspectRatio', 'duration']),
    returns: Object.freeze(['provider', 'toolId', 'jobId', 'status', 'url', 'model', 'keyMode', 'error']),
});

export const OPENAI_IMAGE_TOOL = Object.freeze({
    id: OPENAI_IMAGE_TOOL_ID,
    provider: 'openai',
    label: 'OpenAI Image Generation',
    purpose: 'Generate one approved image asset from a validated prompt.',
    asynchronous: false,
    deferred: true,
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
    deferred: true,
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

function socialPublishTool(id, platform, label, accepts) {
    return Object.freeze({
        id,
        provider: 'muapi-social',
        platform,
        label,
        purpose: `Publish an explicitly reviewed Creator Asset to ${platform} through the server-owned MuAPI social adapter.`,
        asynchronous: true,
        executesExternalActions: true,
        sideEffect: 'publishing',
        requiresExplicitApproval: true,
        successfulPublishCostUsd: 0.01,
        accepts: Object.freeze([...accepts, 'approved']),
        returns: Object.freeze([
            'provider',
            'platform',
            'accountId',
            'jobId',
            'status',
            'url',
            'error',
        ]),
    });
}

export const INSTAGRAM_PUBLISH_TOOL = socialPublishTool(
    INSTAGRAM_PUBLISH_TOOL_ID,
    'instagram',
    'Instagram Publishing',
    ['accountId', 'mediaUrl', 'mediaType', 'caption', 'placement', 'shareToFeed'],
);

export const TIKTOK_PUBLISH_TOOL = socialPublishTool(
    TIKTOK_PUBLISH_TOOL_ID,
    'tiktok',
    'TikTok Publishing',
    ['accountId', 'mediaUrl', 'mediaType', 'caption', 'privacyLevel', 'disableComment', 'disableDuet', 'disableStitch'],
);

const CREATOR_TOOL_REGISTRY = Object.freeze({
    [BRAIN_REASONING_TOOL_ID]: BRAIN_REASONING_TOOL,
    [ANTHROPIC_ASSISTANT_TOOL_ID]: ANTHROPIC_ASSISTANT_TOOL,
    [MUAPI_IMAGE_TOOL_ID]: MUAPI_IMAGE_TOOL,
    [MUAPI_VIDEO_TOOL_ID]: MUAPI_VIDEO_TOOL,
    [OPENAI_IMAGE_TOOL_ID]: OPENAI_IMAGE_TOOL,
    [ELEVENLABS_VOICE_TOOL_ID]: ELEVENLABS_VOICE_TOOL,
    [HEYGEN_AVATAR_VIDEO_TOOL_ID]: HEYGEN_AVATAR_VIDEO_TOOL,
    [RUNWAY_VIDEO_TOOL_ID]: RUNWAY_VIDEO_TOOL,
    [YOUTUBE_PUBLISH_TOOL_ID]: YOUTUBE_PUBLISH_TOOL,
    [INSTAGRAM_PUBLISH_TOOL_ID]: INSTAGRAM_PUBLISH_TOOL,
    [TIKTOK_PUBLISH_TOOL_ID]: TIKTOK_PUBLISH_TOOL,
});

export function getCreatorToolDefinition(toolId) {
    return CREATOR_TOOL_REGISTRY[toolId] || null;
}

export function listCreatorToolDefinitions() {
    return Object.values(CREATOR_TOOL_REGISTRY);
}
