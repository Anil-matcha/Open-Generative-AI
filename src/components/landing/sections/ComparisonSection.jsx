// Comparison Section - Why Keep Buying Scattered AI Tools?

export function ComparisonSection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-[#020205]';
  section.setAttribute('aria-labelledby', 'comparison-heading');

  section.innerHTML = `
    <div class="container mx-auto max-w-6xl">
      <div class="text-center mb-16 comparison-headline opacity-0">
        <h2 id="comparison-heading" class="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6">
          Why Keep Paying For <span class="text-cyan-400 italic">Scattered AI Tools</span> When You Can Build From One Creative Command Center?
        </h2>
        <p class="text-xl text-gray-300 max-w-4xl mx-auto">
          Most creators waste hundreds of dollars monthly on fragmented AI tools that don't work together. Here's what you're really paying for:
        </p>
      </div>

      <!-- Comparison Table -->
      <div class="comparison-card bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 opacity-0 translate-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Other Tools Column -->
          <div class="text-center">
            <h3 class="text-xl font-bold text-red-400 mb-6">Other AI Tools</h3>
            <div class="space-y-4">
              <div class="comparison-item p-4 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">💸</div>
                <div class="text-sm text-gray-300">$30–$100/month per tool</div>
              </div>
              <div class="comparison-item p-4 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">🔄</div>
                <div class="text-sm text-gray-300">Export → Import → Export</div>
              </div>
              <div class="comparison-item p-4 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">📱</div>
                <div class="text-sm text-gray-300">Limited mobile access</div>
              </div>
              <div class="comparison-item p-4 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">🚫</div>
                <div class="text-sm text-gray-300">Content restrictions</div>
              </div>
              <div class="comparison-item p-4 bg-red-400/10 border border-red-400/20 rounded-lg hover:bg-red-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">🕐</div>
                <div class="text-sm text-gray-300">Hours of learning required</div>
              </div>
            </div>
          </div>

          <!-- VS Column -->
          <div class="flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl font-bold text-gray-400 mb-4">VS</div>
              <div class="w-px h-32 bg-gradient-to-b from-transparent via-gray-400 to-transparent mx-auto"></div>
            </div>
          </div>

          <!-- AI Video Agency Studio Column -->
          <div class="text-center">
            <h3 class="text-xl font-bold text-cyan-400 mb-6">AI Video Agency Studio</h3>
            <div class="space-y-4">
              <div class="comparison-item p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">🆓</div>
                <div class="text-sm text-gray-300">Lifetime access, no subscriptions</div>
              </div>
              <div class="comparison-item p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">🔗</div>
                <div class="text-sm text-gray-300">Everything works together</div>
              </div>
              <div class="comparison-item p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">📱</div>
                <div class="text-sm text-gray-300">Full mobile & desktop access</div>
              </div>
              <div class="comparison-item p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">✅</div>
                <div class="text-sm text-gray-300">No content restrictions</div>
              </div>
              <div class="comparison-item p-4 bg-cyan-400/10 border border-cyan-400/20 rounded-lg hover:bg-cyan-400/15 transition-colors duration-200">
                <div class="text-2xl mb-2">⚡</div>
                <div class="text-sm text-gray-300">Ready to use immediately</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-16 comparison-cta opacity-0 translate-y-4">
        <div class="inline-block p-6 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-xl hover:shadow-lg hover:shadow-cyan-400/10 transition-shadow duration-300">
          <h3 class="text-lg font-bold text-white mb-2">The Math Is Simple:</h3>
          <p class="text-gray-300">
            Stop paying $200+/month for fragmented tools. Get everything in one platform for a one-time price.
          </p>
        </div>
      </div>
    </div>

    <style>
      .comparison-card, .comparison-headline, .comparison-cta {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .comparison-card.animate-in, .comparison-headline.animate-in, .comparison-cta.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .comparison-item {
        transition: background-color 0.2s ease, transform 0.2s ease;
      }
      .comparison-item:hover {
        transform: translateY(-2px);
      }
      @media (prefers-reduced-motion: reduce) {
        .comparison-card, .comparison-headline, .comparison-cta {
          transition: none;
          opacity: 1;
          transform: none;
        }
        .comparison-item:hover { transform: none; }
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

    section.querySelectorAll('.comparison-card, .comparison-headline, .comparison-cta').forEach(el => {
      observer.observe(el);
    });
  }, 100);

  return section;
}
