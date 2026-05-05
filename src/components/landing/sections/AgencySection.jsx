// Agency Section - This Is Not Just A Tool — It's An AI Video Agency Business In A Box

export function AgencySection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-[#020205]';
  section.setAttribute('aria-labelledby', 'agency-heading');

  section.innerHTML = `
    <div class="container mx-auto max-w-6xl">
      <div class="text-center mb-16 agency-headline opacity-0">
        <h2 id="agency-heading" class="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
          This Is Not Just A Tool — It's An <span class="text-cyan-400 italic">AI Video Agency Business In A Box</span>
        </h2>
        <p class="text-xl text-gray-300 max-w-4xl mx-auto">
          While others give you a single AI feature, AI Video Agency Studio gives you everything you need to start, run, and scale a complete AI video production agency.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Left Column - Business Benefits -->
        <div class="space-y-8 agency-cards">
          <div class="agency-card opacity-0 translate-y-4 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-xl p-6 hover:shadow-lg hover:shadow-cyan-400/10 transition-all duration-300 group">
            <h3 class="text-xl font-bold text-white mb-3 flex items-center gap-3">
              <span class="text-2xl group-hover:scale-110 transition-transform duration-300">🏢</span>
              Turn Your Skills Into A Business
            </h3>
            <p class="text-gray-300">
              Stop freelancing with expensive tools. Build a sustainable agency business with one comprehensive platform that handles everything from client intake to final delivery.
            </p>
          </div>

          <div class="agency-card opacity-0 translate-y-4 bg-gradient-to-r from-emerald-400/10 to-purple-400/10 border border-emerald-400/30 rounded-xl p-6 hover:shadow-lg hover:shadow-emerald-400/10 transition-all duration-300 group" style="transition-delay: 100ms;">
            <h3 class="text-xl font-bold text-white mb-3 flex items-center gap-3">
              <span class="text-2xl group-hover:scale-110 transition-transform duration-300">⚡</span>
              10x Your Production Speed
            </h3>
            <p class="text-gray-300">
              What used to take days of editing now takes minutes. Generate concepts, create assets, edit professionally, and deliver client-ready packages in record time.
            </p>
          </div>

          <div class="agency-card opacity-0 translate-y-4 bg-gradient-to-r from-purple-400/10 to-pink-400/10 border border-purple-400/30 rounded-xl p-6 hover:shadow-lg hover:shadow-purple-400/10 transition-all duration-300 group" style="transition-delay: 200ms;">
            <h3 class="text-xl font-bold text-white mb-3 flex items-center gap-3">
              <span class="text-2xl group-hover:scale-110 transition-transform duration-300">🎯</span>
              Premium Client Results
            </h3>
            <p class="text-gray-300">
              Deliver Hollywood-quality videos, stunning VFX, and professional commercials that make your clients look amazing and keep them coming back for more.
            </p>
          </div>

          <div class="agency-card opacity-0 translate-y-4 bg-gradient-to-r from-pink-400/10 to-yellow-400/10 border border-pink-400/30 rounded-xl p-6 hover:shadow-lg hover:shadow-pink-400/10 transition-all duration-300 group" style="transition-delay: 300ms;">
            <h3 class="text-xl font-bold text-white mb-3 flex items-center gap-3">
              <span class="text-2xl group-hover:scale-110 transition-transform duration-300">📈</span>
              Scale Without Limits
            </h3>
            <p class="text-gray-300">
              Handle multiple clients simultaneously, automate repetitive tasks, and grow your agency without being bottlenecked by expensive software subscriptions.
            </p>
          </div>
        </div>

        <!-- Right Column - Mock Dashboard -->
        <div class="agency-dashboard opacity-0 translate-y-4 bg-gradient-to-br from-[#171b24] to-[#0a0b0f] border border-white/10 rounded-2xl p-8 shadow-2xl hover:shadow-cyan-400/10 transition-shadow duration-300">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer">
              <span class="text-lg font-bold">A</span>
            </div>
            <div>
              <h4 class="text-lg font-bold text-white">Agency Dashboard</h4>
              <p class="text-sm text-gray-400">Client projects & revenue tracking</p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="dashboard-card bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-white">Tech Startup Commercial</span>
                <span class="text-xs text-cyan-400 bg-cyan-400/20 px-2 py-1 rounded">In Progress</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-2 mb-2">
                <div class="bg-cyan-400 h-2 rounded-full transition-all duration-500" style="width: 75%"></div>
              </div>
              <div class="text-xs text-gray-400">Due: Tomorrow</div>
            </div>

            <div class="dashboard-card bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-white">E-commerce Product Videos</span>
                <span class="text-xs text-emerald-400 bg-emerald-400/20 px-2 py-1 rounded">Completed</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-2 mb-2">
                <div class="bg-emerald-400 h-2 rounded-full" style="width: 100%"></div>
              </div>
              <div class="text-xs text-gray-400">Revenue: $2,400</div>
            </div>

            <div class="dashboard-card bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer">
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-white">Social Media Campaign</span>
                <span class="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">Planning</span>
              </div>
              <div class="w-full bg-white/10 rounded-full h-2 mb-2">
                <div class="bg-yellow-400 h-2 rounded-full" style="width: 25%"></div>
              </div>
              <div class="text-xs text-gray-400">Client: Fashion Brand</div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-white/10">
            <div class="grid grid-cols-3 gap-4 text-center">
              <div class="stat-item hover:scale-105 transition-transform duration-200 cursor-default">
                <div class="text-2xl font-bold text-cyan-400">12</div>
                <div class="text-xs text-gray-400">Active Projects</div>
              </div>
              <div class="stat-item hover:scale-105 transition-transform duration-200 cursor-default">
                <div class="text-2xl font-bold text-emerald-400">$24K</div>
                <div class="text-xs text-gray-400">Monthly Revenue</div>
              </div>
              <div class="stat-item hover:scale-105 transition-transform duration-200 cursor-default">
                <div class="text-2xl font-bold text-purple-400">95%</div>
                <div class="text-xs text-gray-400">Client Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .agency-card, .agency-dashboard, .agency-headline {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .agency-card.animate-in, .agency-dashboard.animate-in, .agency-headline.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .agency-card:hover {
        transform: translateY(-2px);
      }
      @media (prefers-reduced-motion: reduce) {
        .agency-card, .agency-dashboard, .agency-headline {
          transition: none;
          opacity: 1;
          transform: none;
        }
        .agency-card:hover, .stat-item:hover { transform: none; }
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

    section.querySelectorAll('.agency-card, .agency-dashboard, .agency-headline').forEach(el => {
      observer.observe(el);
    });
  }, 100);

  return section;
}
