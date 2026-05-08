export function ProductPhotoStudioPanel({ onGenerate }) {
  const card = document.createElement('div');
  card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  card.innerHTML = `<h3 class="text-white font-bold mb-2">Product Photo Studio</h3><input class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="Product photo prompt" /><button class="mt-2 px-4 py-2 bg-primary/90 text-white rounded-lg">Generate Product Photo Prompt</button>`;
  const input = card.querySelector('input');
  card.querySelector('button').onclick = () => onGenerate?.(input.value.trim());
  return card;
}
