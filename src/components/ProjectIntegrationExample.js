/**
 * Project Integration Example - How to integrate project features into any app
 * 
 * This example shows how to add project save/load functionality to the Timeline Editor
 * The same pattern can be applied to any app in the Open-Higgsfield-AI ecosystem
 */

import { projectIntegrationService } from '../lib/projects/projectService.js';
import { ProjectHeader } from './projects/ProjectHeader.jsx';
import { ProjectStatusIndicator } from './projects/ProjectStatusIndicator.jsx';
import { ProjectQuickActions } from './projects/ProjectQuickActions.jsx';
import { createTimelineState } from '../lib/editor/timelineEditorState.js';

// Example: Integrating project features into Timeline Editor
export function TimelineEditorWithProjects() {
  const container = document.createElement('div');
  container.className = 'w-full h-full bg-app-bg overflow-hidden relative';

  // Register this app with the project integration service
  const appId = 'timeline-editor';
  const appConfig = {
    version: '2.1.0',
    supportedFeatures: ['timeline-editing', 'multi-camera', 'audio-mixing', 'transitions'],
    dataSchema: {
      type: 'object',
      properties: {
        projectTitle: { type: 'string' },
        timelineSeconds: { type: 'number' },
        tracks: { type: 'array' },
        assets: { type: 'array' },
        markers: { type: 'array' },
        captions: { type: 'array' },
        effects: { type: 'array' }
      }
    },
    migrationHandlers: {
      '2.0.0': (data) => {
        // Migration logic from 1.x to 2.0
        if (!data.effects) data.effects = [];
        return data;
      }
    }
  };
  
  projectIntegrationService.registerApp(appId, appConfig);

  // State management
  let currentProjectId = null;
  let currentProject = null;
  let timelineState = createTimelineState();
  let hasUnsavedChanges = false;

  // Initialize project if one is specified in URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectIdFromUrl = urlParams.get('project');
  if (projectIdFromUrl) {
    loadProjectFromUrl(projectIdFromUrl);
  }

  // ==========================================
  // 1. PROJECT HEADER INTEGRATION
  // ==========================================
  const projectHeader = ProjectHeader({
    appId,
    projectId: currentProjectId,
    onSave: () => saveCurrentProject(),
    onLoad: () => showLoadProjectDialog(),
    onNew: () => createNewProject(),
    projectInfo: currentProject
  });
  container.appendChild(projectHeader);

  // ==========================================
  // 2. MAIN TIMELINE EDITOR CONTENT
  // ==========================================
  const mainContent = document.createElement('div');
  mainContent.className = 'flex-1 relative overflow-hidden';
  
  // Timeline editor canvas would go here
  const timelineCanvas = document.createElement('div');
  timelineCanvas.className = 'w-full h-full bg-bg-panel';
  timelineCanvas.textContent = 'Timeline Editor Canvas (would contain actual timeline)';
  mainContent.appendChild(timelineCanvas);

  // ==========================================
  // 3. PROJECT STATUS INDICATOR
  // ==========================================
  const statusBar = document.createElement('div');
  statusBar.className = 'absolute bottom-0 left-0 right-0 bg-bg-panel border-t border-border-color p-3';
  
  const statusIndicator = ProjectStatusIndicator({
    appId,
    projectId: currentProjectId,
    projectInfo: currentProject
  });
  statusBar.appendChild(statusIndicator);
  
  mainContent.appendChild(statusBar);

  // ==========================================
  // 4. PROJECT QUICK ACTIONS
  // ==========================================
  const quickActions = ProjectQuickActions({
    appId,
    projectId: currentProjectId,
    onSave: () => saveCurrentProject(),
    onLoad: () => showLoadProjectDialog(),
    onNew: () => createNewProject()
  });
  container.appendChild(quickActions);

  // ==========================================
  // PROJECT MANAGEMENT FUNCTIONS
  // ==========================================

  async function createNewProject() {
    try {
      const projectTitle = prompt('Enter project title:', 'New Timeline Project');
      if (!projectTitle) return;

      // Create project with initial timeline state
      const project = await projectIntegrationService.createAppProject(
        appId,
        {
          title: projectTitle,
          description: 'Timeline editing project',
          autoSave: true
        },
        {
          projectTitle,
          timelineSeconds: 60,
          tracks: [],
          assets: [],
          markers: [],
          captions: [],
          effects: []
        }
      );

      // Update current state
      currentProjectId = project.id;
      currentProject = project;
      hasUnsavedChanges = false;

      // Update UI
      updateProjectUI();

      // Enable auto-save
      projectIntegrationService.enableAutoSave(currentProjectId);

      console.log('Created new timeline project:', project.id);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project: ' + error.message);
    }
  }

  async function loadProjectFromUrl(projectId) {
    try {
      const result = await projectIntegrationService.loadAppProject(projectId, appId);
      
      // Restore timeline state
      timelineState = { ...timelineState, ...result.appData };
      
      // Update current state
      currentProjectId = result.id;
      currentProject = result;
      hasUnsavedChanges = false;

      // Update UI
      updateProjectUI();

      // Enable auto-save
      projectIntegrationService.enableAutoSave(currentProjectId);

      console.log('Loaded timeline project:', projectId);
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Failed to load project: ' + error.message);
    }
  }

  async function saveCurrentProject() {
    if (!currentProjectId) {
      await createNewProject();
      return;
    }

    try {
      // Get current timeline state
      const currentState = {
        projectTitle: timelineState.projectTitle || currentProject.title,
        timelineSeconds: timelineState.timelineSeconds,
        tracks: timelineState.tracks || [],
        assets: timelineState.assets || [],
        markers: timelineState.markers || [],
        captions: timelineState.captions || [],
        effects: timelineState.effects || []
      };

      await projectIntegrationService.saveAppProject(currentProjectId, currentState);
      hasUnsavedChanges = false;

      console.log('Saved timeline project:', currentProjectId);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  function showLoadProjectDialog() {
    // This would open a project browser modal
    // For now, just prompt for project ID
    const projectId = prompt('Enter project ID to load:');
    if (projectId) {
      loadProjectFromUrl(projectId);
    }
  }

  function updateProjectUI() {
    // Update header with current project info
    const headerContainer = container.querySelector('.project-header-container');
    if (headerContainer) {
      headerContainer.innerHTML = '';
      const newHeader = ProjectHeader({
        appId,
        projectId: currentProjectId,
        onSave: () => saveCurrentProject(),
        onLoad: () => showLoadProjectDialog(),
        onNew: () => createNewProject(),
        projectInfo: currentProject
      });
      headerContainer.appendChild(newHeader);
    }

    // Update status indicator
    const statusContainer = container.querySelector('.project-status-container');
    if (statusContainer) {
      statusContainer.innerHTML = '';
      const newStatus = ProjectStatusIndicator({
        appId,
        projectId: currentProjectId,
        projectInfo: currentProject
      });
      statusContainer.appendChild(newStatus);
    }

    // Update quick actions
    const actionsContainer = container.querySelector('.project-actions-container');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      const newActions = ProjectQuickActions({
        appId,
        projectId: currentProjectId,
        onSave: () => saveCurrentProject(),
        onLoad: () => showLoadProjectDialog(),
        onNew: () => createNewProject()
      });
      actionsContainer.appendChild(newActions);
    }
  }

  // Mark changes when timeline is modified
  function markTimelineChanges() {
    hasUnsavedChanges = true;
    if (currentProjectId) {
      projectIntegrationService.markUnsavedChanges(currentProjectId);
    }
  }

  // Listen for timeline changes (this would be integrated with actual timeline events)
  // Example: timelineCanvas.addEventListener('timeline-changed', markTimelineChanges);

  // Cleanup on page unload
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  });

  // Assemble final component
  container.appendChild(mainContent);

  // Initialize with default state if no project loaded
  if (!currentProjectId) {
    // Could show welcome screen or auto-create project
    console.log('Timeline editor ready - no project loaded');
  }

  return container;
}

/**
 * HOW TO INTEGRATE THIS PATTERN INTO ANY APP:
 * 
 * 1. Register your app with projectIntegrationService.registerApp()
 * 2. Add ProjectHeader, ProjectStatusIndicator, and ProjectQuickActions components
 * 3. Implement save/load functions using projectIntegrationService methods
 * 4. Mark changes when app state changes
 * 5. Handle project lifecycle events
 * 
 * This provides universal project management across all Open-Higgsfield-AI apps!
 */
