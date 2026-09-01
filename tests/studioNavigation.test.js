import test from 'node:test';
import assert from 'node:assert/strict';

import {
    agentBlueprintPath,
    resolveStudioDestination,
    STUDIO_NAVIGATION,
} from '../src/lib/studioNavigation.js';

test('Creator Studio routes resolve the integrated hierarchy and legacy aliases', () => {
    assert.equal(resolveStudioDestination([]), 'home');
    assert.equal(resolveStudioDestination(['selena']), 'selena');
    assert.equal(resolveStudioDestination(['tools', 'image']), 'image');
    assert.equal(resolveStudioDestination(['apps', 'scene-builder']), 'scene-builder');
    assert.equal(resolveStudioDestination(['apps', 'music-video']), 'music-video');
    assert.equal(resolveStudioDestination(['projects']), 'projects');
    assert.equal(resolveStudioDestination(['advanced', 'agents', 'create']), 'agent-blueprints');
    assert.equal(resolveStudioDestination(['creator']), 'selena');
    assert.equal(resolveStudioDestination(['agents']), 'agent-blueprints');
    assert.equal(resolveStudioDestination(['design-agent']), 'graphic-studio');
});

test('Agent Blueprint paths stay inside the Studio shell', () => {
    assert.equal(agentBlueprintPath(), '/studio/advanced/agents');
    assert.equal(agentBlueprintPath('create'), '/studio/advanced/agents/create');
    assert.equal(agentBlueprintPath('/agent-123/chat-456'), '/studio/advanced/agents/agent-123/chat-456');
});

test('navigation contains one stable destination per required working area', () => {
    const ids = STUDIO_NAVIGATION.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ['home', 'selena', 'image', 'video', 'audio', 'graphic-studio', 'scene-builder', 'music-video', 'workflows', 'projects', 'assets', 'publish', 'agent-blueprints', 'marketplace']) {
        assert.ok(ids.includes(id), `missing ${id}`);
    }
});
