import { projectService } from '../../lib/projects/projectService.js';
import { ProjectCard } from './ProjectCard.jsx';
import { showToast } from '../../lib/loading.js';

/**
 * ProjectDashboard Component - Main project listing and management interface
 */
export function ProjectDashboard() {
  const container = document.createElement('div');
  container.className = 'flex flex-col h-full bg-bg-app';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-6 border-b border-border-color';

  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold text-text-primary';
  title.textContent = 'My Projects';

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-3';

  // Search input
  const searchContainer = document.createElement('div');
  searchContainer.className = 'relative';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search projects...';
  searchInput.className = 'w-64 px-4 py-2 bg-bg-card border border-border-color rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-color-primary focus:border-transparent';
  searchInput.oninput = () => filterProjects(searchInput.value);

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

  // Create project button
  const createBtn = document.createElement('button');
  createBtn.className = 'px-4 py-2 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors flex items-center gap-2';
  createBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12h14"/>
    </svg>
    New Project
  `;
  createBtn.onclick = () => showCreateProjectModal();

  actions.appendChild(searchContainer);
  actions.appendChild(createBtn);

  header.appendChild(title);
  header.appendChild(actions);

  // Status filter tabs
  const filterTabs = document.createElement('div');
  filterTabs.className = 'flex items-center gap-1 px-6 py-3 border-b border-border-color';

  const tabs = [
    { id: 'all', label: 'All Projects', filter: null },
    { id: 'draft', label: 'Drafts', filter: 'draft' },
    { id: 'published', label: 'Published', filter: 'published' },
    { id: 'archived', label: 'Archived', filter: 'archived' }
  ];

  let activeTab = 'all';
  let currentFilter = null;

  const renderTabs = () => {
    filterTabs.innerHTML = '';

    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === tab.id
          ? 'bg-color-primary text-black'
          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
      }`;
      tabBtn.textContent = tab.label;
      tabBtn.onclick = () => {
        activeTab = tab.id;
        currentFilter = tab.filter;
        renderTabs();
        loadProjects();
      };
      filterTabs.appendChild(tabBtn);
    });
  };

  renderTabs();

  // Projects grid container
  const projectsContainer = document.createElement('div');
  projectsContainer.className = 'flex-1 p-6 overflow-y-auto custom-scrollbar';

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
  projectsContainer.appendChild(grid);

  // Loading state
  const loadingState = document.createElement('div');
  loadingState.className = 'flex items-center justify-center py-12';
  loadingState.innerHTML = `
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-color-primary mx-auto mb-4"></div>
      <p class="text-text-secondary">Loading projects...</p>
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
    <h3 class="text-xl font-semibold text-text-primary mb-2">No projects yet</h3>
    <p class="text-text-muted mb-6 max-w-md">Create your first project to get started with video editing and content creation.</p>
    <button class="px-6 py-3 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors inline-flex items-center gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Create Your First Project
    </button>
  `;

  const emptyBtn = emptyState.querySelector('button');
  emptyBtn.onclick = () => showCreateProjectModal();

  // State
  let allProjects = [];
  let filteredProjects = [];

  // Load projects
  const loadProjects = async () => {
    try {
      grid.innerHTML = '';
      grid.appendChild(loadingState);

      if (currentFilter) {
        allProjects = await projectService.getProjectsByStatus(currentFilter);
      } else {
        allProjects = await projectService.getProjects();
      }

      filteredProjects = [...allProjects];

      grid.innerHTML = '';

      if (filteredProjects.length === 0) {
        if (currentFilter) {
          // Show filtered empty state
          const filteredEmpty = document.createElement('div');
          filteredEmpty.className = 'flex flex-col items-center justify-center py-12 text-center';
          filteredEmpty.innerHTML = `
            <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-text-primary mb-2">No ${currentFilter} projects</h3>
            <p class="text-text-muted">Try switching to a different filter to see more projects.</p>
          `;
          grid.appendChild(filteredEmpty);
        } else {
          grid.appendChild(emptyState);
        }
      } else {
        filteredProjects.forEach(project => {
          const card = ProjectCard(
            project,
            (p) => handleProjectClick(p),
            (p) => handleProjectEdit(p),
            (p) => handleProjectDelete(p),
            (p) => handleProjectDuplicate(p)
          );
          grid.appendChild(card);
        });
      }
    } catch (error) {
      console.error('[ProjectDashboard] Failed to load projects:', error);
      showToast('Failed to load projects', 'error');
      grid.innerHTML = '';
      grid.appendChild(emptyState);
    }
  };

  // Filter projects
  const filterProjects = (query) => {
    if (!query.trim()) {
      filteredProjects = [...allProjects];
    } else {
      filteredProjects = allProjects.filter(project =>
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
      );
    }

    renderFilteredProjects();
  };

  // Render filtered projects
  const renderFilteredProjects = () => {
    grid.innerHTML = '';

    if (filteredProjects.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'flex flex-col items-center justify-center py-12 text-center';
      noResults.innerHTML = `
        <div class="w-16 h-16 bg-bg-card rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-text-primary mb-2">No projects found</h3>
        <p class="text-text-muted">Try adjusting your search terms.</p>
      `;
      grid.appendChild(noResults);
    } else {
      filteredProjects.forEach(project => {
        const card = ProjectCard(
          project,
          (p) => handleProjectClick(p),
          (p) => handleProjectEdit(p),
          (p) => handleProjectDelete(p),
          (p) => handleProjectDuplicate(p)
        );
        grid.appendChild(card);
      });
    }
  };

  // Event handlers
  const handleProjectClick = (project) => {
    // Navigate to project editor
    console.log('[ProjectDashboard] Opening project:', project.id);
    // TODO: Navigate to project editor with project ID
    showToast(`Opening project: ${project.title}`, 'info');
  };

  const handleProjectEdit = (project) => {
    showEditProjectModal(project);
  };

  const handleProjectDelete = async (project) => {
    if (confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      try {
        await projectService.deleteProject(project.id);
        showToast('Project deleted successfully', 'success');
        loadProjects();
      } catch (error) {
        console.error('[ProjectDashboard] Failed to delete project:', error);
        showToast('Failed to delete project', 'error');
      }
    }
  };

  const handleProjectDuplicate = async (project) => {
    try {
      const newTitle = prompt('Enter a name for the duplicated project:', `${project.title} (Copy)`);
      if (!newTitle) return;

      await projectService.duplicateProject(project.id, newTitle);
      showToast('Project duplicated successfully', 'success');
      loadProjects();
    } catch (error) {
      console.error('[ProjectDashboard] Failed to duplicate project:', error);
      showToast('Failed to duplicate project', 'error');
    }
  };

  // Modal functions
  const showCreateProjectModal = () => {
    // TODO: Implement create project modal
    showToast('Create project modal - Coming soon!', 'info');
  };

  const showEditProjectModal = (project) => {
    // TODO: Implement edit project modal
    showToast(`Edit project: ${project.title} - Coming soon!`, 'info');
  };

  // Initialize
  container.appendChild(header);
  container.appendChild(filterTabs);
  container.appendChild(projectsContainer);

  // Load initial data
  loadProjects();

  return container;
}