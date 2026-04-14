/**
 * AI Storyboard Studio - Full CutAI Feature Implementation
 * Rich film-editing aesthetic with multi-shot breakdown, visual timeline,
 * drag-drop, inline editing, mood analysis, and soundtrack vibes
 */
import { cutai } from '../../lib/cutai-api.js';
import { navigate } from '../../lib/router.js';

const SHOT_TYPES = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'POV', 'Overhead', 'Low Angle', 'Two-Shot', 'Insert Shot'];
const CAMERA_ANGLES = ['Eye Level', 'High Angle', 'Low Angle', 'Dutch Angle', "Bird's Eye", "Worm's Eye"];
const CAMERA_MOVEMENTS = ['Static', 'Pan Left', 'Pan Right', 'Tilt Up', 'Tilt Down', 'Dolly In', 'Dolly Out', 'Tracking Shot', 'Handheld', 'Crane Up', 'Crane Down'];
const TIME_OF_DAY = ['Day', 'Night', 'Dawn', 'Dusk', 'Golden Hour', 'Overcast', 'Interior - Day', 'Interior - Night'];

function getTimeIcon(timeOfDay) {
  const icons = {
    'Day': '☀️', 'Night': '🌙', 'Dawn': '🌅', 'Dusk': '🌆',
    'Golden Hour': '🌇', 'Overcast': '☁️', 'Interior - Day': '🏠', 'Interior - Night': '🌃'
  };
  return icons[timeOfDay] || '⏰';
}

