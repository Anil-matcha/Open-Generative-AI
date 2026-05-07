export function MarketingStudioSettingsModal() {
  const card = document.createElement('div');
  card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';

  const cfg = (() => {
    try { return JSON.parse(localStorage.getItem('marketing_studio_provider') || '{}'); } catch { return {}; }
  })();

  card.innerHTML = `
    <h3 class="text-white font-bold mb-2">Marketing Studio Settings</h3>
    <p class="text-xs text-muted mb-3">Choose provider wiring for backend proxy calls (OpenAI or MuAPI). Keys are BYOK and stored locally for MVP only.</p>
    <div class="grid md:grid-cols-2 gap-2">
      <select id="provider" class="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white">
        <option value="muapi">MuAPI</option>
        <option value="openai">OpenAI</option>
      </select>
      <input id="apiKey" type="password" placeholder="Provider API key" class="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white" />
    </div>
    <button class="mt-3 px-4 py-2 bg-primary/90 text-white rounded-lg">Save Provider Settings</button>
  `;

  const providerEl = card.querySelector('#provider');
  const keyEl = card.querySelector('#apiKey');
  providerEl.value = cfg.provider || 'muapi';
  keyEl.value = cfg.apiKey || '';
  card.querySelector('button').onclick = () => {
    localStorage.setItem('marketing_studio_provider', JSON.stringify({ provider: providerEl.value, apiKey: keyEl.value }));
  };

  return card;
}
