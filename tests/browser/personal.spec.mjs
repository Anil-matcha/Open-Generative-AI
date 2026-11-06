import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

// Synthetic test-only media is created in an ignored directory. No user media
// or MP4 returned by a real generation is committed to this repository.
const syntheticVideo = 'work/browser-fixtures/synthetic.mp4';
test.beforeAll(async () => {
  await mkdir('work/browser-fixtures', { recursive: true });
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i',
    'color=c=black:s=64x64:r=8', '-t', '0.5', '-c:v', 'libx264', '-threads', '1', '-pix_fmt', 'yuv420p', syntheticVideo]);
});

async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Stüdyo parolası').fill(process.env.STUDIO_TEST_PASSWORD);
  await page.getByRole('button',{name:'Stüdyoya gir'}).click();
  await expect(page.getByRole('heading',{name:'Kontrol Paneli',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'İlk çekimi hazırla'})).toBeVisible();
  await page.screenshot({path:'work/browser-results/dashboard.png',fullPage:true});
}
const image = 'docs/assets/generated_example.webp';

test('private deployment redirects visitors and blocks paid proxies',async({page,request})=>{
  await page.goto('/personal');await expect(page).toHaveURL(/\/login$/);
  for (const path of ['/personal', '/personal/video', '/personal/characters', '/personal/scenes', '/personal/history', '/personal/settings']) {
    const response=await request.get(path,{maxRedirects:0});
    expect(response.status(), `Private page: ${path}`).toBe(307);
    expect(new URL(response.headers().location).pathname).toBe('/login');
  }
  const privatePaths = [
    '/api/v1/wan2.2-image-to-video', '/api/v1/get_upload_url', '/api/v1/upload-binary',
    '/api/upload-binary', '/api/v1/history', '/api/v1/predictions/test/media',
    '/api/api/v1/wan2.2-image-to-video', '/api/agents/user/agents',
    '/api/app/test', '/api/workflow/test', '/api/v1/creative-agent/test',
  ];
  for (const path of privatePaths) {
    expect((await request.get(path)).status(), `Unauthenticated GET ${path}`).toBe(401);
    expect((await request.post(path,{data:{}})).status(), `Unauthenticated POST ${path}`).toBe(401);
  }
  const unauthenticated = await request.post('/api/personal/session', { headers: { Origin: 'https://example.invalid' }, data: { password: 'not-a-real-password' } });
  expect(unauthenticated.status()).toBe(403);
  await login(page);
  for (const path of privatePaths) expect((await page.request.post(path,{data:{}})).status(), `Paid proxy blocked: ${path}`).toBe(403);
  const sessionCookie=(await page.context().cookies()).find(cookie=>cookie.name==='personal_studio_session');
  expect(sessionCookie.httpOnly).toBe(true);expect(sessionCookie.secure).toBe(true);expect(sessionCookie.sameSite).toBe('Strict');
  await expect(page.locator('html')).toHaveAttribute('lang','tr');
  await page.getByRole('button',{name:'Oturumu kapat'}).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/personal/history');await expect(page).toHaveURL(/\/login$/);
});

