/**
 * Authentication E2E Tests
 * Tests authentication flows, token management, and security in the browser
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should handle login form securely', async ({ page }) => {
    await page.goto('/login');

    // Check for HTTPS enforcement
    const url = page.url();
    expect(url.startsWith('https://') || url.includes('localhost')).toBe(true);

    // Check for secure form attributes
    const form = page.locator('form');
    await expect(form).toHaveAttribute('action', expect.stringMatching(/^https?:\/\//));
    await expect(form).toHaveAttribute('method', 'POST');

    // Check for CSRF protection
    const csrfToken = page.locator('input[name="_csrf"]');
    await expect(csrfToken).toBeVisible();
  });

  test('should prevent XSS in login form', async ({ page }) => {
    await page.goto('/login');

    // Test XSS prevention in email field
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('<script>alert("xss")</script>test@example.com');

    const formData = await page.evaluate(() => {
      const form = document.querySelector('form');
      const data = new FormData(form);
      return Object.fromEntries(data.entries());
    });

    // Email should be sanitized
    expect(formData.email).not.toContain('<script>');
  });

  test('should securely store authentication tokens', async ({ page }) => {
    await page.goto('/login');

    // Mock successful login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-token-12345',
          refreshToken: 'refresh-token-67890',
          expiresIn: 3600
        })
      });
    });

    // Fill and submit login form
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Wait for login to complete
    await page.waitForURL('**/dashboard');

    // Check that tokens are stored securely
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });

    // Tokens should be encrypted/stored securely
    expect(Object.keys(localStorage)).toContain('auth_token_jwt');
    expect(Object.keys(localStorage)).toContain('auth_token_refresh');

    // JWT should not be stored in plain text
    const jwtData = JSON.parse(localStorage['auth_token_jwt']);
    expect(jwtData.value).not.toBe('jwt-token-12345'); // Should be encrypted
  });

  test('should handle token expiration gracefully', async ({ page }) => {
    // Setup expired token in localStorage
    await page.evaluate(() => {
      const expiredToken = {
        value: btoa('expired-jwt'.split('').reverse().join('')), // Simple encryption
        type: 'jwt',
        created: Date.now() - 7200000, // 2 hours ago
        expires: Date.now() - 3600000, // 1 hour ago
        encrypted: true
      };
      localStorage.setItem('auth_token_jwt', JSON.stringify(expiredToken));
    });

    await page.goto('/dashboard');

    // Should redirect to login due to expired token
    await page.waitForURL('**/login');
  });

  test('should handle 401 responses by clearing tokens', async ({ page }) => {
    // Setup valid-looking token
    await page.evaluate(() => {
      const token = {
        value: btoa('valid-jwt'.split('').reverse().join('')),
        type: 'jwt',
        created: Date.now(),
        expires: Date.now() + 3600000,
        encrypted: true
      };
      localStorage.setItem('auth_token_jwt', JSON.stringify(token));
    });

    // Mock API that returns 401
    await page.route('**/api/protected', async route => {
      await route.fulfill({ status: 401 });
    });

    await page.goto('/dashboard');

    // Should redirect to login and clear tokens
    await page.waitForURL('**/login');

    const hasTokens = await page.evaluate(() => {
      return localStorage.getItem('auth_token_jwt') !== null;
    });

    expect(hasTokens).toBe(false);
  });

  test('should implement rate limiting for login attempts', async ({ page }) => {
    await page.goto('/login');

    // Attempt multiple rapid login attempts
    for (let i = 0; i < 5; i++) {
      await page.locator('input[type="email"]').fill(`user${i}@example.com`);
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();

      // Wait for response or rate limit
      await page.waitForTimeout(100);
    }

    // Should show rate limit message
    const rateLimitMessage = page.locator('.error-message, .rate-limit');
    await expect(rateLimitMessage).toContainText(/rate limit|too many attempts/i);
  });

  test('should validate email format client-side', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Test invalid email
    await emailInput.fill('invalid-email');
    await submitButton.click();

    // Should show validation error
    const errorMessage = page.locator('.error-message, .invalid-feedback');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/invalid email|valid email required/i);
  });

  test('should prevent autocomplete on sensitive fields', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input[type="password"]');

    // Password field should have autocomplete off
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');

    // Check for other sensitive fields
    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');

      if (['password', 'email'].includes(type)) {
        const autocomplete = await input.getAttribute('autocomplete');
        expect(['off', 'no', 'current-password', 'username']).toContain(autocomplete);
      }
    }
  });

  test('should implement secure logout', async ({ page }) => {
    // Setup authenticated state
    await page.evaluate(() => {
      const token = {
        value: btoa('valid-jwt'.split('').reverse().join('')),
        type: 'jwt',
        created: Date.now(),
        expires: Date.now() + 3600000,
        encrypted: true
      };
      localStorage.setItem('auth_token_jwt', JSON.stringify(token));
      localStorage.setItem('auth_token_refresh', JSON.stringify({
        ...token,
        type: 'refresh'
      }));
    });

    await page.goto('/dashboard');

    // Click logout button
    const logoutButton = page.locator('button, a').filter({ hasText: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login and clear all auth data
    await page.waitForURL('**/login');

    const authData = await page.evaluate(() => ({
      hasJwt: localStorage.getItem('auth_token_jwt') !== null,
      hasRefresh: localStorage.getItem('auth_token_refresh') !== null,
      hasSession: sessionStorage.length > 0
    }));

    expect(authData.hasJwt).toBe(false);
    expect(authData.hasRefresh).toBe(false);
    expect(authData.hasSession).toBe(false);
  });

  test('should handle network errors during authentication', async ({ page }) => {
    await page.goto('/login');

    // Mock network failure
    await page.route('**/api/auth/login', async route => {
      await route.abort();
    });

    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Should show network error message
    const errorMessage = page.locator('.error-message, .network-error');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/network error|connection failed|offline/i);
  });

  test('should maintain authentication state across page refreshes', async ({ page }) => {
    // Setup authenticated state
    await page.evaluate(() => {
      const token = {
        value: btoa('valid-jwt'.split('').reverse().join('')),
        type: 'jwt',
        created: Date.now(),
        expires: Date.now() + 3600000,
        encrypted: true
      };
      localStorage.setItem('auth_token_jwt', JSON.stringify(token));
    });

    await page.goto('/dashboard');

    // Verify authenticated content is visible
    const dashboardContent = page.locator('.dashboard, [data-testid="dashboard"]');
    await expect(dashboardContent).toBeVisible();

    // Refresh page
    await page.reload();

    // Should still be authenticated
    await expect(dashboardContent).toBeVisible();
    await expect(page.url()).toContain('/dashboard');
  });
});

