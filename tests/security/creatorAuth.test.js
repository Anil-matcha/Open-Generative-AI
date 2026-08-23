import assert from 'node:assert/strict';
import test from 'node:test';

import {
    authenticateCreatorRequest,
    createCreatorSession,
    creatorCookieSettings,
    isAllowedGithubIdentity,
    isSameOriginMutation,
    safeCreatorReturnPath,
    verifyCreatorSession,
} from '../../src/lib/creatorAuth.js';

const env = {
    NODE_ENV: 'production',
    CREATOR_SESSION_SECRET: 'creator-auth-test-secret-that-is-longer-than-thirty-two-characters',
    CREATOR_SESSION_TTL_SECONDS: '28800',
    CREATOR_GITHUB_ALLOWED_USER_IDS: '12345678',
    CREATOR_GITHUB_ALLOWED_LOGINS: 'lalambert1982-eng',
};
const user = { id: 12345678, login: 'lalambert1982-eng' };
const now = Date.UTC(2026, 7, 23, 16, 0, 0);

test('signed Creator Studio sessions validate only for the allowlisted GitHub identity', () => {
    const token = createCreatorSession(user, { env, now });
    assert.deepEqual(verifyCreatorSession(token, { env, now: now + 60_000 }).user, {
        id: '12345678',
        login: 'lalambert1982-eng',
    });
    assert.equal(verifyCreatorSession(`${token}x`, { env, now }).valid, false);
    assert.equal(verifyCreatorSession(token, { env, now: now + 28_801_000 }).valid, false);
    assert.equal(isAllowedGithubIdentity({ id: 87654321, login: user.login }, env).allowed, false);
    assert.equal(isAllowedGithubIdentity({ id: user.id, login: 'attacker' }, env).allowed, false);
});

test('session cookie authentication does not accept the legacy access-key header', () => {
    const token = createCreatorSession(user, { env, now });
    const cookieName = creatorCookieSettings(env).sessionName;
    const authenticated = authenticateCreatorRequest(new Request('https://local.test/api/creator/providers', {
        headers: { cookie: `${cookieName}=${token}` },
    }), { env, now: now + 60_000 });
    assert.equal(authenticated.valid, true);

    const legacyHeaderOnly = authenticateCreatorRequest(new Request('https://local.test/api/creator/providers', {
        headers: { 'x-studio-access-key': 'legacy-shared-key-that-must-not-work-anymore' },
    }), { env, now });
    assert.equal(legacyHeaderOnly.valid, false);
});

test('production session cookies use the host-only secure prefix', () => {
    assert.equal(creatorCookieSettings(env).sessionName, '__Host-creator_session');
    assert.equal(creatorCookieSettings(env).secure, true);
    assert.equal(creatorCookieSettings({ NODE_ENV: 'development' }).sessionName, 'creator_session');
});

test('mutation origin checks and return paths reject cross-site values', () => {
    assert.equal(isSameOriginMutation(new Request('https://studio.test/api/creator/image', {
        method: 'POST',
        headers: { origin: 'https://studio.test', 'sec-fetch-site': 'same-origin' },
    })), true);
    assert.equal(isSameOriginMutation(new Request('https://studio.test/api/creator/image', {
        method: 'POST',
        headers: { origin: 'https://attacker.test', 'sec-fetch-site': 'cross-site' },
    })), false);
    assert.equal(safeCreatorReturnPath('/studio/creator'), '/studio/creator');
    assert.equal(safeCreatorReturnPath('https://attacker.test'), '/studio/creator');
    assert.equal(safeCreatorReturnPath('//attacker.test/studio'), '/studio/creator');
});
