// Value Stack Section - Here's What You Get Inside AI Video Agency Studio

export function ValueStackSection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-gradient-to-b from-[#05070b] to-[#020205]';
  section.setAttribute('aria-labelledby', 'value-heading');

  section.innerHTML = `
    <div class="container mx-auto max-w-7xl">
      <div class="text-center mb-16">
        <h2 id="value-heading" class="value-headline text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 opacity-0">
          You're Not Getting One AI Tool — You're Getting A <span class="text-cyan-400 italic">Full AI Creative Production Suite</span>
        </h2>
        <p class="text-xl text-gray-300 max-w-4xl mx-auto">
          Here's exactly what you unlock when you start building with AI Video Agency Studio:
        </p>
      </div>

      <!-- Value Stack -->
      <div class="space-y-8 value-items">
        <!-- Core Platform -->
        <div class="value-item opacity-0 translate-y-4 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-2xl p-8 hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-300">
          <div class="flex items-start gap-6">
            <div class="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform duration-300">
              <span class="text-3xl">🎯</span>
            </div>
            <div>
              <h3 class="text-2xl font-bold text-white mb-3">Complete Creative Command Center</h3>
              <p class="text-gray-300 text-lg mb-4">
                One unified platform that handles your entire creative workflow from concept to client delivery. No more switching between apps, losing files, or dealing with incompatible formats.
              </p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div class="stat-card bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors duration-200 cursor-default">
                  <div class="text-cyan-400 font-bold text-xl mb-1">33</div>
                  <div class="text-gray-400">Creative Tools</div>
                </div>
                <div class="stat-card bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors duration-200 cursor-default">
                  <div class="text-emerald-400 font-bold text-xl mb-1">60+</div>
                  <div class="text-gray-400">AI Capabilities</div>
                </div>
                <div class="stat-card bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors duration-200 cursor-default">
                  <div class="text-cyan-400 font-bold text-xl mb-1">200+</div>
                  <div class="text-gray-400">AI Engines</div>
                </div>
                <div class="stat-card bg-white/5 rounded-lg p-3 text-center hover:bg-white/10 transition-colors duration-200 cursor-default">
                  <div class="text-emerald-400 font-bold text-xl mb-1">Lifetime Access</div>
                  <div class="text-gray-400">No Limits</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Six Creative Engines -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 engine-cards">
          <div class="engine-card opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all duration-300 group cursor-pointer">
            <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🎨</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">Create Engine</h4>
            <p class="text-gray-400 text-sm mb-3">Start from scratch with AI-powered generation tools</p>
            <div class="text-xs text-cyan-400">Image • Video • Cinema • Character • Influencer • Commercial</div>
          </div>

          <div class="engine-card opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all duration-300 group cursor-pointer" style="transition-delay: 50ms;">
            <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">✨</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">Enhance Engine</h4>
            <p class="text-gray-400 text-sm mb-3">Transform and improve existing content</p>
            <div class="text-xs text-emerald-400">Effects • VFX • Motion • Upscale • Edit</div>
          </div>

          <div class="engine-card opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/50 hover:bg-purple-400/5 transition-all duration-300 group cursor-pointer" style="transition-delay: 100ms;">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🎬</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">Produce Engine</h4>
            <p class="text-gray-400 text-sm mb-3">Plan, structure, and assemble projects</p>
            <div class="text-xs text-purple-400">Storyboard • Director • Timeline • Render • Audio</div>
          </div>

          <div class="engine-card opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-pink-400/50 hover:bg-pink-400/5 transition-all duration-300 group cursor-pointer" style="transition-delay: 150ms;">
            <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🌍</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">Localize Engine</h4>
            <p class="text-gray-400 text-sm mb-3">Adapt content for global audiences</p>
            <div class="text-xs text-pink-400">Dubbing • Lip Sync • Avatar • TikTok</div>
          </div>

          <div class="engine-card opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all duration-300 group cursor-pointer" style="transition-delay: 200ms;">
            <div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">🤖</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">Automate Engine</h4>
            <p class="text-gray-400 text-sm mb-3">Streamline workflows with AI assistance</p>
            <div class="text-xs text-yellow-400">Video Agent • Agents • Workflows • Assist • Chat</div>
          </div>

          <div class="engine-card opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-indigo-400/50 hover:bg-indigo-400/5 transition-all duration-300 group cursor-pointer" style="transition-delay: 250ms;">
            <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <span class="text-2xl">📊</span>
            </div>
            <h4 class="text-lg font-bold text-white mb-2">Scale Engine</h4>
            <p class="text-gray-400 text-sm mb-3">Manage, reuse, and grow your creative assets</p>
            <div class="text-xs text-indigo-400">Templates • Explore • Library • Community • Training</div>
          </div>
        </div>

        <!-- Professional Features -->
        <div class="value-item opacity-0 translate-y-4 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 border border-emerald-400/30 rounded-2xl p-8 hover:shadow-xl hover:shadow-emerald-400/10 transition-all duration-300">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="prof-feature text-center group">
              <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">🎥</span>
              </div>
              <h4 class="text-lg font-bold text-white mb-2">Professional Quality</h4>
              <p class="text-gray-400 text-sm">
                Hollywood-grade cinematic tools, professional VFX, and broadcast-ready output formats.
              </p>
            </div>
            <div class="prof-feature text-center group" style="transition-delay: 100ms;">
              <div class="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">⚡</span>
              </div>
              <h4 class="text-lg font-bold text-white mb-2">Lightning Fast</h4>
              <p class="text-gray-400 text-sm">
                GPU-accelerated rendering, optimized AI models, and streamlined workflows for rapid production.
              </p>
            </div>
            <div class="prof-feature text-center group" style="transition-delay: 200ms;">
              <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span class="text-3xl">🚀</span>
              </div>
              <h4 class="text-lg font-bold text-white mb-2">Agency Ready</h4>
              <p class="text-gray-400 text-sm">
                Client management tools, professional templates, and business-ready content packages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .value-item, .engine-card, .value-headline {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .value-item.animate-in, .engine-card.animate-in, .value-headline.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .engine-card:hover, .value-item:hover {
        transform: translateY(-2px);
      }
      @media (prefers-reduced-motion: reduce) {
        .value-item, .engine-card, .value-headline, .prof-feature {
          transition: none;
          opacity: 1;
          transform: none;
        }
        .engine-card:hover, .value-item:hover, .prof-feature:hover { transform: none; }
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

    section.querySelectorAll('.value-item, .engine-card, .value-headline').forEach(el => {
      observer.observe(el);
    });
  }, 100);

  return section;
}
