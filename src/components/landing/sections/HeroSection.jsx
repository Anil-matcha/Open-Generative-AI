// Hero Section - AI Video Agency Studio
// Cinematic design with direct-response positioning

export function HeroSection() {
  const section = document.createElement('section');
  section.className = 'relative py-24 md:py-32 px-4 overflow-hidden min-h-screen flex items-center';
  section.setAttribute('role', 'banner');
  section.setAttribute('aria-labelledby', 'hero-headline');

  section.innerHTML = `
    <!-- Cinematic Background -->
    <div class="absolute inset-0 bg-[#020205] -z-10"></div>
    <div class="absolute inset-0 bg-gradient-to-br from-[#171b24] via-[#05070b] to-[#020205] opacity-90 -z-10"></div>
    
    <!-- Animated particle grid -->
    <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 3px 3px, rgba(34,211,238,0.15) 1px, transparent 0); background-size: 80px 80px;"></div>
    
    <!-- Floating geometric shapes with animations -->
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-400/5 rounded-full blur-3xl animate-pulse -z-5"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse -z-5" style="animation-delay: 2s;"></div>
    <div class="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-400/5 rounded-full blur-3xl animate-pulse -z-5" style="animation-delay: 1s;"></div>

    <div class="container mx-auto max-w-6xl text-center relative z-10">
      <!-- Trust Badge with entrance animation -->
      <div class="trust-badge opacity-0 translate-y-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 mb-8 shadow-lg shadow-cyan-400/20">
        <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span class="text-sm text-cyan-100 font-medium">Trusted by 10,000+ Creators & Agencies</span>
      </div>

      <!-- Main Headline with staggered animation -->
      <h1 id="hero-headline" class="hero-headline mb-6 leading-tight opacity-0" style="animation: fadeSlideUp 0.8s ease-out-quart forwards;">
        <span class="text-cyan-400 italic font-black">Create Cinematic AI Videos,</span><br/>
        <span class="text-white font-black">Images, VFX, Commercials,</span><br/>
        <span class="text-cyan-400 italic font-black">Characters, Agents &</span><br/>
        <span class="text-white font-black">Client-Ready Content</span><br/>
        <span class="text-cyan-400 italic font-black">From One Powerful AI Studio</span>
      </h1>

      <!-- Subheadline -->
      <p class="hero-subheadline text-lg md:text-xl text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed font-medium opacity-0" style="font-size: clamp(1.125rem, 2.5vw, 1.25rem); animation: fadeSlideUp 0.8s ease-out-quart 0.2s forwards;">
        AI Video Agency Studio gives you a complete creative command center with 60+ AI-powered tools for generating videos, images, characters, commercials, cinematic effects, avatars, lip sync, dubbing, storyboards, edits, workflows, agents, and client-ready content packages — all from one organized platform.
      </p>

      <!-- Primary CTA with hover effects -->
      <div class="hero-cta flex flex-col sm:flex-row gap-4 justify-center mb-12 opacity-0" style="animation: fadeSlideUp 0.8s ease-out-quart 0.4s forwards;">
        <button class="cta-primary px-8 md:px-12 py-4 bg-gradient-to-r from-cyan-400 to-cyan-300 text-[#020205] font-bold text-lg rounded-lg hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 shadow-2xl shadow-cyan-400/30 hover:shadow-cyan-300/50 hover:scale-105 group">
          <span class="flex items-center justify-center gap-2">
            Start Building My AI Video Agency
            <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </span>
        </button>
        <button class="cta-secondary px-8 md:px-12 py-4 border-2 border-cyan-400/50 text-cyan-100 font-bold text-lg rounded-lg hover:border-cyan-400 hover:bg-cyan-400/10 transition-all duration-300 backdrop-blur-sm group">
          <span class="flex items-center justify-center gap-2">
            Watch The Demo Video
            <svg class="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </span>
        </button>
      </div>

      <!-- Social Proof with stagger -->
      <div class="hero-stats flex flex-wrap justify-center gap-8 md:gap-12 text-sm opacity-0" style="animation: fadeSlideUp 0.8s ease-out-quart 0.6s forwards;" role="region" aria-labelledby="stats-heading">
        <h2 id="stats-heading" class="sr-only">Platform Statistics</h2>
        <div class="stat-item text-center transform hover:scale-110 transition-transform duration-200">
          <div class="text-cyan-400 font-bold text-2xl md:text-3xl mb-1">33</div>
          <div class="text-gray-400">AI Creative Apps</div>
        </div>
        <div class="stat-item text-center transform hover:scale-110 transition-transform duration-200">
          <div class="text-emerald-400 font-bold text-2xl md:text-3xl mb-1">60+</div>
          <div class="text-gray-400">AI Features</div>
        </div>
        <div class="stat-item text-center transform hover:scale-110 transition-transform duration-200">
          <div class="text-cyan-400 font-bold text-2xl md:text-3xl mb-1">200+</div>
          <div class="text-gray-400">AI Models</div>
        </div>
        <div class="stat-item text-center transform hover:scale-110 transition-transform duration-200">
          <div class="text-purple-400 font-bold text-2xl md:text-3xl mb-1">Lifetime</div>
          <div class="text-gray-400">Access</div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator with bounce animation -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-cyan-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
      </svg>
    </div>

    <style>
      @keyframes fadeSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .cta-primary:hover {
        box-shadow: 0 20px 40px rgba(34, 211, 238, 0.3);
      }
      .cta-secondary:hover {
        border-color: rgba(34, 211, 238, 0.8);
        background-color: rgba(34, 211, 238, 0.1);
      }
      @media (prefers-reduced-motion: reduce) {
        .animate-pulse, .animate-bounce { animation: none; }
        .trust-badge, .hero-headline, .hero-subheadline, .hero-cta, .hero-stats {
          opacity: 1;
          transform: none;
          animation: none;
        }
        .stat-item:hover { transform: none; }
        .cta-primary:hover, .cta-secondary:hover { transform: none; }
      }
      @media (prefers-contrast: high) {
        .text-cyan-400 { color: #ffffff; }
        .text-cyan-100 { color: #ffffff; }
        .border-cyan-400\/30 { border-color: #ffffff; }
        .bg-cyan-400\/10 { background-color: rgba(255,255,255,0.1); }
      }
    </style>
  `;

  // Trigger animations after load
  setTimeout(() => {
    const badge = section.querySelector('.trust-badge');
    if (badge) {
      badge.style.animation = 'fadeSlideUp 0.6s ease-out-quart forwards';
    }
  }, 100);

  return section;
}
