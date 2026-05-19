import { chromium } from '@playwright/test';

const apps = [
  { name: 'vibe-workflow', path: '/apps/vibe-workflow/', factory: 'WorkflowBuilderApp' },
  { name: 'open-pomelli', factory: 'PomelliStudio', path: '', note: 'Router key: pomelli-studio' },
  { name: 'remix-go', factory: 'RemixGoApp', path: '', note: 'Router key: remix-go' },
  { name: 'headshot', factory: 'HeadshotStudio', path: '', note: 'Router key: ai-headshot' },
];

const errors = [];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  context.on('pageerror', (err) => {
    console.error('[PAGE ERROR]', err.message);
    errors.push({ type: 'pageerror', message: err.message, stack: err.stack });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
      errors.push({ type: 'console', message: msg.text() });
    }
  });

  page.on('requestfailed', (req) => {
    console.log(`[FAILED REQUEST] ${req.url()} - ${req.failure().errorText}`);
    errors.push({ type: 'requestfailed', url: req.url(), error: req.failure().errorText });
  });

  for (const app of apps) {
    console.log(`
===== TESTING: ${app.name} =====`);
    const url = app.path ? `http://localhost:8080#${app.path}` : `http://localhost:8080`;
    console.log(`Navigating to: ${url}`);

    try {
      const resp = await page.goto(url, { waitUntil: 'commit', timeout: 15000 });
      console.log(`Response status: ${resp?.status()}`);
      await page.waitForTimeout(4000);
      const title = await page.title();
      console.log(`Page title: "${title}"`);
      const errorEls = await page.$$('.text-red-400');
      for (const el of errorEls) {
        const text = await el.textContent();
        console.log(`[PAGE ERROR ELEMENT]: ${text}`);
        errors.push({ type: 'page-element', message: text });
      }
    } catch(e) {
      console.error(`[NAVIGATION ERROR] ${app.name}: ${e.message}`);
      errors.push({ type: 'navigation', app: app.name, message: e.message });
    }

    try { await page.goto('about:blank'); } catch(e) {}
  }

  await browser.close();

  console.log(`

===== ERROR SUMMARY =====`);
  errors.forEach(e => {
    console.log(`[${e.type.toUpperCase()}] ${e.message || e.url || JSON.stringify(e)}`);
  });
  console.log(`Total errors: ${errors.length}`);
})();
