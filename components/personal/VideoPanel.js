'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PROVIDERS, CAMERA_PRESETS, composePrompt, ACTIVE_STATUSES, PROVIDER_LABELS } from '@/lib/personal/catalog.mjs';
import { storage } from '@/lib/personal/storage.mjs';
import { useStudio } from './StudioContext';
import { AssetImage, Field, FileInput, MediaPreview, Status, downloadAsset } from './Shared';

export function VideoActions({ job }) {
  const studio = useStudio(); const [busy, setBusy] = useState(false);
  if (!job || !['completed', 'imported'].includes(job.status)) return null;
  async function download() {
    setBusy(true);
    try { const saved = await studio.keepVideo(job); await downloadAsset(saved.assetId, saved.url, `video-${job.id.slice(0,8)}.mp4`); }
    catch (error) { studio.setNotice(error.message); }
    finally { setBusy(false); }
  }
  return <div className="ps-actions"><button className="ps-button primary" disabled={busy} onClick={download}>{busy ? 'İndiriliyor…' : 'MP4 indir ve sakla'}</button>
    {job.url && <a className="ps-button" href={job.url} target="_blank" rel="noreferrer">Kaynağı aç ↗</a>}
    <small>{job.assetId ? 'Video bu tarayıcıya kaydedildi.' : 'Video bağlantısı geçicidir. Kalıcı tarayıcı kopyası için indirin.'}</small></div>;
}

