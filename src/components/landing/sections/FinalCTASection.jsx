// Final CTA Section - Start Building Your AI Video Agency Today

export function FinalCTASection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-[#020205]';
  section.setAttribute('aria-labelledby', 'final-cta-heading');

  section.innerHTML = `
    <div class="container mx-auto max-w-4xl text-center final-cta-container opacity-0">
      <div class="bg-gradient-to-br from-cyan-400/10 via-emerald-400/10 to-purple-400/10 border border-cyan-400/30 rounded-3xl p-12 md:p-16 shadow-2xl hover:shadow-cyan-400/20 transition-shadow duration-500">
        <h2 id="final-cta-heading" class="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
          Start Building Your <span class="text-cyan-400 italic">AI Video Agency</span> Today
        </h2>

        <p class="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join the creators and agencies who are already using AI Video Agency Studio to create stunning content, win more clients, and build sustainable businesses.
        </p>

        <!-- Final CTA Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button class="final-cta-primary px-8 md:px-12 py-4 bg-gradient-to-r from-cyan-400 to-cyan-300 text-[#020205] font-bold text-lg rounded-xl hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 shadow-2xl shadow-cyan-400/30 hover:shadow-cyan-300/50 transform hover:scale-105 group">
            <span class="flex items-center justify-center gap-2">
              🚀 Start My AI Video Agency
              <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </span>
          </button>
          <button class="final-cta-secondary px-8 md:px-12 py-4 border-2 border-emerald-400/50 text-emerald-100 font-bold text-lg rounded-xl hover:border-emerald-400 hover:bg-emerald-400/10 transition-all duration-300 group">
            <span class="flex items-center justify-center gap-2">
              🎬 Watch Success Stories
              <svg class="w-5 h-5 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </span>
          </button>
        </div>

        <!-- Guarantee -->
        <div class="inline-block bg-white/5 border border-white/20 rounded-xl px-6 py-4 mb-8 hover:bg-white/10 transition-colors duration-300">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-emerald-400/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
              <span class="text-emerald-400 text-lg">✓</span>
            </div>
            <div class="text-left">
              <div class="text-white font-bold">30-Day Money Back Guarantee</div>
              <div class="text-sm text-gray-400">Full refund if not completely satisfied</div>
            </div>
          </div>
        </div>

        <!-- Footer Links -->
        <div class="border-t border-white/10 pt-8">
          <div class="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <a href="/apps" class="hover:text-cyan-400 hover:underline transition-colors duration-200">Explore All Apps</a>
            <a href="/docs" class="hover:text-cyan-400 hover:underline transition-colors duration-200">Documentation</a>
            <a href="/community" class="hover:text-cyan-400 hover:underline transition-colors duration-200">Community</a>
            <a href="/privacy" class="hover:text-cyan-400 hover:underline transition-colors duration-200">Privacy Policy</a>
            <a href="/terms" class="hover:text-cyan-400 hover:underline transition-colors duration-200">Terms of Service</a>
          </div>
          <div class="text-xs text-gray-500 mt-4">
            © 2026 AI Video Agency Studio. Open source and community-driven.
          </div>
        </div>
      </div>
    </div>

    <style>
      .final-cta-container {
        transition: opacity 0.8s ease-out-quart;
      }
      .final-cta-container.animate-in {
        opacity: 1;
      }
      .final-cta-primary:hover {
        box-shadow: 0 20px 40px rgba(34, 211, 238, 0.4);
      }
      @media (prefers-reduced-motion: reduce) {
        .final-cta-container { transition: none; opacity: 1; }
        .final-cta-primary:hover, .final-cta-secondary:hover { transform: none; }
      }
    </style>
  `;

  // Initialize scroll animation
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    section.querySelectorAll('.final-cta-container').forEach(el => {
      observer.observe(el);
    });
  }, 100);

  return section;
}
