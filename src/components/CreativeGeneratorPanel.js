export function CreativeGeneratorPanel({ onGenerate }) {
  const card = document.createElement('div');
  card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  card.innerHTML = `
    <h3 class="text-white font-bold mb-2">Creative Generator</h3>
    <div class="grid md:grid-cols-3 gap-2">
      <button data-type="facebook" class="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">Facebook Post</button>
      <button data-type="instagram" class="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">Instagram Post</button>
      <button data-type="tiktok" class="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">TikTok Concept</button>
      <button data-type="youtube" class="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">YouTube Short</button>
      <button data-type="email" class="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">Email Promo</button>
      <button data-type="ad-copy" class="px-3 py-2 bg-white/10 rounded-lg text-white text-sm">Ad Copy</button>
    </div>
  `;
  card.querySelectorAll('button[data-type]').forEach((btn) => {
    btn.onclick = () => onGenerate?.(btn.dataset.type);
  });
  return card;
}
