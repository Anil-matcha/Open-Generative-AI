// Landing Page Hero Section - Higgsfield.ai style
// Large typography, gradient text, prominent CTAs

export function Hero() {
  const section = document.createElement('section');
  section.className = 'relative py-32 px-4 overflow-hidden';
  section.setAttribute('role', 'banner');
  section.setAttribute('aria-labelledby', 'hero-headline');

  // Background gradient mesh
  section.innerHTML = `
    <div class="absolute inset-0 bg-[#020205] -z-10"></div>
    <div class="absolute inset-0 bg-gradient-to-br from-[#171b24] via-[#05070b] to-[#020205] opacity-90 -z-10"></div>

    <!-- Subtle cyan particles -->
    <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 3px 3px, rgba(34,211,238,0.1) 1px, transparent 0); background-size: 60px 60px;"></div>

    <div class="container mx-auto max-w-5xl text-center relative z-10">
      <!-- Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 mb-8 shadow-lg shadow-cyan-400/20" role="status" aria-live="polite">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true"></span>
        <span class="text-sm text-cyan-100">Now with AI-powered keyframe automation</span>
      </div>

      <!-- Main headline -->
      <h1 id="hero-headline" class="mb-6 leading-tight text-4xl md:text-5xl lg:text-6xl xl:text-7xl" style="font-size: clamp(2.5rem, 8vw, 4.5rem);">
        <span class="text-cyan-400 italic">ONE TIMELINE.</span><br/>
        <span class="text-white">EVERY WORKFLOW.</span>
      </h1>

      <!-- Subheadline -->
      <p class="text-lg md:text-xl lg:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed" style="font-size: clamp(1.125rem, 3vw, 1.5rem);">
        The all-in-one video editing suite for creators.
        Create Hollywood-ready videos in minutes with AI-powered tools,
        professional timeline editing, and cinematic effects.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-wrap gap-4 justify-center mb-16">
        <button id="hero-cta-primary" type="button" aria-label="Try Timeline Editor Free" class="px-8 md:px-12 py-4 bg-cyan-400 text-[#020205] font-semibold hover:bg-cyan-300 transition shadow-lg shadow-cyan-400/50 hover:shadow-cyan-400/70 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#020205]" style="border-radius: 0; letter-spacing: 0.05em; text-transform: uppercase; font-size: clamp(1rem, 2vw, 1.125rem); min-width: 200px;">
          Try Timeline Editor Free
        </button>
        <button id="hero-cta-secondary" type="button" aria-label="Watch Demo" class="px-8 md:px-12 py-4 border border-cyan-400/30 text-cyan-100 font-semibold hover:border-cyan-400 hover:bg-cyan-400/10 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#020205]" style="border-radius: 0; letter-spacing: 0.05em; text-transform: uppercase; font-size: clamp(1rem, 2vw, 1.125rem); min-width: 150px;">
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z"/>
          </svg>
          Watch Demo
        </button>
      </div>

      <!-- Stats bar -->
      <div class="flex flex-wrap justify-center gap-8 md:gap-12 text-sm text-gray-400" role="region" aria-labelledby="stats-heading">
        <h2 id="stats-heading" class="sr-only">Usage Statistics</h2>
        <div class="flex flex-col items-center gap-1">
          <span class="text-cyan-400 font-bold" style="font-size: clamp(1.25rem, 3vw, 1.5rem);">10,000+</span>
          <span class="text-gray-500">creators</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <span class="text-emerald-400 font-bold" style="font-size: clamp(1.25rem, 3vw, 1.5rem);">50K+</span>
          <span class="text-gray-500">videos made</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <span class="text-cyan-400 font-bold" style="font-size: clamp(1.25rem, 3vw, 1.5rem);">4.9/5</span>
          <span class="text-gray-500">rating</span>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 motion-safe-animate-float" aria-hidden="true">
      <svg class="w-6 h-6 text-cyan-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </div>
    <style>
      @keyframes float {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(8px); }
      }
      .motion-safe-animate-float {
        animation: float 3s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .motion-safe-animate-float { animation: none; }
      }
      /* RTL Support */
      [dir="rtl"] .text-center { text-align: center; }
      [dir="rtl"] .transform.-translate-x-1-2 { transform: translateX(50%); }
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .text-cyan-400 { color: #ffffff; }
        .text-cyan-100 { color: #ffffff; }
        .border-cyan-400-30 { border-color: #ffffff; }
        .bg-cyan-400-10 { background-color: rgba(255,255,255,0.1); }
      }
    </style>
  `;
  
  return section;
}
