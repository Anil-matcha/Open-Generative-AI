'use client';

import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';

export default function LegacyProviderSettings({ apiKey, onSave, onClear, requiredFor = '' }) {
  const [value, setValue] = useState('');
  return (
    <div className="h-full overflow-y-auto bg-[#050506] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">{requiredFor ? 'Compatibility required' : 'Advanced'}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{requiredFor ? `${requiredFor} needs a legacy session key` : 'Provider settings'}</h1>
        <p className="mt-3 text-sm leading-6 text-white/38">Selena and the secure Creator tools use server-owned credentials. This browser-session key exists only for legacy MuAPI workspaces that have not yet migrated to the Creator gateway.</p>

        <div className="mt-8 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200"><KeyRound size={20} /></div>
            <div>
              <h2 className="text-sm font-semibold">Legacy compatibility credential</h2>
              <p className="mt-2 text-xs leading-5 text-white/32">Stored in session storage, never a cookie. CreativeCanvas still copies it temporarily into local storage while active; that remaining migration is documented.</p>
            </div>
          </div>
          {apiKey ? (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-200"><ShieldCheck size={15} /> Session key configured</span>
              <button type="button" onClick={onClear} className="text-xs font-bold text-red-300 hover:text-red-200">Remove</button>
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); if (value.trim()) { onSave?.(value.trim()); setValue(''); } }} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input type="password" value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" placeholder="Legacy MuAPI key" className="h-11 flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 text-sm outline-none focus:border-cyan-300/30" />
              <button type="submit" disabled={!value.trim()} className="h-11 rounded-xl bg-cyan-300 px-5 text-xs font-black text-black disabled:opacity-30">Store for session</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
