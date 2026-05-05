// Interactive Character Creation Demo
// Mock demo showing AI character generation

export function CharacterDemo() {
  const demo = document.createElement('div');
  demo.className = 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl mx-auto';
  demo.setAttribute('aria-label', 'AI Character Creation Demo');

  let isGenerating = false;
  let currentCharacter = null;
  let promptInput = null;
  let styleSelect = null;
  let generateBtn = null;
  let resultArea = null;

  const characterStyles = [
    { id: 'realistic', name: 'Realistic', emoji: '📸' },
    { id: 'anime', name: 'Anime', emoji: '🎨' },
    { id: 'fantasy', name: 'Fantasy', emoji: '🧙' },
    { id: 'cyberpunk', name: 'Cyberpunk', emoji: '🤖' }
  ];

  const mockCharacters = [
    { name: "Alex Chen", style: "realistic", description: "Professional business executive with confident expression" },
    { name: "Luna Star", style: "anime", description: "Mystical warrior with glowing blue eyes and flowing hair" },
    { name: "Eldrin the Wise", style: "fantasy", description: "Ancient elven scholar with intricate robes and staff" },
    { name: "Nova Blade", style: "cyberpunk", description: "High-tech mercenary with neon cybernetic implants" }
  ];

  function updateUI() {
    if (generateBtn) {
      generateBtn.disabled = isGenerating;
      generateBtn.innerHTML = isGenerating ? 
        '<div class="flex items-center justify-center gap-2"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Creating...</div>' : 
        '👤 Create Character';
      generateBtn.className = isGenerating 
        ? 'w-full py-3 bg-slate-600 text-slate-400 rounded-lg cursor-not-allowed'
        : 'w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-200 font-medium';
    }

    if (resultArea && currentCharacter) {
      const char = currentCharacter;
      resultArea.innerHTML += `
        <div class="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span class="text-green-400 text-sm">✓</span>
            </div>
            <span class="text-green-400 font-medium">Character Created: ${char.name}</span>
          </div>
          <div class="bg-slate-700 rounded-lg p-4 mb-3">
            <div class="w-full h-40 bg-gradient-to-br from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-2">${getCharacterEmoji(char.style)}</div>
                <div class="text-white font-medium">${char.name}</div>
                <div class="text-slate-300 text-sm">${char.description}</div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button class="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors text-sm">
              Download
            </button>
            <button class="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors text-sm">
              Edit
            </button>
            <button class="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors text-sm">
              Use in Video
            </button>
          </div>
        </div>
      `;
    }
  }

  function startGeneration() {
    if (isGenerating) return;
    
    isGenerating = true;
    updateUI();

    // Simulate generation process
    setTimeout(() => {
      const selectedStyle = styleSelect ? styleSelect.value : 'realistic';
      const styleChars = mockCharacters.filter(c => c.style === selectedStyle);
      currentCharacter = styleChars[Math.floor(Math.random() * styleChars.length)];
      
      isGenerating = false;
      updateUI();
    }, 2500);
  }

  function getCharacterEmoji(style) {
    const emojis = {
      'realistic': '👨',
      'anime': '🎭',
      'fantasy': '🧝',
      'cyberpunk': '🤖'
    };
    return emojis[style] || '👤';
  }

  demo.innerHTML = `
    <div class="text-center mb-6">
      <h3 class="text-xl font-bold text-white mb-2">👤 Try AI Character Creation</h3>
      <p class="text-slate-400 text-sm">Generate consistent characters for your videos and content</p>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Character description:</label>
        <input 
          type="text" 
          placeholder="A confident business executive in a modern office..."
          class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Art style:</label>
        <select class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
          ${characterStyles.map(style => `<option value="${style.id}">${style.emoji} ${style.name}</option>`).join('')}
        </select>
      </div>
      
      <button class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-200 font-medium">
        👤 Create Character
      </button>
    </div>
    
    <div class="mt-4 text-center">
      <div class="text-xs text-slate-500">Demo - No API calls made</div>
    </div>
  `;

  // Get references and add event listeners
  setTimeout(() => {
    promptInput = demo.querySelector('input');
    styleSelect = demo.querySelector('select');
    generateBtn = demo.querySelector('button');
    resultArea = demo.querySelector('.space-y-4');
    
    if (generateBtn) {
      generateBtn.addEventListener('click', startGeneration);
    }
  }, 0);

  return demo;
}