test('character, scene, audio and imported MP4 persist; manifest and download work',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await login(page);
  await page.getByRole('link',{name:'Karakter Stüdyo',exact:true}).click();
  await page.getByRole('button',{name:'Yeni karakter'}).click();
  await page.getByLabel('Karakter adı',{exact:true}).fill('Deniz');
  await page.getByLabel('Görünüm notları',{exact:true}).fill('Natural features, dark hair');
  await page.getByLabel('Tercih edilen görsel stil',{exact:true}).fill('Cinematic portrait');
  await page.getByLabel('Ana referans görseli',{exact:true}).setInputFiles(image);
  await page.getByRole('button',{name:'Karakteri kaydet'}).click();
  await expect(page.getByRole('heading',{name:'Deniz',exact:true})).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Deniz',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Sahne Stüdyo',exact:true}).click();
  await page.getByRole('button',{name:'Yeni sahne'}).click();
  await page.getByLabel('Sahne adı',{exact:true}).fill('Kıyıda bir sabah');
  await page.getByLabel('Karakter',{exact:true}).selectOption({label:'Deniz'});
  await page.getByLabel('Mekân',{exact:true}).fill('A quiet seaside');
  await page.getByLabel('Aksiyon',{exact:true}).fill('The character smiles gently');
  await page.getByLabel('Diyalog',{exact:true}).fill('Yeni bir gün, yeni bir hikâye.');
  const wav=Buffer.alloc(46);wav.write('RIFF',0);wav.writeUInt32LE(38,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(2,40);
  await page.getByLabel('Ses ekle · MP3 / WAV / M4A · en fazla 30 MB',{exact:true}).setInputFiles({name:'voice.wav',mimeType:'audio/wav',buffer:wav});
  await expect(page.locator('audio')).toBeVisible();
  await page.getByRole('button',{name:'Sahneyi kaydet'}).click();
  await expect(page.getByRole('heading',{name:'Kıyıda bir sabah'})).toBeVisible();
  const exported=page.waitForEvent('download');await page.getByRole('button',{name:'JSON dışa aktar'}).click();
  const manifest=JSON.parse(await readFile(await (await exported).path(),'utf8'));
  expect(manifest.scenes[0].character.name).toBe('Deniz');expect(manifest.scenes[0].audioId).toBeTruthy();
  await page.getByRole('link',{name:'Bu sahneyi üret'}).click();
  await expect(page.getByLabel('Üretim yolu',{exact:true})).toHaveValue('official');
  await expect(page.getByRole('link',{name:'Resmi Space’te hesabımla üret'})).toHaveAttribute('href','https://huggingface.co/spaces/Lightricks/ltx-video-distilled');
  await expect(page.getByRole('button',{name:'Ücretsiz kotayla üret'})).toHaveCount(0);
  await expect(page.getByLabel('Hareket açıklaması',{exact:true})).toHaveValue(/quiet seaside/);
  await expect(page.locator('img[alt="Başlangıç karesi"]')).toBeVisible();
  await page.getByLabel('MP4 içe aktar',{exact:true}).setInputFiles(syntheticVideo);
  await expect(page.getByText('İçe aktarıldı',{exact:true})).toBeVisible();
  await expect(page.locator('video')).toBeVisible();
  await expect.poll(()=>page.locator('video').evaluate(video=>video.readyState>=1 && video.duration>0)).toBe(true);
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'MP4 indir ve sakla'}).click();
  const bytes=await readFile(await (await downloaded).path());expect(bytes.subarray(4,8).toString()).toBe('ftyp');
  await page.reload();await expect(page.getByText('İçe aktarıldı',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Üretim Geçmişi',exact:true}).click();
  await expect(page.getByText('Manuel MP4',{exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Gezinme menüsünü aç'}).click();
  await expect(page.getByRole('navigation',{name:'Stüdyo gezinmesi'})).toBeVisible();
  await page.getByRole('link',{name:'Karakter Stüdyo',exact:true}).click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'work/browser-results/mobile-characters.png',fullPage:true});
  expect(errors).toEqual([]);
});

test('model controls reflect capabilities and invalid import is rejected',async({page})=>{
  await login(page);await page.goto('/personal/video');
  await expect(page.getByLabel('Görüntü oranı',{exact:true})).toBeVisible();
  await page.getByLabel('Üretim yolu',{exact:true}).selectOption('anonymous');
  await expect(page.getByRole('button',{name:'Ücretsiz kotayla üret'})).toBeVisible();
  await page.getByLabel('Video motoru',{exact:true}).selectOption('wan');
  await expect(page.getByLabel('Görüntü oranı',{exact:true})).toHaveCount(0);
  await expect(page.getByLabel('Kalite',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('option',{name:/MuAPI/})).toBeDisabled();
  await page.reload();await expect(page.getByLabel('Video motoru',{exact:true})).toHaveValue('wan');
  await page.getByLabel('MP4 içe aktar',{exact:true}).setInputFiles({name:'fake.mp4',mimeType:'video/mp4',buffer:Buffer.from('not an MP4')});
  await expect(page.getByRole('alert').filter({hasText:'Geçerli bir MP4'})).toBeVisible();
});

test('reloading pending jobs marks them interrupted without auto-retry',async({page})=>{
  await login(page);
  await page.evaluate(async()=>{
    const database=await new Promise((resolve,reject)=>{const req=indexedDB.open('personal-cloud-studio',1);req.onsuccess=()=>resolve(req.result);req.onerror=reject;});
    await new Promise((resolve,reject)=>{const tx=database.transaction('jobs','readwrite');tx.objectStore('jobs').put({id:'pending-fixture',createdAt:Date.now(),status:'queued',providerId:'ltx',prompt:'Test pending job',origin:'generated'});tx.oncomplete=resolve;tx.onerror=reject;});database.close();
  });
  await page.goto('/personal/history');await page.reload();
  await expect(page.getByText('Bağlantı kesildi',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/Uzak iş bitmiş olabilir/)).toBeVisible();
});

test('optional real browser LTX generation downloads an actual MP4',async({page})=>{
  test.skip(process.env.STUDIO_LIVE_TEST!=='1','External GPU test is opt-in and consumes the anonymous free quota.');
  test.setTimeout(240000);
  await login(page);await page.goto('/personal/video');
  await page.getByLabel('Üretim yolu',{exact:true}).selectOption('anonymous');
  await page.getByLabel('Karakter / sahne görseli seç',{exact:true}).setInputFiles(image);
  await page.getByLabel('Hareket açıklaması',{exact:true}).fill('Gentle natural motion, steady camera, the subject blinks softly.');
  await page.getByLabel('Süre',{exact:true}).selectOption('1');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Ücretsiz kotayla üret'}).click();
  const finalStatus=page.locator('.ps-preview-card .ps-status');
  await expect(finalStatus).toHaveText(/Tamamlandı|Başarısız/,{timeout:180000});
  await expect(finalStatus,await page.locator('.ps-preview-card').innerText()).toHaveText('Tamamlandı');
  const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'MP4 indir ve sakla'}).click();
  const bytes=await readFile(await (await downloaded).path());expect(bytes.length).toBeGreaterThan(1000);expect(bytes.subarray(4,8).toString()).toBe('ftyp');
  await page.screenshot({path:'work/browser-results/live-ltx.png',fullPage:true});
});
