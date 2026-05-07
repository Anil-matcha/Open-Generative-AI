export function HeadshotOutputGallery({ images = [] }) {
  const wrap = document.createElement('div');
  wrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
  if (!images.length) {
    wrap.innerHTML = '<div class="text-sm text-secondary">Generated headshots will appear here.</div>';
    return wrap;
  }
  images.forEach((src, idx) => {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-white/10 bg-black/30 p-3';
    card.innerHTML = `<img src="${src}" alt="Headshot ${idx+1}" class="w-full rounded-lg object-cover"/><div class="mt-3 flex gap-2"><a href="${src}" download="headshot-${idx+1}.png" class="px-3 py-1.5 text-xs rounded-lg bg-primary/20 text-primary">Download</a><button class="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white" disabled>Save to Library</button></div>`;
    wrap.appendChild(card);
  });
  return wrap;
}
