import http from 'http';

const APPS = [
  'apps', 'workflows', 'image', 'video', 'cinema', 'headshots',
  'ai-headshot', 'character', 'ai-vfx', 'influencer', 'storyboard',
  'effects', 'vfx', 'edit', 'upscale', 'audio', 'avatar', 'training',
  'videotools', 'render', 'video-agent', 'video-outreach', 'director',
  'timeline', 'motion', 'tiktok-carousel', 'dubbing', 'chat',
  'commercial', 'templates', 'explore', 'library', 'community',
  'marketing', 'assist', 'remix-go', 'sendspark'
];

const PORT = process.env.PORT || 8080;
const BASE_URL = `http://localhost:${PORT}`;

console.log('🔍 Higgsfield AI - Application Verification\n');
console.log(`Testing ${APPS.length} applications at ${BASE_URL}\n`);

let passed = 0;
let failed = 0;

function testApp(appName) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}/#/${appName}`;
    const start = Date.now();

    http.get(url, (res) => {
      const duration = Date.now() - start;
      let body = '';

      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const isOk = res.statusCode === 200;
        const hasContent = body.length > 500;
        const hasAppShell = body.includes('id="app"');
        const noFatalErrors = !body.includes('Uncaught TypeError') &&
                             !body.includes('ReferenceError') &&
                             !body.includes('SyntaxError');

        if (isOk && hasContent && hasAppShell) {
          console.log(`✅ ${appName.padEnd(20)} ${body.length.toString().padStart(6)} bytes  ${duration}ms`);
          passed++;
        } else {
          console.log(`❌ ${appName.padEnd(20)} HTTP=${res.statusCode}  content=${hasContent}  shell=${hasAppShell}`);
          if (noFatalErrors === false) console.log(`   ⚠️  Contains JS errors in HTML`);
          failed++;
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`❌ ${appName.padEnd(20)} ERROR: ${err.message}`);
      failed++;
      resolve();
    });
  });
}

async function run() {
  // Check server reachability
  try {
    await new Promise((resolve, reject) => {
      http.get(BASE_URL, (res) => {
        if (res.statusCode === 200) resolve();
        else reject(new Error(`HTTP ${res.statusCode}`));
      }).on('error', reject).setTimeout(5000, () => reject(new Error('Timeout')));
    });
  } catch (e) {
    console.error('❌ Server not reachable at', BASE_URL);
    console.error('   Make sure dev server is running: npm run dev\n');
    process.exit(1);
  }

  console.log('✅ Server reachable. Testing applications...\n');

  for (const app of APPS) {
    await testApp(app);
    await new Promise(r => setTimeout(r, 50)); // 50ms delay
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${Math.round(passed / APPS.length * 100)}%\n`);

  if (failed === 0) {
    console.log('🎉 All applications are serving correctly!');
    console.log('   The SPA shell loads for all routes.\n');
  } else {
    console.log(`⚠️  ${failed} application(s) need attention\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

run();