export default function VideoPanel() {
  const studio = useStudio();
  const search = useSearchParams();
  const sceneId = search.get('scene') || '';
  const scene = studio.scenes.find(item => item.id === sceneId);
  const [providerId, setProviderId] = useState('ltx');
  const [characterId, setCharacterId] = useState('');
  const [imageId, setImageId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState('2');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [quality, setQuality] = useState('fast');
  const [cameraId, setCameraId] = useState('portrait');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);
  const [workflow, setWorkflow] = useState('official');
  const provider = PROVIDERS.find(item => item.id === providerId);
  const character = studio.characters.find(item => item.id === characterId);
  const active = studio.jobs.some(job => ACTIVE_STATUSES.includes(job.status));
  const selectedJob = studio.jobs.find(job => job.id === selectedJobId)
    || [...studio.jobs].filter(job => sceneId ? job.sceneId === sceneId : true).sort((a,b) => b.createdAt - a.createdAt)[0];

  useEffect(() => {
    let alive = true;
    storage('preferences','get','video').then(saved => {
      if (alive && PROVIDERS.some(item => item.id === saved?.providerId && !item.disabled)) {
        setProviderId(saved.providerId);
        setDuration(String(PROVIDERS.find(item => item.id === saved.providerId).defaultDuration));
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!scene) return;
    setCharacterId(scene.characterId || '');
    setImageId(scene.referenceId || studio.characters.find(item => item.id === scene.characterId)?.mainImageId || '');
    setPrompt(scene.prompt || [scene.location, scene.action].filter(Boolean).join('. '));
    setCameraId(scene.cameraId || 'none');
  // Apply a scene once when it is selected, without replacing the user's edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene?.id]);

  const finalPrompt = composePrompt({ prompt, cameraId, appearance: character?.appearance, style: character?.style });
  async function generate(event) {
    event.preventDefault(); if (workflow !== 'anonymous' || submitting || active) return;
    setSubmitting(true); setError('');
    try {
      if (!consent) throw new Error('Hugging Face’e gönderimi onaylayın.');
      const job = await studio.generate({ providerId, characterId, imageId, sceneId, duration: Number(duration), aspectRatio, quality, cameraId, prompt: finalPrompt });
      setSelectedJobId(job.id);
    } catch (failure) { setError(failure.message); }
    finally { setSubmitting(false); }
  }
  return <div className="ps-video-layout">
    <form onSubmit={generate} className="ps-card ps-composer">
      <div className="ps-card-heading"><h2>Yeni çekim</h2><span className="ps-pill">Görsel → video</span></div>
      <Field label="Üretim yolu"><select value={workflow} onChange={event=>setWorkflow(event.target.value)}><option value="official">HF hesabımla resmi Space · manuel MP4 aktarımı</option><option value="anonymous">Anonim API · ayrı ücretsiz kota</option></select></Field>
      <p className="ps-info">Resmi Space’teki HF oturumunuz bu siteye taşınmaz. Hesabınızla üretim için aşağıdaki resmi Space bağlantısını kullanın; indirilen MP4’ü buraya aktarın. Bu yol otomatik üretim değildir.</p>
      {scene && <p className="ps-info">Sahne: {scene.title || scene.id.slice(0,8)}. Bu çekim sahnenize bağlanacak.</p>}
      <Field label="Video motoru"><select value={providerId} onChange={event => { setProviderId(event.target.value); setDuration(String(PROVIDERS.find(item => item.id === event.target.value).defaultDuration)); storage('preferences','put',{id:'video',providerId:event.target.value}).catch(error=>studio.setNotice(error.message)); }}>
        {PROVIDERS.map(item => <option key={item.id} value={item.id} disabled={item.disabled}>{item.name} · {PROVIDER_LABELS[item.cost]}</option>)}
      </select></Field>
      <p className="ps-muted">Ücretsiz kota · Anlık erişim üretim sırasında doğrulanır. Kimlik doğrulaması gerekirse resmi Space’i kullanın.</p>
      <Field label="Kayıtlı karakter"><select value={characterId} onChange={event => {
        setCharacterId(event.target.value); const selected = studio.characters.find(item => item.id === event.target.value); setImageId(selected?.mainImageId || '');
      }}><option value="">Karakter seçmeden devam et</option>{studio.characters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      {character?.templates?.length > 0 && <Field label="Kayıtlı açıklama şablonu"><select defaultValue="" onChange={event => { if (event.target.value) setPrompt(event.target.value); }}><option value="">Şablon seçin</option>{character.templates.map((text,index) => <option key={index} value={text}>{text}</option>)}</select></Field>}
      <div className="ps-reference"><AssetImage id={imageId} alt="Başlangıç karesi" /><div><h3>Başlangıç karesi</h3><p>Tek görsel koşullandırması. Sahne görseli yüklemek karakterin ana görselinin yerine geçer.</p>
        <FileInput label="Karakter / sahne görseli seç" onSaved={setImageId} />
        {character?.additionalImageIds?.length > 0 && <select aria-label="Ek referanslardan başlangıç karesi seç" value="" onChange={event => setImageId(event.target.value)}><option value="">Diğer karakter görselleri</option>{character.additionalImageIds.map((id,index) => <option value={id} key={id}>Referans {index+1}</option>)}</select>}
      </div></div>
      <Field label="Hareket açıklaması" hint="Karakterin ve sahnenin nasıl hareket edeceğini anlatın. Modeller için İngilizce açıklamalar genellikle daha uygundur."><textarea rows={4} value={prompt} maxLength={3000} required onChange={event => setPrompt(event.target.value)} placeholder="Örn. The character turns toward the camera and smiles gently…" /></Field>
      <Field label="Kamera hareketi" hint="Bu efekt açıklama metnine eklenir; fiziksel kamera kontrolü veya sonuç garantisi değildir."><select value={cameraId} onChange={event => setCameraId(event.target.value)}>{CAMERA_PRESETS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
      <div className="ps-form-grid"><Field label="Süre"><select value={duration} onChange={event => setDuration(event.target.value)}>{provider.durations.map(value => <option key={value} value={value}>{value} saniye</option>)}</select></Field>
        {provider.aspectRatios.length > 0 && <Field label="Görüntü oranı"><select value={aspectRatio} onChange={event => setAspectRatio(event.target.value)}>{provider.aspectRatios.map(value => <option key={value}>{value}</option>)}</select></Field>}
      </div>
      {provider.qualities.length > 0 && <Field label="Kalite"><select value={quality} onChange={event => setQuality(event.target.value)}><option value="fast">Hızlı · tek geçiş</option><option value="texture">Doku iyileştirme · daha fazla kota</option></select></Field>}
      {providerId === 'wan' && <p className="ps-muted">Wan görüntü oranını başlangıç karesinden belirler; gerekirse görseli kırpar.</p>}
      <details className="ps-details"><summary>Gönderilecek açıklamayı göster</summary><p>{finalPrompt || 'Açıklama henüz hazırlanmadı.'}</p></details>
      <label className="ps-checkbox"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} />Görsel ve açıklamamın seçilen Hugging Face Space’e gönderilmesini kabul ediyorum.</label>
      {error && <p className="ps-error" role="alert">{error}</p>}
      <button className="ps-button" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(finalPrompt);studio.setNotice('Açıklama kopyalandı. Resmi Space’e kendiniz yapıştırabilirsiniz.');}catch{setError('Kopyalanamadı; açıklama önizlemesinden metni seçin.');}}}>Açıklamayı kopyala</button>
      {workflow === 'official' ? <a className="ps-button primary wide" href={`https://huggingface.co/spaces/${provider.space}`} target="_blank" rel="noreferrer">Resmi Space’te hesabımla üret ↗</a> : <button className="ps-button primary wide" type="submit" disabled={!studio.ready || !imageId || !prompt.trim() || active || submitting || !consent}>{submitting ? 'İş hazırlanıyor…' : active ? 'Mevcut çekim tamamlanıyor…' : '✦ Ücretsiz kotayla üret'}</button>}
    </form>
    <div className="ps-preview-column"><div className="ps-card ps-preview-card"><div className="ps-card-heading"><h2>Önizleme</h2>{selectedJob && <Status status={selectedJob.status} />}</div><MediaPreview job={selectedJob} /><VideoActions job={selectedJob} />
      {selectedJob?.error && <p className="ps-error" role="alert">{selectedJob.error}</p>}
      {selectedJob?.diagnostic && <p className="ps-muted">Tanı: {selectedJob.diagnostic.code} · aşama: {selectedJob.diagnostic.phase} · anonim API</p>}
      {selectedJob && ACTIVE_STATUSES.includes(selectedJob.status) && <div className="ps-job-info" role="status"><span className="ps-live-dot" />Bulut işi sürüyor. Bu sekmeyi açık tutun.{Number.isFinite(selectedJob.position) && ` Sıra: ${selectedJob.position + 1}.`}{Number.isFinite(selectedJob.progress) && ` Sağlayıcı ilerlemesi: %${selectedJob.progress}.`}<button type="button" className="ps-button" onClick={() => studio.cancel(selectedJob.id)}>İzlemeyi durdur</button></div>}
    </div>
    <div className="ps-card ps-manual"><span className="ps-eyebrow">ALTERNATİF ÇALIŞMA AKIŞI</span><h3>Resmi üreticide oluştur, buraya aktar.</h3><p>Ücretsiz kota, oturum veya ağ nedeniyle otomatik üretim çalışmıyorsa resmi Space’i açın. İndirdiğiniz MP4’ü burada önizleyip sahnenize ekleyebilirsiniz. Bu işlem manuel içe aktarımdır.</p>
      <a className="ps-button" href={`https://huggingface.co/spaces/${provider.space}`} target="_blank" rel="noreferrer">Resmi {provider.name} Space’i ↗</a>
      <label className="ps-file-label">MP4 içe aktar<input aria-label="MP4 içe aktar" type="file" accept="video/mp4" onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return;
        try { const job = await studio.importVideo(file, sceneId); setSelectedJobId(job.id); } catch (failure) { setError(failure.message); } finally { event.target.value = ''; }
      }} /></label>
    </div></div>
  </div>;
}
