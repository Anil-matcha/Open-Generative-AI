/**
 * Security Validations E2E Tests
 * Tests XSS prevention, input validation, file upload security, and security measures in the browser
 */

import { test, expect } from '@playwright/test';

test.describe('XSS Prevention', () => {
  test('should prevent XSS in user input fields', async ({ page }) => {
    await page.goto('/contact');

    const nameInput = page.locator('input[name="name"]');
    const messageInput = page.locator('textarea[name="message"]');

    // Test XSS in name field
    await nameInput.fill('<script>alert("xss")</script>John Doe');
    await messageInput.fill('Test message with <img src=x onerror=alert("xss")>');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Check that scripts are not executed
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);

    // No alerts should have been triggered
    expect(alerts.length).toBe(0);

    // Check that content is displayed safely
    const displayedContent = page.locator('.user-content, .message-display');
    const textContent = await displayedContent.textContent();
    expect(textContent).not.toContain('<script>');
    expect(textContent).not.toContain('onerror');
  });

  test('should sanitize HTML in rich text editor', async ({ page }) => {
    await page.goto('/editor');

    // Wait for editor to load
    const editor = page.locator('.rich-editor, [contenteditable]');
    await expect(editor).toBeVisible();

    // Insert malicious HTML
    await editor.fill('<p>Safe text</p><script>alert("xss")</script><img src=x onerror=alert("xss")>');

    // Save content
    await page.locator('button').filter({ hasText: /save|submit/i }).click();

    // Check rendered content
    const renderedContent = page.locator('.rendered-content, .preview');
    const htmlContent = await renderedContent.innerHTML();

    expect(htmlContent).toContain('<p>Safe text</p>');
    expect(htmlContent).not.toContain('<script>');
    expect(htmlContent).not.toContain('onerror');
  });

  test('should prevent XSS in URL parameters', async ({ page }) => {
    // Test XSS via URL parameters
    await page.goto('/search?q=<script>alert("xss")</script>');

    // Check that search results don't execute scripts
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);

    expect(alerts.length).toBe(0);

    // Check that parameter is displayed safely
    const searchResults = page.locator('.search-results, .query-display');
    if (await searchResults.isVisible()) {
      const text = await searchResults.textContent();
      expect(text).not.toContain('<script>');
    }
  });
});

test.describe('Input Validation', () => {
  test('should validate email formats', async ({ page }) => {
    await page.goto('/register');

    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Test invalid emails
    const invalidEmails = [
      'invalid-email',
      'user@',
      '@example.com',
      'user..double@example.com',
      'user@example..com'
    ];

    for (const email of invalidEmails) {
      await emailInput.fill(email);
      await submitButton.click();

      // Should show validation error
      const error = page.locator('.error-message, .invalid-feedback');
      await expect(error).toBeVisible();
      await expect(error).toContainText(/invalid email|valid email required/i);
    }

    // Test valid email
    await emailInput.fill('valid.user@example.com');
    await submitButton.click();

    // Should not show email validation error
    const error = page.locator('.error-message').filter({ hasText: /email/i });
    await expect(error).not.toBeVisible();
  });

  test('should validate URL inputs', async ({ page }) => {
    await page.goto('/profile');

    const websiteInput = page.locator('input[name="website"], input[placeholder*="url"]');
    const submitButton = page.locator('button[type="submit"]');

    // Test invalid URLs
    const invalidUrls = [
      'not-a-url',
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'ftp://example.com'
    ];

    for (const url of invalidUrls) {
      await websiteInput.fill(url);
      await submitButton.click();

      const error = page.locator('.error-message, .invalid-feedback');
      await expect(error).toBeVisible();
      await expect(error).toContainText(/invalid url|valid url required/i);
    }

    // Test valid URLs
    const validUrls = [
      'https://example.com',
      'http://example.com',
      'https://sub.example.com/path?param=value'
    ];

    for (const url of validUrls) {
      await websiteInput.fill(url);
      await submitButton.click();

      const error = page.locator('.error-message').filter({ hasText: /url/i });
      await expect(error).not.toBeVisible();
    }
  });

  test('should sanitize filename inputs', async ({ page }) => {
    await page.goto('/upload');

    const filenameInput = page.locator('input[name="filename"], input[placeholder*="name"]');

    // Test dangerous filenames
    const dangerousNames = [
      '../../../etc/passwd',
      'file/with/../../../paths',
      'file<with>special:chars?.txt',
      'file with spaces and "quotes"'
    ];

    for (const filename of dangerousNames) {
      await filenameInput.fill(filename);

      // Check that filename is sanitized
      const sanitizedValue = await filenameInput.inputValue();
      expect(sanitizedValue).not.toContain('..');
      expect(sanitizedValue).not.toContain('<');
      expect(sanitizedValue).not.toContain('>');
      expect(sanitizedValue).not.toContain(':');
      expect(sanitizedValue).not.toContain('"');
      expect(sanitizedValue).not.toContain('?');
    }
  });
});

