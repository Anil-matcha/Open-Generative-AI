import { templateBrowserService } from '../../lib/templates/templateBrowser.js';
import { TemplateCard } from './TemplateCard.jsx';
import { showToast } from '../../lib/loading.js';

/**
 * TemplateBrowser Component - Template selection and browsing interface
 */
export function TemplateBrowser() {
  const container = document.createElement('div');
  container.className = 'flex flex-col h-full bg-bg-app';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-6 border-b border-border-color';

  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold text-text-primary';
  title.textContent = 'Templates';

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-3';

  // Search input
  const searchContainer = document.createElement('div');
  searchContainer.className = 'relative';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search templates...';
  searchInput.className = 'w-64 px-4 py-2 bg-bg-card border border-border-color rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-color-primary focus:border-transparent';
  searchInput.oninput = () => filterTemplates(searchInput.value);

  const searchIcon = document.createElement('div');
  searchIcon.className = 'absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted';
  searchIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  `;

  searchContainer.appendChild(searchInput);
  searchContainer.appendChild(searchIcon);

  // Create template button (for logged-in users)
  const createBtn = document.createElement('button');
  createBtn.className = 'px-4 py-2 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors flex items-center gap-2';
  createBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    Create Template
  `;
  createBtn.onclick = () => showCreateTemplateModal();

  actions.appendChild(searchContainer);
  actions.appendChild(createBtn);

  header.appendChild(title);
  header.appendChild(actions);

  // Category filter tabs
  const categoryTabs = document.createElement('div');
  categoryTabs.className = 'flex items-center gap-1 px-6 py-3 border-b border-border-color overflow-x-auto';

  // Templates grid container
  const templatesContainer = document.createElement('div');
  templatesContainer.className = 'flex-1 p-6 overflow-y-auto custom-scrollbar';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
  templatesContainer.appendChild(grid);

  // Loading state
  const loadingState = document.createElement('div');
  loadingState.className = 'flex items-center justify-center py-12';
  loadingState.innerHTML = `
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-color-primary mx-auto mb-4"></div>
      <p class="text-text-secondary">Loading templates...</p>
    </div>
  `;

  // Empty state
  const emptyState = document.createElement('div');
  emptyState.className = 'flex flex-col items-center justify-center py-12 text-center';
  emptyState.innerHTML = `
    <div class="w-24 h-24 bg-bg-card rounded-full flex items-center justify-center mb-6">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    </div>
    <h3 class="text-xl font-semibold text-text-primary mb-2">No templates found</h3>
    <p class="text-text-muted mb-6 max-w-md">Try adjusting your search terms or browse a different category.</p>
  `;

  // State
  let allTemplates = [];
  let filteredTemplates = [];
  let categories = [];
  let activeCategory = 'all';

  // Load templates and categories
  const loadData = async () => {
    try {
      grid.innerHTML = '';
      grid.appendChild(loadingState);

      const [templatesData, categoriesData] = await Promise.all([
        templateBrowserService.getAllTemplates(),
        templateBrowserService.getCategoriesWithCounts()
      ]);

      allTemplates = templatesData;
      categories = categoriesData;
      filteredTemplates = [...allTemplates];

      renderCategoryTabs();
      renderTemplates();
    } catch (error) {
      console.error('[TemplateBrowser] Failed to load data:', error);
      showToast('Failed to load templates', 'error');
      grid.innerHTML = '';
      grid.appendChild(emptyState);
    }
  };

  // Render category tabs
  const renderCategoryTabs = () => {
    categoryTabs.innerHTML = '';

    // All templates tab
    const allTab = document.createElement('button');
    allTab.className = `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
      activeCategory === 'all'
        ? 'bg-color-primary text-black'
        : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
    }`;
    allTab.textContent = `All Templates (${allTemplates.length})`;
    allTab.onclick = () => {
      activeCategory = 'all';
      filterByCategory('all');
      renderCategoryTabs();
    };
    categoryTabs.appendChild(allTab);

    // Category tabs
    categories.forEach(category => {
      if (category.count === 0) return; // Skip empty categories

      const tab = document.createElement('button');
      tab.className = `px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
        activeCategory === category.id
          ? 'bg-color-primary text-black'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
      }`;
      tab.textContent = `${category.name} (${category.count})`;
      tab.onclick = () => {
        activeCategory = category.id;
        filterByCategory(category.name);
        renderCategoryTabs();
      };
      categoryTabs.appendChild(tab);
    });
  };

  // Filter by category
  const filterByCategory = (categoryName) => {
    if (categoryName === 'all') {
      filteredTemplates = [...allTemplates];
    } else {
      filteredTemplates = allTemplates.filter(template => template.category === categoryName);
    }
    renderTemplates();
  };

  // Filter templates by search
  const filterTemplates = (query) => {
    if (!query.trim()) {
      // Re-apply category filter
      filterByCategory(activeCategory === 'all' ? 'all' : categories.find(c => c.id === activeCategory)?.name || 'all');
      return;
    }

    const lowerQuery = query.toLowerCase();
    filteredTemplates = allTemplates.filter(template => {
      // Check if template matches current category filter
      const categoryMatch = activeCategory === 'all' || template.category === categories.find(c => c.id === activeCategory)?.name;
      if (!categoryMatch) return false;

      // Check search query
      return template.name.toLowerCase().includes(lowerQuery) ||
             (template.description && template.description.toLowerCase().includes(lowerQuery)) ||
             template.category.toLowerCase().includes(lowerQuery);
    });

    renderTemplates();
  };

  // Render templates
  const renderTemplates = () => {
    grid.innerHTML = '';

    if (filteredTemplates.length === 0) {
      grid.appendChild(emptyState);
    } else {
      filteredTemplates.forEach(template => {
        const card = TemplateCard(
          template,
          (t) => handleTemplateClick(t),
          (t) => handleTemplatePreview(t)
        );
        grid.appendChild(card);
      });
    }
  };

  // Event handlers
  const handleTemplateClick = (template) => {
    console.log('[TemplateBrowser] Selected template:', template.id);
    // TODO: Navigate to template usage or project creation with template
    showToast(`Selected template: ${template.name}`, 'info');
  };

  const handleTemplatePreview = (template) => {
    showTemplatePreviewModal(template);
  };

  // Modal functions
  const showCreateTemplateModal = () => {
    // TODO: Implement create template modal
    showToast('Create template modal - Coming soon!', 'info');
  };

  const showTemplatePreviewModal = (template) => {
    // TODO: Implement template preview modal
    showToast(`Preview template: ${template.name} - Coming soon!`, 'info');
  };

  // Initialize
  container.appendChild(header);
  container.appendChild(categoryTabs);
  container.appendChild(templatesContainer);

  // Load initial data
  loadData();

  return container;
}