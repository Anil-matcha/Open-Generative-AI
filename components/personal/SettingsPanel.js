'use client';
import { useEffect, useState } from 'react';
import { PROVIDERS } from '@/lib/personal/catalog.mjs';
import { clearStudio, sceneManifest, storage } from '@/lib/personal/storage.mjs';
import { useStudio } from './StudioContext';
import { downloadJson } from './Shared';

export default function SettingsPanel() {
  const studio=useStudio();const [usage,setUsage]=useState(null);
  useEffect(()=>{navigator.storage?.estimate().then(setUsage).catch(()=>{});},[]);
  return <div className="ps-settings-grid"><section className="ps-card ps-stack"><span className="ps-eyebrow">VİDEO MOTORLARI</span><h2>Maliyet kontrolü sizde.</h2>
    {PROVIDERS.map(provider=><div key={provider.id} className="ps-provider-row"><div><strong>{provider.name}</strong><p>{provider.cost==='free'?'Hugging Face ZeroGPU · anonim paylaşılan kota':'İsteğe bağlı eski stüdyo · bu arayüzde devre dışı'}</p></div><span className="ps-pill">{provider.cost==='free'?'Ücretsiz kota':'Yapılandırılmadı'}</span>{provider.space && <a href={`https://huggingface.co/spaces/${provider.space}`} target="_blank" rel="noreferrer">Resmi Space ↗</a>}</div>)}
    <p>Ücretsiz erişim; kuyruk, günlük kota ve anlık Space durumuna bağlıdır. Uygulama ücretli modele geçmez, API anahtarı istemez ve kota sınırlarını aşmaz. Sağlayıcı erişimi her üretimde kontrol edilir.</p>
    <p>Hugging Face oturum gerektirirse resmi Space’i açıp kendi ücretsiz hesabınızla üretin. Ücretli hesabınızın kredi ayarlarını resmi sitede kendiniz kontrol edin.</p>
  </section><section className="ps-card ps-stack"><span className="ps-eyebrow">TARAYICI DEPOLAMASI</span><h2>Dosyalarınız bu cihazda.</h2><p>Karakterler, sahneler, sesler ve saklanan videolar IndexedDB’de tutulur. Başka tarayıcıya veya cihaza otomatik taşınmaz. Tarayıcı verilerini temizlemek bunları silebilir.</p>
    {usage && <p>Bu site için kullanılan alan: {((usage.usage||0)/1024/1024).toFixed(1)} MB</p>}
    <button className="ps-button" onClick={async()=>{try{const granted=await navigator.storage?.persist();studio.setNotice(granted?'Kalıcı depolama izni alındı. Yine de ayrıca yedek alın.':'Tarayıcı kalıcı depolama izni vermedi. Dosyalarınızı ayrıca indirin.');}catch(error){studio.setNotice(error.message);}}}>Depolamayı korumayı iste</button>
    <button className="ps-button" onClick={async()=>{try{downloadJson(sceneManifest(studio.scenes,studio.characters,await storage('assets','getAll')),'sahne-manifesti.json');}catch(error){studio.setNotice(error.message);}}}>Sahne planını JSON indir</button><small>JSON görsel, ses veya video içermez. Video dosyalarını Üretim Geçmişi’nden ayrıca indirin.</small>
    <button className="ps-button danger" disabled={studio.jobs.some(job=>['connecting','uploading','queued','generating'].includes(job.status))} onClick={async()=>{if(!window.confirm('Bu tarayıcıdaki TÜM karakterler, sahneler, sesler ve videolar kalıcı olarak silinecek. Devam edilsin mi?'))return;try{await clearStudio();window.location.assign('/personal');}catch(error){studio.setNotice(error.message);}}}>Tüm yerel stüdyo verilerini sil</button>
  </section><section className="ps-card ps-stack"><span className="ps-eyebrow">GİZLİLİK VE ERİŞİM</span><h2>Özel çalışma alanı.</h2><p>Üretimde parola ve imzalı oturum çerezi zorunludur. Görsel ve açıklamalar yalnızca üretim başlattığınızda seçili Hugging Face Space’e gönderilir. Gizli veya kişisel görseller için sağlayıcının koşullarını inceleyin.</p><p>Drive, Make.com, seslendirme ve dudak senkronizasyonu bağlantıları henüz etkin değildir. Hiçbirine otomatik dosya gönderilmez.</p></section>
    <section className="ps-card ps-stack"><span className="ps-eyebrow">STÜDYO TERCİHLERİ</span><h2>Türkçe çalışma alanı.</h2><p>Arayüz Türkçe’dir. İngilizce yerelleştirme için ayrı metin alanı hazırlanmıştır; tüm panellerin İngilizce çevirisi bu sürümde sunulmaz.</p><p>Ses dosyaları sahnelere eklenebilir. Bu sürüm ses ve videoyu birleştirmez; dudak senkronizasyonu veya FFmpeg dışa aktarımı vaat etmez.</p><a className="ps-button" href="/studio">Önceki stüdyo arayüzünü aç ↗</a><small>Eski arayüzün MuAPI çağrıları sunucuda açıkça etkinleştirilmedikçe engellenir.</small></section>
  </div>;
}
