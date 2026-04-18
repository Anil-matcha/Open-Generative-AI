/**
 * Advanced Authentication Hardening E2E Tests
 * Tests multi-factor authentication, biometric authentication, advanced security measures
 */

import { test, expect } from '@playwright/test';

test.describe('Multi-Factor Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should require MFA setup for new users', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.locator('input[name="email"]').fill('newuser@example.com');
    await page.locator('input[name="password"]').fill('SecurePass123!');
    await page.locator('input[name="confirmPassword"]').fill('SecurePass123!');
    await page.locator('button[type="submit"]').click();

    // Should redirect to MFA setup
    await page.waitForURL('**/mfa-setup');

    // Verify MFA setup UI is present
    await expect(page.locator('.mfa-setup')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /setup.*authenticator/i })).toBeVisible();
  });

  test('should handle TOTP MFA verification', async ({ page }) => {
    // Setup authenticated state with MFA required
    await page.evaluate(() => {
      localStorage.setItem('auth_token_jwt', JSON.stringify({
        value: 'jwt-token',
        type: 'jwt',
        encrypted: true,
        mfaRequired: true,
        mfaVerified: false
      }));
    });

    await page.goto('/dashboard');

    // Should redirect to MFA verification
    await page.waitForURL('**/mfa-verify');

    // Mock successful TOTP verification
    await page.route('**/api/auth/verify-mfa', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mfa-verified-jwt'
        })
      });
    });

    // Enter TOTP code
    await page.locator('input[name="totp"]').fill('123456');
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should support SMS-based MFA', async ({ page }) => {
    await page.goto('/login');

    // Login with MFA-enabled account
    await page.locator('input[name="email"]').fill('mfa-user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Should show MFA method selection
    await expect(page.locator('.mfa-methods')).toBeVisible();

    // Select SMS
    await page.locator('button').filter({ hasText: /sms/i }).click();

    // Mock SMS sending
    await page.route('**/api/auth/send-sms', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Enter phone number if required
    const phoneInput = page.locator('input[name="phone"]');
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+1234567890');
      await page.locator('button').filter({ hasText: /send.*code/i }).click();
    }

    // Enter SMS code
    await page.locator('input[name="smsCode"]').fill('123456');

    // Mock SMS verification
    await page.route('**/api/auth/verify-sms', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'sms-verified-jwt'
        })
      });
    });

    await page.locator('button[type="submit"]').click();

    // Should login successfully
    await page.waitForURL('**/dashboard');
  });

  test('should handle biometric authentication', async ({ page }) => {
    await page.goto('/login');

    // Login with biometric-enabled account
    await page.locator('input[name="email"]').fill('biometric-user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Should show biometric prompt
    await expect(page.locator('.biometric-prompt')).toBeVisible();

    // Mock WebAuthn API
    await page.evaluate(() => {
      navigator.credentials = {
        get: async () => ({
          id: 'credential-id',
          type: 'public-key',
          response: {
            authenticatorData: 'auth-data',
            signature: 'signature',
            userHandle: 'user-handle'
          }
        })
      };
    });

    // Click biometric button
    await page.locator('button').filter({ hasText: /biometric|face.*id|fingerprint/i }).click();

    // Mock biometric verification
    await page.route('**/api/auth/verify-biometric', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'biometric-verified-jwt'
        })
      });
    });

    // Should login successfully
    await page.waitForURL('**/dashboard');
  });

  test('should enforce MFA for sensitive operations', async ({ page }) => {
    // Setup authenticated state
    await page.evaluate(() => {
      localStorage.setItem('auth_token_jwt', JSON.stringify({
        value: 'jwt-token',
        type: 'jwt',
        encrypted: true,
        mfaVerified: true
      }));
    });

    await page.goto('/account/settings');

    // Attempt sensitive operation (password change)
    await page.locator('button').filter({ hasText: /change.*password/i }).click();

    // Should require MFA verification again
    await expect(page.locator('.mfa-verify')).toBeVisible();

    // Mock MFA verification for sensitive operation
    await page.route('**/api/auth/verify-mfa', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'sensitive-op-verified'
        })
      });
    });

    await page.locator('input[name="totp"]').fill('123456');
    await page.locator('button[type="submit"]').click();

    // Should proceed to password change form
    await expect(page.locator('.password-change-form')).toBeVisible();
  });

  test('should handle MFA recovery', async ({ page }) => {
    await page.goto('/login');

    // Login attempt
    await page.locator('input[name="email"]').fill('mfa-user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Click recovery link
    await page.locator('a').filter({ hasText: /recovery|backup/i }).click();

    // Should show recovery options
    await expect(page.locator('.mfa-recovery')).toBeVisible();

    // Mock backup codes
    await page.route('**/api/auth/recovery-codes', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          codes: ['ABC123', 'DEF456', 'GHI789']
        })
      });
    });

    // Enter backup code
    await page.locator('input[name="backupCode"]').fill('ABC123');

    // Mock backup code verification
    await page.route('**/api/auth/verify-backup-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'backup-verified-jwt'
        })
      });
    });

    await page.locator('button[type="submit"]').click();

    // Should login successfully
    await page.waitForURL('**/dashboard');
  });
});

