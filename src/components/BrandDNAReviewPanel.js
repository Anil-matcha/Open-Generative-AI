export function BrandDNAReviewPanel({ brandDna, onChange }) {
  const panel = document.createElement('div'); panel.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  panel.innerHTML = `<h3 class="text-white font-bold mb-3">Brand Profile</h3>`;
  ['businessName','tagline','offerSummary','audience','industry'].forEach((key) => {
    const input = document.createElement('input');
    input.className = 'w-full mb-2 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white';
    input.value = brandDna[key] || ''; input.placeholder = key;
    input.oninput = () => onChange(key, input.value);
    panel.appendChild(input);
  });
  return panel;
}
