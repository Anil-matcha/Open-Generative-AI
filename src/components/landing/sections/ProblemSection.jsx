// Problem Section - AI Video Is Exploding... But Most People Can't Turn It Into A Real Business

export function ProblemSection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-gradient-to-b from-[#020205] to-[#05070b]';
  section.setAttribute('aria-labelledby', 'problem-heading');

  section.innerHTML = `
    <div class="container mx-auto max-w-6xl">
      <div class="text-center mb-16">
        <h2 id="problem-heading" class="problem-headline text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 opacity-0">
          AI Video Is <span class="text-cyan-400 italic">Exploding</span>… But Most People Still Can't Turn It Into A Real Business
        </h2>
        <p class="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
          Everyone's talking about AI video tools, but here's the harsh reality: Most creators and agencies are stuck buying 10+ different tools, learning complex workflows, and still delivering mediocre results that don't impress clients.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 problem-cards">
        <!-- Problem 1 -->
        <div class="problem-card opacity-0 translate-y-4 bg-white/5 border border-red-400/20 rounded-xl p-6 hover:border-red-400/40 hover:bg-red-400/5 transition-all duration-300 group">
          <div class="w-14 h-14 bg-red-400/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <span class="text-3xl">💸</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Subscription Overload</h3>
          <p class="text-gray-400 leading-relaxed">
            $50/month for image generation, $30/month for video tools, $25/month for VFX software... It adds up fast and still leaves gaps in your creative workflow.
          </p>
        </div>

        <!-- Problem 2 -->
        <div class="problem-card opacity-0 translate-y-4 bg-white/5 border border-red-400/20 rounded-xl p-6 hover:border-red-400/40 hover:bg-red-400/5 transition-all duration-300 group" style="transition-delay: 100ms;">
          <div class="w-14 h-14 bg-red-400/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <span class="text-3xl">🔄</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Workflow Chaos</h3>
          <p class="text-gray-400 leading-relaxed">
            Generate in one tool, edit in another, render in a third, export to a fourth. By the time you finish a single video, your client has moved on to someone faster.
          </p>
        </div>

        <!-- Problem 3 -->
        <div class="problem-card opacity-0 translate-y-4 bg-white/5 border border-red-400/20 rounded-xl p-6 hover:border-red-400/40 hover:bg-red-400/5 transition-all duration-300 group" style="transition-delay: 200ms;">
          <div class="w-14 h-14 bg-red-400/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <span class="text-3xl">📉</span>
          </div>
          <h3 class="text-xl font-bold text-white mb-3">Mediocre Results</h3>
          <p class="text-gray-400 leading-relaxed">
            Fragmented tools produce fragmented results. Your videos look amateur, your VFX looks cheap, and your clients notice the difference.
          </p>
        </div>
      </div>

      <div class="text-center mt-16 solution-reveal opacity-0 translate-y-4">
        <div class="inline-block p-8 bg-gradient-to-r from-cyan-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-2xl hover:shadow-lg hover:shadow-cyan-400/10 transition-shadow duration-300">
          <h3 class="text-2xl font-bold text-white mb-4">Here's The Truth:</h3>
          <p class="text-lg text-gray-300 max-w-2xl">
            You don't need 10 different subscriptions and a PhD in video editing. You need one comprehensive platform that handles everything from concept to client delivery.
          </p>
        </div>
      </div>
    </div>

    <style>
      .problem-card, .solution-reveal {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .problem-card.animate-in, .solution-reveal.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .problem-card, .solution-reveal { transition: none; opacity: 1; transform: none; }
        .problem-card:hover, .solution-reveal:hover { transform: none; }
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

    section.querySelectorAll('.problem-card, .solution-reveal, .problem-headline').forEach(el => {
      observer.observe(el);
    });
  }, 100);

  return section;
}
