import { supabase } from '../../lib/supabase.js';
import { whiteLabelManager } from '../../lib/theming/whiteLabelManager.js';
import { showToast } from '../../lib/loading.js';

/**
 * WhiteLabelAdmin Component - Administrative interface for white label management
 */
export function WhiteLabelAdmin() {
  const container = document.createElement('div');
  container.className = 'flex flex-col h-full bg-bg-app';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-6 border-b border-border-color';

  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold text-text-primary';
  title.textContent = 'White Label Administration';

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-3';

  // Create new white label button
  const createBtn = document.createElement('button');
  createBtn.className = 'px-4 py-2 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors flex items-center gap-2';
  createBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    New White Label
  `;
  createBtn.onclick = () => showCreateWhiteLabelModal();

  actions.appendChild(createBtn);

  header.appendChild(title);
  header.appendChild(actions);

  // Content area
  const content = document.createElement('div');
  content.className = 'flex-1 p-6 overflow-y-auto custom-scrollbar';

  // White labels list
  const listContainer = document.createElement('div');
  listContainer.className = 'space-y-4';

  // Loading state
  const loadingState = document.createElement('div');
  loadingState.className = 'flex items-center justify-center py-12';
  loadingState.innerHTML = `
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-color-primary mx-auto mb-4"></div>
      <p class="text-text-secondary">Loading white labels...</p>
    </div>
  `;

  content.appendChild(listContainer);

  // Assemble container
  container.appendChild(header);
  container.appendChild(content);

  // State
  let whiteLabels = [];

  // Load white labels
  const loadWhiteLabels = async () => {
    try {
      listContainer.innerHTML = '';
      listContainer.appendChild(loadingState);

      const { data, error } = await supabase
        .from('white_labels')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      whiteLabels = data || [];
      renderWhiteLabels();
    } catch (error) {
      console.error('[WhiteLabelAdmin] Failed to load white labels:', error);
      showToast('Failed to load white labels', 'error');
      listContainer.innerHTML = '';
      listContainer.appendChild(createEmptyState());
    }
  };

  // Render white labels
  const renderWhiteLabels = () => {
    listContainer.innerHTML = '';

    if (whiteLabels.length === 0) {
      listContainer.appendChild(createEmptyState());
      return;
    }

    whiteLabels.forEach(whiteLabel => {
      const card = createWhiteLabelCard(whiteLabel);
      listContainer.appendChild(card);
    });
  };

  // Create white label card
  const createWhiteLabelCard = (whiteLabel) => {
    const card = document.createElement('div');
    card.className = 'bg-bg-card border border-border-color rounded-lg p-6';

    const header = document.createElement('div');
    header.className = 'flex items-start justify-between mb-4';

    const info = document.createElement('div');

    const name = document.createElement('h3');
    name.className = 'text-lg font-semibold text-text-primary';
    name.textContent = whiteLabel.name;

    const domain = document.createElement('p');
    domain.className = 'text-text-muted';
    domain.textContent = `Domain: ${whiteLabel.domain}`;

    const status = document.createElement('span');
    status.className = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      whiteLabel.is_active
        ? 'bg-green-500/20 text-green-400'
        : 'bg-gray-500/20 text-gray-400'
    }`;
    status.textContent = whiteLabel.is_active ? 'Active' : 'Inactive';

    info.appendChild(name);
    info.appendChild(domain);
    info.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'p-2 text-text-secondary hover:text-text-primary hover:bg-bg-panel rounded-md transition-colors';
    editBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    `;
    editBtn.title = 'Edit white label';
    editBtn.onclick = () => showEditWhiteLabelModal(whiteLabel);

    // Toggle active status
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `p-2 rounded-md transition-colors ${
      whiteLabel.is_active
        ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
        : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
    }`;
    toggleBtn.innerHTML = whiteLabel.is_active ? `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ` : `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="16,12 12,8 8,12"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
      </svg>
    `;
    toggleBtn.title = whiteLabel.is_active ? 'Deactivate' : 'Activate';
    toggleBtn.onclick = () => toggleWhiteLabelStatus(whiteLabel);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'p-2 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors';
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18"/>
        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    `;
    deleteBtn.title = 'Delete white label';
    deleteBtn.onclick = () => deleteWhiteLabel(whiteLabel);

    actions.appendChild(editBtn);
    actions.appendChild(toggleBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(info);
    header.appendChild(actions);

    // Branding preview
    const branding = whiteLabel.branding || {};
    if (branding.name || branding.logo) {
      const preview = document.createElement('div');
      preview.className = 'mt-4 p-4 bg-bg-panel rounded-md';

      const previewTitle = document.createElement('h4');
      previewTitle.className = 'text-sm font-medium text-text-primary mb-2';
      previewTitle.textContent = 'Branding Preview';

      const previewContent = document.createElement('div');
      previewContent.className = 'flex items-center gap-3';

      if (branding.logo) {
        const logo = document.createElement('img');
        logo.src = branding.logo;
        logo.className = 'w-8 h-8 rounded-md object-cover';
        logo.alt = 'Logo';
        previewContent.appendChild(logo);
      }

      if (branding.name) {
        const brandName = document.createElement('span');
        brandName.className = 'text-text-primary font-medium';
        brandName.textContent = branding.name;
        previewContent.appendChild(brandName);
      }

      preview.appendChild(previewTitle);
      preview.appendChild(previewContent);
      card.appendChild(preview);
    }

    card.appendChild(header);
    return card;
  };

  // Create empty state
  const createEmptyState = () => {
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
      <h3 class="text-xl font-semibold text-text-primary mb-2">No white labels yet</h3>
      <p class="text-text-muted mb-6 max-w-md">Create your first white label configuration to enable multi-tenant theming and branding.</p>
      <button class="px-6 py-3 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors inline-flex items-center gap-2 create-wl-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Create First White Label
      </button>
    `;

    const createBtn = emptyState.querySelector('.create-wl-btn');
    createBtn.onclick = () => showCreateWhiteLabelModal();

    return emptyState;
  };

  // Modal functions
  const showCreateWhiteLabelModal = () => {
    // TODO: Implement create white label modal
    showToast('Create white label modal - Coming soon!', 'info');
  };

  const showEditWhiteLabelModal = (whiteLabel) => {
    // TODO: Implement edit white label modal
    showToast(`Edit white label: ${whiteLabel.name} - Coming soon!`, 'info');
  };

  // Toggle white label status
  const toggleWhiteLabelStatus = async (whiteLabel) => {
    try {
      const newStatus = !whiteLabel.is_active;
      const { error } = await supabase
        .from('white_labels')
        .update({ is_active: newStatus })
        .eq('id', whiteLabel.id);

      if (error) throw error;

      showToast(`White label ${newStatus ? 'activated' : 'deactivated'}`, 'success');
      loadWhiteLabels();
    } catch (error) {
      console.error('[WhiteLabelAdmin] Failed to toggle status:', error);
      showToast('Failed to update white label status', 'error');
    }
  };

  // Delete white label
  const deleteWhiteLabel = async (whiteLabel) => {
    if (!confirm(`Are you sure you want to delete "${whiteLabel.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('white_labels')
        .delete()
        .eq('id', whiteLabel.id);

      if (error) throw error;

      showToast('White label deleted successfully', 'success');
      loadWhiteLabels();
    } catch (error) {
      console.error('[WhiteLabelAdmin] Failed to delete white label:', error);
      showToast('Failed to delete white label', 'error');
    }
  };

  // Initialize
  loadWhiteLabels();

  return container;
}