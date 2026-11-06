'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { copy } from '@/lib/personal/copy.mjs';
import { ACTIVE_STATUSES } from '@/lib/personal/catalog.mjs';
import { useStudio } from './StudioContext';
import { AssetImage, Empty, Status } from './Shared';
import VideoPanel from './VideoPanel';
import Characters from './Characters';
import Scenes from './Scenes';
import HistoryPanel from './HistoryPanel';
import SettingsPanel from './SettingsPanel';

function NavigationIcon({ name }) {
  const paths = {
    dashboard: ['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'],
    video: ['M4 4h16v16H4z', 'm10 8 6 4-6 4z'],
    characters: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'],
    scenes: ['m12 3 10 5-10 5L2 8z','m2 12 10 5 10-5','m2 16 10 5 10-5'],
    history: ['M3 11a9 9 0 1 1 2.5 7','M3 4v7h7','M12 7v5l3 2'],
    settings: ['M4 6h16M4 12h16M4 18h16','M8 3v6M16 9v6M10 15v6'],
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name].map((d,index)=><path key={index} d={d}/>)}</svg>;
}
const path=tab=>tab==='dashboard'?'/personal':`/personal/${tab}`;

function Dashboard() {
  const studio=useStudio();
  const recent=[...studio.jobs].sort((a,b)=>b.createdAt-a.createdAt).slice(0,4);
  return <div className="ps-stack"><section className="ps-hero"><div><span className="ps-eyebrow">SIRADAKİ HİKÂYENİZ SİZİ BEKLİYOR</span><h2>Bir kareyle başlar.<br/><em>Hareketle hayat bulur.</em></h2><p>Karakterinizi seçin. Sahnenizi kurun. Fikrinizi bulutta kısa bir filme dönüştürün.</p><Link href="/personal/video" className="ps-button primary">İlk çekimi hazırla <span>↗</span></Link></div><div className="ps-hero-art" aria-hidden="true"><div className="ps-frame outer"/><div className="ps-frame middle"/><div className="ps-frame inner"><span>▶</span></div><span className="ps-art-note">GÖRSEL → HAREKET → HİKÂYE</span></div></section>
    <div className="ps-stat-grid">{[[studio.characters.length,'Kayıtlı karakter'],[studio.scenes.length,'Planlanan sahne'],[studio.jobs.filter(job=>job.status==='completed').length,'Üretilen video'],[studio.jobs.filter(job=>job.origin==='imported').length,'İçe aktarılan video']].map(([number,label])=><div className="ps-card ps-stat" key={label}><span>{number}</span><p>{label}</p></div>)}</div>
    <div className="ps-dashboard-grid"><section className="ps-card ps-stack"><div className="ps-card-heading"><h2>Son çekimler</h2><Link href="/personal/history">Tümünü gör ↗</Link></div>{!recent.length?<Empty>Henüz çekiminiz yok. Bir görsel yükleyerek başlayın.</Empty>:recent.map(job=><Link className="ps-recent-row" key={job.id} href={`/personal/history?job=${job.id}`}><AssetImage id={job.imageId} alt=""/><div><strong>{job.prompt?.slice(0,65) || 'Yeni çekim'}</strong><p>{job.origin==='imported'?'Manuel MP4 içe aktarımı':'Hugging Face bulut üretimi'}</p></div><Status status={job.status}/></Link>)}</section>
      <section className="ps-card ps-stack"><span className="ps-eyebrow">YAPIM NOTLARI</span><h2>Önce karakter. Sonra hikâye.</h2><ol className="ps-steps"><li><span>01</span><div><strong>Karakterinizi arşivleyin</strong><p>Görselleri ve görünüm notlarını tekrar kullanın.</p></div></li><li><span>02</span><div><strong>Sahnenizi hazırlayın</strong><p>Mekân, aksiyon, kamera ve diyalog tek yerde.</p></div></li><li><span>03</span><div><strong>Çekimi başlatın</strong><p>Ücretsiz kotaya göre bir seferde tek video üretin.</p></div></li></ol><Link href="/personal/characters" className="ps-button">Karakter Stüdyo’ya git ↗</Link></section></div>
  </div>;
}

export default function PersonalStudio() {
  const {section=[]}=useParams();const requested=section[0] || 'dashboard';
  const active=copy.navigation[requested]?requested:'dashboard';
  const studio=useStudio();const [menu,setMenu]=useState(false);
  const pending=studio.jobs.filter(job=>ACTIVE_STATUSES.includes(job.status));
  const panels={dashboard:<Dashboard/>,video:<VideoPanel/>,characters:<Characters/>,scenes:<Scenes/>,history:<HistoryPanel/>,settings:<SettingsPanel/>};
  return <div className="ps-shell"><aside className={`ps-sidebar ${menu?'open':''}`}><Link href="/personal" className="ps-brand"><span className="ps-brand-mark">K</span><div>{copy.brand}<small>{copy.subtitle}</small></div></Link>
    <span className="ps-nav-heading">ÇALIŞMA ALANI</span><nav aria-label="Stüdyo gezinmesi">{Object.entries(copy.navigation).map(([id,label])=><Link key={id} href={path(id)} className={active===id?'active':''} onClick={()=>setMenu(false)} aria-current={active===id?'page':undefined}><span aria-hidden="true"><NavigationIcon name={id}/></span>{label}{id==='history'&&pending.length>0&&<b>{pending.length}</b>}</Link>)}</nav>
    <div className="ps-sidebar-bottom"><div className="ps-cloud-note"><span className="ps-live-dot"/><strong>Bulutta üretim</strong><p>Kişisel GPU gerekmez.<br/>Ücretsiz sağlayıcı kotası geçerlidir.</p></div><button className="ps-logout" onClick={async()=>{try{await fetch('/api/personal/session',{method:'DELETE'});window.location.assign('/login');}catch{studio.setNotice('Çıkış yapılamadı. Bağlantıyı kontrol edin.');}}}>↪ Oturumu kapat</button></div>
  </aside>{menu&&<button className="ps-scrim" aria-label="Menüyü kapat" onClick={()=>setMenu(false)}/>}
    <div className="ps-main"><header className="ps-topbar"><button className="ps-menu-toggle" aria-label="Gezinme menüsünü aç" onClick={()=>setMenu(!menu)}>☰</button><span>Kişisel çalışma alanı <span className="ps-breadcrumb">/ {copy.navigation[active]}</span></span><span className="ps-private">◈ Özel stüdyo</span></header>
      <main className="ps-content"><div className="ps-page-heading"><div><span className="ps-eyebrow">KARE / {active==='video'?'GÖRSELDEN VİDEOYA':'YARATICI ÇALIŞMA ALANI'}</span><h1>{copy.navigation[active]}</h1><p>{copy.descriptions[active]}</p></div><Link href="/personal/video" className="ps-button">＋ Yeni çekim</Link></div>
        {studio.notice&&<div className="ps-notice" role="alert"><p>{studio.notice}</p><button aria-label="Bildirimi kapat" onClick={()=>studio.setNotice('')}>×</button></div>}
        {!studio.ready?<div className="ps-card ps-empty" role="status">Tarayıcı arşivi açılıyor… {studio.notice&&<button className="ps-button" onClick={()=>window.location.reload()}>Yeniden dene</button>}</div>:panels[active]}
      </main><footer className="ps-footer">Kişisel üretim alanınız · Dosyalar bu tarayıcıda saklanır · Ücretsiz erişim sağlayıcı kotasına bağlıdır.</footer>
    </div>
  </div>;
}
