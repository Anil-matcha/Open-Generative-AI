// Six Creative Engines Section - Animated with parallax and hover effects

export function SixEnginesSection() {
  const engines = [
    {
      id: 'create',
      title: 'Create',
      description: 'Start from scratch with AI-powered generation',
      icon: '🎨',
      gradient: 'from-cyan-500 to-cyan-400',
      apps: ['Image', 'Video', 'Cinema Studio', 'Character', 'Influencer', 'Commercial'],
      color: 'cyan'
    },
    {
      id: 'enhance',
      title: 'Enhance',
      description: 'Transform and improve existing content',
      icon: '✨',
      gradient: 'from-emerald-500 to-emerald-400',
      apps: ['Effects', 'VFX', 'AI-VFX', 'Motion', 'Upscale', 'Edit'],
      color: 'emerald'
    },
    {
      id: 'produce',
      title: 'Produce',
      description: 'Plan, structure, and assemble projects',
      icon: '🎬',
      gradient: 'from-purple-500 to-purple-400',
      apps: ['Storyboard', 'Director', 'Timeline', 'Render', 'Video Tools', 'Audio'],
      color: 'purple'
    },
    {
      id: 'localize',
      title: 'Localize',
      description: 'Adapt content for global audiences',
      icon: '🌍',
      gradient: 'from-pink-500 to-pink-400',
      apps: ['Dubbing', 'Lip Sync', 'Avatar', 'TikTok', 'Social Content'],
      color: 'pink'
    },
    {
      id: 'automate',
      title: 'Automate',
      description: 'Streamline workflows with AI assistance',
      icon: '🤖',
      gradient: 'from-yellow-500 to-yellow-400',
      apps: ['Video Agent', 'Agents', 'Workflows', 'Assist', 'Chat', 'MCP & CLI'],
      color: 'yellow'
    },
    {
      id: 'scale',
      title: 'Scale',
      description: 'Manage, reuse, and grow your creative assets',
      icon: '📊',
      gradient: 'from-indigo-500 to-indigo-400',
      apps: ['Templates', 'Explore', 'Library', 'Community', 'Training'],
      color: 'indigo'
    }
  ];

  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-[#05070b] relative overflow-hidden';
  section.setAttribute('aria-labelledby', 'engines-heading');

  // Create animated particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5
  }));

  section.innerHTML = `
    <!-- Animated Background Particles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      ${particles.map((p, i) => `
        <div 
          class="engine-particle absolute rounded-full bg-cyan-400/20 animate-particle-float"
          style="
            left: ${p.x}%;
            top: ${p.y}%;
            width: ${p.size}px;
            height: ${p.size}px;
            animation-duration: ${p.duration}s;
            animation-delay: ${p.delay}s;
          "
        ></div>
      `).join('')}
      <div class="engine-glow engine-glow-1 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl animate-pulse"></div>
      <div class="engine-glow engine-glow-2 w-80 h-80 bg-purple-400/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
    </div>

    <div class="container mx-auto max-w-7xl relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16 engine-header opacity-0">
        <h2 id="engines-heading" class="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
          Inside The <span class="text-cyan-400 italic">AI Video Agency Studio</span> Platform
        </h2>
        <p class="text-lg text-gray-300 max-w-3xl mx-auto">
          Six powerful creative engines working together. Generate, enhance, produce, localize, automate, and scale — all from one unified command center.
        </p>
      </div>

      <!-- Six Engines Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        ${engines.map((engine, index) => `
          <div 
            class="engine-card relative bg-gradient-to-br ${engine.gradient.replace('from-', 'from-[').replace(' to-', ']/to-[')}/10 border border-white/10 rounded-2xl p-6 cursor-pointer group hover:scale-105 transition-all duration-500 overflow-hidden"
            data-engine="${engine.id}"
            style="transition-delay: ${index * 100}ms;"
          >
            <!-- Animated Gradient Overlay on Hover -->
            <div class="engine-card-glow absolute inset-0 bg-gradient-to-br ${engine.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
            
            <!-- Content -->
            <div class="relative z-10">
              <div class="w-16 h-16 bg-gradient-to-br ${engine.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <span class="text-3xl">${engine.icon}</span>
              </div>
              <h3 class="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-300">${engine.title}</h3>
              <p class="text-gray-400 text-sm mb-4">${engine.description}</p>
              
              <!-- App Tags with stagger animation -->
              <div class="flex flex-wrap gap-2">
                ${engine.apps.map((app, i) => `
                  <span 
                    class="engine-app-tag text-xs px-2 py-1 bg-white/5 rounded-full text-gray-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                    style="transition-delay: ${i * 50}ms;"
                  >
                    ${app}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Corner Accent -->
            <div class="engine-corner absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div class="absolute top-0 right-0 border-t-[40px] border-r-[40px] border-transparent border-t-${engine.color}-400/30"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Animated Stats Bar -->
      <div class="stats-reveal opacity-0 translate-y-8 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-2xl p-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div class="stat-item group">
            <div class="text-3xl md:text-4xl font-black text-cyan-400 mb-2 relative">
              <span class="counter-number" data-target="33">0</span>
              <div class="absolute -inset-2 bg-cyan-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="text-gray-400 text-sm">AI Creative Apps</div>
          </div>
          <div class="stat-item group">
            <div class="text-3xl md:text-4xl font-black text-emerald-400 mb-2 relative">
              <span class="counter-number" data-target="60">0</span><span class="text-emerald-400">+</span>
              <div class="absolute -inset-2 bg-emerald-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="text-gray-400 text-sm">AI Features</div>
          </div>
          <div class="stat-item group">
            <div class="text-3xl md:text-4xl font-black text-cyan-400 mb-2 relative">
              <span class="counter-number" data-target="200">0</span><span class="text-cyan-400">+</span>
              <div class="absolute -inset-2 bg-cyan-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="text-gray-400 text-sm">AI Models</div>
          </div>
          <div class="stat-item group">
            <div class="text-3xl md:text-4xl font-black text-emerald-400 mb-2 relative">
              <span class="text-purple-400">$297</span>
              <div class="absolute -inset-2 bg-emerald-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div class="text-gray-400 text-sm">Lifetime Access</div>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes particle-float {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
        25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
        75% { transform: translateY(-30px) translateX(15px); opacity: 0.5; }
      }
      .animate-particle-float { animation: particle-float 15s ease-in-out infinite; }
      
      .engine-card {
        transition: transform 0.5s ease-out-quart, border-color 0.3s ease, box-shadow 0.3s ease;
      }
      .engine-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }
      .engine-header {
        transition: opacity 0.8s ease-out-quart;
      }
      .engine-header.animate-in { opacity: 1; }
      .stats-reveal {
        transition: opacity 0.8s ease-out-quart, transform 0.8s ease-out-quart;
      }
      .stats-reveal.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .stat-item {
        transition: transform 0.3s ease;
      }
      .stat-item:hover {
        transform: scale(1.05);
      }
      @media (prefers-reduced-motion: reduce) {
        .animate-particle-float, .engine-glow { animation: none; }
        .engine-card:hover { transform: none; }
        .engine-card-glow { transition: none; opacity: 0; }
        .engine-header, .stats-reveal { transition: none; opacity: 1; transform: none; }
        .stat-item:hover { transform: none; }
      }
    </style>
  `;

  // Initialize animations
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    section.querySelectorAll('.engine-card, .engine-header, .stats-reveal').forEach(el => {
      observer.observe(el);
    });

    // Animate counters
    const counters = section.querySelectorAll('.counter-number');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      
      const updateCounter = () => {
        current += step;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };
      
      // Start animation when visible
      const counterObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          updateCounter();
          counterObserver.disconnect();
        }
      }, { threshold: 0.5 });
      
      counterObserver.observe(counter);
    });
  }, 100);

  return section;
}
