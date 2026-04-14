import { projectIntegrationService } from '../../lib/projects/projectService.js';
import { showToast } from '../../lib/loading.js';

/**
 * ProjectHeader Component - Header bar with project controls for all apps
 * @param {Object} props - Component props
 * @param {string} props.appId - App identifier
 * @param {string} props.projectId - Current project ID
 * @param {Function} props.onSave - Save callback
 * @param {Function} props.onLoad - Load callback
 * @param {Function} props.onNew - New project callback
 * @param {Object} props.projectInfo - Current project info
 */
export function ProjectHeader({ 
  appId, 
  projectId, 
  onSave, 
  onLoad, 
  onNew, 
  projectInfo 
}) {
  const container = document.createElement('div');
  container.className = 'flex items-center justify-between p-4 bg-bg-panel border-b border-border-color';

  // Left side - Project info and controls
  const leftSide = document.createElement('div');
  leftSide.className = 'flex items-center gap-4';

  // Project title and status
  const projectInfoDiv = document.createElement('div');
  projectInfoDiv.className = 'flex items-center gap-3';

  const projectIcon = document.createElement('div');
  projectIcon.className = 'w-8 h-8 bg-color-primary rounded-lg flex items-center justify-center';
  projectIcon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  `;

  const titleDiv = document.createElement('div');
  const projectTitle = document.createElement('h3');
  projectTitle.className = 'text-text-primary font-medium';
  projectTitle.textContent = projectInfo?.title || 'Untitled Project';

  const projectStatus = document.createElement('span');
  projectStatus.className = `px-2 py-1 rounded-full text-xs font-medium ${
    projectInfo?.status === 'published' ? 'bg-green-500/20 text-green-400' :
    projectInfo?.status === 'draft' ? 'bg-yellow-500/20 text-yellow-400' :
    'bg-gray-500/20 text-gray-400'
  }`;
  projectStatus.textContent = projectInfo?.status || 'draft';

  titleDiv.appendChild(projectTitle);
  projectInfoDiv.appendChild(projectIcon);
  projectInfoDiv.appendChild(titleDiv);
  projectInfoDiv.appendChild(projectStatus);

  // Save status indicator
  const saveStatus = document.createElement('div');
  saveStatus.className = 'flex items-center gap-2 text-sm text-text-muted';
  
  const saveIndicator = document.createElement('div');
  saveIndicator.className = 'w-2 h-2 rounded-full bg-gray-400';
  saveIndicator.id = 'save-indicator';
  
  const saveText = document.createElement('span');
  saveText.id = 'save-text';
  saveText.textContent = 'All changes saved';
  
  saveStatus.appendChild(saveIndicator);
  saveStatus.appendChild(saveText);

  leftSide.appendChild(projectInfoDiv);
  leftSide.appendChild(saveStatus);

  // Right side - Action buttons
  const rightSide = document.createElement('div');
  rightSide.className = 'flex items-center gap-2';

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'px-3 py-2 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors text-sm flex items-center gap-2';
  saveBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
      <polyline points="17,21 17,13 7,13 7,21"/>
      <polyline points="7,3 7,8 15,8"/>
    </svg>
    Save
  `;
  saveBtn.onclick = async () => {
    try {
      updateSaveStatus('saving');
      const result = await onSave();
      updateSaveStatus('saved');
      showToast('Project saved successfully', 'success');
    } catch (error) {
      updateSaveStatus('error');
      showToast('Failed to save project', 'error');
    }
  };

  // Load button
  const loadBtn = document.createElement('button');
  loadBtn.className = 'px-3 py-2 bg-bg-card text-text-primary font-medium rounded-lg hover:bg-bg-panel transition-colors text-sm flex items-center gap-2 border border-border-color';
  loadBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>
    Load
  `;
  loadBtn.onclick = () => {
    if (onLoad) onLoad();
  };

  // New project button
  const newBtn = document.createElement('button');
  newBtn.className = 'px-3 py-2 bg-bg-card text-text-primary font-medium rounded-lg hover:bg-bg-panel transition-colors text-sm flex items-center gap-2 border border-border-color';
  newBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
    New
  `;
  newBtn.onclick = () => {
    if (onNew) onNew();
  };

  // Auto-save toggle
  const autoSaveToggle = document.createElement('div');
  autoSaveToggle.className = 'flex items-center gap-2';
  
  const autoSaveLabel = document.createElement('span');
  autoSaveLabel.className = 'text-sm text-text-muted';
  autoSaveLabel.textContent = 'Auto-save';
  
  const autoSaveSwitch = document.createElement('button');
  autoSaveSwitch.className = 'relative inline-flex h-6 w-11 items-center rounded-full bg-bg-panel transition-colors focus:outline-none focus:ring-2 focus:ring-color-primary';
  autoSaveSwitch.innerHTML = `
    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
  `;
  
  let autoSaveEnabled = true;
  const updateAutoSaveToggle = () => {
    autoSaveSwitch.classList.toggle('bg-color-primary', autoSaveEnabled);
    autoSaveSwitch.querySelector('span').classList.toggle('translate-x-6', autoSaveEnabled);
  };
  updateAutoSaveToggle();
  
  autoSaveSwitch.onclick = () => {
    autoSaveEnabled = !autoSaveEnabled;
    updateAutoSaveToggle();
    
    if (projectId) {
      if (autoSaveEnabled) {
        projectIntegrationService.enableAutoSave(projectId);
        showToast('Auto-save enabled', 'success');
      } else {
        projectIntegrationService.disableAutoSave(projectId);
        showToast('Auto-save disabled', 'info');
      }
    }
  };

  autoSaveToggle.appendChild(autoSaveLabel);
  autoSaveToggle.appendChild(autoSaveSwitch);

  rightSide.appendChild(autoSaveToggle);
  rightSide.appendChild(newBtn);
  rightSide.appendChild(loadBtn);
  rightSide.appendChild(saveBtn);

  // Assemble header
  container.appendChild(leftSide);
  container.appendChild(rightSide);

  // State management
  let saveTimeout;

  const updateSaveStatus = (status) => {
    const indicator = container.querySelector('#save-indicator');
    const text = container.querySelector('#save-text');
    
    if (!indicator || !text) return;
    
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    switch (status) {
      case 'saving':
        indicator.className = 'w-2 h-2 rounded-full bg-yellow-400 animate-pulse';
        text.textContent = 'Saving...';
        text.className = 'text-sm text-yellow-400';
        break;
      case 'saved':
        indicator.className = 'w-2 h-2 rounded-full bg-green-400';
        text.textContent = 'All changes saved';
        text.className = 'text-sm text-green-400';
        saveTimeout = setTimeout(() => updateSaveStatus('idle'), 3000);
        break;
      case 'unsaved':
        indicator.className = 'w-2 h-2 rounded-full bg-orange-400';
        text.textContent = 'Unsaved changes';
        text.className = 'text-sm text-orange-400';
        break;
      case 'error':
        indicator.className = 'w-2 h-2 rounded-full bg-red-400';
        text.textContent = 'Save failed';
        text.className = 'text-sm text-red-400';
        saveTimeout = setTimeout(() => updateSaveStatus('idle'), 5000);
        break;
      default: // idle
        indicator.className = 'w-2 h-2 rounded-full bg-gray-400';
        text.textContent = 'All changes saved';
        text.className = 'text-sm text-text-muted';
    }
  };

  // State for cleanup
  let changeListener = null;

  // Listen for project changes
  if (projectId) {
    changeListener = (event, data) => {
      switch (event) {
        case 'unsaved-changes':
          updateSaveStatus('unsaved');
          break;
        case 'saved':
          updateSaveStatus(data.isAutoSave ? 'saved' : 'saved');
          break;
      }
    };
    projectIntegrationService.addChangeListener(projectId, changeListener);
  }

  // Initialize auto-save if project exists
  if (projectId && autoSaveEnabled) {
    projectIntegrationService.enableAutoSave(projectId);
  }

  // Cleanup function for memory management
  container._cleanup = () => {
    // Remove change listeners
    if (projectId && changeListener) {
      projectIntegrationService.removeChangeListener(projectId, changeListener);
    }

    // Disable auto-save
    if (projectId) {
      projectIntegrationService.disableAutoSave(projectId);
    }
  };

  return container;
}
