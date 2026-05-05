// Interactive Video Generation Demo
// Mock demo showing AI video generation workflow

export function VideoGenDemo() {
  const demo = document.createElement('div');
  demo.className = 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl mx-auto';
  demo.setAttribute('aria-label', 'AI Video Generation Demo');

  let isGenerating = false;
  let currentStep = 0;
  let promptInput = null;
  let durationSelect = null;
  let generateBtn = null;
  let progressBar = null;
  let resultArea = null;

  const mockPrompts = [
    "A rocket launching into space, slow motion, cinematic",
    "Waves crashing on a tropical beach, golden hour, peaceful",
    "City skyline at night, cars moving, neon lights reflecting",
    "Butterfly emerging from chrysalis, timelapse, magical transformation"
  ];

  function updateProgress(progress) {
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  function updateUI() {
    if (generateBtn) {
      generateBtn.disabled = isGenerating;
      generateBtn.innerHTML = isGenerating ? 
        '<div class="flex items-center justify-center gap-2"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generating...</div>' : 
        '🎬 Generate Video';
      generateBtn.className = isGenerating 
        ? 'w-full py-3 bg-slate-600 text-slate-400 rounded-lg cursor-not-allowed'
        : 'w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all duration-200 font-medium';
    }
  }

  function startGeneration() {
    if (isGenerating) return;
    
    isGenerating = true;
    currentStep = 1;
    updateUI();
    
    // Simulate generation progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(progressInterval);
        setTimeout(() => {
          isGenerating = false;
          currentStep = 2;
          updateUI();
        }, 500);
      }
      updateProgress(progress);
    }, 300);
  }

  demo.innerHTML = `
    <div class="text-center mb-6">
      <h3 class="text-xl font-bold text-white mb-2">🎬 Try AI Video Generation</h3>
      <p class="text-slate-400 text-sm">Create cinematic videos from text descriptions</p>
    </div>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Describe your video:</label>
        <input 
          type="text" 
          placeholder="A rocket launching into space, slow motion, cinematic..."
          class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-2">Duration:</label>
        <select class="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent">
          <option value="5">5 seconds</option>
          <option value="10" selected>10 seconds</option>
          <option value="15">15 seconds</option>
          <option value="30">30 seconds</option>
        </select>
      </div>
      
      <div class="bg-slate-800 rounded-lg p-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-slate-300">Generation Progress</span>
          <span class="text-sm text-purple-400 font-mono progress-text">0%</span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 progress-bar" style="width: 0%"></div>
        </div>
      </div>
      
      <button class="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all duration-200 font-medium">
        🎬 Generate Video
      </button>
    </div>
    
    <div class="mt-4 text-center">
      <div class="text-xs text-slate-500">Demo - No API calls made</div>
    </div>
  `;

  // Get references and add event listeners
  setTimeout(() => {
    promptInput = demo.querySelector('input');
    durationSelect = demo.querySelector('select');
    generateBtn = demo.querySelector('button');
    progressBar = demo.querySelector('.progress-bar');
    resultArea = demo.querySelector('.space-y-4');
    
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
