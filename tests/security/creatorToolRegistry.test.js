import assert from 'node:assert/strict';
import test from 'node:test';

import {
    ANTHROPIC_ASSISTANT_TOOL_ID,
    BRAIN_REASONING_TOOL_ID,
    ELEVENLABS_VOICE_TOOL_ID,
    HEYGEN_AVATAR_VIDEO_TOOL_ID,
    INSTAGRAM_PUBLISH_TOOL_ID,
    MUAPI_IMAGE_TOOL_ID,
    MUAPI_VIDEO_TOOL_ID,
    OPENAI_IMAGE_TOOL_ID,
    RUNWAY_VIDEO_TOOL_ID,
    TIKTOK_PUBLISH_TOOL_ID,
    YOUTUBE_PUBLISH_TOOL_ID,
    getCreatorToolDefinition,
    listCreatorToolDefinitions,
} from '../../src/lib/creatorToolRegistry.js';

const EXPECTED_TOOLS = [
    [BRAIN_REASONING_TOOL_ID, 'brain-router'],
    [ANTHROPIC_ASSISTANT_TOOL_ID, 'anthropic'],
    [MUAPI_IMAGE_TOOL_ID, 'muapi'],
    [MUAPI_VIDEO_TOOL_ID, 'muapi'],
    [OPENAI_IMAGE_TOOL_ID, 'openai'],
    [ELEVENLABS_VOICE_TOOL_ID, 'elevenlabs'],
    [HEYGEN_AVATAR_VIDEO_TOOL_ID, 'heygen'],
    [RUNWAY_VIDEO_TOOL_ID, 'runway'],
    [YOUTUBE_PUBLISH_TOOL_ID, 'youtube'],
    [INSTAGRAM_PUBLISH_TOOL_ID, 'muapi-social'],
    [TIKTOK_PUBLISH_TOOL_ID, 'muapi-social'],
];

test('Creator Studio registry exposes the brain boundary and each existing Phase 1 tool exactly once', () => {
    const tools = listCreatorToolDefinitions();
    assert.deepEqual(tools.map((tool) => [tool.id, tool.provider]), EXPECTED_TOOLS);
    assert.equal(new Set(tools.map((tool) => tool.id)).size, EXPECTED_TOOLS.length);

    for (const [id, provider] of EXPECTED_TOOLS) {
        const definition = getCreatorToolDefinition(id);
        assert.equal(definition.id, id);
        assert.equal(definition.provider, provider);
        assert.equal(typeof definition.purpose, 'string');
        assert.equal(Object.isFrozen(definition), true);
        assert.equal(Object.isFrozen(definition.accepts), true);
        assert.equal(Object.isFrozen(definition.returns), true);
    }
    assert.equal(getCreatorToolDefinition('unknown_tool'), null);
});

test('registry preserves asynchronous jobs and private YouTube approval constraints', () => {
    assert.equal(getCreatorToolDefinition(MUAPI_IMAGE_TOOL_ID).asynchronous, true);
    assert.equal(getCreatorToolDefinition(MUAPI_VIDEO_TOOL_ID).asynchronous, true);
    assert.equal(getCreatorToolDefinition(HEYGEN_AVATAR_VIDEO_TOOL_ID).asynchronous, true);
    assert.equal(getCreatorToolDefinition(RUNWAY_VIDEO_TOOL_ID).asynchronous, true);
    assert.equal(getCreatorToolDefinition(OPENAI_IMAGE_TOOL_ID).deferred, true);
    assert.equal(getCreatorToolDefinition(RUNWAY_VIDEO_TOOL_ID).deferred, true);

    const youtube = getCreatorToolDefinition(YOUTUBE_PUBLISH_TOOL_ID);
    assert.equal(youtube.asynchronous, true);
    assert.equal(youtube.requiresExplicitApproval, true);
    assert.equal(youtube.forcedPrivacyStatus, 'private');
    assert.equal(youtube.accepts.includes('approved'), true);

    for (const toolId of [INSTAGRAM_PUBLISH_TOOL_ID, TIKTOK_PUBLISH_TOOL_ID]) {
        const social = getCreatorToolDefinition(toolId);
        assert.equal(social.asynchronous, true);
        assert.equal(social.requiresExplicitApproval, true);
        assert.equal(social.sideEffect, 'publishing');
        assert.equal(social.successfulPublishCostUsd, 0.01);
        assert.equal(social.accepts.includes('approved'), true);
    }
});

test('registry metadata contains no credential values or client-readable secret fields', () => {
    const serialized = JSON.stringify(listCreatorToolDefinitions());
    assert.doesNotMatch(serialized, /NEXT_PUBLIC_/i);
    assert.doesNotMatch(serialized, /apiKey|clientSecret|refreshToken|accessToken/i);
});
