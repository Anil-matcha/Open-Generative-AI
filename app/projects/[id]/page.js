'use client';
/**
 * app/projects/[id]/page.js — página interna de um projeto
 */
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

const S = {
  page: { minHeight:'100vh', background:'#030303', color:'#fff', fontFamily:'Inter,sans-serif', fontSize:'14px' },
  header: { background:'#0a0a0a', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 24px', height:'52px', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:100 },
  layout: { display:'flex', height:'calc(100vh - 52px)' },
  sidebar: { width:'200px', flexShrink:0, borderRight:'1px solid rgba(255,255,255,0.06)', padding:'16px 12px', overflowY:'auto', background:'#070707' },
  main: { flex:1, overflowY:'auto', padding:'20px 24px' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'10px' },
  genCard: { background:'#0f0f0f', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', overflow:'hidden', cursor:'pointer', transition:'border-color 0.15s' },
  genThumb: { width:'100%', aspectRatio:'1/1', objectFit:'cover', display:'block', background:'#1a1a1a' },
  genThumbEmpty: { width:'100%', aspectRatio:'1/1', background:'#1a1a1a', display:'flex', alignItems:'center', justifyContent:'center' },
  genFooter: { padding:'8px 10px' },
  genModel: { fontSize:'11px', color:'rgba(255,255,255,0.35)', marginBottom:'2px' },
  genPrompt: { fontSize:'11px', color:'rgba(255,255,255,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  sideItem: (active) => ({ padding:'7px 10px', borderRadius:'7px', fontSize:'12px', cursor:'pointer', marginBottom:'3px', background: active ? 'rgba(255,255,255,0.06)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.4)', display:'flex', alignItems:'center', gap:'7px' }),
  btn: { background:'#22d3ee', color:'#000', border:'none', borderRadius:'7px', padding:'7px 14px', fontSize:'12px', fontWeight:'600', cursor:'pointer' },
  btnSm: { background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', color:'rgba(255,255,255,0.5)', cursor:'pointer' },
  btnDanger: { background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'6px', padding:'5px 10px', fontSize:'12px', color:'#f87171', cursor:'pointer' },
  modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', zIndex:200 },
  modalBox: { background:'#111', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'14px', padding:'0', width:'100%', maxWidth:'640px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' },
  input: { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', color:'#fff', outline:'none', boxSizing:'border-box' },
  label: { display:'block', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.3)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.04em' },
  badge: (color) => ({ background: color+'22', color: color, borderRadius:'5px', padding:'2px 8px', fontSize:'11px', fontWeight:'500' }),
};

const TYPE_ICONS = { image:'🖼', video:'🎬', audio:'🎵', lipsync:'👄', clipping:'✂️' };
const TYPE_LABELS = { image:'Imagens', video:'Vídeos', audio:'Áudio', lipsync:'Lip Sync', clipping:'Clipping', all:'Todas' };

function GenDetailModal({ gen, projects, onClose, onMove, onDelete }) {
  const [moving, setMoving] = useState(false);
  const [targetProject, setTargetProject] = useState('');
  const [copied, setCopied] = useState(false);

  async function doMove() {
    setMoving(true);
    await fetch(`/api/generations/${gen.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ projectId: targetProject || null }) });
    setMoving(false);
    onMove();
  }

  function copyPrompt() {
    navigator.clipboard.writeText(gen.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modalBox}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <span>{TYPE_ICONS[gen.type] || '🖼'}</span>
            <span style={{ fontWeight:'600', fontSize:'14px' }}>{gen.model}</span>
            <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)' }}>{new Date(gen.created_at).toLocaleDateString('pt-BR')}</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px' }}>✕</button>
        </div>

        <div style={{ flex:1, overflowY:'auto' }}>
          {gen.output_url && (
            <div style={{ background:'#0a0a0a', display:'flex', alignItems:'center', justifyContent:'center', padding:'12px' }}>
              {gen.type === 'video' || gen.type === 'lipsync' ? (
                <video src={gen.output_url} controls style={{ maxWidth:'100%', maxHeight:'320px', borderRadius:'8px' }} />
              ) : (
                <img src={gen.output_url} alt="" style={{ maxWidth:'100%', maxHeight:'320px', borderRadius:'8px', objectFit:'contain' }} />
              )}
            </div>
          )}

          <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <div style={S.label}>Prompt</div>
              <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'rgba(255,255,255,0.7)', lineHeight:'1.5', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {gen.prompt || '—'}
              </div>
            </div>

            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              <span style={S.badge('#22d3ee')}>{gen.credits_used} crédito{gen.credits_used !== 1 ? 's' : ''}</span>
              <span style={S.badge('#7F77DD')}>{gen.type}</span>
              {gen.user_name && <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>por {gen.user_name}</span>}
            </div>

            <div>
              <div style={S.label}>Mover para projeto</div>
              <div style={{ display:'flex', gap:'8px' }}>
                <select style={{ ...S.input, flex:1, appearance:'none' }} value={targetProject} onChange={e => setTargetProject(e.target.value)}>
                  <option value="">Sem projeto</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button style={S.btnSm} onClick={doMove} disabled={moving}>{moving ? '...' : 'Mover'}</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', gap:'8px', justifyContent:'space-between' }}>
          <button style={S.btnDanger} onClick={() => { if(confirm('Apagar esta geração?')) { onDelete(); onClose(); } }}>Apagar</button>
          <div style={{ display:'flex', gap:'8px' }}>
            <button style={S.btnSm} onClick={copyPrompt}>{copied ? '✓ Copiado' : 'Copiar prompt'}</button>
            {gen.output_url && <a href={gen.output_url} download target="_blank" rel="noreferrer" style={{ ...S.btn, textDecoration:'none', display:'flex', alignItems:'center' }}>Baixar</a>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShareModal({ project, onClose, onUpdated }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [members, setMembers] = useState(project.members || []);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  async function addMember() {
    if (!email.trim()) { setErr('Email obrigatório'); return; }
    setAdding(true); setErr('');
    const res = await fetch(`/api/projects/${project.id}/members`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, role }) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error); setAdding(false); return; }
    setMsg(`${data.userName} adicionado!`);
    setEmail('');
    // refresh members
    const m = await fetch(`/api/projects/${project.id}/members`).then(r => r.json());
    setMembers(Array.isArray(m) ? m : []);
    setAdding(false);
    onUpdated();
  }

  async function removeMember(userId) {
    await fetch(`/api/projects/${project.id}/members`, { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId }) });
    setMembers(m => m.filter(x => x.user_id !== userId));
    onUpdated();
  }

  return (
    <div style={S.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modalBox, maxWidth:'420px' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between' }}>
          <h3 style={{ fontWeight:'700', fontSize:'14px' }}>Compartilhar projeto</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'18px' }}>✕</button>
        </div>
        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:'14px' }}>
          <div>
            <div style={S.label}>Convidar por email</div>
            <div style={{ display:'flex', gap:'8px' }}>
              <input style={{ ...S.input, flex:1 }} value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@empresa.com" onKeyDown={e=>e.key==='Enter'&&addMember()} />
              <select style={{ ...S.input, width:'auto', appearance:'none', paddingRight:'20px' }} value={role} onChange={e=>setRole(e.target.value)}>
                <option value="viewer">Visualizar</option>
                <option value="editor">Editar</option>
              </select>
              <button style={S.btn} onClick={addMember} disabled={adding}>{adding?'...':'Convidar'}</button>
            </div>
            {err && <div style={{ color:'#f87171', fontSize:'12px', marginTop:'5px' }}>{err}</div>}
            {msg && <div style={{ color:'#4ade80', fontSize:'12px', marginTop:'5px' }}>{msg}</div>}
          </div>

          <div>
            <div style={S.label}>Membros ({members.length + 1})</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color:'rgba(255,255,255,0.7)' }}>{project.owner_name}</span>
                <span style={{ color:'rgba(255,255,255,0.3)' }}>dono</span>
              </div>
              {members.map(m => (
                <div key={m.user_id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ color:'rgba(255,255,255,0.7)' }}>{m.name}</div>
                    <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>{m.email}</div>
                  </div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>{m.role === 'editor' ? 'Editor' : 'Visualizador'}</span>
                    <button style={S.btnDanger} onClick={() => removeMember(m.user_id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [project, setProject] = useState(null);
  const [generations, setGenerations] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedGen, setSelectedGen] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    const [projRes, genRes, allProjRes] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch(`/api/generations?projectId=${id}&type=${typeFilter}`),
      fetch('/api/projects'),
    ]);
    if (projRes.status === 401) { router.push('/login'); return; }
    if (projRes.status === 404) { router.push('/projects'); return; }
    const [proj, gens, allProj] = await Promise.all([projRes.json(), genRes.json(), allProjRes.json()]);
    setProject(proj);
    setEditName(proj.name);
    setGenerations(Array.isArray(gens) ? gens : []);
    setAllProjects(Array.isArray(allProj) ? allProj : []);
    setLoading(false);
  }, [id, typeFilter, router]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    await fetch(`/api/projects/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name: editName }) });
    setEditing(false);
    load();
  }

  async function deleteGen(genId) {
    await fetch(`/api/generations/${genId}`, { method:'DELETE' });
    setGenerations(g => g.filter(x => x.id !== genId));
  }

  const typeCounts = generations.reduce((acc, g) => { acc[g.type] = (acc[g.type]||0)+1; return acc; }, {});

  if (loading) return <div style={{ ...S.page, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)' }}>Carregando...</div>;
  if (!project) return null;

  const isOwner = project.my_role === 'owner';
  const canEdit = project.my_role === 'owner' || project.my_role === 'editor';

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => router.push('/projects')} style={{ ...S.btnSm, fontSize:'12px' }}>← Projetos</button>
        {editing ? (
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <input style={{ ...S.input, width:'200px', padding:'5px 10px', fontSize:'14px', fontWeight:'600' }} value={editName} onChange={e=>setEditName(e.target.value)} autoFocus onKeyDown={e=>e.key==='Enter'&&saveEdit()} />
            <button style={S.btn} onClick={saveEdit}>Salvar</button>
            <button style={S.btnSm} onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{ width:'14px', height:'14px', borderRadius:'50%', background: project.color, flexShrink:0 }} />
            <span style={{ fontWeight:'700', fontSize:'15px' }}>{project.name}</span>
            {canEdit && <button onClick={() => setEditing(true)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'12px', padding:'2px 6px' }}>Renomear</button>}
          </div>
        )}
        <div style={{ flex:1 }} />
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)' }}>{project.gen_count} gerações</span>
          {isOwner && <button style={S.btnSm} onClick={() => setShowShare(true)}>Compartilhar</button>}
          <button style={S.btn} onClick={() => router.push('/studio')}>Ir ao Studio</button>
        </div>
      </div>

      <div style={S.layout}>
        <div style={S.sidebar}>
          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Filtrar</div>
          {['all', 'image', 'video', 'audio', 'lipsync', 'clipping'].map(t => (
            <div key={t} style={S.sideItem(typeFilter === t)} onClick={() => setTypeFilter(t)}>
              <span>{TYPE_ICONS[t] || '📁'}</span>
              <span>{TYPE_LABELS[t]}</span>
              {typeCounts[t] > 0 && <span style={{ marginLeft:'auto', fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>{typeCounts[t]}</span>}
            </div>
          ))}

          {project.members?.length > 0 && (
            <>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:'16px 0 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Membros</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', marginBottom:'4px' }}>{project.owner_name} (dono)</div>
              {project.members.map(m => (
                <div key={m.user_id} style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginBottom:'4px' }}>{m.name}</div>
              ))}
            </>
          )}

          {project.description && (
            <>
              <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.25)', margin:'16px 0 8px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Descrição</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:'1.5' }}>{project.description}</div>
            </>
          )}
        </div>

        <div style={S.main}>
          {generations.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px', color:'rgba(255,255,255,0.2)' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>🎨</div>
              <div style={{ fontSize:'15px', marginBottom:'8px' }}>Nenhuma geração ainda</div>
              <div style={{ fontSize:'13px', marginBottom:'20px' }}>Vá ao Studio, selecione este projeto no header e comece a gerar.</div>
              <button style={S.btn} onClick={() => router.push('/studio')}>Ir ao Studio</button>
            </div>
          ) : (
            <div style={S.grid}>
              {generations.map(g => (
                <div key={g.id} style={S.genCard}
                  onClick={() => setSelectedGen(g)}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'}>
                  {g.output_url ? (
                    g.type === 'video' || g.type === 'lipsync' ? (
                      <video src={g.output_url} style={{ width:'100%', aspectRatio:'1/1', objectFit:'cover', display:'block', background:'#1a1a1a' }} muted />
                    ) : (
                      <img src={g.output_url} alt="" style={S.genThumb} loading="lazy" />
                    )
                  ) : (
                    <div style={S.genThumbEmpty}>
                      <span style={{ fontSize:'28px' }}>{TYPE_ICONS[g.type] || '🖼'}</span>
                    </div>
                  )}
                  <div style={S.genFooter}>
                    <div style={S.genModel}>{g.model} · {g.credits_used} cr.</div>
                    <div style={S.genPrompt}>{g.prompt || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedGen && (
        <GenDetailModal
          gen={selectedGen}
          projects={allProjects.filter(p => p.id !== parseInt(id))}
          onClose={() => setSelectedGen(null)}
          onMove={() => { setSelectedGen(null); load(); }}
          onDelete={() => deleteGen(selectedGen.id)}
        />
      )}

      {showShare && project && (
        <ShareModal
          project={project}
          onClose={() => setShowShare(false)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
