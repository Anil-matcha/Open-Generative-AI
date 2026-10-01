"use client";

import { useEffect, useState } from 'react';
import { getPreferredProvider, IMAGE_PROVIDERS, setPreferredProvider } from '../providerPreference.js';

export default function ProviderPicker() {
  const [provider, setProvider] = useState('muapi');

  useEffect(() => {
    const sync = () => setProvider(getPreferredProvider());
    sync();
    window.addEventListener('open-generative-ai:provider-change', sync);
    return () => window.removeEventListener('open-generative-ai:provider-change', sync);
  }, []);

  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-2.5 py-2 backdrop-blur-md shadow-xl">
      <span className="text-[10px] font-bold uppercase tracking-wide text-white/45">Provider</span>
      <select value={provider} onChange={(event) => { setPreferredProvider(event.target.value); setProvider(event.target.value); }} className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer" aria-label="AI provider">
        {IMAGE_PROVIDERS.map((item) => (
          <option key={item.id} value={item.id} className="bg-zinc-900 text-white">{item.label} · {item.badge}</option>
        ))}
      </select>
    </div>
  );
}
