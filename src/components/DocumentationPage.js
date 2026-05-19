import { navigate } from '../lib/router.js';

export function DocumentationPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto';

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
      </button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Documentation</p>
        <h1 class="text-lg font-bold text-white">Implementation Plan</h1>
      </div>
    </div>
  `;
  container.appendChild(header);

  const content = document.createElement('div');
  content.className = 'flex-1 p-6 overflow-y-auto';
  content.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
        <h2 class="text-2xl font-bold text-white mb-4">Migration Plan: Full Conversion of 4 Upstream Apps</h2>
        <p class="text-secondary mb-4">Convert Marketing Studio, Workflows, Agents, and Design Agent from upstream into full working Higgsfield applications.</p>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-black/30 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-primary">Workflows</div>
            <div class="text-xs text-secondary">Native builder with node palette and canvas</div>
          </div>
          <div class="bg-black/30 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-400">✓</div>
            <div class="text-xs text-secondary">Marketing Studio - Full implementation</div>
          </div>
          <div class="bg-black/30 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-yellow-400">✓</div>
            <div class="text-xs text-secondary">AI Agents - OpenAI integration + handoffs</div>
          </div>
          <div class="bg-black/30 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-purple-400">✓</div>
            <div class="text-xs text-secondary">Design Agent - Handoffs to Library</div>
          </div>
        </div>

        <h3 class="text-lg font-bold text-white mb-2">Completed Tasks</h3>
        <ul class="space-y-2 text-sm text-secondary">
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>WorkflowBuilderApp.js - Native workflow builder with drag-drop canvas</span></li>
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>Router updated for /workflows, /agents, /ai-agent, /design-agent routes</span></li>
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>AIAgentApp.js - Added Send to Director and Send to Library buttons</span></li>
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>DesignAgentApp.js - Added Send to Library button</span></li>
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>MarketingStudioApp.js - Added Save to Library in fullscreen modal</span></li>
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>Build verified - all changes compile successfully</span></li>
          <li class="flex items-start gap-2"><span class="text-green-400">✓</span> <span>Changes pushed to main branch</span></li>
        </ul>

        <h3 class="text-lg font-bold text-white mt-6 mb-2">Native Apps Summary</h3>
        <div class="space-y-3 text-sm">
          <div class="border-l-2 border-primary pl-3">
            <div class="font-bold text-white">WorkflowBuilderApp.js</div>
            <div class="text-secondary">Node palette (Text, Image, Video, OpenAI, Output) • Drag-drop canvas • Properties panel • MuAPI integration</div>
          </div>
          <div class="border-l-2 border-green-400 pl-3">
            <div class="font-bold text-white">MarketingStudioApp.js</div>
            <div class="text-secondary">Video ad generation • Asset upload • Avatar presets • Library handoff</div>
          </div>
          <div class="border-l-2 border-yellow-400 pl-3">
            <div class="font-bold text-white">AIAgentApp.js</div>
            <div class="text-secondary">10 agent roles • OpenAI chat • Tool selection • Workflow/Design/Marketing/Director/Library handoffs</div>
          </div>
          <div class="border-l-2 border-purple-400 pl-3">
            <div class="font-bold text-white">DesignAgentApp.js</div>
            <div class="text-secondary">20 design types • 8 style options • 6 output formats • Image/Workflow/Library handoffs</div>
          </div>
        </div>
      </div>
    </div>
  `;
  container.appendChild(content);

  document.getElementById('back-btn').onclick = () => window.history.back();

  return container;
}