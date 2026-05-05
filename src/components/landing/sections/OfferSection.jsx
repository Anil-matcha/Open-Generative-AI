// Offer Section - Get The AI Video Agency Studio Today
// Two-tier pricing: $297 Lifetime | $997 Whitelabel Lifetime

export function OfferSection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-gradient-to-b from-[#020205] via-[#05070b] to-[#020205] relative overflow-hidden';
  section.setAttribute('aria-labelledby', 'offer-heading');

  // All features for the interactive comparison
  const featureCategories = {
    'Core Platform': [
      '33 AI Creative Apps Access',
      '60+ AI Features & Tools',
      '200+ AI Models Library',
      'Professional Timeline Editor',
      '4K/8K Export Quality',
      'No Watermarks on Exports',
      'Cloud Storage (50GB)',
      'Priority GPU Rendering'
    ],
    'Generation Tools': [
      'Text-to-Image Generation',
      'Image-to-Image Generation',
      'Text-to-Video Creation',
      'Image-to-Video Transformation',
      'Video-to-Video Editing',
      'AI Prompt Enhancement',
      'Cinematic Prompt Rewriting',
      'Multi-Model Generation',
      'Aspect Ratio Selection',
      'Style Preset Selection'
    ],
    'Cinema & Visual': [
      'Cinematic Camera Presets',
      'Lens Style Controls',
      'Focal Length Controls',
      'Aperture Controls',
      'Shot Type Selection',
      'Lighting Mood Controls',
      'Scene Composition Guidance',
      'Camera Movement Prompts',
      'Film-Style Visual Direction',
      'Director-Style Scene Planning'
    ],
    'Character & Avatar': [
      'Consistent Character Creation',
      'AI Avatar Generation',
      'Talking Avatar Creation',
      'AI Influencer Content',
      'Character Transformation',
      'Fashion-Style Creator Shots',
      'Profile Image Generation',
      'Persona-Based Visual Content',
      'Brand Mascot Creation',
      'Virtual Spokesperson Content'
    ],
    'VFX & Effects': [
      'Explosion Effects',
      'Fire Effects',
      'Lightning Effects',
      'Tornado Effects',
      'Disintegration Effects',
      'Energy Effects',
      'Action Scene Effects',
      'Motion Effects',
      'Style Transfer Effects',
      'Cinematic Transformation Effects'
    ],
    'Editing & Export': [
      'AI Video Editing Assistance',
      'Timeline Editing',
      'Scene Arrangement',
      'Clip Organization',
      'Asset Previewing',
      'Render Management',
      'AI Upscaling',
      'Video Enhancement',
      'Image Enhancement',
      'Output Export Workflow'
    ],
    'Business & Agency': [
      'Product Commercial Generation',
      'Ecommerce Ad Creative',
      'Local Business Promo Creation',
      'Social Media Video Creation',
      'TikTok Content Generation',
      'YouTube Thumbnail Creation',
      'Campaign Storyboard Creation',
      'Client Asset Library',
      'Agency Service Packaging',
      'Client-Ready Content Packages'
    ],
    'Automation & AI': [
      'AI Video Agents',
      'Creative Workflow Automation',
      'AI Assistant Chat',
      'MCP-Ready Controls',
      'CLI Workflow Control',
      'Template-Based Generation',
      'Repeatable Client Workflows',
      'Custom Workflow Builder',
      'API Access',
      'Webhook Integrations'
    ]
  };

  section.innerHTML = `
    <!-- Animated Background Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="pricing-orb pricing-orb-1 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-float-slow"></div>
      <div class="pricing-orb pricing-orb-2 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-float-slow-delayed"></div>
      <div class="pricing-orb pricing-orb-3 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl animate-float-slow"></div>
    </div>

    <div class="container mx-auto max-w-7xl relative z-10">
      <div class="text-center mb-16 offer-headline opacity-0">
        <div class="inline-block bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 rounded-2xl px-6 py-3 mb-8">
          <span class="text-cyan-400 font-bold text-lg">💎 Lifetime Access Pricing</span>
        </div>
        <h2 id="offer-heading" class="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
          Get <span class="text-cyan-400 italic">Lifetime Access</span> Today
        </h2>
        <p class="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Choose the plan that fits your needs. Pay once, own forever. No subscriptions, no hidden fees.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
        <!-- Starter Plan -->
        <div class="starter-card pricing-card opacity-0 translate-y-4">
          <div class="bg-gradient-to-br from-[#171b24] to-[#0a0b0f] border border-white/10 rounded-3xl p-8 hover:border-cyan-400/50 transition-all duration-500 h-full flex flex-col">
            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-white mb-2">Lifetime Access</h3>
              <div class="text-5xl font-black text-cyan-400 mb-2">$297</div>
              <div class="text-gray-400">One-time payment • Forever yours</div>
            </div>

            <div class="flex-1">
              <div class="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Everything Included:</div>
              <ul class="space-y-3 mb-8">
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-cyan-400 text-xs">✓</span>
                  </div>
                  <span class="text-gray-300 text-sm">Full access to all 33 AI Creative Apps</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-cyan-400 text-xs">✓</span>
                  </div>
                  <span class="text-gray-300 text-sm">All 60+ AI Features & Capabilities</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-cyan-400 text-xs">✓</span>
                  </div>
                  <span class="text-gray-300 text-sm">200+ AI Models Library</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-cyan-400 text-xs">✓</span>
                  </div>
                  <span class="text-gray-300 text-sm">Commercial Usage Rights</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-cyan-400 text-xs">✓</span>
                  </div>
                  <span class="text-gray-300 text-sm">Priority Support Access</span>
                </li>
                <li class="flex items-start gap-3">
                  <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-cyan-400 text-xs">✓</span>
                  </div>
                  <span class="text-gray-300 text-sm">Lifetime Updates</span>
                </li>
              </ul>
            </div>

            <button class="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 text-[#020205] font-bold text-lg rounded-xl hover:from-cyan-400 hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-cyan-400/30 hover:shadow-cyan-400/50 transform hover:scale-105">
              Get Lifetime Access — $297
            </button>

            <div class="text-center mt-4">
              <p class="text-xs text-gray-500">30-day money-back guarantee</p>
            </div>
          </div>
        </div>

        <!-- Whitelabel Plan -->
        <div class="whitelabel-card pricing-card opacity-0 translate-y-4 relative" style="transition-delay: 150ms;">
          <!-- Popular Badge -->
          <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
              ⚡ Most Popular
            </div>
          </div>

          <div class="bg-gradient-to-br from-[#1a1625] via-[#0f0f1a] to-[#0a0b0f] border-2 border-purple-400/50 rounded-3xl p-8 hover:border-purple-400 transition-all duration-500 h-full flex flex-col relative overflow-hidden">
            <!-- Animated Background Glow -->
            <div class="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>

            <div class="relative z-10">
              <div class="text-center mb-6">
                <h3 class="text-2xl font-bold text-white mb-2">Whitelabel <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Pro</span></h3>
                <div class="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">$997</div>
                <div class="text-gray-400">One-time payment • Full ownership</div>
              </div>

              <div class="flex-1">
                <div class="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Everything in Lifetime, plus:</div>
                <ul class="space-y-3 mb-8">
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Your Own Branding</strong> — Remove all watermarks & use custom logos</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Resell Rights</strong> — Package & sell AI services to your clients</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Whitelabel Domain</strong> — Deploy on your own domain name</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Priority GPU+</strong> — 10x faster rendering speeds</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Unlimited Clients</strong> — Build unlimited client accounts</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">API Access</strong> — Integrate into your own products</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Custom Workflows</strong> — Build & sell workflow templates</span>
                  </li>
                  <li class="flex items-start gap-3">
                    <div class="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span class="text-white text-xs">✓</span>
                    </div>
                    <span class="text-gray-300 text-sm"><strong class="text-white">Dedicated Support</strong> — 24/7 priority assistance</span>
                  </li>
                </ul>
              </div>

              <button class="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:from-purple-400 hover:to-pink-400 transition-all duration-300 shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50 transform hover:scale-105">
                Get Whitelabel Pro — $997
              </button>

              <div class="text-center mt-4">
                <p class="text-xs text-gray-500">30-day money-back guarantee • Instant delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Interactive Feature Comparison -->
      <div class="feature-comparison max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h3 class="text-2xl md:text-3xl font-bold text-white mb-4">Compare All Features</h3>
          <p class="text-gray-400">Click each category to explore all available features</p>
        </div>

        <!-- Feature Tabs -->
        <div class="flex flex-wrap justify-center gap-3 mb-8" id="feature-tabs">
          ${Object.keys(featureCategories).map((cat, i) => `
            <button 
              class="feature-tab px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${i === 0 ? 'bg-cyan-400 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}"
              data-category="${cat}"
            >
              ${cat}
            </button>
          `).join('')}
        </div>

        <!-- Feature List -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
          <div id="feature-list" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Features will be populated by JS -->
          </div>
        </div>
      </div>

      <!-- Social Proof -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mt-16">
        <div class="social-proof-item opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-300">
          <div class="text-4xl font-black text-cyan-400 mb-2">2,847</div>
          <div class="text-gray-400">Lifetime Members</div>
        </div>
        <div class="social-proof-item opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-emerald-400/30 hover:bg-emerald-400/5 transition-all duration-300" style="transition-delay: 100ms;">
          <div class="text-4xl font-black text-emerald-400 mb-2">$4.2M+</div>
          <div class="text-gray-400">Earned by Members</div>
        </div>
        <div class="social-proof-item opacity-0 translate-y-4 bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/30 hover:bg-purple-400/5 transition-all duration-300" style="transition-delay: 200ms;">
          <div class="text-4xl font-black text-purple-400 mb-2">4.9/5</div>
          <div class="text-gray-400">Average Rating</div>
        </div>
      </div>
    </div>

    <style>
      @keyframes float-slow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(5deg); }
      }
      @keyframes float-slow-delayed {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(20px) rotate(-5deg); }
      }
      .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
      .animate-float-slow-delayed { animation: float-slow-delayed 10s ease-in-out infinite; }
      
      .pricing-card {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .pricing-card.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .social-proof-item {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .social-proof-item.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .social-proof-item:hover {
        transform: translateY(-4px);
      }
      .feature-tab {
        transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
      }
      .feature-tab:hover { transform: translateY(-2px); }
      .feature-item {
        transition: background-color 0.2s ease, transform 0.2s ease;
      }
      .feature-item:hover {
        background-color: rgba(34, 211, 238, 0.1);
        transform: translateX(4px);
      }
      .offer-headline {
        transition: opacity 0.8s ease-out-quart;
      }
      .offer-headline.animate-in { opacity: 1; }
      @media (prefers-reduced-motion: reduce) {
        .animate-float-slow, .animate-float-slow-delayed { animation: none; }
        .pricing-card, .social-proof-item, .offer-headline, .feature-item {
          transition: none;
          opacity: 1;
          transform: none;
        }
        .feature-tab:hover, .social-proof-item:hover { transform: none; }
      }
    </style>
  `;

  // Initialize animations and interactivity
  setTimeout(() => {
    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    section.querySelectorAll('.pricing-card, .social-proof-item, .offer-headline').forEach(el => {
      observer.observe(el);
    });

    // Feature tabs interactivity
    const tabs = section.querySelectorAll('.feature-tab');
    const featureList = section.querySelector('#feature-list');
    let activeCategory = Object.keys(featureCategories)[0];

    function renderFeatures(category) {
      const features = featureCategories[category];
      featureList.innerHTML = features.map(f => `
        <div class="feature-item flex items-center gap-3 p-3 rounded-lg cursor-default">
          <div class="w-5 h-5 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="text-cyan-400 text-xs">✓</span>
          </div>
          <span class="text-gray-300 text-sm">${f}</span>
        </div>
      `).join('');
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('bg-cyan-400', 'text-black');
          t.classList.add('bg-white/5', 'text-gray-300');
        });
        tab.classList.remove('bg-white/5', 'text-gray-300');
        tab.classList.add('bg-cyan-400', 'text-black');
        activeCategory = tab.dataset.category;
        renderFeatures(activeCategory);
      });
    });

    // Initial render
    renderFeatures(activeCategory);
  }, 100);

  return section;
}
