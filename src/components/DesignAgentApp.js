import { navigate } from '../lib/router.js';

const STORAGE_KEY = 'higgsfield.designProjects';
const HANDOFF_KEYS = {
  image: 'higgsfield.pendingImagePrompt',
  workflow: 'higgsfield.pendingWorkflowDesignOutput',
  agent: 'higgsfield.pendingAgentDesignOutput',
  marketing: 'higgsfield.pendingMarketingDesignOutput',
  library: 'higgsfield.pendingLibraryDesignProject'
};

const DESIGN_TYPES = [
  { id: 'landing-page', name: 'Landing Page', icon: '🌐' },
  { id: 'saas-dashboard', name: 'SaaS Dashboard', icon: '💻' },
  { id: 'app-screen', name: 'App Screen', icon: '📱' },
  { id: 'checkout-page', name: 'Checkout Page', icon: '💳' },
  { id: 'webinar-page', name: 'Webinar Page', icon: '🎤' },
  { id: 'product-thumbnail', name: 'Product Thumbnail', icon: '🎯' },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', icon: '▶️' },
  { id: 'facebook-event', name: 'Facebook Event Image', icon: '📘' },
  { id: 'ad-creative', name: 'Ad Creative', icon: '📢' },
  { id: 'logo-concept', name: 'Logo Concept', icon: '🔤' },
  { id: 'brand-kit', name: 'Brand Kit', icon: '🎨' },
  { id: 'video-scene', name: 'Video Scene', icon: '🎬' },
  { id: 'storyboard-frame', name: 'Storyboard Frame', icon: '📋' },
];

const STYLE_OPTIONS = [
  { id: 'luxury-saas', name: 'Luxury SaaS', description: 'Premium, sophisticated design' },
  { id: 'dark-glassmorphism', name: 'Dark Glassmorphism', description: 'Modern glass-like effects' },
  { id: 'cinematic-ai', name: 'Cinematic AI', description: 'Movie-style visuals' },
  { id: 'futuristic-tech', name: 'Futuristic Tech', description: 'Sci-fi inspired' },
  { id: 'clean-minimal', name: 'Clean Minimal', description: 'Simple, uncluttered' },
  { id: 'bold-drm', name: 'Bold Direct Response', description: 'High-converting designs' },
  { id: 'premium-agency', name: 'Premium Agency', description: 'Professional studio look' },
  { id: 'neon-creator', name: 'Neon Creator Studio', description: 'Glowing, vibrant' },
];

const OUTPUT_FORMATS = [
  { id: 'brief', name: 'Design Brief', icon: '📄' },
  { id: 'image-prompt', name: 'Image Generation Prompt', icon: '🎨' },
  { id: 'wireframe', name: 'Landing Page Wireframe', icon: ' wireframe' },
  { id: 'ui-sections', name: 'UI Section Copy', icon: '🧩' },
  { id: 'thumbnail-prompt', name: 'Thumbnail Prompt', icon: '▶️' },
  { id: 'brand-direction', name: 'Brand Direction', icon: '🎨' },
  { id: 'component-list', name: 'Component List', icon: '🧩' },
];

function safeReadStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function safeWriteStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-primary text-black px-4 py-2 rounded-lg text-sm font-bold z-50';
    toast.textContent = 'Copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  });
}

