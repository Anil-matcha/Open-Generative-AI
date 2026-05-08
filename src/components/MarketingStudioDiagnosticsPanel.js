export function MarketingStudioDiagnosticsPanel() {
  const proxyUrl = import.meta.env.VITE_MARKETING_STUDIO_PROXY_URL || '';
  const appUrl = import.meta.env.VITE_OPEN_POMELLI_APP_URL || '';

  const card = document.createElement('div');
  card.className = 'bg-white/5 border border-white/10 rounded-2xl p-4';
  card.innerHTML = `
    <h3 class="text-white font-bold mb-2">Diagnostics</h3>
    <p class="text-xs text-muted mb-2">Use this to validate dev wiring before testing generation.</p>
    <div class="text-xs text-secondary space-y-1 mb-3">
      <div>VITE_OPEN_POMELLI_APP_URL: <span class="text-white">${appUrl || 'Not set'}</span></div>
      <div>VITE_MARKETING_STUDIO_PROXY_URL: <span class="text-white">${proxyUrl || 'Not set'}</span></div>
    </div>
    <button class="px-4 py-2 bg-white/10 rounded text-white text-sm">Run Connectivity Check</button>
    <pre class="mt-2 text-xs text-muted whitespace-pre-wrap"></pre>
  `;

  const out = card.querySelector('pre');
  card.querySelector('button').onclick = async () => {
    try {
      out.textContent = 'Checking...';
      if (!proxyUrl) {
        out.textContent = 'Proxy not set. Set VITE_MARKETING_STUDIO_PROXY_URL or use standalone app link.';
        return;
      }
      const res = await fetch(`${proxyUrl}/health`, { method: 'GET' });
      out.textContent = res.ok ? 'Proxy reachable (/health passed).' : `Proxy responded with status ${res.status}.`;
    } catch (err) {
      out.textContent = `Connectivity check failed: ${err.message}`;
    }
  };

  return card;
}