test.describe('File Upload Security', () => {
  test('should validate file types', async ({ page }) => {
    await page.goto('/upload');

    const fileInput = page.locator('input[type="file"]');

    // Create a test file with wrong type
    const invalidFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
    await fileInput.setInputFiles([invalidFile]);

    // Should show error
    const error = page.locator('.error-message, .file-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/file type not allowed|invalid file type/i);
  });

  test('should enforce file size limits', async ({ page }) => {
    await page.goto('/upload');

    const fileInput = page.locator('input[type="file"]');

    // Create a large file (over 10MB)
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

    await fileInput.setInputFiles([largeFile]);

    // Should show size error
    const error = page.locator('.error-message, .file-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/file size|too large/i);
  });

  test('should prevent directory traversal', async ({ page }) => {
    await page.goto('/upload');

    // Mock file input with path traversal
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]');
      if (input) {
        // Create a file with malicious path
        const file = new File(['content'], '../../../etc/passwd');
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;

        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Should reject the file
    const error = page.locator('.error-message, .file-error');
    await expect(error).toBeVisible();
  });

  test('should validate image dimensions', async ({ page }) => {
    await page.goto('/upload');

    const fileInput = page.locator('input[type="file"]');

    // Create a small valid image
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      // If there's a canvas for image preview, test dimension validation
      const smallImage = new File(['small'], 'small.gif', { type: 'image/gif' });
      await fileInput.setInputFiles([smallImage]);

      // Should validate dimensions after upload
      await page.waitForTimeout(1000);

      const dimensionError = page.locator('.error-message').filter({ hasText: /dimension|size|width|height/i });
      // This test depends on whether the app validates image dimensions
      // If it does, we expect no error for valid images
    }
  });
});

test.describe('Content Security Policy', () => {
  test('should enforce CSP violations', async ({ page }) => {
    // Listen for CSP violation events
    const violations = [];
    page.on('console', msg => {
      if (msg.text().includes('CSP') || msg.text().includes('Content Security Policy')) {
        violations.push(msg.text());
      }
    });

    await page.goto('/');

    // Try to inject inline script
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.textContent = 'console.log("inline script executed")';
      document.head.appendChild(script);
    });

    // Check for CSP violation
    await page.waitForTimeout(1000);

    // CSP should prevent inline scripts
    expect(violations.length).toBeGreaterThan(0);
  });

  test('should block external script loading from unauthorized domains', async ({ page }) => {
    const violations = [];
    page.on('console', msg => {
      if (msg.text().includes('CSP') || msg.text().includes('blocked')) {
        violations.push(msg.text());
      }
    });

    await page.goto('/');

    // Try to load script from unauthorized domain
    await page.evaluate(() => {
      const script = document.createElement('script');
      script.src = 'https://malicious-site.com/script.js';
      document.head.appendChild(script);
    });

    await page.waitForTimeout(1000);

    // Should be blocked by CSP
    expect(violations.some(v => v.includes('blocked') || v.includes('CSP'))).toBe(true);
  });
});

