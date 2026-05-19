import { createHeroSection } from '../lib/thumbnails.js';
import { navigate } from '../lib/router.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

export function VideoOutreachStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col overflow-hidden bg-gradient-to-br from-[#090d1a] via-[#0d1324] to-[#090b16] text-white';

  const heroBanner = createHeroSection('video-outreach', 'h-64 md:h-80 lg:h-96 mb-4');

  container.innerHTML = `
    <div class="mx-auto max-w-7xl px-6 py-8 md:px-10">
      <div class="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_0_40px_rgba(56,189,248,0.12)] backdrop-blur-xl">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="mb-2 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Standalone app</p>
            <h1 class="text-3xl font-semibold tracking-tight">AI Personalized Video Outreach</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-300">Create campaigns, import contacts, generate personalized scripts with OpenAI, and run MuAPI media jobs from one dedicated workspace.</p>
          </div>
          <div class="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">Phase 1 MVP Active</div>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <button id="create-campaign-btn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-medium transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
          Create Campaign
        </button>
        <button id="import-contacts-btn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-medium transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
          Import Contacts
        </button>
        <button id="generate-scripts-btn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-medium transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
          Generate Scripts
        </button>
        <button id="create-landing-btn" class="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm font-medium transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
          Create Landing Pages
        </button>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 class="text-lg font-semibold">Implementation Checklist</h2>
          <div class="mt-4 grid gap-3 text-sm text-slate-300">
            ${[
              'Auth + workspace bootstrap',
              'Campaign creation + list views',
              'CSV/manual contact import',
              'OpenAI personalized scripts edge function',
              'Landing page creation by prospect slug',
              'Public tracking + lead capture endpoints',
              'Analytics rollup by campaign/video/contact',
              'MuAPI media job starter + webhook completion'
            ].map((step, idx) => `
              <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <span class="inline-flex h-6 w-6 items-center justify-center rounded-full ${idx < 5 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-slate-400/20 text-slate-200'} text-xs font-semibold">${idx + 1}</span>
                <span>${step}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 class="text-lg font-semibold">Provider Boundaries</h2>
          <ul class="mt-4 space-y-3 text-sm text-slate-300">
            <li><span class="font-semibold text-cyan-200">OpenAI:</span> scripts, subject lines, follow-ups, CTA, and MuAPI prompts.</li>
            <li><span class="font-semibold text-violet-200">MuAPI:</span> all video/audio/avatar/lip-sync/image generation workflows.</li>
            <li><span class="font-semibold text-amber-200">Security:</span> no browser direct calls; only Supabase Edge + Netlify server functions.</li>
          </ul>
        </div>
      </div>
    </div>
    `;

  if (heroBanner) {
    const innerDiv = container.querySelector('.mx-auto.max-w-7xl');
    if (innerDiv) innerDiv.prepend(heroBanner);
  }

  // Add event listeners for buttons
  const createCampaignBtn = container.querySelector('#create-campaign-btn');
  const importContactsBtn = container.querySelector('#import-contacts-btn');
  const generateScriptsBtn = container.querySelector('#generate-scripts-btn');
  const createLandingBtn = container.querySelector('#create-landing-btn');

  if (createCampaignBtn) {
    createCampaignBtn.addEventListener('click', () => navigate('campaigns/new'));
  }
  if (importContactsBtn) {
    importContactsBtn.addEventListener('click', () => navigate('campaigns'));
  }
  if (generateScriptsBtn) {
    generateScriptsBtn.addEventListener('click', () => navigate('campaigns'));
  }
  if (createLandingBtn) {
    createLandingBtn.addEventListener('click', () => navigate('campaigns'));
  }

  return container;
}
