import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Selena remains on the secure Creator assistant route and does not use MuAPI Agent chat', async () => {
    const creator = await read('../packages/studio/src/components/CreatorStudio.jsx');
    assert.match(creator, /request\("assistant",\s*\{[\s\S]*?method: "POST"/);
    assert.match(creator, /fetch\(`\/api\/creator\/\$\{path\}`/);
    assert.doesNotMatch(creator, /sendAgentChatMessage/);
});

test('direct image and video creation reuse the project media request implementation', async () => {
    const creator = await read('../packages/studio/src/components/CreatorStudio.jsx');
    assert.match(creator, /submitProjectMedia\(\{ kind: toolId, \.\.\.draft \}, token/);
    assert.match(creator, /buildProjectMediaRequest/);
    assert.match(creator, /initialAsset\.url/);
});

test('Graphic Studio consolidates existing canvas, image editor, and layer components', async () => {
    const graphic = await read('../packages/studio/src/components/GraphicStudio.jsx');
    const image = await read('../packages/studio/src/components/ImageStudio.jsx');
    const draw = await read('../packages/studio/src/components/DrawModal.jsx');
    assert.match(graphic, /DesignAgentStudio/);
    assert.match(graphic, /ImageStudio/);
    assert.match(graphic, /LayersStudio/);
    assert.match(graphic, /mode === "canvas"/);
    assert.match(graphic, /owner-authenticated Creator server adapter/i);
    assert.match(graphic, /initialAsset=\{initialAsset\}/);
    assert.match(image, /initialAsset\?\.type !== "image"/);
    assert.match(image, /Use the secure Creator Image tool to generate/);
    assert.match(draw, /initialImageUrl/);
});

test('Projects and Assets use the authenticated durable Project API with owner-scoped handoff', async () => {
    const shell = await read('../components/StandaloneShell.js');
    const projects = await read('../components/ProjectsStudio.js');
    const assets = await read('../components/StudioAssets.js');
    const projectRoute = await read('../src/lib/creatorProjectRoutes.js');
    assert.match(shell, /fetch\(`\/api\/creator\/projects\$\{path\}`/);
    assert.match(shell, /case 'projects': return <ProjectsStudio/);
    assert.match(shell, /saveProjectStoryboard/);
    assert.match(shell, /saveProjectConversation/);
    assert.match(shell, /recordAsset/);
    assert.match(projects, /New Project/);
    assert.match(projects, /aria-label=\{editor\.mode === 'create' \? 'Create Project' : 'Rename Project'\}/);
    assert.match(projects, /onSubmit=\{submitEditor\}/);
    assert.doesNotMatch(projects, /window\.prompt/);
    assert.match(projects, /aria-label="Project Workspace"/);
    assert.match(projects, /Continue with Selena/);
    assert.match(projects, /Build Storyboard/);
    assert.match(projects, /Prepare Publish/);
    assert.match(projects, /onNavigate\?\.\(action\.path\)/);
    assert.match(shell, /onNavigate=\{navigate\}/);
    assert.match(projects, /Recent Projects/);
    assert.match(assets, /Upload Asset/);
    assert.match(assets, /role="alert"/);
    assert.match(assets, /Asset upload failed/);
    assert.match(shell, /uploading=\{assetUploading\} error=\{projectError\}/);
    assert.match(projectRoute, /authorizeCreatorRequest/);
    assert.match(projectRoute, /getCreatorProject\(user, payload\.projectId/);
});

test('Selena renders structured plans and approval-aware action cards', async () => {
    const creator = await read('../packages/studio/src/components/CreatorStudio.jsx');
    assert.match(creator, /data\.suggestedActions/);
    assert.match(creator, /message\.plan/);
    assert.match(creator, /action\.requiresApproval/);
    assert.match(creator, /Review action/);
    assert.match(creator, /Cancel/);
    assert.match(creator, /projectId: project\?\.id/);
    assert.doesNotMatch(creator, /project:\s*project/);
});

test('Storyboard persistence produces a versioned timeline boundary without claiming rendered transitions', async () => {
    const storyboard = await read('../packages/studio/src/components/StoryboardWorkspace.jsx');
    const timeline = await read('../src/lib/creatorTimeline.js');
    assert.match(storyboard, /onStoryboardChange/);
    assert.match(storyboard, /project\.storyboard/);
    assert.match(timeline, /CREATOR_TIMELINE_VERSION = 1/);
    assert.match(timeline, /rendered: false/);
    assert.match(timeline, /status: 'not-requested'/);
    assert.doesNotMatch(timeline, /ffmpeg|renderVideo|composeVideo/);
});

test('legacy Agent Builder routes through Studio-contained Agent Blueprints paths', async () => {
    const agents = await read('../packages/studio/src/components/AgentStudio.jsx');
    const shell = await read('../components/StandaloneShell.js');
    assert.match(agents, /basePath = "\/agents"/);
    assert.match(shell, /basePath="\/studio\/advanced\/agents"/);
    assert.doesNotMatch(shell, /window\.history\.pushState|window\.location\.reload/);
});

test('asset handoff populates Graphic Studio, Storyboard, and Lip Sync without requiring a URL copy', async () => {
    const storyboard = await read('../packages/studio/src/components/StoryboardWorkspace.jsx');
    const lipSync = await read('../packages/studio/src/components/LipSyncStudio.jsx');
    const shell = await read('../components/StandaloneShell.js');
    assert.match(storyboard, /initialAsset\.type === 'image'/);
    assert.match(lipSync, /setVideoUrl\(initialAsset\.url\)/);
    assert.match(lipSync, /setImageUrl\(initialAsset\.url\)/);
    assert.match(shell, /'graphic-studio': '\/studio\/apps\/graphic-studio'/);
    assert.match(shell, /<GraphicStudio[^>]*initialAsset=\{handoffAsset\}/);
});

test('no new provider key is embedded in the integrated shell or secure Creator client', async () => {
    const shell = await read('../components/StandaloneShell.js');
    const creator = await read('../packages/studio/src/components/CreatorStudio.jsx');
    assert.doesNotMatch(shell, /MUAPI_(?:API_KEY|PRODUCTION_API_KEY)\s*=/);
    assert.doesNotMatch(creator, /x-api-key/);
    assert.match(creator, /Provider keys never enter the browser/);
});

test('legacy credentials are requested inside the Creator shell instead of replacing navigation', async () => {
    const shell = await read('../components/StandaloneShell.js');
    assert.doesNotMatch(shell, /return <ApiKeyModal/);
    assert.match(shell, /LEGACY_DESTINATIONS\.has\(destinationId\).*requiredFor=\{destination\.label\}/s);
    assert.doesNotMatch(shell.match(/const LEGACY_DESTINATIONS = new Set\(\[([\s\S]*?)\]\);/)?.[1] || '', /graphic-studio|graphics/);
});

test('Music Video reuses the real Storyboard workspace and Workflow exits without a reload loop', async () => {
    const shell = await read('../components/StandaloneShell.js');
    const workflow = await read('../packages/studio/src/components/WorkflowStudio.jsx');
    const workflowUi = await read('../packages/studio/src/components/WorkflowUI.jsx');
    assert.match(shell, /case 'music-video': return <CreatorStudio[^>]*initialToolId="storyboard"/);
    assert.doesNotMatch(workflow, /window\.location\.reload|fromWorkflowBuilder/);
    assert.doesNotMatch(workflowUi, /fromWorkflowBuilder|sessionStorage/);
});

test('unified Publish preserves direct YouTube and adds secure Asset handoff for Instagram and TikTok', async () => {
    const shell = await read('../components/StandaloneShell.js');
    const assets = await read('../components/StudioAssets.js');
    const social = await read('../packages/studio/src/components/SocialPublishStudio.jsx');
    const route = await read('../app/api/social/muapi/[[...path]]/route.js');
    assert.match(shell, /<SocialPublishStudio initialAsset=\{handoffAsset\}/);
    assert.match(shell, /youtubeWorkspace=\{<CreatorStudio/);
    assert.match(shell, /'publish': '\/studio\/publish'/);
    assert.match(assets, /onOpen\?\.\(asset, 'publish'\)/);
    assert.match(social, /Review Publish/);
    assert.match(social, /approved: true/);
    assert.match(social, /Scheduling is not available/);
    assert.doesNotMatch(social, /MUAPI_(?:SOCIAL_|PRODUCTION_)?API_KEY|x-api-key/);
    assert.match(route, /authorizeCreatorRequest/);
    assert.match(route, /evaluateJsonSafety/);
});

test('Selena action handoff rejects a stale or foreign-Project asset instead of navigating silently', async () => {
    const shell = await read('../components/StandaloneShell.js');
    assert.match(shell, /assets\.find\(\(asset\) => asset\.id === action\.parameters\.assetId\)/);
    assert.match(shell, /if \(!requestedAsset\) \{/);
    assert.match(shell, /no longer available in this Project/);
    assert.match(shell, /setHandoffAsset\(null\);\s*\n\s*return;/);
});

test('shell mount does not seed a previous Project\'s cached Assets while a durable Project load is pending', async () => {
    const shell = await read('../components/StandaloneShell.js');
    assert.match(shell, /pendingProjectId = window\.localStorage\.getItem\(CURRENT_PROJECT_STORAGE_KEY\)/);
    assert.match(shell, /if \(!pendingProjectId\) setAssets\(loadAssets\(\)\);/);
});

test('Social publish confirmation guards against a double-submit race with a synchronous ref', async () => {
    const social = await read('../packages/studio/src/components/SocialPublishStudio.jsx');
    assert.match(social, /const publishInFlightRef = useRef\(false\);/);
    assert.match(social, /if \(publishInFlightRef\.current \|\| working \|\| !approved\) return;/);
    assert.match(social, /publishInFlightRef\.current = true;/);
    assert.match(social, /publishInFlightRef\.current = false;/);
});
