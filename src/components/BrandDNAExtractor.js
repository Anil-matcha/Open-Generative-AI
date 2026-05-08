export function BrandDNAExtractor({ onAnalyze }) {
  const card = document.createElement('div'); card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  card.innerHTML = `<h3 class="text-white font-bold mb-2">Brand DNA Extraction</h3><input class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" placeholder="https://example.com" /><button class="mt-3 px-4 py-2 bg-primary/90 text-white rounded-lg">Analyze Website</button><p class="text-xs text-muted mt-2">No login required. Requires backend proxy or standalone Open-Pomelli deployment.</p>`;
  const input = card.querySelector('input');
  card.querySelector('button').onclick = () => onAnalyze(input.value.trim());
  return card;
}
