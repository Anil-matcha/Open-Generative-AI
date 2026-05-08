import { marketingStudioPresets } from '../lib/marketingStudioPresets.js';
export function CampaignConceptGenerator({ onGenerate }) {
  const card = document.createElement('div'); card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  const options = marketingStudioPresets.map(p => `<option value="${p.slug}">${p.title}</option>`).join('');
  card.innerHTML = `<h3 class="text-white font-bold mb-2">Campaign Concepts</h3><select class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">${options}</select><button class="mt-3 px-4 py-2 bg-primary/90 text-white rounded-lg">Generate Campaigns</button>`;
  const sel = card.querySelector('select'); card.querySelector('button').onclick = () => onGenerate(sel.value);
  return card;
}
