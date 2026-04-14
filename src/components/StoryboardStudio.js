import { cutai } from '../lib/cutai-api.js';
import { muapi } from '../lib/muapi.js';
import { AuthModal } from './AuthModal.js';
import { createInlineInstructions } from './InlineInstructions.js';
import { createHeroSection } from '../lib/thumbnails.js';

// Toast notification system
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-bold z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-600' :
    type === 'error' ? 'bg-red-600' :
    type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

const SHOT_TYPES = ['Wide Shot', 'Medium Shot', 'Close-Up', 'Extreme Close-Up', 'POV', 'Overhead', 'Low Angle'];

export function StoryboardStudio() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-y-auto relative';

  const topBar = document.createElement('div');
  topBar.className = 'px-4 md:px-8 pt-6 pb-4 shrink-0';
  const storyBanner = createHeroSection('storyboard', 'h-32 md:h-44 mb-4');
  if (storyBanner) {
    const bannerText = document.createElement('div');
    bannerText.className = 'absolute bottom-0 left-0 right-0 p-4 z-10';
    bannerText.innerHTML = '<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Storyboard Studio</h1><p class="text-white/60 text-xs">Create characters, plan scenes, and generate complete storyboards</p>';
    storyBanner.appendChild(bannerText);
    topBar.appendChild(storyBanner);
  } else {
    topBar.innerHTML = '<h1 class="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Storyboard Studio</h1><p class="text-secondary text-xs mb-4">Create characters, plan scenes, and generate complete storyboards</p>';
  }
  const inlineInstructions = createInlineInstructions('storyboard');
  inlineInstructions.classList.add('px-4', 'md:px-8', 'mt-2');
  topBar.appendChild(inlineInstructions);

  container.appendChild(topBar);

  // Data structures
  const characters = [];
  const scenes = [];
  let storyboardResult = null;
  let currentProjectId = null;

  // Persistence functions
  function saveProject() {
    const projectData = {
      characters: characters.map(c => ({ ...c })),
      scenes: scenes.map(s => ({ ...s })),
      storyboardResult,
      projectId: currentProjectId,
      timestamp: Date.now()
    };
    localStorage.setItem('storyboard_project', JSON.stringify(projectData));
    showToast('Project saved locally', 'success');
  }

  function loadProject() {
    const saved = localStorage.getItem('storyboard_project');
    if (saved) {
      try {
        const projectData = JSON.parse(saved);
        characters.length = 0;
        characters.push(...projectData.characters);
        scenes.length = 0;
        scenes.push(...projectData.scenes);
        storyboardResult = projectData.storyboardResult;
        currentProjectId = projectData.projectId;
        renderTabs();
        showToast('Project loaded from local storage', 'success');
      } catch (err) {
        showToast('Failed to load project', 'error');
      }
    } else {
      showToast('No saved project found', 'warning');
    }
  }

  function clearProject() {
    if (confirm('Are you sure you want to clear the current project?')) {
      characters.length = 0;
      scenes.length = 0;
      storyboardResult = null;
      currentProjectId = null;
      localStorage.removeItem('storyboard_project');
      renderTabs();
      showToast('Project cleared', 'info');
    }
  }

  // Tab navigation
  const tabs = ['Characters', 'Scenes', 'Results'];
  let currentTab = 'Characters';

  const tabBar = document.createElement('div');
  tabBar.className = 'px-4 md:px-8 mb-4 flex gap-2 items-center';
  tabs.forEach(tab => {
    const tabBtn = document.createElement('button');
    tabBtn.className = `px-4 py-2 rounded-lg text-xs font-bold transition-all ${
      currentTab === tab ? 'bg-primary text-black' : 'bg-white/5 text-white hover:bg-white/10'
    }`;
    tabBtn.textContent = tab;
    tabBtn.onclick = () => {
      currentTab = tab;
      renderTabs();
    };
    tabBar.appendChild(tabBtn);
  });

  // Add persistence buttons
  const persistenceDiv = document.createElement('div');
  persistenceDiv.className = 'ml-auto flex gap-2';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-white hover:bg-white/10 transition-all';
  saveBtn.textContent = 'Save';
  saveBtn.onclick = saveProject;

  const loadBtn = document.createElement('button');
  loadBtn.className = 'px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-white hover:bg-white/10 transition-all';
  loadBtn.textContent = 'Load';
  loadBtn.onclick = loadProject;

  const clearBtn = document.createElement('button');
  clearBtn.className = 'px-3 py-1 bg-white/5 border border-white/10 rounded text-xs font-bold text-white hover:bg-white/10 transition-all';
  clearBtn.textContent = 'Clear';
  clearBtn.onclick = clearProject;

  persistenceDiv.appendChild(saveBtn);
  persistenceDiv.appendChild(loadBtn);
  persistenceDiv.appendChild(clearBtn);
  tabBar.appendChild(persistenceDiv);

  container.appendChild(tabBar);

  const contentArea = document.createElement('div');
  contentArea.className = 'flex-1 px-4 md:px-8 pb-8 overflow-y-auto';
  container.appendChild(contentArea);

  function renderTabs() {
    contentArea.innerHTML = '';

    // Update tab buttons (keep persistence buttons)
    const persistenceDiv = tabBar.querySelector('.ml-auto');
    tabBar.innerHTML = '';
    tabs.forEach(tab => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `px-4 py-2 rounded-lg text-xs font-bold transition-all ${
        currentTab === tab ? 'bg-primary text-black' : 'bg-white/5 text-white hover:bg-white/10'
      }`;
      tabBtn.textContent = tab;
      tabBtn.onclick = () => {
        currentTab = tab;
        renderTabs();
      };
      tabBar.appendChild(tabBtn);
    });

    if (persistenceDiv) {
      tabBar.appendChild(persistenceDiv);
    }

    switch (currentTab) {
      case 'Characters':
        renderCharacters();
        break;
      case 'Scenes':
        renderScenes();
        break;
      case 'Results':
        renderResults();
        break;
    }
  }

  function renderCharacters() {
    const section = document.createElement('div');
    section.className = 'space-y-4';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = '<h2 class="text-lg font-bold text-white">Characters</h2>';
    const addCharBtn = document.createElement('button');
    addCharBtn.className = 'px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all';
    addCharBtn.textContent = '+ Add Character';
    addCharBtn.onclick = () => {
      characters.push({ name: '', traits: '', imageUrl: null });
      renderTabs();
    };
    header.appendChild(addCharBtn);
    section.appendChild(header);

    const charsGrid = document.createElement('div');
    charsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

    characters.forEach((char, idx) => {
      const card = document.createElement('div');
      card.className = 'bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3';

      const charHeader = document.createElement('div');
      charHeader.className = 'flex items-center justify-between';
      charHeader.innerHTML = `<span class="text-xs font-bold text-primary">Character ${idx + 1}</span><button class="text-muted hover:text-red-400 transition-colors text-xs remove-char">&times;</button>`;
      card.appendChild(charHeader);

      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50';
      nameInput.placeholder = 'Character name...';
      nameInput.value = char.name;
      nameInput.oninput = () => { char.name = nameInput.value; };
      card.appendChild(nameInput);

      const traitsInput = document.createElement('textarea');
      traitsInput.className = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none';
      traitsInput.rows = 3;
      traitsInput.placeholder = 'Character traits and description...';
      traitsInput.value = char.traits;
      traitsInput.oninput = () => { char.traits = traitsInput.value; };
      card.appendChild(traitsInput);

      const imageArea = document.createElement('div');
      imageArea.className = 'w-full aspect-square bg-white/[0.02] rounded-lg border border-white/5 flex items-center justify-center overflow-hidden';
      if (char.imageUrl) {
        imageArea.innerHTML = `<img src="${char.imageUrl}" class="w-full h-full object-cover">`;
      } else {
        imageArea.innerHTML = '<span class="text-muted text-xs">No image</span>';
      }
      card.appendChild(imageArea);

      const genCharBtn = document.createElement('button');
      genCharBtn.className = 'w-full bg-white/10 text-white py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition-all';
      genCharBtn.textContent = 'Generate Character Image';
      genCharBtn.onclick = () => generateCharacter(idx, genCharBtn, imageArea);
      card.appendChild(genCharBtn);

      card.querySelector('.remove-char').onclick = () => {
        characters.splice(idx, 1);
        renderTabs();
      };

      charsGrid.appendChild(card);
    });

    section.appendChild(charsGrid);
    contentArea.appendChild(section);
  }

  async function generateCharacter(idx, btn, imageArea) {
    const char = characters[idx];
    if (!char.traits.trim()) {
      showToast('Please enter character traits first', 'warning');
      return;
    }
    const apiKey = localStorage.getItem('muapi_key');
    if (!apiKey) {
      AuthModal(() => generateCharacter(idx, btn, imageArea));
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span>';

    try {
      const prompt = `Character portrait: ${char.name} - ${char.traits}, professional character design, cinematic lighting, high detail`;
      const result = await muapi.generateImage({ model: 'flux-dev', prompt, aspect_ratio: '1:1' });
      if (result?.url) {
        char.imageUrl = result.url;
        imageArea.innerHTML = `<img src="${result.url}" class="w-full h-full object-cover">`;
        showToast('Character image generated successfully!', 'success');
      }
    } catch (err) {
      console.error('Character generation error:', err);
      showToast(`Failed to generate character image: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate Character Image';
    }
  }

  function renderScenes() {
    const section = document.createElement('div');
    section.className = 'space-y-4';

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';
    header.innerHTML = '<h2 class="text-lg font-bold text-white">Scenes</h2>';
    const addSceneBtn = document.createElement('button');
    addSceneBtn.className = 'px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all';
    addSceneBtn.textContent = '+ Add Scene';
    addSceneBtn.onclick = () => {
      scenes.push({ title: '', description: '', shots: [{ prompt: '', narration: '', shot: 'Wide Shot' }] });
      renderTabs();
    };
    header.appendChild(addSceneBtn);
    section.appendChild(header);

    const scenesList = document.createElement('div');
    scenesList.className = 'space-y-6';

    scenes.forEach((scene, sceneIdx) => {
      const sceneCard = document.createElement('div');
      sceneCard.className = 'bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-4';

      const sceneHeader = document.createElement('div');
      sceneHeader.className = 'flex items-center justify-between';
      sceneHeader.innerHTML = `<span class="text-sm font-bold text-primary">Scene ${sceneIdx + 1}</span><button class="text-muted hover:text-red-400 transition-colors text-xs remove-scene">&times;</button>`;
      sceneCard.appendChild(sceneHeader);

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.className = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-muted focus:outline-none focus:border-primary/50';
      titleInput.placeholder = 'Scene title...';
      titleInput.value = scene.title;
      titleInput.oninput = () => { scene.title = titleInput.value; };
      sceneCard.appendChild(titleInput);

      const descInput = document.createElement('textarea');
      descInput.className = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none';
      descInput.rows = 2;
      descInput.placeholder = 'Scene description...';
      descInput.value = scene.description;
      descInput.oninput = () => { scene.description = descInput.value; };
      sceneCard.appendChild(descInput);

      // Shots within scene
      const shotsHeader = document.createElement('div');
      shotsHeader.className = 'flex items-center justify-between';
      shotsHeader.innerHTML = '<span class="text-xs font-bold text-secondary">Shots</span>';
      const addShotBtn = document.createElement('button');
      addShotBtn.className = 'px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-all';
      addShotBtn.textContent = '+ Shot';
      addShotBtn.onclick = () => {
        scene.shots.push({ prompt: '', narration: '', shot: 'Wide Shot' });
        renderTabs();
      };
      shotsHeader.appendChild(addShotBtn);
      sceneCard.appendChild(shotsHeader);

      const shotsGrid = document.createElement('div');
      shotsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

      scene.shots.forEach((shot, shotIdx) => {
        const shotCard = document.createElement('div');
        shotCard.className = 'bg-white/[0.02] border border-white/5 rounded-lg p-3 space-y-2';

        const shotHeader = document.createElement('div');
        shotHeader.className = 'flex items-center justify-between';
        shotHeader.innerHTML = `<span class="text-xs font-bold text-primary">Shot ${shotIdx + 1}</span><button class="text-muted hover:text-red-400 transition-colors text-xs remove-shot">&times;</button>`;
        shotCard.appendChild(shotHeader);

        const shotSelect = document.createElement('select');
        shotSelect.className = 'w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none appearance-none cursor-pointer';
        SHOT_TYPES.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s;
          opt.textContent = s;
          opt.style.background = '#111';
          if (s === shot.shot) opt.selected = true;
          shotSelect.appendChild(opt);
        });
        shotSelect.onchange = () => { shot.shot = shotSelect.value; };
        shotCard.appendChild(shotSelect);

        const promptInput = document.createElement('textarea');
        promptInput.className = 'w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50 resize-none';
        promptInput.rows = 2;
        promptInput.placeholder = 'Describe this shot...';
        promptInput.value = shot.prompt;
        promptInput.oninput = () => { shot.prompt = promptInput.value; };
        shotCard.appendChild(promptInput);

        const narrationInput = document.createElement('input');
        narrationInput.type = 'text';
        narrationInput.className = 'w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-xs placeholder:text-muted focus:outline-none focus:border-primary/50';
        narrationInput.placeholder = 'Narration text (optional)...';
        narrationInput.value = shot.narration || '';
        narrationInput.oninput = () => { shot.narration = narrationInput.value; };
        shotCard.appendChild(narrationInput);

        shotCard.querySelector('.remove-shot').onclick = () => {
          scene.shots.splice(shotIdx, 1);
          if (scene.shots.length === 0) scene.shots.push({ prompt: '', narration: '', shot: 'Wide Shot' });
          renderTabs();
        };

        shotsGrid.appendChild(shotCard);
      });

      sceneCard.appendChild(shotsGrid);

      sceneCard.querySelector('.remove-scene').onclick = () => {
        scenes.splice(sceneIdx, 1);
        renderTabs();
      };

      scenesList.appendChild(sceneCard);
    });

    section.appendChild(scenesList);

    // Generate Storyboard button
    const genStoryboardBtn = document.createElement('button');
    genStoryboardBtn.className = 'w-full py-3 bg-primary text-black rounded-xl text-sm font-bold hover:shadow-glow transition-all';
    genStoryboardBtn.textContent = 'Generate Storyboard';
    genStoryboardBtn.onclick = () => generateStoryboard(genStoryboardBtn);
    section.appendChild(genStoryboardBtn);

    contentArea.appendChild(section);
  }

  function renderResults() {
    const section = document.createElement('div');
    section.className = 'space-y-4';

    if (!storyboardResult) {
      section.innerHTML = '<div class="text-center text-muted py-8">No storyboard generated yet. Create characters and scenes first, then generate a storyboard.</div>';
    } else {
      const header = document.createElement('div');
      header.className = 'flex items-center justify-between';
      header.innerHTML = '<h2 class="text-lg font-bold text-white">Generated Storyboard</h2>';
      const exportBtn = document.createElement('button');
      exportBtn.className = 'px-4 py-2 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/20 transition-all';
      exportBtn.innerHTML = 'Export JSON';
      exportBtn.onclick = () => exportStoryboard();
      header.appendChild(exportBtn);
      section.appendChild(header);

      // Display storyboard frames
      const framesGrid = document.createElement('div');
      framesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

      // Assume storyboardResult has scenes with shots and images
      if (storyboardResult.scenes) {
        storyboardResult.scenes.forEach((scene, sceneIdx) => {
          scene.shots.forEach((shot, shotIdx) => {
            if (shot.imageUrl) {
              const card = document.createElement('div');
              card.className = 'bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-3';

              const frameNum = document.createElement('div');
              frameNum.className = 'text-xs font-bold text-primary';
              frameNum.textContent = `Scene ${sceneIdx + 1} - Shot ${shotIdx + 1}`;
              card.appendChild(frameNum);

              const imageArea = document.createElement('div');
              imageArea.className = 'w-full aspect-video bg-white/[0.02] rounded-lg border border-white/5 flex items-center justify-center overflow-hidden';
              imageArea.innerHTML = `<img src="${shot.imageUrl}" class="w-full h-full object-cover">`;
              card.appendChild(imageArea);

              const shotType = document.createElement('div');
              shotType.className = 'text-xs text-secondary';
              shotType.textContent = shot.shot;
              card.appendChild(shotType);

              const prompt = document.createElement('div');
              prompt.className = 'text-xs text-white';
              prompt.textContent = shot.prompt;
              card.appendChild(prompt);

              if (shot.narration) {
                const narration = document.createElement('div');
                narration.className = 'text-xs text-muted italic';
                narration.textContent = `"${shot.narration}"`;
                card.appendChild(narration);
              }

              framesGrid.appendChild(card);
            }
          });
        });
      }

      section.appendChild(framesGrid);
    }

    contentArea.appendChild(section);
  }

  async function generateStoryboard(btn) {
    if (characters.length === 0 || scenes.length === 0) {
      showToast('Please create at least one character and one scene.', 'warning');
      return;
    }
    // No API key needed for CutAI backend

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block mr-2">&#9711;</span> Generating...';
    showToast('Generating storyboard...', 'info');

    try {
      // Prepare data for createStoryboard
      const chars = characters.map(c => ({ name: c.name, traits: c.traits, image_url: c.imageUrl }));
      const shots = scenes.flatMap((scene, sceneIdx) =>
        scene.shots.map(shot => ({
          scene_index: sceneIdx,
          prompt: shot.prompt,
          narration: shot.narration,
          shot_type: shot.shot
        }))
      );

      const result = await cutai.createStoryboardProject({ characters: chars, scenes, shots });
      storyboardResult = result;
      currentProjectId = result.project?.id;
      currentTab = 'Results';
      renderTabs();
      saveProject(); // Auto-save after successful generation
      showToast('Storyboard generated successfully!', 'success');
    } catch (err) {
      console.error('Storyboard generation error:', err);
      const errorMessage = err.message?.includes('fetch') ?
        'Network error: Please check your connection and ensure the backend is running.' :
        err.message || 'Generation failed. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Generate Storyboard';
    }
  }

  function exportStoryboard() {
    if (!storyboardResult) {
      showToast('No storyboard to export', 'warning');
      return;
    }
    try {
      const data = JSON.stringify(storyboardResult, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storyboard-project-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Storyboard exported successfully!', 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export storyboard', 'error');
    }
  }

  renderTabs();
  return container;
}