export function AIStoryboardStudio() {
  const container = document.createElement('div');
  container.className = 'flex flex-col h-full bg-[#0a0a0b] text-white overflow-hidden';

  let currentView = 'home';
  let currentProject = null;
  let scenes = [];
  let projects = [];
  let selectedScene = null;
  let selectedShot = null;
  let draggedItem = null;
  let editingField = null;

  const header = createHeader();
  container.appendChild(header);

  const mainContent = document.createElement('div');
  mainContent.className = 'flex-1 flex overflow-hidden';
  container.appendChild(mainContent);

  const canvasArea = document.createElement('div');
  canvasArea.className = 'flex-1 flex flex-col overflow-hidden';
  mainContent.appendChild(canvasArea);

  const sidePanel = document.createElement('div');
  sidePanel.className = 'w-96 bg-[#0d0d0f] border-l border-white/5 flex flex-col hidden';
  mainContent.appendChild(sidePanel);

  function createHeader() {
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0d0d0f]';
    
    header.innerHTML = `
      <div class="flex items-center gap-4">
        <button id="backBtn" class="hidden items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <div>
          <h1 class="text-xl font-bold tracking-tight" id="headerTitle">AI Storyboard</h1>
          <p class="text-xs text-white/40" id="headerSubtitle">Create shot-by-shot storyboards with AI</p>
        </div>
      </div>
      <div class="flex items-center gap-3" id="headerActions">
        <button id="newProjectBtn" class="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold hover:shadow-glow transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          New Project
        </button>
      </div>
    `;

    header.querySelector('#backBtn').onclick = () => showHome();
    header.querySelector('#newProjectBtn').onclick = () => showNewProjectModal();

    return header;
  }

  function showHome() {
    currentView = 'home';
    const headerTitle = document.getElementById('headerTitle');
    const headerSubtitle = document.getElementById('headerSubtitle');
    const headerActions = document.getElementById('headerActions');
    const backBtn = document.getElementById('backBtn');
    
    backBtn.classList.add('hidden');
    backBtn.classList.remove('flex');
    headerTitle.textContent = 'AI Storyboard';
    headerSubtitle.textContent = 'Create shot-by-shot storyboards with AI';
    headerActions.innerHTML = `
      <button id="newProjectBtn" class="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold hover:shadow-glow transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        New Project
      </button>
    `;
    headerActions.querySelector('#newProjectBtn').onclick = () => showNewProjectModal();

    sidePanel.classList.add('hidden');
    sidePanel.classList.remove('flex');
    canvasArea.classList.remove('hidden');
    canvasArea.classList.add('flex');
    canvasArea.innerHTML = '';

    renderProjectGallery();
    loadProjects();
  }

  async function loadProjects() {
    try {
      projects = await cutai.getProjects();
      renderProjectGallery();
    } catch (e) {
      console.error('Failed to load projects:', e);
      showToast('Failed to load projects. Please check your connection.', 'error');
    }
  }

  function renderProjectGallery() {
    const hasProjects = projects && projects.length > 0;
    
    canvasArea.innerHTML = `
      <div class="flex-1 p-6 overflow-y-auto">
        ${hasProjects ? `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="projectsGrid">
            ${renderProjectCards()}
          </div>
        ` : ''}
      </div>
    `;

    if (!hasProjects || projects.length === 0) {
      canvasArea.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div class="text-6xl mb-4">🎬</div>
          <h3 class="text-xl font-bold text-white mb-2">No Projects Yet</h3>
          <p class="text-white/50 text-sm max-w-md mb-6">Create your first AI-powered storyboard project</p>
          <button id="createFirstBtn" class="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-lg text-sm font-semibold hover:shadow-glow transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            Create Project
          </button>
        </div>
      `;
      canvasArea.querySelector('#createFirstBtn').onclick = () => showNewProjectModal();
      return;
    }

    canvasArea.querySelectorAll('.open-project').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const projectId = parseInt(btn.closest('[data-project-id]').dataset.projectId);
        await openProjectById(projectId);
      };
    });

    canvasArea.querySelectorAll('.duplicate-project').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const projectId = parseInt(btn.closest('[data-project-id]').dataset.projectId);
        await duplicateProject(projectId);
      };
    });

    canvasArea.querySelectorAll('.delete-project').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm('Delete this project?')) {
          const projectId = parseInt(btn.closest('[data-project-id]').dataset.projectId);
          await deleteProject(projectId);
        }
      };
    });
  }

  function renderProjectCards() {
    if (!projects || projects.length === 0) return '';
    
    return projects.map(project => `
      <div class="group relative bg-[#141417] border border-white/10 rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-pointer" data-project-id="${project.id}">
        <div class="h-32 bg-gradient-to-br ${getProjectGradient(project)} flex items-center justify-center relative">
          <div class="text-4xl opacity-50">${getGenreEmoji(project.genre)}</div>
          <div class="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white/70">${project.genre || 'Uncategorized'}</div>
        </div>
        <div class="p-4">
          <h3 class="font-bold text-white truncate">${project.name}</h3>
          <p class="text-xs text-white/30 mt-1">${formatDate(project.updated_at)}</p>
        </div>
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <button class="open-project px-4 py-2 bg-white text-black rounded-lg text-xs font-semibold">Open</button>
          <button class="duplicate-project px-4 py-2 bg-primary/80 text-black rounded-lg text-xs font-semibold">Duplicate</button>
          <button class="delete-project px-4 py-2 bg-red-500/80 text-white rounded-lg text-xs font-semibold">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function getGenreEmoji(genre) {
    const emojis = { 'Horror': '👻', 'Action': '💥', 'Romance': '💕', 'Sci-Fi': '🚀', 'Comedy': '😂', 'Drama': '🎭', 'Thriller': '🔪', 'Mystery': '🔍', 'Fantasy': '🧙', 'Documentary': '�纪录片' };
    return emojis[genre] || '🎬';
  }

  function getProjectGradient(project) {
    const gradients = [
      'from-amber-900/50 via-orange-800/30 to-red-900/50',
      'from-indigo-900/50 via-purple-800/30 to-pink-900/50',
      'from-emerald-900/50 via-teal-800/30 to-cyan-900/50',
      'from-rose-900/50 via-pink-800/30 to-fuchsia-900/50',
      'from-yellow-900/50 via-amber-800/30 to-orange-900/50'
    ];
    return gradients[project.id % gradients.length] || gradients[0];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function duplicateProject(projectId) {
    try {
      showLoadingOverlay('Duplicating project...');
      await cutai.duplicateProject(projectId);
      removeLoadingOverlay();
      await loadProjects();
    } catch (e) {
      console.error('Failed to duplicate:', e);
      removeLoadingOverlay();
      alert('Failed to duplicate project');
    }
  }

  async function deleteProject(projectId) {
    try {
      await cutai.deleteProject(projectId);
      await loadProjects();
    } catch (e) {
      console.error('Failed to delete:', e);
      alert('Failed to delete project');
    }
  }

  async function openProjectById(projectId) {
    try {
      showLoadingOverlay('Loading project...');
      const data = await cutai.getStoryboard(projectId);
      currentProject = data.project;
      scenes = data.scenes || [];
      openProject(currentProject, scenes);
      removeLoadingOverlay();
    } catch (e) {
      console.error('Failed to load project:', e);
      removeLoadingOverlay();
      const errorMessage = e.message?.includes('404') ?
        'Project not found.' :
        'Failed to load project. Please check your connection.';
      alert(errorMessage);
    }
  }

  function showNewProjectModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-[#141417] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <h2 class="text-xl font-bold text-white mb-6">Create New Storyboard</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Project Name</label>
            <input type="text" id="projectName" placeholder="My Storyboard" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50">
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Genre</label>
            <select id="projectGenre" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50">
              <option value="Action">Action</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Horror">Horror</option>
              <option value="Romance">Romance</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Thriller">Thriller</option>
              <option value="Mystery">Mystery</option>
              <option value="Fantasy">Fantasy</option>
              <option value="Documentary">Documentary</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Premise</label>
            <textarea id="projectPremise" rows="4" placeholder="A detective discovers a hidden truth that changes everything..." class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"></textarea>
          </div>
          
          <div class="pt-4 flex gap-3">
            <button id="cancelBtn" class="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition-all">Cancel</button>
            <button id="createBtn" class="flex-1 px-4 py-3 bg-primary text-black rounded-lg text-sm font-semibold hover:shadow-glow transition-all">Create & Generate</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#cancelBtn').onclick = () => modal.remove();
    modal.querySelector('#createBtn').onclick = () => {
      const name = modal.querySelector('#projectName').value || 'Untitled Project';
      const genre = modal.querySelector('#projectGenre').value;
      const premise = modal.querySelector('#projectPremise').value;
      modal.remove();
      createAndGenerateProject(name, genre, premise);
    };

    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  async function createAndGenerateProject(name, genre, premise) {
    showLoadingOverlay('Creating project and generating storyboard...');

    try {
      const data = await cutai.generateStoryboard(0, genre, premise);
      currentProject = data.project;
      scenes = data.scenes || [];
      openProject(currentProject, scenes);
      removeLoadingOverlay();
    } catch (error) {
      console.error('Failed to create project:', error);
      removeLoadingOverlay();
      const errorMessage = error.message?.includes('fetch') ?
        'Network error: Please check your connection and ensure the backend server is running.' :
        error.message || 'Failed to generate storyboard. Please try again.';
      alert(errorMessage);
    }
  }
  }

  function openProject(project, projectScenes) {
    currentView = 'editor';
    currentProject = project;
    scenes = projectScenes || [];

    const headerTitle = document.getElementById('headerTitle');
    const headerSubtitle = document.getElementById('headerSubtitle');
    const headerActions = document.getElementById('headerActions');
    const backBtn = document.getElementById('backBtn');
    
    backBtn.classList.remove('hidden');
    backBtn.classList.add('flex');
    headerTitle.textContent = project.name;
    headerSubtitle.textContent = `${project.genre} • ${scenes.length} scenes • ${countTotalShots()} shots`;
    headerActions.innerHTML = `
      <button id="exportBtn" class="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-sm font-semibold hover:bg-white/20 transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        Export
      </button>
      <button id="sendToRenderBtn" class="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg text-sm font-semibold hover:shadow-glow transition-all">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Send to Render
      </button>
    `;

    headerActions.querySelector('#exportBtn').onclick = () => showExportModal();
    headerActions.querySelector('#sendToRenderBtn').onclick = () => sendToRender();

    sidePanel.classList.remove('hidden');
    sidePanel.classList.add('flex');
    canvasArea.classList.add('flex');
    canvasArea.classList.remove('hidden');

    renderEditor();
  }

  function countTotalShots() {
    return scenes.reduce((sum, s) => sum + (s.shots?.length || 0), 0);
  }

  function renderEditor() {
    canvasArea.innerHTML = `
      <div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-[#0d0d0f]">
          <div class="flex gap-1">
            <button class="view-btn active px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-black" data-view="grid">Grid</button>
            <button class="view-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white/70 hover:bg-white/10" data-view="timeline">Timeline</button>
            <button class="view-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-white/70 hover:bg-white/10" data-view="script">Script</button>
          </div>
          <div class="flex-1"></div>
          <button id="regenerateAllBtn" class="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white/70 hover:bg-white/10 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            Regenerate All
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6" id="storyboardCanvas">
          ${renderSceneGrid()}
        </div>
      </div>
    `;

    canvasArea.querySelectorAll('.view-btn').forEach(btn => {
      btn.onclick = () => switchView(btn.dataset.view);
    });

    canvasArea.querySelector('#regenerateAllBtn').onclick = async () => {
      if (currentProject) {
        showLoadingOverlay('Regenerating storyboard...');
        try {
          const data = await cutai.generateStoryboard(currentProject.id, currentProject.genre, currentProject.premise);
          scenes = data.scenes || [];
          currentProject.scenes = scenes;
          const idx = projects.findIndex(p => p.id === currentProject.id);
          if (idx >= 0) projects[idx].scenes = scenes;
          renderEditor();
          renderSidePanel();
        } catch (e) {
          console.error(e);
        }
        removeLoadingOverlay();
      }
    };

    renderSidePanel();
  }

  function switchView(view) {
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
      btn.classList.toggle('bg-primary', btn.dataset.view === view);
      btn.classList.toggle('text-black', btn.dataset.view === view);
      btn.classList.toggle('bg-white/5', btn.dataset.view !== view);
      btn.classList.toggle('text-white/70', btn.dataset.view !== view);
    });

    const canvas = document.getElementById('storyboardCanvas');
    if (view === 'grid') {
      canvas.innerHTML = renderSceneGrid();
      attachDragListeners();
      attachSceneCardListeners();
    } else if (view === 'timeline') {
      canvas.innerHTML = renderTimelineView();
    } else if (view === 'script') {
      canvas.innerHTML = renderScriptView();
    }
  }

  function renderSceneGrid() {
    if (scenes.length === 0) {
      return `
        <div class="flex flex-col items-center justify-center h-full text-center">
          <div class="text-5xl mb-4">🎬</div>
          <h3 class="text-lg font-bold text-white mb-2">No Scenes Yet</h3>
          <p class="text-white/50 text-sm">Generate scenes to see them here</p>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="sceneGrid">
        ${scenes.map((scene, i) => renderSceneCard(scene, i)).join('')}
      </div>
    `;
  }

  function renderSceneCard(scene, index) {
    const moodGradient = getMoodGradient(scene);
    const totalDuration = (scene.shots || []).reduce((sum, s) => sum + (s.duration || 3), 0);
    
    return `
      <div class="scene-card group bg-[#141417] border border-white/10 rounded-xl overflow-hidden hover:border-primary/30 transition-all cursor-grab" 
           data-scene-id="${scene.id}" 
           draggable="true">
        <div class="h-40 bg-gradient-to-br ${moodGradient} relative flex items-center justify-center">
          <div class="text-center">
            <div class="text-3xl mb-1">${getMoodEmoji(scene)}</div>
            <div class="text-xs text-white/60 font-mono">Scene ${scene.scene_number}</div>
          </div>
          
          <div class="absolute top-2 left-2 flex flex-col gap-1">
            ${scene.time_of_day ? `
              <span class="px-2 py-0.5 bg-black/50 rounded text-xs text-white/80 flex items-center gap-1">
                ${getTimeIcon(scene.time_of_day)} ${scene.time_of_day}
              </span>
            ` : ''}
          </div>
          
          <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button class="edit-scene-btn w-7 h-7 rounded-md bg-black/50 flex items-center justify-center text-white hover:bg-black/70" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          
          <div class="absolute bottom-2 left-2 right-2 flex justify-between items-center">
            <div class="flex gap-1">
              ${(scene.shots || []).slice(0, 3).map((shot, i) => (
                `<span class="px-1.5 py-0.5 bg-black/50 rounded text-[10px] text-white/80">${shot.shot_type?.split(' ')[0] || 'Shot'}</span>`
              )).join('')}
              ${(scene.shots?.length || 0) > 3 ? `<span class="px-1.5 py-0.5 bg-primary/50 rounded text-[10px] text-black">+${scene.shots.length - 3}</span>` : ''}
            </div>
            <span class="text-[10px] text-white/60">⏱${totalDuration.toFixed(1)}s</span>
          </div>
        </div>
        
        <div class="p-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              ${editingField === `title-${scene.id}` ? `
                <input type="text" class="scene-title-input w-full bg-white/10 border border-primary/50 rounded px-2 py-1 text-sm text-white focus:outline-none" 
                       value="${scene.title || ''}" data-scene-id="${scene.id}">
              ` : `
                <h4 class="text-sm font-bold text-white truncate cursor-pointer hover:text-primary" 
                    data-scene-id="${scene.id}" data-field="title">
                  ${scene.title || `Scene ${scene.scene_number}`}
                </h4>
              `}
            </div>
          </div>
          
          <p class="text-xs text-white/70 mt-2 line-clamp-2 font-mono leading-relaxed">${scene.description}</p>
          
          <div class="flex gap-2 mt-2 text-xs text-white/50 flex-wrap">
            ${scene.location ? `<span class="flex items-center gap-1">📍 ${scene.location}</span>` : ''}
          </div>
          
          <div class="mt-3 pt-2 border-t border-white/5">
            <div class="flex items-center justify-between text-[10px] text-white/40 mb-1">
              <span>Soundtrack</span>
              <span>🎵</span>
            </div>
            <p class="text-xs text-white/60 truncate">${scene.soundtrack_genre || 'TBD'}</p>
            ${scene.soundtrack_reference ? `<p class="text-[10px] text-primary/70 mt-1 truncate">♪ ${scene.soundtrack_reference}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function attachSceneCardListeners() {
    const grid = document.getElementById('sceneGrid');
    if (!grid) return;

    grid.querySelectorAll('[data-field="title"]').forEach(el => {
      el.onclick = (e) => {
        const sceneId = parseInt(el.dataset.sceneId);
        editingField = `title-${sceneId}`;
        renderEditor();
        setTimeout(() => {
          const input = document.querySelector('.scene-title-input');
          if (input) {
            input.focus();
            input.onblur = async () => {
              const newTitle = input.value;
              await updateSceneTitle(sceneId, newTitle);
              editingField = null;
            };
            input.onkeydown = (e) => {
              if (e.key === 'Enter') input.blur();
              if (e.key === 'Escape') {
                editingField = null;
                renderEditor();
              }
            };
          }
        }, 50);
      };
    });

    grid.querySelectorAll('.edit-scene-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const card = btn.closest('.scene-card');
        const sceneId = parseInt(card.dataset.sceneId);
        const scene = scenes.find(s => s.id === sceneId);
        if (scene) {
          selectedScene = scene;
          selectedShot = null;
          renderSidePanel();
        }
      };
    });

    grid.querySelectorAll('.scene-card').forEach(card => {
      card.onclick = (e) => {
        if (e.target.closest('.edit-scene-btn') || e.target.closest('[data-field]')) return;
        const sceneId = parseInt(card.dataset.sceneId);
        const scene = scenes.find(s => s.id === sceneId);
        if (scene) {
          selectedScene = scene;
          selectedShot = scene.shots?.[0] || null;
          renderSidePanel();
        }
      };
    });
  }

  async function updateSceneTitle(sceneId, newTitle) {
    try {
      await cutai.updateScene(sceneId, { title: newTitle });
      const scene = scenes.find(s => s.id === sceneId);
      if (scene) scene.title = newTitle;
    } catch (e) {
      console.error('Failed to update title:', e);
    }
  }

  function getMoodGradient(scene) {
    const tension = scene.mood_tension || 0.5;
    const darkness = scene.mood_darkness || 0.5;
    
    if (tension > 0.7 && darkness > 0.6) {
      return 'from-red-900/60 via-red-800/40 to-indigo-900/60';
    } else if (tension > 0.5) {
      return 'from-amber-900/60 via-orange-800/40 to-red-900/60';
    } else if (darkness > 0.5) {
      return 'from-indigo-900/60 via-purple-800/40 to-indigo-900/60';
    } else {
      return 'from-amber-800/60 via-yellow-700/40 to-orange-800/60';
    }
  }

  function getMoodEmoji(scene) {
    const tension = scene.mood_tension || 0.5;
    const emotion = scene.mood_emotion || 0.5;
    
    if (tension > 0.7) return '😰';
    if (emotion > 0.7) return '😊';
    if (emotion < 0.3) return '😶';
    return '🎬';
  }

  function renderTimelineView() {
    if (scenes.length === 0) {
      return `<div class="flex items-center justify-center h-full"><p class="text-white/50">No scenes to display</p></div>`;
    }

    return `
      <div class="flex flex-col h-full">
        <div class="mb-4 p-4 bg-[#141417] rounded-xl border border-white/10">
          <h3 class="text-sm font-bold text-white mb-3">Mood Arc Visualization</h3>
          <div class="flex items-end gap-1 h-24">
            ${scenes.map((scene, i) => `
              <div class="flex-1 flex flex-col items-center gap-1">
                <div class="w-full flex flex-col gap-0.5" style="height: 80px;">
                  <div class="w-full bg-red-500 rounded-t" style="height: ${(scene.mood_tension || 0.5) * 100}%; opacity: 0.8"></div>
                  <div class="w-full bg-amber-500 rounded-t" style="height: ${(scene.mood_emotion || 0.5) * 100}%; opacity: 0.8"></div>
                  <div class="w-full bg-green-500 rounded-t" style="height: ${(scene.mood_energy || 0.5) * 100}%; opacity: 0.8"></div>
                  <div class="w-full bg-indigo-500 rounded-t" style="height: ${(scene.mood_darkness || 0.5) * 100}%; opacity: 0.8"></div>
                </div>
                <span class="text-[10px] text-white/40">S${i + 1}</span>
              </div>
            `).join('')}
          </div>
          <div class="flex gap-4 mt-2 text-xs text-white/40 justify-center">
            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-500 rounded"></span>Tension</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-amber-500 rounded"></span>Emotion</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-green-500 rounded"></span>Energy</span>
            <span class="flex items-center gap-1"><span class="w-2 h-2 bg-indigo-500 rounded"></span>Darkness</span>
          </div>
        </div>
        
        <div class="flex-1 bg-[#0d0d0f] rounded-xl border border-white/10 overflow-hidden" id="timeline-container" style="height: 400px;">
          <div id="timeline-inner" class="w-full h-full overflow-x-auto p-4">
            ${renderTimelineNodes()}
          </div>
        </div>
      </div>
    `;
  }

  function renderTimelineNodes() {
    if (scenes.length === 0) return '<p class="text-white/50">No scenes</p>';
    
    return `
      <div class="flex gap-6 items-start min-w-max pb-4">
        ${scenes.map((scene, i) => {
          const moodGradient = getMoodGradient(scene);
          const nextScene = scenes[i + 1];
          
          return `
            <div class="flex items-center gap-2">
              <div class="scene-timeline-node w-48 bg-[#141417] border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-primary/30 transition-all" data-scene-id="${scene.id}">
                <div class="h-24 bg-gradient-to-br ${moodGradient} flex items-center justify-center relative">
                  <span class="text-3xl">${getMoodEmoji(scene)}</span>
                  <div class="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white/80">
                    S${scene.scene_number}
                  </div>
                </div>
                <div class="p-2">
                  <p class="text-xs font-bold text-white truncate">${scene.title || `Scene ${scene.scene_number}`}</p>
                  <p class="text-[10px] text-white/50 mt-1 line-clamp-2">${scene.description}</p>
                </div>
              </div>
              ${nextScene ? `
                <div class="timeline-connector w-12 flex items-center justify-center">
                  <svg width="48" height="24" viewBox="0 0 48 24" class="text-primary/50">
                    <path d="M0 12h40M32 4l8 8-8 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
                  </svg>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderScriptView() {
    const scriptText = scenes.map((s, i) => {
      const slugLine = `${s.time_of_day || 'DAY/NIGHT'} - ${s.location || 'LOCATION'}`;
      const shots = (s.shots || []).map(shot => 
        `   ${shot.shot_type || 'SHOT'} | ${shot.camera_angle || ''} ${shot.camera_movement || ''} | ${shot.duration || 3}s\n   ${shot.description || ''}`
      ).join('\n\n');
      return `[Scene ${s.scene_number}]\n${slugLine}\n\n${s.description}\n\n${shots}`;
    }).join('\n\n---\n\n');

    return `
      <div class="h-full">
        <div class="p-4 bg-[#141417] rounded-xl border border-white/10 h-full flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-white">Screenplay</h3>
            <button id="copyScriptBtn" class="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-white/70">Copy to Clipboard</button>
          </div>
          <pre class="flex-1 text-xs text-white/80 font-mono leading-relaxed whitespace-pre-wrap overflow-y-auto p-4 bg-[#0a0a0b] rounded-lg border border-white/5">${scriptText || 'No script generated yet.'}</pre>
        </div>
      </div>
    `;
  }

  function renderSidePanel() {
    sidePanel.innerHTML = `
      <div class="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 class="text-sm font-bold text-white">Analysis</h3>
        ${selectedScene ? `
          <button id="closeDetail" class="text-white/40 hover:text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        ` : ''}
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        ${scenes.length > 0 ? renderMoodGraph() : '<p class="text-xs text-white/40 text-center">Generate scenes to see mood analysis</p>'}
      </div>
      
      ${selectedScene ? renderSceneDetail(selectedScene) : ''}
    `;

    sidePanel.querySelector('#closeDetail')?.addEventListener('click', () => {
      selectedScene = null;
      selectedShot = null;
      renderSidePanel();
    });

    if (selectedShot) {
      sidePanel.querySelector('.shot-detail')?.scrollIntoView({ behavior: 'smooth' });
    } else if (selectedScene) {
      sidePanel.querySelector('.scene-detail')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function renderMoodGraph() {
    const avgTension = scenes.reduce((a, s) => a + (s.mood_tension || 0), 0) / scenes.length;
    const avgEmotion = scenes.reduce((a, s) => a + (s.mood_emotion || 0), 0) / scenes.length;
    const avgEnergy = scenes.reduce((a, s) => a + (s.mood_energy || 0), 0) / scenes.length;
    const avgDarkness = scenes.reduce((a, s) => a + (s.mood_darkness || 0), 0) / scenes.length;

    return `
      <div class="space-y-3">
        <div class="p-3 bg-[#141417] rounded-xl border border-white/10">
          <div class="text-xs text-white/50 mb-2">Avg Tension</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-red-500 rounded-full transition-all" style="width: ${avgTension * 100}%"></div>
            </div>
            <span class="text-xs font-semibold text-white w-8">${Math.round(avgTension * 100)}%</span>
          </div>
        </div>
        
        <div class="p-3 bg-[#141417] rounded-xl border border-white/10">
          <div class="text-xs text-white/50 mb-2">Avg Emotion</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full transition-all" style="width: ${avgEmotion * 100}%"></div>
            </div>
            <span class="text-xs font-semibold text-white w-8">${Math.round(avgEmotion * 100)}%</span>
          </div>
        </div>
        
        <div class="p-3 bg-[#141417] rounded-xl border border-white/10">
          <div class="text-xs text-white/50 mb-2">Avg Energy</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-green-500 rounded-full transition-all" style="width: ${avgEnergy * 100}%"></div>
            </div>
            <span class="text-xs font-semibold text-white w-8">${Math.round(avgEnergy * 100)}%</span>
          </div>
        </div>
        
        <div class="p-3 bg-[#141417] rounded-xl border border-white/10">
          <div class="text-xs text-white/50 mb-2">Avg Darkness</div>
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 rounded-full transition-all" style="width: ${avgDarkness * 100}%"></div>
            </div>
            <span class="text-xs font-semibold text-white w-8">${Math.round(avgDarkness * 100)}%</span>
          </div>
        </div>
        
        <div class="p-3 bg-[#141417] rounded-xl border border-white/10">
          <h4 class="text-xs font-bold text-white mb-2">Scene Breakdown</h4>
          <div class="space-y-1.5">
            ${scenes.map((s, i) => `
              <div class="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 p-1 rounded ${selectedScene?.id === s.id ? 'bg-primary/20' : ''}" data-scene-id="${s.id}">
                <span class="text-white/40 w-5">S${i + 1}</span>
                <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                  <div class="h-full bg-red-500" style="width: ${(s.mood_tension || 0.5) * 100}%"></div>
                  <div class="h-full bg-amber-500" style="width: ${(s.mood_emotion || 0.5) * 100}%"></div>
                  <div class="h-full bg-green-500" style="width: ${(s.mood_energy || 0.5) * 100}%"></div>
                  <div class="h-full bg-indigo-500" style="width: ${(s.mood_darkness || 0.5) * 100}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderSceneDetail(scene) {
    const shots = scene.shots || [];
    
    return `
      <div class="scene-detail border-t border-white/5 p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-bold text-white">Scene ${scene.scene_number}</h3>
        </div>
        
        <div class="space-y-3">
          <div>
            <label class="text-xs text-white/50">Title</label>
            <p class="text-sm text-white/90 mt-0.5">${scene.title || `Scene ${scene.scene_number}`}</p>
          </div>
          
          <div>
            <label class="text-xs text-white/50">Description</label>
            <p class="text-sm text-white/90 mt-0.5">${scene.description}</p>
          </div>
          
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-xs text-white/50">Time of Day</label>
              <p class="text-sm text-white mt-0.5">${scene.time_of_day || 'N/A'}</p>
            </div>
            <div>
              <label class="text-xs text-white/50">Location</label>
              <p class="text-sm text-white mt-0.5">${scene.location || 'N/A'}</p>
            </div>
          </div>
          
          <div class="pt-2 border-t border-white/5">
            <label class="text-xs text-white/50">Soundtrack</label>
            <div class="mt-1 p-2 bg-white/5 rounded-lg">
              <p class="text-sm text-white">${scene.soundtrack_genre || 'TBD'}</p>
              <p class="text-xs text-white/50">${scene.soundtrack_tempo || 'N/A'} • ${scene.soundtrack_instruments?.join(', ') || 'N/A'}</p>
              ${scene.soundtrack_reference ? `<p class="text-xs text-primary/70 mt-1">♪ ${scene.soundtrack_reference}</p>` : ''}
            </div>
          </div>
          
          <div class="pt-2 border-t border-white/5">
            <label class="text-xs text-white/50 flex items-center justify-between">
              Shots (${shots.length})
              <span class="text-primary text-[10px]">Click to view</span>
            </label>
            <div class="mt-2 space-y-2">
              ${shots.map((shot, i) => `
                <div class="p-2 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-all ${selectedShot?.id === shot.id ? 'border border-primary' : ''}" data-shot-id="${shot.id}">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-white">Shot ${shot.shot_number}: ${shot.shot_type || 'N/A'}</span>
                    <span class="text-[10px] text-white/40">${shot.duration || 3}s</span>
                  </div>
                  ${shot.camera_angle || shot.camera_movement ? `
                    <div class="flex gap-1 mt-1">
                      ${shot.camera_angle ? `<span class="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">📷 ${shot.camera_angle}</span>` : ''}
                      ${shot.camera_movement ? `<span class="text-[10px] px-1.5 py-0.5 bg-white/10 rounded">🎥 ${shot.camera_movement}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          
          <button id="regenerateSceneBtn" class="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-white/70 hover:bg-white/10 transition-all">
            Regenerate Scene
          </button>
        </div>
      </div>
    `;
  }

  function showExportModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-[#141417] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h2 class="text-lg font-bold text-white mb-4">Export Storyboard</h2>
        <div class="space-y-3">
          <button id="exportJSON" class="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <div class="flex items-center gap-3">
              <span class="text-xl">📄</span>
              <div class="text-left">
                <p class="text-sm font-semibold text-white">JSON</p>
                <p class="text-xs text-white/50">Raw data export</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white/40"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button id="exportPDF" class="w-full flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <div class="flex items-center gap-3">
              <span class="text-xl">📄</span>
              <div class="text-left">
                <p class="text-sm font-semibold text-white">HTML</p>
                <p class="text-xs text-white/50">Web document</p>
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white/40"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <button id="closeModal" class="w-full mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/10 transition-all">Cancel</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#exportJSON').onclick = async () => {
      modal.remove();
      await exportJSON();
    };
    modal.querySelector('#exportPDF').onclick = async () => {
      modal.remove();
      await exportPDF();
    };
    modal.querySelector('#closeModal').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  async function exportJSON() {
    if (!currentProject) return;
    try {
      const data = await cutai.exportJSON(currentProject.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.replace(/\s+/g, '-').toLowerCase()}-storyboard.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed');
    }
  }

  async function exportPDF() {
    if (!currentProject) return;
    try {
      const data = await cutai.exportPDF(currentProject.id);
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name.replace(/\s+/g, '-').toLowerCase()}-storyboard.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed');
    }
  }

  function sendToRender() {
    if (!currentProject) return;

    const storyboardData = {
      projectId: currentProject.id,
      projectName: currentProject.name,
      genre: currentProject.genre,
      premise: currentProject.premise,
      scenes: scenes.map(s => ({
        sceneNumber: s.scene_number,
        title: s.title,
        description: s.description,
        timeOfDay: s.time_of_day,
        location: s.location,
        duration: s.duration,
        mood: {
          tension: s.mood_tension,
          emotion: s.mood_emotion,
          energy: s.mood_energy,
          darkness: s.mood_darkness
        },
        soundtrack: {
          genre: s.soundtrack_genre,
          tempo: s.soundtrack_tempo,
          instruments: s.soundtrack_instruments,
          reference: s.soundtrack_reference
        },
        shots: (s.shots || []).map(shot => ({
          shotNumber: shot.shot_number,
          shotType: shot.shot_type,
          cameraAngle: shot.camera_angle,
          cameraMovement: shot.camera_movement,
          description: shot.description,
          duration: shot.duration,
          sdPrompt: shot.sd_prompt
        }))
      }))
    };

    localStorage.setItem('ai-storyboard-project', JSON.stringify(storyboardData));
    navigate('render');
  }

  function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div class="text-center">
        <div class="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-white/70 text-sm">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  function removeLoadingOverlay() {
    document.getElementById('loadingOverlay')?.remove();
  }

  function attachDragListeners() {
    const grid = document.getElementById('sceneGrid');
    if (!grid) return;

    grid.querySelectorAll('.scene-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedItem = card;
        card.classList.add('opacity-50');
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        draggedItem = null;
        card.classList.remove('opacity-50');
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== card) {
          const allCards = Array.from(grid.querySelectorAll('.scene-card'));
          const draggedIdx = allCards.indexOf(draggedItem);
          const targetIdx = allCards.indexOf(card);
          
          if (draggedIdx < targetIdx) {
            grid.insertBefore(draggedItem, card.nextSibling);
          } else {
            grid.insertBefore(draggedItem, card);
          }

          const reorderedScenes = [];
          grid.querySelectorAll('.scene-card').forEach((c, i) => {
            const sceneId = parseInt(c.dataset.sceneId);
            const scene = scenes.find(s => s.id === sceneId);
            if (scene) {
              scene.order_index = i;
              reorderedScenes.push(scene);
            }
          });
          scenes = reorderedScenes;
        }
      });
    });
  }

  canvasArea.innerHTML = '';
  renderProjectGallery();
  loadProjects();

  return container;
}
