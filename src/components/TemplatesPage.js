import { allTemplates, getAllCategories } from '../lib/templates.js';
import { NICHE_LABELS_MAP } from '../lib/nicheTemplatesIndex.js';
import { navigate } from '../lib/router.js';
import { getTemplateThumbnail, createThumbnailImg, createHeroSection } from '../lib/thumbnails.js';
import { createInlineInstructions } from './InlineInstructions.js';

export function TemplatesPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full overflow-y-auto bg-app-bg';

  const inner = document.createElement('div');
  inner.className = 'w-full px-4 md:px-8 py-8 md:py-12';

  const heroSection = document.createElement('div');
  heroSection.className = 'mb-10 animate-fade-in-up w-full';
  const heroBanner = createHeroSection('templates', 'h-64 md:h-80 lg:h-96 mb-6');
  if (heroBanner) {
    const heroContent = document.createElement('div');
    heroContent.className = 'absolute bottom-0 left-0 right-0 p-6 z-10';
    heroContent.innerHTML = `
      <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-1">Templates</h1>
      <p class="text-white/60 text-sm font-medium">Ready-to-use creative templates. Pick one, upload your media, and generate.</p>
    `;
    heroBanner.appendChild(heroContent);
    heroSection.appendChild(heroBanner);
  } else {
    heroSection.innerHTML = `
      <h1 class="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">Templates</h1>
      <p class="text-secondary text-sm md:text-base max-w-xl">Ready-to-use creative templates. Pick one, upload your media, and generate.</p>
    `;
  }
  inner.appendChild(heroSection);

  const controlsRow = document.createElement('div');
  controlsRow.className = 'mb-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up';
  controlsRow.style.animationDelay = '0.1s';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search templates...';
  searchInput.className = 'w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors';
  controlsRow.appendChild(searchInput);

  const filterRow = document.createElement('div');
  filterRow.className = 'flex gap-2 overflow-x-auto no-scrollbar';

  // Get all categories and niches for filtering
  const categories = getAllCategories();
  const niches = Object.values(NICHE_LABELS_MAP);
  const allFilters = ['All', 'Standard', ...categories.filter(c => !niches.includes(c)), '--- Niches ---', ...niches];
  
  let activeFilter = null;

  allFilters.forEach(filter => {
    if (filter === '--- Niches ---') {
      const divider = document.createElement('span');
      divider.className = 'text-xs text-muted self-center px-2';
      divider.textContent = '|';
      filterRow.appendChild(divider);
      return;
    }
    
    const isActive = filter === 'All';
    const btn = createFilterChip(filter, isActive);
    btn.onclick = () => {
      activeFilter = filter === 'All' ? null : filter;
      updateFilters();
      renderCategories();
    };
    filterRow.appendChild(btn);
  });

  controlsRow.appendChild(filterRow);
  inner.appendChild(controlsRow);
  const inlineInstructions = createInlineInstructions('templates');
   inlineInstructions.classList.add('mb-8');
  inner.appendChild(inlineInstructions);

  const sectionsContainer = document.createElement('div');
  inner.appendChild(sectionsContainer);

  function updateFilters() {
    filterRow.querySelectorAll('button').forEach(btn => {
      const isActive = (activeFilter === null && btn.dataset.filter === 'all') ||
                       btn.dataset.filter === activeFilter;
      if (isActive) {
        btn.classList.add('bg-primary/20', 'text-primary', 'border-primary/30');
        btn.classList.remove('bg-white/5', 'text-secondary', 'border-white/10');
      } else {
        btn.classList.remove('bg-primary/20', 'text-primary', 'border-primary/30');
        btn.classList.add('bg-white/5', 'text-secondary', 'border-white/10');
      }
    });
  }

  function renderCategories() {
    sectionsContainer.innerHTML = '';
    
    // Separate standard templates and niche templates
    const standardTemplates = allTemplates.filter(t => !t.niche);
    const nicheTemplates = allTemplates.filter(t => t.niche);
    
    // Group niche templates by their niche
    const nicheGroups = {};
    nicheTemplates.forEach(t => {
      if (!nicheGroups[t.niche]) {
        nicheGroups[t.niche] = [];
      }
      nicheGroups[t.niche].push(t);
    });

    if (activeFilter === null) {
      // Show all: standard categories first, then niche groups
      const standardCategories = [...new Set(standardTemplates.map(t => t.category))];
      let sectionIndex = 0;

      // Render standard categories
      standardCategories.forEach((cat) => {
        const catTemplates = standardTemplates.filter(t => t.category === cat);
        if (catTemplates.length > 0) {
          const section = createTemplateSection(cat, catTemplates, false);
          section.style.animationDelay = `${0.15 + sectionIndex * 0.05}s`;
          sectionsContainer.appendChild(section);
          sectionIndex++;
        }
      });

      // Render niche groups
      Object.keys(nicheGroups).sort().forEach((niche) => {
        const section = createTemplateSection(niche, nicheGroups[niche], true);
        section.style.animationDelay = `${0.15 + sectionIndex * 0.05}s`;
        sectionsContainer.appendChild(section);
        sectionIndex++;
      });
    } else if (activeFilter === 'Standard') {
      // Show only standard templates
      const standardCategories = [...new Set(standardTemplates.map(t => t.category))];
      let sectionIndex = 0;

      standardCategories.forEach((cat) => {
        const catTemplates = standardTemplates.filter(t => t.category === cat);
        if (catTemplates.length > 0) {
          const section = createTemplateSection(cat, catTemplates, false);
          section.style.animationDelay = `${0.15 + sectionIndex * 0.05}s`;
          sectionsContainer.appendChild(section);
          sectionIndex++;
        }
      });
    } else if (niches.includes(activeFilter)) {
      // Show specific niche
      const nicheTemplatesFiltered = nicheTemplates.filter(t => t.niche === activeFilter);
      if (nicheTemplatesFiltered.length > 0) {
        const section = createTemplateSection(activeFilter, nicheTemplatesFiltered, true);
        sectionsContainer.appendChild(section);
      }
    } else {
      // Show specific category
      const catTemplates = allTemplates.filter(t => t.category === activeFilter && !t.niche);
      if (catTemplates.length > 0) {
        const section = createTemplateSection(activeFilter, catTemplates, false);
        sectionsContainer.appendChild(section);
      }
    }
  }

  renderCategories();
  container.appendChild(inner);

  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    container.querySelectorAll('[data-searchable]').forEach(el => {
      const text = el.dataset.searchable.toLowerCase();
      el.style.display = text.includes(q) ? '' : 'none';
    });
  };

  return container;
}

