# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: main-app/timeline-editor.e2e.spec.ts >> Animation System >> should apply rendiv animation
- Location: tests/e2e/main-app/timeline-editor.e2e.spec.ts:314:3

# Error details

```
Error: page.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('[data-testid="rendiv-animation-btn"]')

```

```
Error: browserContext.close: Target page, context or browser has been closed
```