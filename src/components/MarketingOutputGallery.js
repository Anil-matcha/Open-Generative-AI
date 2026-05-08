export function MarketingOutputGallery({ outputs = [] }) {
  const card = document.createElement('div');
  card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  card.innerHTML = '<h3 class="text-white font-bold mb-2">Marketing Output Gallery</h3>';

  const grid = document.createElement('div');
  grid.className = 'grid md:grid-cols-2 gap-2';

  outputs.forEach((item) => {
    const el = document.createElement('div');
    el.className = 'bg-black/30 border border-white/10 rounded-xl p-3';
    el.innerHTML = `<div class="text-xs text-primary mb-1">${item.type}</div><pre class="text-xs text-secondary whitespace-pre-wrap">${item.text || ''}</pre><button class="mt-2 text-xs text-white/80 underline">Copy</button>`;
    el.querySelector('button').onclick = () => navigator.clipboard?.writeText(item.text || '');
    grid.appendChild(el);
  });

  if (!outputs.length) {
    const empty = document.createElement('p');
    empty.className = 'text-xs text-muted';
    empty.textContent = 'No outputs yet. Generate campaigns/creatives to populate this gallery.';
    card.appendChild(empty);
  } else {
    card.appendChild(grid);
  }

  return card;
}
