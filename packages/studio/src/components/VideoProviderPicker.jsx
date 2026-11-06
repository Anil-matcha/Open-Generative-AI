"use client";

import { useEffect, useState } from 'react';
import { getPreferredVideoProvider, VIDEO_PROVIDERS, setPreferredVideoProvider } from '../videoProviderPreference.js';

export default function VideoProviderPicker() {
  const [provider, setProvider] = useState('muapi');

  useEffect(() => {
    const sync = () => setProvider(getPreferredVideoProvider());
    sync();
    window.addEventListener('open-generative-ai:video-provider-change', sync);
    return () => window.removeEventListener('open-generative-ai:video-provider-change', sync);
  }, []);

  return (
    <div className="absolute top-3 right-3 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-2.5 py-2 backdrop-blur-md shadow-xl">
      <span className="text-[10px] font-bold uppercase tracking-wide text-white/45">Video Provider</span>
      <select
        value={provider}
        onChange={(event) => {
          setPreferredVideoProvider(event.target.value);
          setProvider(event.target.value);
        }}
        className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer"
        aria-label="Video AI provider"
      >
        {VIDEO_PROVIDERS.map((item) => (
          <option key={item.id} value={item.id} className="bg-zinc-900 text-white">
            {item.label} · {item.badge}
          </option>
        ))}
      </select>
    </div>
  );
}