export function DesignAgentApp() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto custom-scrollbar';

  let project = {
    id: 'design_' + Date.now(),
    name: 'New Design Project',
    type: 'landing-page',
    brandDescription: '',
    audience: '',
    offer: '',
    cta: 'Get Started',
    style: 'dark-glassmorphism',
    colorMood: 'blue-purple-tech',
    outputs: { brief: '', imagePrompt: '', layout: '', copyBlocks: '', componentList: '', animationIdeas: '' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-4 border-b border-white/10 bg-black/20';
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <button id="back-btn" class="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/></svg>
      </button>
      <div>
        <p class="text-xs font-bold text-muted uppercase tracking-wider">Design Agent</p>
        <h1 class="text-lg font-bold text-white">AI Design Assistant</h1>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="save-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Save Project</button>
      <button id="export-btn" class="px-3 py-1.5 text-xs font-bold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">Export</button>
    </div>
  `;
  container.appendChild(header);

  const main = document.createElement('flex-1 flex flex-row overflow-hidden');
  main.className = 'flex-1 flex flex-row overflow-hidden';

  const configPanel = document.createElement('div');
  configPanel.className = 'w-80 border-r border-white/10 bg-black/20 p-4 overflow-y-auto';
  configPanel.innerHTML = `
    <p class="text-xs font-bold text-muted uppercase tracking-wider mb-3">Design Project</p>
    <div class="space-y-4">
      <div>
        <label class="text-xs text-secondary mb-1 block">Project Name</label>
        <input type="text" id="project-name" placeholder="SmartCRM Landing Page" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Design Type</label>
        <select id="design-type" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          ${DESIGN_TYPES.map(d => `<option value="${d.id}">${d.icon} ${d.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Brand/Product Description</label>
        <textarea id="brand-description" placeholder="A SaaS CRM for sales teams..." class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white resize-none h-24"></textarea>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Target Audience</label>
        <input type="text" id="audience" placeholder="Sales managers, small business owners" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Main Offer</label>
        <input type="text" id="offer" placeholder="AI-powered video editing for creators" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Call to Action</label>
        <input type="text" id="cta" placeholder="Get Started Free" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Style</label>
        <select id="style" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          ${STYLE_OPTIONS.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="text-xs text-secondary mb-1 block">Color Mood</label>
        <select id="color-mood" class="w-full px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white">
          <option value="blue-purple-tech">Blue/Purple Tech</option>
          <option value="black-gold">Black/Gold Premium</option>
          <option value="neon-green">Neon Green AI</option>
          <option value="red-orange">Red/Orange Urgency</option>
          <option value="white-gray">White/Gray Minimal</option>
        </select>
      </div>
      <p class="text-xs font-bold text-muted uppercase tracking-wider">Output Formats</p>
      <div id="outputs-list" class="space-y-1 max-h-48 overflow-y-auto"></div>
      <button id="generate-btn" class="w-full px-4 py-2 text-sm font-bold text-black bg-primary border-none rounded-lg hover:bg-primary/80 mt-2">Generate Design</button>
    </div>
  `;

  const outputsList = configPanel.querySelector('#outputs-list');
  OUTPUT_FORMATS.forEach(of => {
    const ofEl = document.createElement('label');
    ofEl.className = 'flex items-center gap-2 text-xs';
    ofEl.innerHTML = `<input type="checkbox" data-output="${of.id}" ${of.id === 'brief' ? 'checked' : ''} class="rounded"><span>${of.icon} ${of.name}</span>`;
    outputsList.appendChild(ofEl);
  });

  const outputPanel = document.createElement('flex-1 flex flex-col p-4');
  outputPanel.className = 'flex-1 flex flex-col p-4 overflow-y-auto';
  outputPanel.innerHTML = `
    <div class="space-y-6" id="outputs-container">
      <div class="empty-state text-center py-10">
        <p class="text-secondary text-sm">Configure your design project and click "Generate Design" to get started.</p>
        <div class="flex gap-2 justify-center mt-4">
          <button id="send-image" class="px-3 py-1.5 text-xs text-white bg-blue-500/10 border border-blue-500/20 rounded">Send to Image Studio</button>
          <button id="send-workflow" class="px-3 py-1.5 text-xs text-white bg-teal-500/10 border border-teal-500/20 rounded">Send to Workflow</button>
        </div>
      </div>
    </div>
  `;

  main.appendChild(configPanel);
  main.appendChild(outputPanel);
  container.appendChild(main);

  // Event listeners
  document.getElementById('back-btn').onclick = () => window.history.back();
  document.getElementById('save-btn').onclick = saveProject;
  document.getElementById('export-btn').onclick = exportProject;
  document.getElementById('generate-btn').onclick = generateDesign;
  document.getElementById('send-image').onclick = () => sendOutput('image');
  document.getElementById('send-workflow').onclick = () => sendOutput('workflow');

  function saveProject() {
    project.name = document.getElementById('project-name').value;
    project.type = document.getElementById('design-type').value;
    project.brandDescription = document.getElementById('brand-description').value;
    project.audience = document.getElementById('audience').value;
    project.offer = document.getElementById('offer').value;
    project.cta = document.getElementById('cta').value;
    project.style = document.getElementById('style').value;
    project.colorMood = document.getElementById('color-mood').value;

    const saved = safeReadStorage(STORAGE_KEY, []);
    saved.push(project);
    safeWriteStorage(STORAGE_KEY, saved);
  }

  function exportProject() {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'design-project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function generateDesign() {
    saveProject();

    project.outputs.brief = `Design Brief: ${project.name}\nType: ${project.type}\nStyle: ${project.style}\n\nBrand: ${project.brandDescription}\nAudience: ${project.audience}\nOffer: ${project.offer}\nCTA: ${project.cta}`;

    project.outputs.imagePrompt = `Create a ${project.style.replace(/-/g, ' ')} ${project.type.replace(/-/g, ' ')} for ${project.brandDescription}. Target: ${project.audience}. Include modern, clean elements with bold typography and vibrant accent colors. Aspect ratio 16:9. Style: ${project.colorMood.replace(/-/g, ' ')} palette.`;

    project.outputs.layout = `1. Hero Section with headline: "${project.offer}" and CTA button: "${project.cta}"\n2. Features Grid (3-4 columns)\n3. Testimonial Section\n4. Pricing Section\n5. FAQ Accordion\n6. Footer with links`;

    project.outputs.copyBlocks = `Headline: "${project.offer}"\nSubheadline: Transform your workflow with AI-powered design\nCTA: "${project.cta}"\nSecondary: Learn more about how this works`;

    project.outputs.componentList = `Header, Hero Banner, Features Grid, Testimonial Carousel, Pricing Table, FAQ, CTA Banner, Footer`;

    project.outputs.animationIdeas = `Hero fade-in (0.5s), Features stagger (0.1s each), CTA pulse (2s cycle), Background parallax on scroll`;

    renderOutputs();
  }

  function renderOutputs() {
    const container = document.getElementById('outputs-container');
    container.innerHTML = '';

    const selectedOutputs = [];
    document.querySelectorAll('input[data-output]:checked').forEach(cb => selectedOutputs.push(cb.dataset.output));

    selectedOutputs.forEach(outputType => {
      const outputEl = document.createElement('div');
      outputEl.className = 'bg-white/5 border border-white/10 rounded-xl p-4';

      const title = document.createElement('h3');
      title.className = 'text-sm font-bold text-white mb-2 flex items-center justify-between';
      title.innerHTML = `${OUTPUT_FORMATS.find(f => f.id === outputType)?.name || outputType} <button data-copy="${outputType}" class="text-xs text-primary hover:text-white">Copy</button>`;

      const content = document.createElement('div');
      content.className = 'text-xs text-secondary space-y-1';
      content.id = `output-${outputType}`;
      content.textContent = project.outputs[outputType] || '';

      outputEl.appendChild(title);
      outputEl.appendChild(content);
      container.appendChild(outputEl);
    });

    if (selectedOutputs.length === 0) {
      container.innerHTML = '<div class="empty-state text-center py-10"><p class="text-secondary text-sm">Select output formats and click "Generate Design" to see results.</p></div>';
    }
  }

  function sendOutput(target) {
    safeWriteStorage(HANDOFF_KEYS[target] || 'higgsfield.pendingOutput', JSON.stringify({ outputs: project.outputs, project: project.name }));
    navigate(target);
  }

  container.addEventListener('change', (e) => {
    if (e.target.matches('input[data-output]')) {
      renderOutputs();
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target.matches('[data-copy]')) {
      const outputType = e.target.dataset.copy;
      copyToClipboard(project.outputs[outputType] || '');
    }
  });

  return container;
}