function createFilterChip(label, isActive) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.dataset.filter = label === 'All' ? 'all' : label;
  btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap transition-all ${
    isActive
      ? 'bg-primary/20 text-primary border-primary/30'
      : 'bg-white/5 text-secondary border-white/10 hover:bg-white/10'
  }`;
  return btn;
}

function createTemplateSection(category, catTemplates, isNiche) {
  const section = document.createElement('div');
  section.className = 'mb-10 animate-fade-in-up';

  const heading = document.createElement('h2');
  heading.className = `text-lg font-bold mb-4 flex items-center gap-2 ${isNiche ? 'text-cyan-400' : 'text-white'}`;
  
  const nicheLabel = isNiche ? '<span class="text-[10px] font-medium text-cyan-500/70 uppercase tracking-wider">Industry</span>' : '';
  heading.innerHTML = `${category} ${nicheLabel}<span class="text-xs font-medium text-muted">${catTemplates.length}</span>`;
  section.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3';

  catTemplates.forEach(t => {
    const card = document.createElement('div');
    card.className = `backdrop-blur-xl border rounded-xl cursor-pointer transition-all group overflow-hidden ${
      isNiche 
        ? 'bg-[#0a1628]/80 border-cyan-500/20 hover:bg-cyan-900/20 hover:border-cyan-400/40' 
        : 'bg-[#111]/90 border-white/10 hover:bg-white/[0.06] hover:border-white/10'
    }`;
    card.dataset.searchable = `${t.name} ${t.description || ''} ${category} ${t.outputType} ${t.niche || ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const thumbnail = getTemplateThumbnail(t.id);
    if (thumbnail) {
      const heroWrapper = document.createElement('div');
      heroWrapper.className = 'thumb-hero h-32';

      const skeleton = document.createElement('div');
      skeleton.className = 'thumb-skeleton absolute inset-0';
      heroWrapper.appendChild(skeleton);

      const img = createThumbnailImg(thumbnail, t.name, 'absolute inset-0');
      heroWrapper.appendChild(img);
      card.appendChild(heroWrapper);
    }

    const color = t.outputType === 'video'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-primary/10 text-primary border-primary/20';

    const content = document.createElement('div');
    content.className = 'p-3';
    content.innerHTML = `
      <div class="flex items-start gap-3 mb-1">
        <div class="w-8 h-8 rounded-lg ${color} border flex items-center justify-center shrink-0">
          <span class="text-lg">${t.icon}</span>
        </div>
        <div class="min-w-0">
          <div class="text-sm font-bold text-white group-hover:${isNiche ? 'text-cyan-400' : 'text-primary'} transition-colors truncate">${t.name}</div>
          ${t.description ? `<div class="text-[11px] text-muted mt-0.5 line-clamp-2">${t.description}</div>` : ''}
        </div>
      </div>
      <div class="text-[10px] font-bold text-muted mt-1 ml-11">${t.outputType === 'video' ? 'Video' : 'Image'}</div>
    `;
    card.appendChild(content);

    const onClick = () => navigate(`template/${t.id}`);
    card.onclick = onClick;
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    };
    grid.appendChild(card);
  });

  section.appendChild(grid);
  return section;
}
