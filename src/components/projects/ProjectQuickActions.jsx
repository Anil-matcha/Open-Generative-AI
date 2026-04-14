import { projectIntegrationService } from '../../lib/projects/projectService.js';
import { showToast } from '../../lib/loading.js';

/**
 * ProjectQuickActions Component - Quick project actions overlay
 * @param {Object} props - Component props
 * @param {string} props.appId - App identifier
 * @param {string} props.projectId - Current project ID
 * @param {Function} props.onSave - Save callback
 * @param {Function} props.onLoad - Load callback
 * @param {Function} props.onNew - New project callback
 */
export function ProjectQuickActions({ appId, projectId, onSave, onLoad, onNew }) {
  const container = document.createElement('div');
  container.className = 'fixed bottom-6 right-6 z-50';

  // Main action button
  const actionBtn = document.createElement('button');
  actionBtn.className = 'w-14 h-14 bg-color-primary hover:bg-color-primary-hover rounded-full shadow-lg flex items-center justify-center transition-all duration-200 group';
  actionBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-black">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  `;

  // Actions menu
  const actionsMenu = document.createElement('div');
  actionsMenu.className = 'absolute bottom-16 right-0 bg-bg-card border border-border-color rounded-lg shadow-xl p-2 opacity-0 invisible transform translate-y-2 transition-all duration-200 min-w-48';
  actionsMenu.id = 'actions-menu';

  const actions = [
    {
      label: 'Save Project',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>',
      action: async () => {
        try {
          await onSave();
          showToast('Project saved successfully', 'success');
        } catch (error) {
          showToast('Failed to save project', 'error');
        }
        hideMenu();
      }
    },
    {
      label: 'Load Project',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>',
      action: () => {
        if (onLoad) onLoad();
        hideMenu();
      }
    },
    {
      label: 'New Project',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
      action: () => {
        if (onNew) onNew();
        hideMenu();
      }
    }
  ];

  actions.forEach(action => {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-md transition-colors text-left';
    
    actionBtn.innerHTML = `
      <span class="flex-shrink-0">${action.icon}</span>
      <span class="flex-1">${action.label}</span>
    `;
    
    actionBtn.onclick = action.action;
    actionsMenu.appendChild(actionBtn);
  });

  // Toggle menu visibility
  let menuVisible = false;
  
  const showMenu = () => {
    actionsMenu.classList.remove('opacity-0', 'invisible', 'translate-y-2');
    actionsMenu.classList.add('opacity-100', 'visible', 'translate-y-0');
    menuVisible = true;
  };
  
  const hideMenu = () => {
    actionsMenu.classList.add('opacity-0', 'invisible', 'translate-y-2');
    actionsMenu.classList.remove('opacity-100', 'visible', 'translate-y-0');
    menuVisible = false;
  };

  actionBtn.onclick = () => {
    if (menuVisible) {
      hideMenu();
    } else {
      showMenu();
    }
  };

  // Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target) && menuVisible) {
      hideMenu();
    }
  });

  // Assemble component
  container.appendChild(actionsMenu);
  container.appendChild(actionBtn);

  return container;
}
