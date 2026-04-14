import { projectIntegrationService } from '../../lib/projects/projectService.js';

/**
 * ProjectStatusIndicator Component - Shows current project status in app UI
 * @param {Object} props - Component props
 * @param {string} props.appId - App identifier
 * @param {string} props.projectId - Current project ID
 * @param {Object} props.projectInfo - Project information
 */
export function ProjectStatusIndicator({ appId, projectId, projectInfo }) {
  const container = document.createElement('div');
  container.className = 'flex items-center gap-3 px-3 py-2 bg-bg-panel rounded-lg border border-border-color';

  // Project icon
  const icon = document.createElement('div');
  icon.className = 'w-6 h-6 text-color-primary';
  icon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  `;

  // Project info
  const info = document.createElement('div');
  info.className = 'flex-1 min-w-0';

  const title = document.createElement('div');
  title.className = 'text-sm font-medium text-text-primary truncate';
  title.textContent = projectInfo?.title || 'Untitled Project';

  const meta = document.createElement('div');
  meta.className = 'flex items-center gap-2 text-xs text-text-muted';

  const appName = document.createElement('span');
  appName.textContent = getAppDisplayName(appId);

  const separator = document.createElement('span');
  separator.textContent = '•';

  const status = document.createElement('span');
  status.className = `font-medium ${
    projectInfo?.status === 'published' ? 'text-green-400' :
    projectInfo?.status === 'draft' ? 'text-yellow-400' :
    'text-gray-400'
  }`;
  status.textContent = projectInfo?.status || 'draft';

  meta.appendChild(appName);
  meta.appendChild(separator);
  meta.appendChild(status);

  info.appendChild(title);
  info.appendChild(meta);

  // Status indicators
  const indicators = document.createElement('div');
  indicators.className = 'flex items-center gap-2';

  // Save status
  const saveStatus = document.createElement('div');
  saveStatus.className = 'flex items-center gap-1';
  
  const saveDot = document.createElement('div');
  saveDot.className = 'w-2 h-2 rounded-full';
  saveDot.id = 'status-dot';
  
  const saveLabel = document.createElement('span');
  saveLabel.className = 'text-xs text-text-muted hidden sm:inline';
  saveLabel.id = 'status-label';
  saveLabel.textContent = 'Saved';

  saveStatus.appendChild(saveDot);
  saveStatus.appendChild(saveLabel);

  // Auto-save indicator
  const autoSaveIndicator = document.createElement('div');
  autoSaveIndicator.className = 'hidden';
  autoSaveIndicator.id = 'auto-save-indicator';
  autoSaveIndicator.innerHTML = `
    <div class="flex items-center gap-1 text-xs text-text-muted">
      <div class="w-1.5 h-1.5 bg-color-primary rounded-full animate-pulse"></div>
      <span>Auto-saving...</span>
    </div>
  `;

  indicators.appendChild(saveStatus);
  indicators.appendChild(autoSaveIndicator);

  // Assemble component
  container.appendChild(icon);
  container.appendChild(info);
  container.appendChild(indicators);

  // State management
  let currentStatus = 'saved';

  const updateStatus = (status) => {
    const dot = container.querySelector('#status-dot');
    const label = container.querySelector('#status-label');
    const autoSave = container.querySelector('#auto-save-indicator');
    
    if (!dot || !label || !autoSave) return;
    
    currentStatus = status;
    
    switch (status) {
      case 'saved':
        dot.className = 'w-2 h-2 rounded-full bg-green-400';
        label.textContent = 'Saved';
        label.className = 'text-xs text-green-400 hidden sm:inline';
        autoSave.classList.add('hidden');
        break;
      case 'saving':
        dot.className = 'w-2 h-2 rounded-full bg-yellow-400 animate-pulse';
        label.textContent = 'Saving...';
        label.className = 'text-xs text-yellow-400 hidden sm:inline';
        autoSave.classList.add('hidden');
        break;
      case 'auto-saving':
        dot.className = 'w-2 h-2 rounded-full bg-blue-400';
        label.textContent = 'Saved';
        label.className = 'text-xs text-blue-400 hidden sm:inline';
        autoSave.classList.remove('hidden');
        break;
      case 'unsaved':
        dot.className = 'w-2 h-2 rounded-full bg-orange-400';
        label.textContent = 'Unsaved';
        label.className = 'text-xs text-orange-400 hidden sm:inline';
        autoSave.classList.add('hidden');
        break;
      case 'error':
        dot.className = 'w-2 h-2 rounded-full bg-red-400';
        label.textContent = 'Error';
        label.className = 'text-xs text-red-400 hidden sm:inline';
        autoSave.classList.add('hidden');
        break;
    }
  };

  // State for cleanup
  let changeListener = null;

  // Listen for project changes
  if (projectId) {
    changeListener = (event, data) => {
      switch (event) {
        case 'unsaved-changes':
          updateStatus('unsaved');
          break;
        case 'saved':
          updateStatus(data.isAutoSave ? 'auto-saving' : 'saved');
          break;
      }
    };
    projectIntegrationService.addChangeListener(projectId, changeListener);
    
    // Check initial status
    if (projectIntegrationService.hasUnsavedChanges(projectId)) {
      updateStatus('unsaved');
    }
  }

  // Initialize
  updateStatus('saved');

  // Cleanup function for memory management
  container._cleanup = () => {
    // Remove change listeners
    if (projectId && changeListener) {
      projectIntegrationService.removeChangeListener(projectId, changeListener);
    }
  };

  return container;
}

/**
 * Get display name for app ID
 * @param {string} appId - App identifier
 * @returns {string} Display name
 */
function getAppDisplayName(appId) {
  const appNames = {
    'timeline-editor': 'Timeline',
    'image-studio': 'Image Studio',
    'video-studio': 'Video Studio',
    'cinema-studio': 'Cinema Studio',
    'character-studio': 'Character Studio',
    'audio-studio': 'Audio Studio',
    'storyboard-studio': 'Storyboard',
    'effects-studio': 'Effects Studio',
    'edit-studio': 'Edit Studio',
    'influencer-studio': 'Influencer',
    'commercial-studio': 'Commercial',
    'avatar-studio': 'Avatar',
    'training-studio': 'Training',
    'video-tools-studio': 'Video Tools',
    'chat-studio': 'Chat',
    'lip-sync-studio': 'Lip Sync',
    'text-to-image': 'Text to Image',
    'image-to-image': 'Image to Image',
    'text-to-video': 'Text to Video',
    'image-to-video': 'Image to Video',
    'video-to-video': 'Video to Video',
    'video-watermark': 'Video Watermark'
  };
  
  return appNames[appId] || appId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
