'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStudio } from './StudioContext';
import { ACTIVE_STATUSES, PROVIDERS } from '@/lib/personal/catalog.mjs';
import { Empty, MediaPreview, Status } from './Shared';
import { VideoActions } from './VideoPanel';

export default function HistoryPanel() {
  const studio=useStudio(); const params=useSearchParams();
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState(params.get('job') || '');
  const jobs=[...studio.jobs].sort((a,b)=>b.createdAt-a.createdAt).filter(job=>filter==='all' || (filter==='active' ? ACTIVE_STATUSES.includes(job.status) : filter==='ready' ? ['completed','imported'].includes(job.status) : job.status==='failed'));
  const job=studio.jobs.find(item=>item.id===selected) || jobs[0];
  return <div className="ps-stack"><div className="ps-section-bar"><p>Gerçek üretimler ve manuel içe aktarımlar ayrı işaretlenir. Otomatik yeniden deneme yapılmaz.</p><select aria-label="Geçmiş filtresi" className="ps-filter" value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">Tüm çekimler</option><option value="active">Devam edenler</option><option value="ready">Hazır videolar</option><option value="failed">Başarısız denemeler</option></select></div>
    {!jobs.length ? <Empty>Bu görünümde kayıt yok. İlk videonuzu oluşturun veya resmi üreticiden MP4 içe aktarın.</Empty> : <div className="ps-history-layout"><div className="ps-stack">{jobs.map(item=><button className={`ps-card ps-history-row ${job?.id===item.id?'selected':''}`} key={item.id} onClick={()=>setSelected(item.id)}><div className="ps-card-heading"><span>{item.origin==='imported'?'Manuel MP4':'Bulut üretimi'}</span><Status status={item.status}/></div><p>{item.prompt}</p><small>{new Intl.DateTimeFormat('tr-TR',{dateStyle:'short',timeStyle:'short'}).format(item.createdAt)} · {PROVIDERS.find(provider=>provider.id===item.providerId)?.name || 'İçe aktarma'}</small></button>)}</div>
      {job && <section className="ps-card ps-stack"><div className="ps-card-heading"><h2>Çekim ayrıntıları</h2><Status status={job.status}/></div><MediaPreview job={job}/><VideoActions job={job}/><p className="ps-muted">{job.prompt}</p>{job.error && <p className="ps-error">{job.error}</p>}
        {job.seed != null && <small>Üretim tohumu: {job.seed}</small>}
        <label className="ps-field"><span>Sahneye bağla</span><select value={job.sceneId || ''} onChange={async event=>{try{await studio.put('jobs',{...job,sceneId:event.target.value});}catch(error){studio.setNotice(error.message);}}}><option value="">Sahneye bağlı değil</option>{studio.scenes.map(scene=><option key={scene.id} value={scene.id}>{scene.title}</option>)}</select></label>
        {ACTIVE_STATUSES.includes(job.status) ? <button className="ps-button" onClick={()=>studio.cancel(job.id)}>İzlemeyi durdur</button> : <button className="ps-button danger" onClick={async()=>{if(window.confirm('Bu geçmiş kaydı silinsin mi?'))try{await studio.remove('jobs',job.id);setSelected('');}catch(error){studio.setNotice(error.message);}}}>Geçmiş kaydını sil</button>}
      </section>}</div>}
  </div>;
}
