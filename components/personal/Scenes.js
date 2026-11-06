'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CAMERA_PRESETS } from '@/lib/personal/catalog.mjs';
import { sceneManifest, storage } from '@/lib/personal/storage.mjs';
import { useStudio } from './StudioContext';
import { AssetImage, AudioPreview, Empty, Field, FileInput, Status, downloadJson } from './Shared';

const newScene = () => ({ id: crypto.randomUUID(), title: '', characterId: '', referenceId: '', location: '', action: '', cameraId: 'static', prompt: '', dialogue: '', audioId: '' });
export default function Scenes() {
  const studio = useStudio(); const [draft,setDraft] = useState(null); const [busy,setBusy] = useState(false);
  const edit = (key,value) => setDraft(previous => ({ ...previous, [key]: value }));
  async function exportScenes() {
    try {
      const jobs = [...studio.jobs].sort((a,b) => b.createdAt-a.createdAt);
      downloadJson(sceneManifest(studio.scenes.map(scene => ({ ...scene, latestGeneration: jobs.find(job => job.sceneId === scene.id) || null })),studio.characters,await storage('assets','getAll')), 'sahne-manifesti.json');
    } catch(error) { studio.setNotice(error.message); }
  }
  return <div className="ps-stack"><div className="ps-section-bar"><p>Çekimlerinizi sahne sahne planlayın. Üretim her sahne için sizin seçiminizle başlatılır.</p><div className="ps-actions"><button className="ps-button" onClick={exportScenes} disabled={!studio.scenes.length}>JSON dışa aktar</button><button className="ps-button primary" disabled={!studio.ready} onClick={() => setDraft(newScene())}>＋ Yeni sahne</button></div></div>
    {draft && <form className="ps-card ps-stack" onSubmit={async event => {
      event.preventDefault(); setBusy(true);
      try { await studio.put('scenes',{ ...draft, title: draft.title.trim() }); setDraft(null); } catch(error) { studio.setNotice(error.message); } finally { setBusy(false); }
    }}><div className="ps-card-heading"><h2>Sahne hazırlığı</h2><button className="ps-button" type="button" onClick={() => setDraft(null)}>Vazgeç</button></div>
      <div className="ps-form-grid"><Field label="Sahne adı"><input value={draft.title} required maxLength={100} onChange={event => edit('title',event.target.value)} /></Field>
        <Field label="Karakter"><select value={draft.characterId} onChange={event => edit('characterId',event.target.value)}><option value="">Karakter seçilmedi</option>{studio.characters.map(character => <option key={character.id} value={character.id}>{character.name}</option>)}</select></Field>
        <Field label="Mekân"><input value={draft.location} maxLength={500} onChange={event => edit('location',event.target.value)} /></Field>
        <Field label="Aksiyon"><input value={draft.action} maxLength={1000} onChange={event => edit('action',event.target.value)} /></Field>
        <Field label="Kamera açıklama şablonu"><select value={draft.cameraId} onChange={event => edit('cameraId',event.target.value)}>{CAMERA_PRESETS.map(preset => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></Field>
        <div className="ps-stack"><FileInput label="Sahne başlangıç görseli" onSaved={id => edit('referenceId',id)} />{draft.referenceId && <AssetImage id={draft.referenceId} alt="Sahne referansı" className="ps-scene-image" />}</div>
      </div>
      <Field label="Sahne açıklaması"><textarea value={draft.prompt} maxLength={3000} rows={3} onChange={event => edit('prompt',event.target.value)} /></Field>
      <Field label="Diyalog" hint="Yapım notu olarak saklanır. Otomatik seslendirme veya dudak senkronizasyonu yapılmaz."><textarea value={draft.dialogue} rows={2} maxLength={4000} onChange={event => edit('dialogue',event.target.value)} /></Field>
      <FileInput label="Ses ekle · MP3 / WAV / M4A · en fazla 30 MB" kind="audio" onSaved={id => edit('audioId',id)} />
      {draft.audioId && <><AudioPreview id={draft.audioId} /><button type="button" className="ps-button" onClick={() => edit('audioId','')}>Sesi kaldır</button></>}
      <p className="ps-muted">Ses ayrı bir referans dosyasıdır. Videoyla birleştirme, hizalama ve dudak senkronizasyonu bu sürümde uygulanmaz.</p>
      <button className="ps-button primary" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Sahneyi kaydet'}</button>
    </form>}
    {!studio.scenes.length && !draft && <Empty>Yeni bir sahne oluşturun; karakter, mekân, hareket ve diyaloğu tek yerde hazırlayın.</Empty>}
    <div className="ps-stack">{studio.scenes.map((scene,index) => {
      const job = [...studio.jobs].filter(item => item.sceneId===scene.id).sort((a,b)=>b.createdAt-a.createdAt)[0];
      return <article key={scene.id} className="ps-card ps-scene"><AssetImage id={scene.referenceId || studio.characters.find(item=>item.id===scene.characterId)?.mainImageId} alt={scene.title} className="ps-scene-image" />
        <div className="ps-stack"><div className="ps-card-heading"><span className="ps-eyebrow">SAHNE {String(index+1).padStart(2,'0')}</span><Status status={job?.status || 'draft'} /></div><h2>{scene.title}</h2><p>{[scene.location,scene.action].filter(Boolean).join(' · ') || scene.prompt || 'Çekim hazırlanıyor.'}</p>
          <small>Sahne kimliği: {scene.id}</small>{scene.dialogue && <blockquote>“{scene.dialogue}”</blockquote>}{scene.audioId && <AudioPreview id={scene.audioId} />}
          <div className="ps-actions"><Link className="ps-button primary" href={`/personal/video?scene=${scene.id}`}>Bu sahneyi üret</Link><button className="ps-button" onClick={()=>setDraft({...scene})}>Düzenle</button>
            {job && <Link className="ps-button" href={`/personal/history?job=${job.id}`}>Videoyu gör</Link>}
            <button className="ps-button danger" onClick={async()=>{ if(window.confirm('Sahne planı silinsin mi? Çekim geçmişi korunur.'))try {await studio.remove('scenes',scene.id);}catch(error){studio.setNotice(error.message);} }}>Sil</button></div>
        </div></article>;
    })}</div>
  </div>;
}
