'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { storage, saveAsset } from '@/lib/personal/storage.mjs';
import { ACTIVE_STATUSES, providerError } from '@/lib/personal/catalog.mjs';
import { createVideoProvider } from '@/lib/personal/provider.mjs';
import { validateAsset } from '@/lib/personal/validation.mjs';

const StudioContext = createContext(null);
export const useStudio = () => useContext(StudioContext);

export default function StudioContextProvider({ children }) {
  const [records, setRecords] = useState({ characters: [], scenes: [], jobs: [] });
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const running = useRef(new Map());
  const launching = useRef(false);
  const mounted = useRef(true);
  const jobsRef = useRef(new Map());
  useEffect(() => {
    mounted.current = true;
    let alive = true;
    (async () => {
      try {
        const [characters, scenes, jobs] = await Promise.all(['characters', 'scenes', 'jobs'].map(store => storage(store, 'getAll')));
        const restored = jobs.map(job => ACTIVE_STATUSES.includes(job.status)
          ? { ...job, status: 'interrupted', error: 'Sayfa kapandığı için izleme kesildi. Uzak iş bitmiş olabilir; tekrar üretmeden önce resmi Space’i kontrol edin.' } : job);
        await Promise.all(restored.filter((job, index) => job !== jobs[index]).map(job => storage('jobs', 'put', job)));
        if (!alive) return;
        jobsRef.current = new Map(restored.map(job => [job.id, job]));
        setRecords({ characters, scenes, jobs: restored }); setReady(true);
      } catch (error) { if (alive) setNotice(error.message); }
    })();
    const active = running.current;
    return () => { alive = false; mounted.current = false; active.forEach(controller => controller.abort()); };
  }, []);

  async function put(store, record) {
    const next = { ...record, updatedAt: Date.now() };
    await storage(store, 'put', next);
    if (store === 'jobs') jobsRef.current.set(next.id, next);
    if (mounted.current) setRecords(previous => ({ ...previous, [store]: [...previous[store].filter(item => item.id !== next.id), next] }));
    return next;
  }
  async function remove(store, id) {
    await storage(store, 'delete', id);
    setRecords(previous => ({ ...previous, [store]: previous[store].filter(item => item.id !== id) }));
  }
  async function updateJob(id, changes) {
    return put('jobs', { ...jobsRef.current.get(id), ...changes });
  }
  async function generate(input) {
    if (launching.current || running.current.size) throw new Error('Kota kontrolü için aynı anda tek video üretilebilir. Önce mevcut işi tamamlayın.');
    if (!ready) throw new Error('Tarayıcı depolaması henüz hazır değil.');
    launching.current = true;
    let job, provider, image;
    try {
    provider = createVideoProvider(input.providerId);
    image = await storage('assets', 'get', input.imageId);
    if (!image?.blob) throw new Error('Başlangıç görseli bulunamadı. Yeniden yükleyin.');
    job = await put('jobs', {
      id: crypto.randomUUID(), createdAt: Date.now(), providerId: input.providerId, prompt: input.prompt,
      imageId: input.imageId, characterId: input.characterId || '', sceneId: input.sceneId || '',
      duration: input.duration, aspectRatio: input.aspectRatio, quality: input.quality,
      cameraId: input.cameraId, status: 'connecting', origin: 'generated',
    });
    const controller = new AbortController();
    running.current.set(job.id, controller);
    launching.current = false;
    const deadline = setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), 10 * 60 * 1000);
    // The UI immediately receives a persisted job. Work continues across tab
    // navigation within this layout; no generation is retried automatically.
    (async () => {
      try {
        const handle = await provider.submitGeneration({ ...input, image: image.blob }, { signal: controller.signal });
        await updateJob(job.id, { status: 'uploading' });
        for await (const update of provider.getGenerationStatus(handle)) {
          await updateJob(job.id, { ...update, ...(update.result || {}) });
        }
      } catch (error) {
        const reason = controller.signal.reason;
        const timedOut = reason?.name === 'TimeoutError';
        await updateJob(job.id, {
          status: controller.signal.aborted && !timedOut ? 'cancelled' : 'failed',
          error: timedOut ? providerError(reason) : controller.signal.aborted ? 'İzleme durduruldu. Uzak GPU işinin iptali garanti edilmez.' : (/[^\x00-\x7F]/.test(error.message) ? error.message : providerError(error)),
          diagnostic: error.diagnostic || null,
        });
      } finally { clearTimeout(deadline); running.current.delete(job.id); }
    })().catch(error => { if (mounted.current) setNotice(error.message); });
    return job;
    } catch (error) { launching.current = false; throw error; }
  }
  async function importVideo(file, sceneId = '') {
    await validateAsset(file, 'video');
    const assetId = await saveAsset(file);
    return put('jobs', { id: crypto.randomUUID(), createdAt: Date.now(), status: 'imported', origin: 'imported', assetId, sceneId, prompt: file.name || 'İçe aktarılan video', providerId: 'manual' });
  }
  async function keepVideo(job) {
    if (job.assetId) return job;
    const response = await fetch(job.url, { signal: AbortSignal.timeout(90000) });
    if (!response.ok) throw new Error('Video indirilemiyor. Geçici bağlantının süresi dolmuş olabilir.');
    if (Number(response.headers.get('content-length')) > 100 * 1024 * 1024) throw new Error('Video 100 MB sınırını aşıyor.');
    const blob = new Blob([await response.blob()], { type: 'video/mp4' });
    await validateAsset(blob, 'video');
    return updateJob(job.id, { assetId: await saveAsset(blob) });
  }
  return <StudioContext.Provider value={{ ...records, ready, notice, setNotice, put, remove, generate, importVideo, keepVideo, cancel: id => running.current.get(id)?.abort() }}>{children}</StudioContext.Provider>;
}
