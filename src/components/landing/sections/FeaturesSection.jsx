// Features Section - 60+ AI Features Showcase

export function FeaturesSection({ categories }) {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-[#020205]';
  section.setAttribute('aria-labelledby', 'features-heading');

  const categoryColors = {
    creation: { bg: 'from-cyan-500/10 to-cyan-400/5 border-cyan-400/30', icon: 'from-cyan-500 to-cyan-400' },
    cinema: { bg: 'from-emerald-500/10 to-emerald-400/5 border-emerald-400/30', icon: 'from-emerald-500 to-emerald-400' },
    character: { bg: 'from-purple-500/10 to-purple-400/5 border-purple-400/30', icon: 'from-purple-500 to-purple-400' },
    vfx: { bg: 'from-pink-500/10 to-pink-400/5 border-pink-400/30', icon: 'from-pink-500 to-pink-400' },
    editing: { bg: 'from-yellow-500/10 to-yellow-400/5 border-yellow-400/30', icon: 'from-yellow-500 to-yellow-400' },
    commercial: { bg: 'from-indigo-500/10 to-indigo-400/5 border-indigo-400/30', icon: 'from-indigo-500 to-indigo-400' }
  };

  section.innerHTML = `
    <div class="container mx-auto max-w-7xl">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <h2 id="features-heading" class="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
          <span class="text-cyan-400 italic">60+ AI Features</span> Designed To Help You Create, Edit, Automate, Package & Sell AI Video Services
        </h2>
        <p class="text-lg text-gray-300 max-w-3xl mx-auto">
          Every feature is designed to help you produce professional-quality content faster, scale your creative output, and build a sustainable AI video agency business.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8" id="features-grid">
        ${(categories && Object.entries(categories).length > 0) ? Object.entries(categories).map(([key, category], index) => `
          <div class="feature-category opacity-0 translate-y-4 transition-all duration-500 ease-out-quart" style="transition-delay: ${index * 100}ms;" data-index="${index}">
            <div class="bg-gradient-to-br ${categoryColors[key].bg} border rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <div class="w-10 h-10 bg-gradient-to-br ${categoryColors[key].icon} rounded-lg flex items-center justify-center shadow-lg">
                  <span class="text-lg">${getCategoryIcon(key)}</span>
                </div>
                ${category.title}
              </h3>
              <ul class="space-y-2">
                ${category.features.map(feature => `
                  <li class="flex items-start gap-3 text-gray-300">
                    <svg class="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span class="text-sm leading-relaxed">${feature}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>
        `).join('') : ''}
      </div>

      <!-- CTA Button -->
      <div class="text-center mt-16">
        <button class="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-300 text-[#020205] font-bold text-lg rounded-lg hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 shadow-2xl shadow-cyan-400/30 hover:shadow-cyan-300/50 transform hover:scale-105 hover:shadow-cyan-400/40">
          Unlock The 60+ AI Creative Tools →
        </button>
      </div>
    </div>

    <style>
      .feature-category {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .feature-category.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .feature-category:hover {
        transform: translateY(-2px);
      }
      @media (prefers-reduced-motion: reduce) {
        .feature-category { transition: none; opacity: 1; transform: none; }
        .feature-category:hover { transform: none; }
      }
    </style>
  `;

  return section;
}

// Helper function to get category icons
function getCategoryIcon(category) {
  const icons = {
    creation: '🎨',
    cinema: '🎬',
    character: '👤',
    vfx: '💥',
    editing: '✂️',
    commercial: '💼'
  };
  
  return icons[category] || '⚙️';
}
