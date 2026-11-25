'use client';
import { useState } from 'react';
import { useStudio } from './StudioContext';
import { AssetImage, Empty, Field, FileInput } from './Shared';

const blank = () => ({ id: crypto.randomUUID(), name: '', description: '', appearance: '', personality: '', style: '', mainImageId: '', additionalImageIds: [], templates: [] });
export default function Characters() {
  const studio = useStudio(); const [draft, setDraft] = useState(null); const [busy, setBusy] = useState(false);
  const edit = (key,value) => setDraft(previous => ({ ...previous, [key]: value }));
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try {
      if (!draft.mainImageId || !draft.name.trim()) throw new Error('Karakter adı ve ana referans görseli gerekli.');
      await studio.put('characters', { ...draft, name: draft.name.trim(), templates: draft.templates.map(text => text.trim()).filter(Boolean).slice(0,20) }); setDraft(null);
    } catch (error) { studio.setNotice(error.message); }
    finally { setBusy(false); }
  }
  return <div className="ps-stack"><div className="ps-section-bar"><p>Aynı karakteri farklı çekimlerde yeniden kullanın. Kimlik tutarlılığı modele ve başlangıç karesine bağlıdır.</p><button className="ps-button primary" disabled={!studio.ready} onClick={() => setDraft(blank())}>＋ Yeni karakter</button></div>
    {draft && <form onSubmit={save} className="ps-card ps-stack"><div className="ps-card-heading"><h2>Karakter profili</h2><button type="button" className="ps-button" onClick={() => setDraft(null)}>Vazgeç</button></div>
      <div className="ps-character-editor"><div className="ps-stack"><AssetImage id={draft.mainImageId} alt="Ana referans" className="ps-portrait" /><FileInput label="Ana referans görseli" onSaved={id => edit('mainImageId',id)} />
        <FileInput label="Ek referans görselleri" multiple onSaved={ids => edit('additionalImageIds',[...draft.additionalImageIds,...ids].slice(0,8))} />
        <div className="ps-thumbs">{draft.additionalImageIds.map((id,index) => <button title="Referansı kaldır" aria-label={`Referans ${index+1} kaldır`} key={id} type="button" onClick={() => edit('additionalImageIds',draft.additionalImageIds.filter(item => item !== id))}><AssetImage id={id} alt={`Ek referans ${index+1}`} /></button>)}</div>
        <p className="ps-muted">Ek görseller arşivlenir. Seçili video motorları tek bir başlangıç karesi kullanır; referanslar birleştirilmez.</p>
      </div><div className="ps-stack">
        <Field label="Karakter adı"><input value={draft.name} required maxLength={100} onChange={event => edit('name',event.target.value)} /></Field>
        {[
          ['description','Karakter açıklaması'],['appearance','Görünüm notları'],['personality','Kişilik notları'],['style','Tercih edilen görsel stil'],
        ].map(([key,label]) => <Field key={key} label={label}><textarea rows={2} value={draft[key]} maxLength={1500} onChange={event => edit(key,event.target.value)} /></Field>)}
        <Field label="Açıklama şablonları" hint="Her satır ayrı bir şablondur."><textarea rows={3} value={draft.templates.join('\n')} maxLength={4000} onChange={event => edit('templates',event.target.value.split('\n'))} /></Field>
        <button className="ps-button primary" disabled={busy || !draft.mainImageId}>{busy ? 'Kaydediliyor…' : 'Karakteri kaydet'}</button>
      </div></div>
    </form>}
    {!studio.characters.length && !draft && <Empty>İlk karakterinizi oluşturun. Referans görselleri yalnızca bu tarayıcıda saklanır.</Empty>}
    <div className="ps-character-grid">{studio.characters.map(character => <article className="ps-card ps-character-card" key={character.id}>
      <AssetImage id={character.mainImageId} alt={character.name} className="ps-portrait" /><div className="ps-character-copy"><span className="ps-eyebrow">KARAKTER REFERANSI</span><h2>{character.name}</h2><p>{character.description || character.appearance || 'Yeni hikâyeler için hazır.'}</p><small>{1 + character.additionalImageIds.length} referans görseli</small><div className="ps-actions"><button className="ps-button" onClick={() => setDraft({ ...character })}>Düzenle</button><button className="ps-button danger" onClick={async () => {
        if (!window.confirm('Bu karakter profilini silmek istiyor musunuz? Mevcut sahneler ve çekimler korunur.')) return;
        try { await studio.remove('characters',character.id); } catch(error) { studio.setNotice(error.message); }
      }}>Sil</button></div></div></article>)}</div>
  </div>;
}
