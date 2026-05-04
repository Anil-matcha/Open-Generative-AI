// Landing Page Hero Section - Higgsfield.ai style
// Large typography, gradient text, prominent CTAs

export function Hero() {
  const section = document.createElement('section');
  section.className = 'relative py-32 px-4 overflow-hidden';
  
  // Background gradient mesh
  section.innerHTML = `
    <div class="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-[#0f1113] to-[#0f1113] -z-10"></div>
    
    <!-- Subtle animated particles (static for now) -->
    <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0); background-size: 40px 40px;"></div>
    
    <div class="container mx-auto max-w-5xl text-center relative z-10">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span class="text-sm text-gray-300">Now with AI-powered keyframe automation</span>
      </div>
      
      <!-- Main headline -->
      <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight" style="font-family: 'Sora', sans-serif;">
        <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          ONE TIMELINE.
        </span><br/>
        <span class="text-white">EVERY WORKFLOW.</span>
      </h1>
      
      <!-- Subheadline -->
      <p class="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed" style="font-family: 'Inter', sans-serif;">
        The all-in-one video editing suite for creators. 
        Create Hollywood-ready videos in minutes with AI-powered tools, 
        professional timeline editing, and cinematic effects.
      </p>
      
      <!-- CTA Buttons -->
      <div class="flex flex-wrap gap-4 justify-center mb-16">
        <button id="hero-cta-primary" class="px-10 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary/90 transition transform hover:scale-105 shadow-lg shadow-primary/25">
          Try Timeline Editor Free
        </button>
        <button id="hero-cta-secondary" class="px-10 py-4 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/10 transition flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Watch Demo
        </button>
      </div>
      
      <!-- Stats bar -->
      <div class="flex flex-wrap justify-center gap-12 text-sm text-gray-500">
        <div>
          <span class="text-white font-semibold text-lg">10,000+</span> creators
        </div>
        <div>
          <span class="text-white font-semibold text-lg">50K+</span> videos made
        </div>
        <div>
          <span class="text-white font-semibold text-lg">4.9/5</span> rating
        </div>
      </div>
    </div>
    
    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </div>
  `;
  
  return section;
}
