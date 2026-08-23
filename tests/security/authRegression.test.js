import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function source(relativePath) {
  return readFile(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

test('agent server pages no longer read API keys from cookies', async () => {
  const files = [
    'app/agents/[agent_id]/page.js',
    'app/agents/[agent_id]/[conversation_id]/page.js',
    'app/agents/create/page.js',
    'app/agents/edit/[id]/page.js',
  ];
  for (const file of files) {
    const text = await source(file);
    assert.equal(text.includes('next/headers'), false, file);
    assert.equal(text.includes('cookies()'), false, file);
    assert.equal(text.includes('muapi_key'), false, file);
  }
});

test('web BYOK storage is session-scoped and legacy cookies are only deleted', async () => {
  const shell = await source('components/StandaloneShell.js');
  const agentAuth = await source('app/agents/useAgentAuth.js');
  assert.equal(shell.includes('sessionStorage.setItem(STORAGE_KEY, key)'), true);
  assert.equal(shell.includes('localStorage.setItem(STORAGE_KEY, key)'), false);
  assert.equal(shell.includes('max-age=31536000'), false);
  assert.equal(agentAuth.includes('document.cookie'), false);
});

test('middleware no longer rewrites authenticated API paths directly upstream', async () => {
  const middleware = await source('middleware.js');
  assert.equal(middleware.includes('NextResponse.rewrite'), false);
  assert.equal(middleware.includes("'unsafe-eval'"), true);
  assert.equal(middleware.includes("NODE_ENV === 'development'"), true);
  assert.equal(middleware.includes("script-src 'self' 'unsafe-inline'"), false);
  assert.equal(middleware.includes("'nonce-${nonce}'"), true);
});

test('Creator Studio uses GitHub identity sessions instead of a browser-readable shared key', async () => {
  const creator = await source('packages/studio/src/components/CreatorStudio.jsx');
  const gateway = await source('src/lib/creatorProviderGateway.js');
  const auth = await source('src/lib/creatorAuth.js');
  const oauthStart = await source('app/api/auth/github/start/route.js');
  const oauthCallback = await source('app/api/auth/github/callback/route.js');
  const workflowStudio = await source('packages/studio/src/components/WorkflowStudio.jsx');

  assert.equal(creator.includes('creator_studio_access_key'), false);
  assert.equal(creator.includes('x-studio-access-key'), false);
  assert.equal(creator.includes('Continue with GitHub'), true);
  assert.equal(creator.includes('/api/auth/session'), true);
  assert.equal(creator.includes('/api/auth/logout'), true);
  assert.equal(gateway.includes('authenticateCreatorRequest'), true);
  assert.equal(gateway.includes('CREATOR_STUDIO_ACCESS_KEY'), false);
  assert.equal(auth.includes('__Host-creator_session'), false);
  assert.equal(auth.includes("`${prefix}creator_session`"), true);
  assert.equal(oauthStart.includes('code_challenge_method'), true);
  assert.equal(oauthStart.includes("authorizeUrl.searchParams.set('state'"), true);
  assert.equal(oauthStart.includes("authorizeUrl.searchParams.set('scope', 'offline_access')"), true);
  assert.equal(oauthStart.includes('repo'), false);
  assert.match(
    oauthCallback,
    /githubJson\(\s*['"]https:\/\/api\.github\.com\/user['"]\s*,/,
  );
  assert.equal(oauthCallback.includes('createCreatorSession'), true);
  assert.equal(oauthCallback.includes('response.cookies.set'), true);
  assert.equal(workflowStudio.includes('wl_workflow_token'), false);
});
