// Interactive Image Generation Demo
// Mock demo showing AI image generation workflow

export function ImageGenDemo() {
  const demo = document.createElement('div');
  demo.className = 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl mx-auto';
  demo.setAttribute('aria-label', 'AI Image Generation Demo');

  let isGenerating = false;
  let currentStep = 0;
  let promptInput = null;
  let generateBtn = null;
  let resultArea = null;

  const mockPrompts = [
    "A cinematic sunset over a futuristic city, dramatic lighting, 8k",
    "Cyberpunk samurai standing on a neon-lit rooftop, rain falling, detailed armor",
    "Majestic eagle soaring through storm clouds, lightning in background, photorealistic",
    "Steampunk airship floating above Victorian London, golden hour lighting"
  ];

  const mockResults = [
    "🎨 Generated: Cinematic sunset over futuristic city with dramatic lighting",
    "⚔️ Generated: Cyberpunk samurai on neon rooftop in rain",
    "🦅 Generated: Majestic eagle soaring through storm clouds with lightning",
    "🚀 Generated: Steampunk airship above Victorian London at golden hour"
  ];

  function updateUI() {
    if (generateBtn) {
      generateBtn.disabled = isGenerating;
      generateBtn.textContent = isGenerating ? 'Generating...' : 'Generate Image';
      generateBtn.className = isGenerating 
        ? 'w-full py-3 bg-slate-600 text-slate-400 rounded-lg cursor-not-allowed'
        : 'w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 font-medium';
    }

    if (resultArea && currentStep > 0) {
      resultArea.innerHTML = `
        <div class="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <span class="text-green-400 text-sm">✓</span>
            </div>
            <span class="text-green-400 font-medium">Image Generated Successfully!</span>
          </div>
          <div class="bg-slate-700 rounded-lg p-4 mb-3">
            <div class="w-full h-32 bg-gradient-to-br from-slate-600 to-slate-500 rounded-lg flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-2">🖼️</div>
                <div class="text-slate-300 text-sm">${mockResults[currentStep - 1]}</div>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors text-sm">
              Download
            </button>
            <button class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors text-sm">
              Share
            </button>
            <button class="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-sm">
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
      currentStep = (currentStep % mockPrompts.length) + 1;
      isGenerating = false;
      updateUI();
    }, 3000);
  }

  demo.innerHTML = `
    <div class="text-center mb-6">
      <h3 class="text-xl font-bold text-white mb-2">🎨 Try AI Image Generation</h3>
      <p class="text-slate-400 text-sm">Enter a prompt and watch AI create stunning visuals instantly</p>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Describe your image:</label>
        <input 
          type="text" 
          placeholder="A cinematic sunset over a futuristic city..."
          class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>
      
      <button class="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 font-medium">
        Generate Image
      </button>
    </div>
    
    <div class="mt-4 text-center">
      <div class="text-xs text-slate-500">Demo - No API calls made</div>
    </div>
  `;

  // Get references and add event listeners
  setTimeout(() => {
    promptInput = demo.querySelector('input');
    generateBtn = demo.querySelector('button');
    resultArea = demo.querySelector('.space-y-4');
    
    if (promptInput) {
      promptInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
          const randomPrompt = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
          e.target.placeholder = randomPrompt;
        }
      });
    }
    
    if (generateBtn) {
      generateBtn.addEventListener('click', startGeneration);
    }
    
    // Initialize with a random prompt
    if (promptInput) {
      promptInput.placeholder = mockPrompts[Math.floor(Math.random() * mockPrompts.length)];
    }
  }, 0);

  return demo;
}
