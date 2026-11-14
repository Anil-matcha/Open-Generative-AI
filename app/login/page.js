'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/personal/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign('/personal');
    } catch (failure) { setError(failure.message || 'Bağlantı kurulamadı.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-[#090b10] text-white flex items-center justify-center p-6">
    <form onSubmit={login} className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-6">
      <span className="text-xs tracking-[0.3em] text-cyan-300">KİŞİSEL AI STÜDYO</span>
      <h1 className="text-3xl font-semibold">Yönetmen koltuğunuz hazır.</h1>
      <p className="text-sm text-white/50">Özel stüdyonuza erişmek için parolanızı girin.</p>
      <label className="block text-sm">Stüdyo parolası<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 p-3" /></label>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-cyan-300 p-3 font-semibold text-black disabled:opacity-50">{busy ? 'Kontrol ediliyor…' : 'Stüdyoya gir'}</button>
    </form>
  </main>;
}
