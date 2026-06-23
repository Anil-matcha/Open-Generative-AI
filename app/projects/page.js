'use client';
/**
 * app/projects/page.js — galeria de projetos do usuário
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const COLORS = ['#7F77DD','#1D9E75','#D85A30','#378ADD','#BA7517','#D4537E','#888780','#639922'];

const S = {
  page: { minHeight:'100vh', background:'#030303', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:'14px' },
  header: { background:'#0a0a0a', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 24px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 },
  main: { maxWidth:'1100px', margin:'0 auto', padding:'32px 24px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'16px' },
  card: { background:'#0f0f0f', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'12px', overflow:'hidden', cursor:'pointer', transition:'border-color 0.15s' },
  cardTop: (color) => ({ height:'80px', background: color + '22', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }),
  cardBody: { padding:'14px 16px' },
  cardTitle: { fontWeight:'600', fontSize:'14px', marginBottom:'4px' },
  cardSub: { fontSize:'12px', color:'rgba(255,255,255,0.35)' },
  addCard: { background:'#0f0f0f', border:'1px dashed rgba(255,255,255,0.12)', borderRadius:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'8px', cursor:'pointer', minHeight:'140px', color:'rgba(255,255,255,0.25)', transition:'all 0.15s', fontSize:'13px' },
  btn: { background:'#22d3ee', color:'#000', border:'none', borderRadius:'8px', padding:'9px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer' },
  btnSm: { background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'7px', padding:'7px 14px', fontSize:'12px', color:'rgba(255,255,255,0.6)', cursor:'pointer' },
  modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', zIndex:200 },
  modalBox: { background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', padding:'28px', width:'100%', maxWidth:'420px' },
  input: { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'9px 12px', fontSize:'13px', color:'#fff', outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.3)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em' },
};

function NewProjectModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!name.trim()) { setErr('Nome obrigatório'); return; }
    setSaving(true);
    const res = await fetch('/api/projects', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, description: desc, color }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || 'Erro'); setSaving(false); return; }
    onCreated(data.id);
  }

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
          <h3 style={{ fontWeight:'700', fontSize:'15px' }}>Novo projeto</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px' }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <label style={S.label}>Nome</label>
            <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Campanha 1PRA1" autoFocus />
          </div>
          <div>
            <label style={S.label}>Descrição (opcional)</label>
            <input style={S.input} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descreva o projeto..." />
          </div>
          <div>
            <label style={S.label}>Cor</label>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer', border: color === c ? '3px solid #fff' : '3px solid transparent', transition:'border 0.1s' }} />
              ))}
            </div>
          </div>
          {err && <div style={{ color:'#f87171', fontSize:'12px' }}>{err}</div>}
          <button style={{ ...S.btn, marginTop:'4px' }} onClick={submit} disabled={saving}>
            {saving ? 'Criando...' : 'Criar projeto'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => { if(r.status===401) router.push('/login'); return r.json(); }),
      fetch('/api/auth/me').then(r => r.json()),
    ]).then(([proj, me]) => {
      setProjects(Array.isArray(proj) ? proj : []);
      setUser(me);
      setLoading(false);
    });
  }, [router]);

  function handleCreated(id) {
    setShowNew(false);
    router.push(`/projects/${id}`);
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={() => router.push('/studio')} style={{ ...S.btnSm, fontSize:'13px' }}>← Studio</button>
          <span style={{ fontWeight:'700', color:'#22d3ee' }}>Projetos</span>
        </div>
        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          {user?.role === 'admin' && (
            <button onClick={() => router.push('/admin')} style={S.btnSm}>Admin</button>
          )}
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)' }}>{user?.name}</span>
        </div>
      </div>

      <div style={S.main}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
          <h1 style={{ fontSize:'20px', fontWeight:'700' }}>Meus projetos</h1>
          <button style={S.btn} onClick={() => setShowNew(true)}>+ Novo projeto</button>
        </div>

        {loading ? (
          <div style={{ color:'rgba(255,255,255,0.2)', textAlign:'center', padding:'48px' }}>Carregando...</div>
        ) : (
          <div style={S.grid}>
            {projects.map(p => (
              <div key={p.id} style={S.card} onClick={() => router.push(`/projects/${p.id}`)}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}>
                <div style={S.cardTop(p.color)}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div style={S.cardBody}>
                  <div style={S.cardTitle}>{p.name}</div>
                  <div style={S.cardSub}>
                    {p.gen_count} {p.gen_count === 1 ? 'geração' : 'gerações'}
                    {p.member_count > 1 && ` · ${p.member_count} membros`}
                    {p.my_role !== 'owner' && <span style={{ marginLeft:'6px', background:'rgba(34,211,238,0.1)', color:'#22d3ee', borderRadius:'4px', padding:'1px 6px', fontSize:'10px' }}>{p.my_role}</span>}
                  </div>
                  {p.description && <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', marginTop:'6px' }}>{p.description}</div>}
                </div>
              </div>
            ))}

            <div style={S.addCard} onClick={() => setShowNew(true)}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; e.currentTarget.style.color='rgba(255,255,255,0.25)'; }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
              Novo projeto
            </div>
          </div>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} onCreated={handleCreated} />}
    </div>
  );
}
