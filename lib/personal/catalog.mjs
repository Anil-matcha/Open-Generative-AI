export const PROVIDERS = [
  { id: 'ltx', name: 'LTX Video Distilled', space: 'Lightricks/ltx-video-distilled', host: 'https://lightricks-ltx-video-distilled.hf.space', endpoint: '/image_to_video', cost: 'free',
    durations: [1, 2, 3, 4, 5, 8], aspectRatios: ['9:16', '16:9', '1:1'], qualities: ['fast', 'texture'], defaultDuration: 2, multipleReferences: false, nativeCamera: false },
  { id: 'wan', name: 'Wan 2.2 14B Fast', space: 'zerogpu-aoti/wan2-2-fp8da-aoti-faster', host: 'https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space', endpoint: '/generate_video', cost: 'free',
    durations: [1, 2, 3, 4, 5], aspectRatios: [], qualities: [], defaultDuration: 3, multipleReferences: false, nativeCamera: false },
  { id: 'muapi', name: 'MuAPI', cost: 'paid', disabled: true },
];

export const CAMERA_PRESETS = [
  ['none', 'Hareket seçilmedi', ''],
  ['zoom-in', 'Yavaş yakınlaşma', 'A slow, smooth optical zoom in toward the subject.'],
  ['zoom-out', 'Yavaş uzaklaşma', 'A slow, smooth optical zoom out revealing the surroundings.'],
  ['dolly-in', 'Dolly ileri', 'The camera slowly moves forward toward the subject, with natural foreground parallax.'],
  ['dolly-out', 'Dolly geri', 'The camera slowly moves backward away from the subject, revealing depth.'],
  ['pan-left', 'Sola pan', 'The camera gently pans left from a fixed position.'],
  ['pan-right', 'Sağa pan', 'The camera gently pans right from a fixed position.'],
  ['orbit-left', 'Sola yörünge', 'The camera slowly orbits left around the subject while keeping the subject centered.'],
  ['orbit-right', 'Sağa yörünge', 'The camera slowly orbits right around the subject while keeping the subject centered.'],
  ['handheld', 'Sinematik elde çekim', 'Subtle, controlled handheld camera movement, cinematic framing, no sudden shaking.'],
  ['static', 'Sabit kamera', 'Locked-off static camera, stable framing, no camera movement.'],
  ['tracking', 'Takip çekimi', 'A smooth tracking shot follows the moving subject at a steady distance.'],
  ['portrait', 'Hafif portre hareketi', 'The subject breathes naturally, blinks gently and makes a subtle head movement, keeping facial appearance close to the reference.'],
].map(([id, label, prompt]) => ({ id, label, prompt }));

export const STATUS_TR = {
  draft: 'Taslak', connecting: 'Bağlanıyor', uploading: 'Yükleniyor', queued: 'Sırada', generating: 'Üretiliyor',
  completed: 'Tamamlandı', failed: 'Başarısız', interrupted: 'Bağlantı kesildi', cancelled: 'Durduruldu', imported: 'İçe aktarıldı',
};
export const ACTIVE_STATUSES = ['connecting', 'uploading', 'queued', 'generating'];
export const PROVIDER_LABELS = { free: 'Ücretsiz kota', paid: 'Ücretli · devre dışı', unavailable: 'Kullanılamıyor', unconfigured: 'Yapılandırılmadı' };

export function getProvider(id) {
  const provider = PROVIDERS.find(item => item.id === id);
  if (!provider || provider.disabled || provider.cost !== 'free') throw new Error('Bu sağlayıcı devre dışı. Ücretli API çağrısı yapılmadı.');
  return provider;
}

export function composePrompt({ prompt, cameraId, appearance, style }) {
  return [prompt?.trim(), appearance?.trim(), style?.trim(), CAMERA_PRESETS.find(item => item.id === cameraId)?.prompt].filter(Boolean).join('\n');
}

export function buildProviderPayload(id, input, image) {
  const provider = getProvider(id);
  if (!input.prompt?.trim() || input.prompt.length > 4000) throw new Error('Hareket açıklaması 1–4000 karakter olmalı.');
  if (!provider.durations.includes(Number(input.duration))) throw new Error('Desteklenen bir süre seçin.');
  if (id === 'wan') return {
    input_image: image, prompt: input.prompt, steps: 4, negative_prompt: 'blurry, distorted, inconsistent motion',
    duration_seconds: Number(input.duration), guidance_scale: 1, guidance_scale_2: 1, seed: 42, randomize_seed: true,
  };
  const sizes = { '9:16': [512, 288], '16:9': [288, 512], '1:1': [512, 512] };
  if (!sizes[input.aspectRatio] || !provider.qualities.includes(input.quality)) throw new Error('Desteklenen oran ve kaliteyi seçin.');
  const [height, width] = sizes[input.aspectRatio];
  return {
    prompt: input.prompt, negative_prompt: 'worst quality, inconsistent motion, blurry, jittery, distorted',
    input_image_filepath: image, input_video_filepath: null, height_ui: height, width_ui: width,
    mode: 'image-to-video', duration_ui: Number(input.duration), ui_frames_to_use: 9,
    seed_ui: 42, randomize_seed: true, ui_guidance_scale: 1, improve_texture_flag: input.quality === 'texture',
  };
}

export function providerError(error) {
  const message = String(error?.message || error || '');
  if (/quota|exceed|429|too many|gpu.*limit/i.test(message)) return 'Ücretsiz GPU kotası doldu. Kota yenilenmesini bekleyin veya resmi Space üzerinden durumunuzu kontrol edin.';
  if (/auth|sign.?in|log.?in|401|403|token/i.test(message)) return 'Hugging Face oturum açılmasını istiyor. Resmi Space’i açıp ücretsiz hesabınızla üretin, ardından MP4 dosyasını içe aktarın.';
  if (/timeout|timed out/i.test(message)) return 'Bekleme süresi doldu. Uzak iş hâlâ çalışıyor olabilir; yeniden göndermeden önce resmi Space’i kontrol edin.';
  if (/404|not found|queue|503|sleep|unavailable|load|fetch|network|connect/i.test(message)) return 'Space, kuyruğu veya ağ bağlantısı şu anda kullanılamıyor. Daha sonra deneyin ya da resmi üreticiden MP4 içe aktarın.';
  return 'Sağlayıcı üretimi tamamlayamadı. Resmi Space’i kontrol edin veya MP4 içe aktarın.';
}

export function normalizeOutput(id, data) {
  const provider = getProvider(id);
  const file = data?.[0]?.video || data?.[0];
  const candidate = typeof file === 'string' ? file : file?.url;
  let url;
  try { url = new URL(candidate); } catch { throw new Error('Geçerli video adresi alınamadı.'); }
  if (url.origin !== provider.host || url.username || url.password) throw new Error('Güvenilir bir video adresi alınamadı.');
  return { url: url.href, seed: data[1], providerId: id };
}