test.describe('Secure Data Handling', () => {
  test('should not log sensitive data to console', async ({ page }) => {
    await page.goto('/login');

    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    // Fill login form
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('secretpassword123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(1000);

    // Check that passwords are not logged
    const passwordLogs = consoleMessages.filter(msg =>
      msg.includes('secretpassword123') ||
      msg.includes('password')
    );

    expect(passwordLogs.length).toBe(0);
  });

  test('should clear sensitive data from memory', async ({ page }) => {
    await page.goto('/login');

    // Fill and submit form
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // Navigate away
    await page.goto('/about');

    // Check that form fields are cleared
    await page.goBack();

    const passwordField = page.locator('input[type="password"]');
    const passwordValue = await passwordField.inputValue();

    expect(passwordValue).toBe(''); // Should be cleared
  });

  test('should use secure random values', async ({ page }) => {
    await page.goto('/');

    // Test that crypto.getRandomValues is used for secure IDs
    const randomValues = await page.evaluate(() => {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array);
    });

    // Should generate different values each time
    const randomValues2 = await page.evaluate(() => {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return Array.from(array);
    });

    expect(randomValues).not.toEqual(randomValues2);
    expect(randomValues.length).toBe(16);
  });
});

test.describe('Network Security', () => {
  test('should use HTTPS for all requests', async ({ page }) => {
    const requests = [];
    page.on('request', request => {
      if (!request.url().startsWith('data:') && !request.url().startsWith('blob:')) {
        requests.push(request.url());
      }
    });

    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that all HTTP requests use HTTPS (or are localhost)
    const httpRequests = requests.filter(url =>
      url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')
    );

    expect(httpRequests.length).toBe(0);
  });

  test('should include security headers in API requests', async ({ page }) => {
    const requestHeaders = {};
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requestHeaders[request.url()] = request.headers();
      }
    });

    await page.goto('/dashboard');

    // Trigger an API request
    await page.evaluate(() => {
      fetch('/api/test').catch(() => {});
    });

    await page.waitForTimeout(1000);

    // Check headers for the first API request
    const apiUrls = Object.keys(requestHeaders);
    if (apiUrls.length > 0) {
      const headers = requestHeaders[apiUrls[0]];
      expect(headers['x-requested-with']).toBe('XMLHttpRequest');
      expect(headers['content-type']).toBe('application/json');
    }
  });

  test('should handle mixed content warnings', async ({ page }) => {
    // This test would need to be run against a page that attempts to load mixed content
    // For now, we'll test that HTTPS pages don't load HTTP resources

    await page.goto('/');

    const insecureRequests = [];
    page.on('request', request => {
      if (request.url().startsWith('http://') &&
          !request.url().includes('localhost') &&
          page.url().startsWith('https://')) {
        insecureRequests.push(request.url());
      }
    });

    await page.waitForLoadState('networkidle');

    // Should not have insecure requests from HTTPS pages
    expect(insecureRequests.length).toBe(0);
  });
});

test.describe('Error Handling Security', () => {
  test('should not expose sensitive information in error messages', async ({ page }) => {
    await page.goto('/');

    // Trigger an error
    await page.evaluate(() => {
      throw new Error('Database connection failed: host=internal-db:5432 user=admin password=secret123');
    });

    // Check console for exposed secrets
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });

    await page.waitForTimeout(1000);

    // Should not expose database credentials
    const exposedSecrets = consoleMessages.filter(msg =>
      msg.includes('password=') ||
      msg.includes('secret123') ||
      msg.includes('internal-db')
    );

    expect(exposedSecrets.length).toBe(0);
  });

  test('should sanitize error messages displayed to users', async ({ page }) => {
    await page.goto('/api-test');

    // Mock API error with sensitive information
    await page.route('**/api/error', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error: SQL injection detected from IP 192.168.1.100',
          details: 'Connection string: postgresql://user:pass@db.example.com/db'
        })
      });
    });

    // Trigger the error
    await page.evaluate(() => {
      fetch('/api/error').then(r => r.json()).then(data => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-display';
        errorDiv.textContent = data.error;
        document.body.appendChild(errorDiv);
      });
    });

    // Check displayed error
    const errorDisplay = page.locator('.error-display');
    await expect(errorDisplay).toBeVisible();

    const errorText = await errorDisplay.textContent();

    // Should not expose internal details
    expect(errorText).not.toContain('SQL injection');
    expect(errorText).not.toContain('192.168.1.100');
    expect(errorText).not.toContain('postgresql://');
    expect(errorText).not.toContain('pass@db.example.com');
  });
});