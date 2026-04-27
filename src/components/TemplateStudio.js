import { getTemplateById } from '../lib/templates.js';
import { getTemplateThumbnail } from '../lib/thumbnails.js';
import { getTemplateSpecs, hasEnhancedSpecs } from '../lib/templateSpecs.js';
import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createUploadPicker } from './UploadPicker.js';
import { navigate } from '../lib/router.js';
import { sanitizeUrl } from '../lib/security.js';
import { GTMPromptModal } from './modals/GTMPromptModal.jsx';

export function TemplateStudio(templateId) {
  const template = getTemplateById(templateId);
  
  if (!template) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'min-h-screen bg-[#0a0a0b] text-white flex items-center justify-center';
    errorContainer.innerHTML = `<div class="text-zinc-400">Template not found</div>`;
    return errorContainer;
  }

  // Get enhanced specs if available
  const specs = getTemplateSpecs(templateId) || {};
  const hasSpecs = hasEnhancedSpecs(templateId);

  // Support both input structures
  const allInputs = [
    ...(template.inputs || []),
    ...(template.quickInputs || []),
    ...(template.advancedInputs || [])
  ];

  // State management
  const formState = {};
  let activeTab = 'Enhanced Prompt';
  let aiEnhancer = true;
  let showAdvanced = false;
  let uploadedUrl = null;
  let isGenerating = false;

  // Create full-page wrapper
  const container = document.createElement('div');
  container.className = 'min-h-screen bg-[#0a0a0b] text-white';

  // Create app shell row
  const appShell = document.createElement('div');
  appShell.className = 'flex min-h-screen';

  // Left rail spacer
  const leftRail = document.createElement('aside');
  leftRail.className = 'hidden w-[68px] shrink-0 border-r border-white/5 bg-black/90 lg:block';
  appShell.appendChild(leftRail);

  // Main content area
  const main = document.createElement('main');
  main.className = 'flex-1';

  // Top nav row
  const navHeader = document.createElement('div');
  navHeader.className = 'border-b border-white/5 px-6 py-4';
  navHeader.innerHTML = `
    <div class="flex items-center gap-8 overflow-x-auto text-sm text-zinc-400">
      <button class="hover:text-white transition" data-nav="explore">Explore</button>
      <button class="hover:text-white transition" data-nav="image">Image</button>
      <button class="hover:text-white transition" data-nav="video">Video</button>
      <button class="hover:text-white transition" data-nav="tools">Storyboard</button>
      <button class="hover:text-white transition" data-nav="edit">Edit</button>
      <button class="hover:text-white transition" data-nav="character">Character</button>
      <button class="hover:text-white transition" data-nav="effects">Vibe Motion</button>
      <button class="hover:text-white transition" data-nav="cinema">Cinema Studio</button>
      <button class="hover:text-white transition" data-nav="influencer">AI Influencer</button>
      <button class="hover:text-white transition" data-nav="apps">Apps</button>
      <button class="text-white font-semibold" data-nav="templates">Templates</button>
      <button class="hover:text-white transition" data-nav="assist">Assist</button>
      <button class="hover:text-white transition" data-nav="community">Community</button>
    </div>
  `;
  main.appendChild(navHeader);

  // Add nav click handlers
  navHeader.querySelectorAll('[data-nav]').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.nav);
  });

  // Content area with padding
  const contentArea = document.createElement('div');
  contentArea.className = 'px-8 py-10';

  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'mb-10 text-sm text-zinc-400 transition hover:text-white';
  backBtn.innerHTML = '&larr; Back to Apps';
  backBtn.onclick = () => navigate('templates');
  contentArea.appendChild(backBtn);

  // Centered template container
  const centeredContainer = document.createElement('div');
  centeredContainer.className = 'mx-auto max-w-[980px]';

  // Hero section - improved layout with Figma-inspired design
  const heroSection = document.createElement('div');
  heroSection.className = 'flex flex-col items-center text-center mb-12';

  // Enhanced thumbnail with better styling
  const thumbnailUrl = getTemplateThumbnail(template.id);
  const thumbnailContainer = document.createElement('div');
  thumbnailContainer.className = 'relative mb-8';

  const thumbnailEl = document.createElement('div');
  thumbnailEl.className = 'h-32 w-32 rounded-[32px] border-2 border-emerald-400/30 shadow-[0_0_60px_rgba(16,185,129,0.15)] overflow-hidden ring-4 ring-emerald-400/10';

  if (thumbnailUrl) {
    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = template.name;
    img.className = 'w-full h-full object-cover';
    thumbnailEl.appendChild(img);
  } else {
    thumbnailEl.className += ' bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center';
    const icon = document.createElement('div');
    icon.className = 'text-6xl';
    icon.textContent = template.icon || '🎬';
    thumbnailEl.appendChild(icon);
  }
  thumbnailContainer.appendChild(thumbnailEl);

  // Add subtle glow effect
  const glow = document.createElement('div');
  glow.className = 'absolute inset-0 rounded-[32px] bg-emerald-400/5 blur-xl -z-10';
  thumbnailContainer.appendChild(glow);

  heroSection.appendChild(thumbnailContainer);

  // Enhanced title with better typography
  const title = document.createElement('h1');
  title.className = 'text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-zinc-300 bg-clip-text text-transparent mb-4';
  title.textContent = template.name;
  heroSection.appendChild(title);

  // Improved description
  const desc = document.createElement('p');
  desc.className = 'text-xl text-zinc-300 max-w-2xl leading-relaxed';
  desc.textContent = hasSpecs && specs.uiDescription ? specs.uiDescription : template.description;
  heroSection.appendChild(desc);

  // Enhanced pills with better spacing and styling
  const pills = document.createElement('div');
  pills.className = 'mt-8 flex flex-wrap gap-3 justify-center';
  pills.innerHTML = `
    <span class="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-medium text-emerald-200 shadow-sm">
      <span class="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
      ${template.outputType === 'video' ? 'Video Generation' : 'Image Generation'}
    </span>
    <span class="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-200">
      <span class="w-2 h-2 rounded-full bg-zinc-400 mr-2"></span>
      ${template.category}
    </span>
    ${hasSpecs && specs.coreUseCase ? `<span class="inline-flex items-center rounded-full border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-200"><span class="w-2 h-2 rounded-full bg-zinc-400 mr-2"></span>${specs.coreUseCase}</span>` : ''}
  `;
  heroSection.appendChild(pills);
  centeredContainer.appendChild(heroSection);

  // Two-column grid
  const grid = document.createElement('div');
  grid.className = 'mt-10 grid gap-8 xl:grid-cols-[520px_1fr] xl:items-start';

  // Left panel - Enhanced form inputs with Figma-inspired design
  const leftPanel = document.createElement('div');
  leftPanel.className = 'rounded-[40px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.04] p-8 shadow-[0_25px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm';

  // Form header
  const formHeader = document.createElement('div');
  formHeader.className = 'mb-6';
  formHeader.innerHTML = `
    <h2 class="text-2xl font-bold text-white mb-2">Configuration</h2>
    <p class="text-zinc-400 text-sm">Customize your generation parameters</p>
  `;
  leftPanel.appendChild(formHeader);

  // Build enhanced form fields
  allInputs.forEach(input => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'mb-6 last:mb-0';

    const label = document.createElement('div');
    label.className = 'mb-4 flex items-center justify-between gap-3';
    label.innerHTML = `
      <div class="text-sm font-semibold text-zinc-200">${input.label}</div>
      ${input.type === 'text' || input.type === 'textarea' ? `<button class="enhancer-btn rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 hover:border-emerald-400/50" data-field="${input.name}">✨ Enhance</button>` : ''}
    `;
    fieldWrapper.appendChild(label);

    if (input.type === 'image') {
      const uploadArea = document.createElement('div');
      uploadArea.className = 'group flex h-20 items-center gap-4 rounded-[24px] border-2 border-dashed border-white/20 bg-gradient-to-r from-white/[0.02] to-white/[0.01] px-6 text-zinc-400 cursor-pointer transition hover:border-emerald-400/40 hover:bg-emerald-500/5 hover:text-emerald-300';
      uploadArea.innerHTML = `
        <div class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-xl group-hover:border-emerald-400/40 group-hover:bg-emerald-500/10 transition">📁</div>
        <div class="flex-1">
          <div class="text-sm font-medium text-zinc-300 group-hover:text-emerald-200">Upload Image</div>
          <div class="text-xs text-zinc-500 group-hover:text-emerald-300/80">Click to browse or drag and drop</div>
        </div>
      `;
      uploadArea.onclick = () => {
        const picker = createUploadPicker({
          anchorContainer: container,
          onSelect: ({ url }) => {
            uploadedUrl = url;
            formState[input.name] = url;
            uploadArea.innerHTML = `<div class="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-xl">✓</div><div class="flex-1"><div class="text-sm font-medium text-emerald-200">Image Uploaded</div><div class="text-xs text-emerald-300/80">Ready to generate</div></div>`;
            uploadArea.className = uploadArea.className.replace('border-dashed border-white/20', 'border-solid border-emerald-400/40');
          },
          onClear: () => {
            uploadedUrl = null;
            formState[input.name] = null;
          }
        });
        container.appendChild(picker.panel);
      };
      fieldWrapper.appendChild(uploadArea);
    } else if (input.type === 'text' || input.type === 'textarea') {
      const el = document.createElement(input.type === 'textarea' ? 'textarea' : 'input');
      el.className = 'w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 py-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20';
      if (input.type === 'textarea') {
        el.className += ' resize-none';
        el.rows = 4;
        el.style.minHeight = '100px';
      } else {
        el.className += ' h-12';
      }
      el.placeholder = input.placeholder || '';
      el.oninput = () => { formState[input.name] = el.value; };
      fieldWrapper.appendChild(el);
    } else if (input.type === 'select') {
      const select = document.createElement('select');
      select.className = 'h-12 w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.08] to-white/[0.04] px-5 text-sm text-white outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 appearance-none cursor-pointer';
      (input.options || []).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        option.className = 'bg-zinc-900 text-white';
        select.appendChild(option);
      });
      if (input.options && input.options.length > 0) {
        formState[input.name] = input.options[0];
      }
      select.onchange = () => { formState[input.name] = select.value; };
      fieldWrapper.appendChild(select);
    }

    leftPanel.appendChild(fieldWrapper);
  });

  // Enhanced AI Enhancer section
  const enhancerSection = document.createElement('div');
  enhancerSection.className = 'mt-8 rounded-[32px] border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 via-blue-500/5 to-purple-500/5 p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)]';
  enhancerSection.innerHTML = `
    <div class="flex items-start justify-between gap-4 mb-4">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span class="text-lg">✨</span>
          </div>
          <div class="text-lg font-bold text-white">AI Enhancement</div>
        </div>
        <div class="text-sm text-zinc-300 leading-relaxed">
          Automatically optimizes your prompts with cinematic techniques, niche detection, and professional enhancement for premium results.
        </div>
      </div>
      <button id="enhancerToggle" class="relative h-8 w-14 rounded-full transition bg-emerald-400 shadow-lg">
        <span class="absolute top-1 h-6 w-6 rounded-full bg-white transition left-7" id="enhancerToggleKnob"></span>
      </button>
    </div>
    <div class="flex items-center justify-between">
      <div class="text-xs text-emerald-200/80 font-medium">Enhancement Active</div>
      <button id="advancedToggle" class="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 px-4 py-2 rounded-full border border-emerald-400/30 hover:border-emerald-400/50 hover:bg-emerald-500/10">
        Advanced Settings →
      </button>
    </div>
    <div id="advancedControls" class="mt-6 grid gap-5 md:grid-cols-2 hidden"></div>
  `;
  leftPanel.appendChild(enhancerSection);

  // Advanced controls content
  const advancedControls = enhancerSection.querySelector('#advancedControls');
  const advancedFields = [
    { name: 'templateType', label: 'Template Type', type: 'select', options: ['cinematic-short-film', 'dramatic-trailer', 'founder-story-film', 'testimonial-film', 'case-study-film', 'promo-film', 'cinematic-commercial', 'documentary-style-film'] },
    { name: 'niche', label: 'Niche', type: 'select', options: ['auto-detect', 'restaurant', 'med-spa', 'real-estate', 'fitness', 'legal', 'dental', 'general-business', 'automotive', 'fashion', 'local-business', 'saas', 'agency'] },
    { name: 'businessType', label: 'Business Type', type: 'text', placeholder: 'optional' },
    { name: 'audience', label: 'Audience', type: 'text', placeholder: 'optional' },
    { name: 'subject', label: 'Subject', type: 'text', placeholder: 'optional' },
    { name: 'setting', label: 'Setting', type: 'text', placeholder: 'optional' },
    { name: 'visualStyle', label: 'Visual Style', type: 'select', options: ['luxury', 'dramatic', 'documentary', 'commercial'] },
    { name: 'cta', label: 'CTA', type: 'text', placeholder: 'optional' }
  ];

  advancedFields.forEach(field => {
    const wrapper = document.createElement('div');
    if (field.type === 'select') {
      wrapper.innerHTML = `
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">${field.label}</div>
        </div>
        <select class="h-11 w-full rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 text-sm text-white outline-none transition focus:border-emerald-400/50 appearance-none cursor-pointer" data-advanced-field="${field.name}">
          ${field.options.map(opt => `<option value="${opt}" class="bg-zinc-950 text-white">${opt}</option>`).join('')}
        </select>
      `;
    } else {
      wrapper.innerHTML = `
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">${field.label}</div>
          <button class="enhancer-btn rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white" data-field="${field.name}">Enhance</button>
        </div>
        <input type="text" class="h-11 w-full rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 text-sm text-white outline-none transition focus:border-emerald-400/50" placeholder="${field.placeholder}" data-advanced-field="${field.name}" />
      `;
    }
    advancedControls.appendChild(wrapper);
  });

  // Extra instructions textarea
  const extraWrapper = document.createElement('div');
  extraWrapper.className = 'md:col-span-2';
  extraWrapper.innerHTML = `
    <div class="mb-3 flex items-center justify-between gap-3">
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Extra Instructions</div>
      <button class="basic-enhancer-btn rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white" title="Basic Enhancement">Enhance</button>
      <button class="gtm-enhancer-btn rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white" title="GTM Prompt Enhancement">🚀 GTM Boost</button>
    </div>
    <textarea class="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50 resize-none" rows="4" placeholder="optional cinematic instructions" data-advanced-field="extraInstructions"></textarea>
  `;
  advancedControls.appendChild(extraWrapper);

  // Enhanced Generate button
  const genBtn = document.createElement('button');
  genBtn.className = 'mt-8 flex h-16 w-full items-center justify-center rounded-[28px] bg-gradient-to-r from-emerald-400 to-emerald-500 text-xl font-bold text-white shadow-[0_0_40px_rgba(16,185,129,0.3)] transition hover:from-emerald-500 hover:to-emerald-600 hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] transform hover:scale-[1.02] active:scale-[0.98]';
  genBtn.innerHTML = `
    <span class="flex items-center gap-3">
      <span class="text-2xl">🚀</span>
      <span>Generate Content</span>
    </span>
  `;
  leftPanel.appendChild(genBtn);

  // Creative Intelligence section
  const intelligenceSection = document.createElement('div');
  intelligenceSection.className = 'mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)]';
  intelligenceSection.innerHTML = `
    <h2 class="text-xl font-bold text-white">Creative Intelligence</h2>
    <p class="mt-2 mb-5 text-sm text-zinc-400">These tiles show the cinematic structure, creative direction, and visual strategy this template will use to build your final video.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 hover:border-blue-400/20 transition cursor-pointer">
        <div class="mb-3 text-3xl">🏷️</div>
        <h3 class="text-lg font-bold text-white mb-2">Auto-Detected Niche</h3>
        <textarea class="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300 outline-none transition focus:border-emerald-400/50 resize-none" rows="3" data-tile="niche">${hasSpecs && specs.niche ? specs.niche : 'general-business'}</textarea>
      </div>
      <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 hover:border-violet-400/20 transition cursor-pointer">
        <div class="mb-3 text-3xl">🎬</div>
        <h3 class="text-lg font-bold text-white mb-2">Scene Structure</h3>
        <textarea class="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300 outline-none transition focus:border-emerald-400/50 resize-none" rows="3" data-tile="scene">${hasSpecs && specs.sceneBlueprint ? specs.sceneBlueprint.join(' → ') : 'Hook → Subject → Movement → Payoff → CTA'}</textarea>
      </div>
      <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 hover:border-emerald-400/20 transition cursor-pointer">
        <div class="mb-3 text-3xl">🎥</div>
        <h3 class="text-lg font-bold text-white mb-2">Cinematic Enrichment</h3>
        <textarea class="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300 outline-none transition focus:border-emerald-400/50 resize-none" rows="3" data-tile="cinematic">${hasSpecs && specs.cinematography ? specs.cinematography : 'Dynamic camera movement, shallow depth of field, professional lighting'}</textarea>
      </div>
      <div class="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 hover:border-amber-400/20 transition cursor-pointer">
        <div class="mb-3 text-3xl">⚙️</div>
        <h3 class="text-lg font-bold text-white mb-2">Visual Style</h3>
        <textarea class="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300 outline-none transition focus:border-emerald-400/50 resize-none" rows="3" data-tile="style">${hasSpecs && specs.visualStyle ? specs.visualStyle : 'Polished, cinematic, high-contrast, premium aesthetic'}</textarea>
      </div>
      <div class="md:col-span-2 rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4 hover:border-rose-400/20 transition cursor-pointer">
        <div class="mb-3 text-3xl">✨</div>
        <h3 class="text-lg font-bold text-white mb-2">Enhancer Keywords</h3>
        <textarea class="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-zinc-300 outline-none transition focus:border-emerald-400/50 resize-none" rows="4" data-tile="keywords">${hasSpecs && specs.enhancerKeywords ? specs.enhancerKeywords : 'cinematic, professional, 4K, high quality, premium'}</textarea>
      </div>
    </div>
  `;
  leftPanel.appendChild(intelligenceSection);

  grid.appendChild(leftPanel);

  // Right panel - Enhanced Preview and Output
  const rightPanel = document.createElement('div');
  rightPanel.className = 'space-y-6';

  // Enhanced Preview section
  const previewSection = document.createElement('div');
  previewSection.className = 'rounded-[40px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.04] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm';
  previewSection.innerHTML = `
    <div class="mb-6 flex items-center justify-between">
      <h3 class="text-xl font-bold text-white">Live Preview</h3>
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
          ${template.outputType === 'video' ? 'Video' : 'Image'}
        </span>
        <span class="inline-flex rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300">${template.category}</span>
        <span class="inline-flex rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-300">${template.aspectRatio || '16:9'}</span>
      </div>
    </div>
    <div class="rounded-[32px] border border-white/20 bg-gradient-to-br from-black/60 to-black/40 p-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
      <div class="aspect-[16/10] rounded-[24px] border border-white/10 bg-gradient-to-br from-zinc-900/80 to-black/80 p-6">
        <div class="flex h-full flex-col rounded-[20px] border border-white/15 bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-zinc-500"></div>
              <span class="text-xs font-medium text-zinc-400 uppercase tracking-wider">Preview Panel</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-xs font-medium text-emerald-300">Ready</span>
            </div>
          </div>
          <div id="previewArea" class="flex flex-1 items-center justify-center rounded-[16px] border-2 border-dashed border-zinc-600 bg-gradient-to-br from-zinc-900/50 to-black/50 text-center transition hover:border-emerald-400/50 hover:bg-emerald-500/5">
            <div class="text-center">
              <div class="text-4xl mb-3 opacity-50">🎯</div>
              <div class="text-sm text-zinc-400 mb-1">Upload media and configure settings</div>
              <div class="text-xs text-zinc-500">Your generated content will appear here</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  rightPanel.appendChild(previewSection);

  // Enhanced Output tabs section
  const outputTabs = ['Enhanced Prompt', 'Scene Beats', 'Voiceover', 'Negative Prompt'];
  const outputSection = document.createElement('div');
  outputSection.className = 'rounded-[40px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.04] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.5)] backdrop-blur-sm';

  // Section header
  const outputHeader = document.createElement('div');
  outputHeader.className = 'mb-6';
  outputHeader.innerHTML = `
    <h3 class="text-xl font-bold text-white mb-2">Generated Content</h3>
    <p class="text-zinc-400 text-sm">AI-enhanced outputs and creative assets</p>
  `;
  outputSection.appendChild(outputHeader);

  // Enhanced tab buttons
  const tabRow = document.createElement('div');
  tabRow.className = 'mb-6 flex flex-wrap gap-3';
  tabRow.id = 'outputTabs';
  outputTabs.forEach(tab => {
    const tabBtn = document.createElement('button');
    tabBtn.className = `rounded-full px-4 py-2.5 text-sm font-medium transition ${
      tab === activeTab
        ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 shadow-sm'
        : 'border border-white/20 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:border-white/30'
    }`;
    tabBtn.textContent = tab;
    tabBtn.onclick = () => {
      activeTab = tab;
      document.querySelectorAll('#outputTabs button').forEach(b => {
        b.className = `rounded-full px-4 py-2.5 text-sm font-medium transition ${
          b.textContent === activeTab
            ? 'border border-emerald-400/50 bg-emerald-500/20 text-emerald-200 shadow-sm'
            : 'border border-white/20 bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08] hover:border-white/30'
        }`;
      });
      updateOutputContent();
    };
    tabRow.appendChild(tabBtn);
  });
  outputSection.appendChild(tabRow);

  // Enhanced output content area
  const outputContent = document.createElement('div');
  outputContent.className = 'rounded-[24px] border border-white/20 bg-gradient-to-b from-black/60 to-black/40 p-5';
  outputContent.innerHTML = `
    <div class="mb-4 flex items-center justify-between gap-3">
      <div class="text-sm font-medium text-zinc-300">Editable Output</div>
      <button id="wandBtn" class="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 transition hover:bg-emerald-500/25 hover:border-emerald-400/60 shadow-sm" title="Enhance with AI">
        <span class="text-lg">✨</span>
      </button>
    </div>
    <textarea id="outputTextarea" class="w-full rounded-[20px] border border-white/20 bg-gradient-to-b from-white/[0.06] to-white/[0.03] px-5 py-4 text-sm leading-7 text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 resize-none" rows="14">${specs.enhancerKeywords || 'Click Generate to create an enhanced prompt...'}</textarea>
  `;
  outputSection.appendChild(outputContent);
  rightPanel.appendChild(outputSection);

  grid.appendChild(rightPanel);
  centeredContainer.appendChild(grid);
  contentArea.appendChild(centeredContainer);
  main.appendChild(contentArea);
  appShell.appendChild(main);
  container.appendChild(appShell);

  // Result area (hidden by default)
  const resultArea = document.createElement('div');
  resultArea.id = 'resultArea';
  resultArea.className = 'hidden mt-8';
  centeredContainer.appendChild(resultArea);

  // Update output content based on active tab
  function updateOutputContent() {
    const textarea = document.getElementById('outputTextarea');
    if (!textarea) return;

    switch (activeTab) {
      case 'Enhanced Prompt':
        textarea.value = specs.enhancerKeywords || 'Enhanced prompt will appear here...';
        break;
      case 'Scene Beats':
        textarea.value = specs.sceneBlueprint ? specs.sceneBlueprint.join(' → ') : 'Scene beats will appear here...';
        break;
      case 'Voiceover':
        textarea.value = `Create a premium voiceover for a ${template.name}. Open with a fast hook, build emotional or commercial momentum, end with a clear call to action.`;
        break;
      case 'Negative Prompt':
        textarea.value = specs.negativePrompt || 'Negative prompt will appear here...';
        break;
    }
  }

  // Add functionality after DOM is ready
  setTimeout(() => {
    // Enhancer toggle
    const toggleBtn = document.getElementById('enhancerToggle');
    const toggleKnob = document.getElementById('enhancerToggleKnob');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        aiEnhancer = !aiEnhancer;
        toggleBtn.className = `relative h-7 w-12 rounded-full transition ${aiEnhancer ? 'bg-emerald-400' : 'bg-white/10'}`;
        toggleKnob.className = `absolute top-1 h-5 w-5 rounded-full bg-black transition ${aiEnhancer ? 'left-6' : 'left-1'}`;
      };
    }

    // Advanced toggle
    const advancedBtn = document.getElementById('advancedToggle');
    const advControls = document.getElementById('advancedControls');
    if (advancedBtn && advControls) {
      advancedBtn.onclick = () => {
        showAdvanced = !showAdvanced;
        advancedBtn.textContent = showAdvanced ? 'Hide Advanced Controls' : 'Show Advanced Controls';
        advControls.className = showAdvanced ? 'mt-5 grid gap-4 md:grid-cols-2' : 'mt-5 grid gap-4 md:grid-cols-2 hidden';
      };
    }

    // Wand button
    const wandBtn = document.getElementById('wandBtn');
    if (wandBtn) {
      wandBtn.onclick = () => {
        const textarea = document.getElementById('outputTextarea');
        if (textarea && textarea.value) {
          const enhancedText = `${textarea.value}, cinematic quality, professional lighting, high detail, 4K resolution`;
          textarea.value = enhancedText;
          textarea.classList.add('border-emerald-400/50');
          setTimeout(() => textarea.classList.remove('border-emerald-400/50'), 1000);
        }
      };
    }

    // Enhancer buttons
    document.querySelectorAll('.enhancer-btn').forEach(btn => {
      btn.onclick = () => {
        const fieldName = btn.dataset.field;
        const input = document.querySelector(`[data-advanced-field="${fieldName}"]`);
        if (input && input.value) {
          const enhancedValue = `${input.value}, cinematic style, professional quality, premium aesthetic`;
          input.value = enhancedValue;
          btn.classList.add('border-emerald-400/40', 'bg-emerald-500/15', 'text-emerald-200');
          btn.textContent = 'Enhanced ✓';
          setTimeout(() => {
            btn.classList.remove('border-emerald-400/40', 'bg-emerald-500/15', 'text-emerald-200');
            btn.textContent = 'Enhance';
          }, 2000);
        }
      };
    });

    // Basic enhancer button handler
    document.querySelectorAll('.basic-enhancer-btn').forEach(btn => {
      btn.onclick = () => {
        const fieldName = btn.dataset.field || 'extraInstructions';
        const input = document.querySelector(`[data-advanced-field="${fieldName}"]`);
        if (input && input.value) {
          const enhancedValue = `${input.value}, cinematic style, professional quality, premium aesthetic`;
          input.value = enhancedValue;
          btn.classList.add('border-emerald-400/40', 'bg-emerald-500/15', 'text-emerald-200');
          btn.textContent = 'Enhanced ✓';
          setTimeout(() => {
            btn.classList.remove('border-emerald-400/40', 'bg-emerald-500/15', 'text-emerald-200');
            btn.textContent = 'Enhance';
          }, 2000);
        }
      };
    });

    // GTM Enhancer button handler
    document.querySelectorAll('.gtm-enhancer-btn').forEach(btn => {
      btn.onclick = () => {
        const fieldName = btn.dataset.field || 'extraInstructions';
        const input = document.querySelector(`[data-advanced-field="${fieldName}"]`);
        if (input) {
          openGTMPromptModal(input, fieldName);
        }
      };
    });
  }, 100);

  // Generate button handler
  genBtn.onclick = async () => {
    if (isGenerating) return;

    // SECURITY ISSUE: API keys stored in localStorage are accessible to XSS attacks
    // TODO: Replace with server-side session storage or httpOnly cookies
    const apiKey = localStorage.getItem('muapi_key');
    if (!apiKey) {
      AuthModal(() => genBtn.click());
      return;
    }

    isGenerating = true;
    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Generating...';

    try {
      const params = { model: template.model, ...(template.defaultParams || {}) };
      if (template.aspectRatio) params.aspect_ratio = template.aspectRatio;

      allInputs.forEach(input => {
        if (formState[input.name]) {
          params[input.name] = formState[input.name];
        }
      });

      // Build enhanced prompt if AI enhancer is on
      if (aiEnhancer && specs.enhancerKeywords && params.prompt) {
        params.prompt = `${params.prompt}, ${specs.enhancerKeywords}`;
      } else if (template.basePrompt && params.prompt) {
        params.prompt = template.basePrompt.replace('{prompt}', params.prompt);
      } else if (template.basePrompt && !params.prompt) {
        params.prompt = template.basePrompt.replace('{prompt}', '');
      }

      let result;
      if (template.modelType === 'i2v') {
        result = await muapi.generateI2V(params);
      } else if (template.modelType === 'i2i') {
        result = await muapi.generateI2I(params);
      } else {
        result = await muapi.generateImage(params);
      }

      if (result && result.url) {
        showResult(result.url);
        saveToHistory(result.url, params.prompt || template.name);
      } else {
        throw new Error('No output URL returned');
      }
    } catch (err) {
      console.error('[TemplateStudio]', err);
      genBtn.textContent = `Error: ${err.message.slice(0, 40)}`;
      setTimeout(() => {
        genBtn.textContent = 'Generate';
        genBtn.disabled = false;
      }, 3000);
      return;
    }

    isGenerating = false;
    genBtn.disabled = false;
    genBtn.textContent = 'Generate';
  };

  function showResult(url) {
    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
      const safeUrl = sanitizeUrl(url);
      if (template.outputType === 'video') {
        previewArea.innerHTML = `<video src="${safeUrl}" controls autoplay loop class="w-full h-full object-contain rounded-xl"></video>`;
      } else {
        previewArea.innerHTML = `<img src="${safeUrl}" alt="Generated result" class="w-full h-full object-contain rounded-xl" />`;
      }
    }

    resultArea.classList.remove('hidden');
    const safeUrl = sanitizeUrl(url);
    resultArea.innerHTML = `
      <div class="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <h3 class="text-lg font-bold text-white mb-4">Generated Result</h3>
        <div class="rounded-[20px] border border-white/10 bg-black/40 p-4">
          ${template.outputType === 'video'
            ? `<video src="${safeUrl}" controls autoplay loop class="w-full rounded-xl"></video>`
            : `<img src="${safeUrl}" alt="Generated result" class="w-full rounded-xl" />`
          }
        </div>
        <div class="flex gap-3 mt-4">
          <a href="${url}" download="${template.id}-${Date.now()}" class="flex-1 bg-white text-black py-3 rounded-xl font-bold text-sm text-center hover:opacity-90 transition">Download</a>
          <button id="generateAgainBtn" class="flex-1 border border-white/10 bg-white/[0.04] text-white py-3 rounded-xl font-bold text-sm hover:bg-white/[0.08] transition">Generate Again</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const againBtn = document.getElementById('generateAgainBtn');
      if (againBtn) {
        againBtn.onclick = () => genBtn.click();
      }
    }, 0);
  }

  function saveToHistory(url, prompt) {
    try {
      const history = JSON.parse(localStorage.getItem('muapi_history') || '[]');
      history.unshift({
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('muapi_history', JSON.stringify(history.slice(0, 100)));
    } catch (e) { /* ignore */ }
  }

  // GTM Prompt Modal Function
  function openGTMPromptModal(promptTextarea) {
    try {
      const modal = new GTMPromptModal({
        appTheme: 'template-studio',
        onPromptGenerated: (generatedPrompt) => {
          // Load the generated prompt into the textarea
          promptTextarea.value = generatedPrompt;
          promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));

          console.log('GTM-optimized prompt loaded successfully!');
        }
      });
      modal.open();
    } catch (error) {
      console.error('GTM Prompt Modal error:', error);
      alert('Failed to open GTM Prompt Enhancer');
    }
  }

  return container;
}
