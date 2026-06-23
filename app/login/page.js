'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao fazer login'); return; }
      if (data.user.role === 'admin') { router.push('/admin'); } else { router.push('/studio'); }
    } catch { setError('Falha na conexao. Tente novamente.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#030303', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'Inter, sans-serif' }}>
      <div style={{ width:'100%', maxWidth:'360px', background:'#0a0a0a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'2.5rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <img src="/logo.webp" alt="Criativos 1PRA1" style={{ height:'60px', objectFit:'contain', marginBottom:'16px' }} />
          <h1 style={{ fontSize:'1.1rem', fontWeight:'700', color:'#fff', marginBottom:'4px' }}>Criativos 1PRA1</h1>
          <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)' }}>Acesso interno</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.3)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus placeholder="seu@email.com" style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'10px 14px', fontSize:'14px', color:'#fff', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'rgba(255,255,255,0.3)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Senha</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="..." style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'8px', padding:'10px 14px', fontSize:'14px', color:'#fff', outline:'none', boxSizing:'border-box' }} />
          </div>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#f87171' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? 'rgba(34,211,238,0.5)' : '#22d3ee', color:'#000', border:'none', borderRadius:'8px', padding:'11px', fontSize:'14px', fontWeight:'600', cursor: loading ? 'not-allowed' : 'pointer', marginTop:'4px' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
