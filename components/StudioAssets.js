'use client';

import { Film, Image as ImageIcon, Mic2, Play, Trash2, Upload } from 'lucide-react';

function AssetPreview({ asset }) {
  if (asset.type === 'video') return <video src={asset.url} muted preload="metadata" className="h-full w-full object-cover" />;
  if (asset.type === 'audio') return <div className="flex h-full items-center justify-center text-cyan-200"><Mic2 size={30} /></div>;
  return <img src={asset.url} alt="" className="h-full w-full object-cover" />;
}

export default function StudioAssets({ assets, currentProject, onOpen, onDelete, onUpload, uploading = false, error = '' }) {
  return (
    <div className="h-full overflow-y-auto bg-[#050506] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/70">Assets</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Generate once. Reuse everywhere.</h1>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <p className="max-w-2xl text-sm leading-6 text-white/35">{currentProject ? <>Assets are retained in <strong className="text-white/55">{currentProject.name}</strong> and can move directly into Graphic Studio, Scene Builder, Lip Sync, and Publish.</> : 'Create or open a Project to retain Assets across browser sessions.'}</p>
          <label className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black ${currentProject && !uploading ? 'cursor-pointer border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100' : 'cursor-not-allowed border-white/[0.07] text-white/20'}`}>
            <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Asset'}
            <input type="file" className="hidden" disabled={!currentProject || uploading} accept="image/*,video/mp4,video/quicktime,video/webm,audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload?.(file); event.target.value = ''; }} />
          </label>
        </div>

        {error && (
          <div role="alert" className="mt-5 rounded-2xl border border-red-300/20 bg-red-300/[0.06] px-4 py-3 text-sm text-red-100">
            <p className="font-semibold">Asset upload failed</p>
            <p className="mt-1 text-xs leading-5 text-red-100/70">{error}</p>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-white/[0.1] bg-white/[0.02] px-8 py-20 text-center">
            <ImageIcon size={28} className="mx-auto text-white/20" />
            <h2 className="mt-4 text-sm font-semibold text-white/60">No retained assets yet</h2>
            <p className="mt-2 text-xs text-white/25">Generate an image or video through Selena, AI Generator, or Scene Builder.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset) => (
              <article key={asset.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
                <div className="aspect-video bg-black"><AssetPreview asset={asset} /></div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold">{asset.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/25">{asset.type} · {asset.source}</p>
                    </div>
                    <button type="button" onClick={() => onDelete?.(asset.id)} aria-label={`Remove ${asset.title}`} className="text-white/25 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {asset.type === 'image' && <button type="button" onClick={() => onOpen?.(asset, 'graphic-studio')} className="rounded-lg border border-white/[0.1] px-3 py-2 text-[10px] font-bold text-white/60 hover:text-white"><ImageIcon size={11} className="mr-1 inline" /> Edit graphic</button>}
                    {asset.type === 'image' && <button type="button" onClick={() => onOpen?.(asset, 'scene-builder')} className="rounded-lg bg-cyan-300 px-3 py-2 text-[10px] font-black text-black"><Play size={11} className="mr-1 inline" /> Animate</button>}
                    {(asset.type === 'video' || asset.type === 'image') && <button type="button" onClick={() => onOpen?.(asset, 'lipsync')} className="rounded-lg border border-white/[0.1] px-3 py-2 text-[10px] font-bold text-white/60 hover:text-white"><Film size={11} className="mr-1 inline" /> Lip Sync</button>}
                    {(asset.type === 'video' || asset.type === 'image') && <button type="button" onClick={() => onOpen?.(asset, 'publish')} className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] px-3 py-2 text-[10px] font-bold text-emerald-100"><Play size={11} className="mr-1 inline" /> Publish</button>}
                    <a href={asset.url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/[0.1] px-3 py-2 text-[10px] font-bold text-white/60 hover:text-white">Open</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
