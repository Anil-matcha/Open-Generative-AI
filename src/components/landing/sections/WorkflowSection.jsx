// Workflow Section - Go From Simple Idea To Finished Client Asset In Minutes

export function WorkflowSection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-[#05070b]';
  section.setAttribute('aria-labelledby', 'workflow-heading');

  section.innerHTML = `
    <div class="container mx-auto max-w-7xl">
      <div class="text-center mb-16">
        <h2 id="workflow-heading" class="workflow-headline text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 opacity-0">
          Go From Simple Idea To <span class="text-cyan-400 italic">Finished Client Asset</span> In Minutes
        </h2>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto">
          Stop juggling multiple tools and complex workflows. AI Video Agency Studio gives you a streamlined creative pipeline that turns concepts into polished deliverables.
        </p>
      </div>

      <!-- Workflow Steps -->
      <div class="relative">
        <!-- Connection line -->
        <div class="hidden lg:block absolute top-24 left-1/2 transform -translate-x-1/2 w-full max-w-4xl h-0.5 bg-gradient-to-r from-cyan-400/50 via-emerald-400/50 to-cyan-400/50 workflow-line opacity-0"></div>
        
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-4 workflow-steps">
          <!-- Step 1: Ideate -->
          <div class="workflow-step opacity-0 translate-y-4 text-center group">
            <div class="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-400/30">
              <span class="text-2xl">💡</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">1. Ideate</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Use AI chat and explore features to brainstorm creative concepts, write compelling prompts, and plan your video strategy.
            </p>
            <div class="text-xs text-cyan-400 mt-2 font-medium">Chat • Explore • Assist</div>
          </div>

          <!-- Step 2: Generate -->
          <div class="workflow-step opacity-0 translate-y-4 text-center group" style="transition-delay: 100ms;">
            <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-400/30">
              <span class="text-2xl">🎬</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">2. Generate</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Create cinematic videos, stunning images, and visual effects using our 200+ AI models and professional-grade tools.
            </p>
            <div class="text-xs text-emerald-400 mt-2 font-medium">Image • Video • Cinema</div>
          </div>

          <!-- Step 3: Enhance -->
          <div class="workflow-step opacity-0 translate-y-4 text-center group" style="transition-delay: 200ms;">
            <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-400/30">
              <span class="text-2xl">✨</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">3. Enhance</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Add VFX, effects, motion, upscale quality, and apply professional editing techniques to polish your content.
            </p>
            <div class="text-xs text-purple-400 mt-2 font-medium">VFX • Effects • Edit</div>
          </div>

          <!-- Step 4: Produce -->
          <div class="workflow-step opacity-0 translate-y-4 text-center group" style="transition-delay: 300ms;">
            <div class="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-pink-400/30">
              <span class="text-2xl">🎯</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">4. Produce</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Arrange scenes in timeline, add audio, dub for multiple languages, and finalize your professional video production.
            </p>
            <div class="text-xs text-pink-400 mt-2 font-medium">Timeline • Audio • Dubbing</div>
          </div>

          <!-- Step 5: Deliver -->
          <div class="workflow-step opacity-0 translate-y-4 text-center group" style="transition-delay: 400ms;">
            <div class="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-400/30">
              <span class="text-2xl">🚀</span>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">5. Deliver</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Export in multiple formats, organize in your library, and deliver polished client-ready packages with professional branding.
            </p>
            <div class="text-xs text-yellow-400 mt-2 font-medium">Render • Library • Commercial</div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center mt-16 workflow-cta opacity-0 translate-y-4">
        <div class="inline-block p-8 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-2xl hover:shadow-lg hover:shadow-cyan-400/10 transition-shadow duration-300">
          <h3 class="text-xl font-bold text-white mb-3">From Concept To Client Delivery In One Platform</h3>
          <p class="text-gray-300 mb-6">No more switching between 10 different tools. Everything you need is right here.</p>
          <button class="px-8 py-3 bg-gradient-to-r from-cyan-400 to-cyan-300 text-[#020205] font-bold rounded-lg hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 hover:scale-105 shadow-lg shadow-cyan-400/20">
            Start My First AI Video Project →
          </button>
        </div>
      </div>
    </div>

    <style>
      .workflow-step, .workflow-cta, .workflow-headline, .workflow-line {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .workflow-step.animate-in, .workflow-cta.animate-in, .workflow-headline.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .workflow-line.animate-in {
        opacity: 1;
      }
      @media (prefers-reduced-motion: reduce) {
        .workflow-step, .workflow-cta, .workflow-headline, .workflow-line {
          transition: none;
          opacity: 1;
          transform: none;
        }
        .workflow-step:hover { transform: none; }
      }
    </style>
  `;

  // Initialize scroll animations
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    section.querySelectorAll('.workflow-step, .workflow-cta, .workflow-headline, .workflow-line').forEach(el => {
      observer.observe(el);
    });
  }, 100);

  return section;
}