test.describe('Advanced Security Measures', () => {
  test('should implement account lockout after failed attempts', async ({ page }) => {
    await page.goto('/login');

    // Multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await page.locator('input[name="email"]').fill('user@example.com');
      await page.locator('input[name="password"]').fill('wrongpassword' + i);
      await page.locator('button[type="submit"]').click();

      // Mock failed login response
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid credentials',
            attemptsRemaining: Math.max(0, 4 - i)
          })
        });
      }, { times: 1 });
    }

    // Should show account locked message
    await expect(page.locator('.account-locked, .error-message')).toBeVisible();
    await expect(page.locator('text=/account.*locked|too.*many.*attempts/i')).toBeVisible();

    // Login button should be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('should prevent concurrent sessions', async ({ page, context }) => {
    // Setup authenticated session in first context
    await page.evaluate(() => {
      localStorage.setItem('auth_token_jwt', JSON.stringify({
        value: 'jwt-token',
        type: 'jwt',
        encrypted: true,
        sessionId: 'session-1'
      }));
    });

    await page.goto('/dashboard');

    // Create second context (simulating another device/browser)
    const newContext = await context.browser().newContext();
    const newPage = await newContext.newPage();

    await newPage.goto('/login');

    // Login with same credentials
    await newPage.locator('input[name="email"]').fill('user@example.com');
    await newPage.locator('input[name="password"]').fill('password123');

    // Mock login that terminates other sessions
    await newPage.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token',
          terminateOtherSessions: true
        })
      });
    });

    await newPage.locator('button[type="submit"]').click();

    // First session should be terminated
    await page.reload();
    await page.waitForURL('**/login');

    // Should show session terminated message
    await expect(page.locator('.session-terminated')).toBeVisible();

    await newContext.close();
  });

  test('should implement device fingerprinting', async ({ page }) => {
    const deviceFingerprint = {
      userAgent: 'test-agent',
      screenResolution: '1920x1080',
      timezone: 'UTC',
      language: 'en-US',
      platform: 'test-platform'
    };

    // Mock device fingerprint collection
    await page.evaluate((fp) => {
      window.deviceFingerprint = fp;
    }, deviceFingerprint);

    await page.goto('/login');

    // Login attempt
    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // Mock login that checks device fingerprint
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-token',
          deviceFingerprint: deviceFingerprint,
          newDevice: false
        })
      });
    });

    await page.locator('button[type="submit"]').click();

    // Should login normally (known device)
    await page.waitForURL('**/dashboard');
  });

  test('should handle suspicious activity detection', async ({ page }) => {
    await page.goto('/login');

    // Login from unusual location/IP
    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');

    // Mock suspicious login detection
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-token',
          suspiciousActivity: true,
          requireVerification: true
        })
      });
    });

    await page.locator('button[type="submit"]').click();

    // Should require additional verification
    await expect(page.locator('.suspicious-activity')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /verify.*email|send.*code/i })).toBeVisible();

    // Mock email verification
    await page.route('**/api/auth/verify-email', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.locator('button').filter({ hasText: /verify.*email/i }).click();
    await page.locator('input[name="verificationCode"]').fill('123456');

    await page.route('**/api/auth/verify-code', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'verified-jwt-token'
        })
      });
    });

    await page.locator('button[type="submit"]').click();

    // Should proceed to dashboard
    await page.waitForURL('**/dashboard');
  });
});

test.describe('Session Security', () => {
  test('should implement session timeout', async ({ page }) => {
    // Setup authenticated state with short session timeout
    await page.evaluate(() => {
      localStorage.setItem('auth_token_jwt', JSON.stringify({
        value: 'jwt-token',
        type: 'jwt',
        encrypted: true,
        expires: Date.now() + 300000, // 5 minutes
        sessionTimeout: 60000 // 1 minute session timeout
      }));
      localStorage.setItem('session_start', (Date.now() - 65000).toString()); // Session started 65 seconds ago
    });

    await page.goto('/dashboard');

    // Should redirect to login due to session timeout
    await page.waitForURL('**/login');

    // Should show session expired message
    await expect(page.locator('.session-expired')).toBeVisible();
  });

  test('should handle remember me functionality securely', async ({ page }) => {
    await page.goto('/login');

    // Fill login form with remember me checked
    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('input[name="rememberMe"]').check();

    // Mock login with remember me
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-token',
          refreshToken: 'long-lived-refresh-token',
          rememberMe: true,
          expiresIn: 2592000 // 30 days
        })
      });
    });

    await page.locator('button[type="submit"]').click();

    // Should store tokens with longer expiry
    const storedTokens = await page.evaluate(() => ({
      jwt: localStorage.getItem('auth_token_jwt'),
      refresh: localStorage.getItem('auth_token_refresh')
    }));

    expect(storedTokens.jwt).toBeTruthy();
    expect(storedTokens.refresh).toBeTruthy();

    // Close and reopen browser
    await page.reload();

    // Should still be logged in
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should implement secure session storage', async ({ page }) => {
    await page.goto('/login');

    // Mock successful login
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-token-123',
          sessionId: 'secure-session-id',
          encryptedSession: 'encrypted-session-data'
        })
      });
    });

    await page.locator('input[name="email"]').fill('user@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Check that session data is stored securely
    const sessionData = await page.evaluate(() => ({
      sessionId: sessionStorage.getItem('session_id'),
      encryptedData: sessionStorage.getItem('encrypted_session'),
      jwtToken: localStorage.getItem('auth_token_jwt')
    }));

    expect(sessionData.sessionId).toBe('secure-session-id');
    expect(sessionData.encryptedData).toBe('encrypted-session-data');
    expect(sessionData.jwtToken).toBeTruthy();
  });
});</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/tests/e2e/advanced-auth-hardening.e2e.spec.ts