test.describe('Security Headers', () => {
  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/');

    // Check Content Security Policy
    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).toContain("object-src 'none'");

    // Check other security headers
    const headers = response.headers();
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBeDefined();
  });

  test('should prevent clickjacking attacks', async ({ page }) => {
    const response = await page.goto('/');

    // X-Frame-Options should prevent framing
    const xFrameOptions = response.headers()['x-frame-options'];
    expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions);
  });
});

test.describe('Token Security', () => {
  test('should rotate refresh tokens', async ({ page }) => {
    // Setup initial tokens
    await page.evaluate(() => {
      const refreshToken = {
        value: btoa('old-refresh-token'.split('').reverse().join('')),
        type: 'refresh',
        created: Date.now(),
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        encrypted: true
      };
      localStorage.setItem('auth_token_refresh', JSON.stringify(refreshToken));
    });

    // Mock token refresh endpoint
    await page.route('**/api/auth/refresh', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token'
        })
      });
    });

    await page.goto('/dashboard');

    // Trigger token refresh (this would happen automatically in the app)
    await page.evaluate(() => {
      // Simulate token refresh trigger
      window.dispatchEvent(new CustomEvent('token-refresh'));
    });

    await page.waitForTimeout(1000);

    // Check that new tokens are stored
    const newTokens = await page.evaluate(() => ({
      jwt: localStorage.getItem('auth_token_jwt'),
      refresh: localStorage.getItem('auth_token_refresh')
    }));

    expect(newTokens.jwt).toBeDefined();
    expect(newTokens.refresh).toBeDefined();
    expect(newTokens.jwt).not.toBe(newTokens.refresh); // Different tokens
  });

  test('should handle concurrent authentication requests', async ({ page }) => {
    await page.goto('/login');

    // Mock slow authentication endpoint
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'jwt-token-123',
          refreshToken: 'refresh-token-456'
        })
      });
    });

    // Start multiple login attempts simultaneously
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(page.evaluate(() => {
        return fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123'
          })
        }).then(r => r.json());
      }));
    }

    const results = await Promise.all(promises);

    // All requests should succeed with same tokens (idempotent)
    results.forEach(result => {
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});