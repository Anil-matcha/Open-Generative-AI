// Interactive Demos Section - Animated mock demos with real interactions

import { ImageGenDemo } from '../demos/ImageGenDemo.jsx';
import { VideoGenDemo } from '../demos/VideoGenDemo.jsx';
import { CharacterDemo } from '../demos/CharacterDemo.jsx';

export function DemosSection() {
  const section = document.createElement('section');
  section.className = 'py-20 px-4 bg-gradient-to-b from-[#020205] via-[#05070b] to-[#020205] relative overflow-hidden';
  section.setAttribute('aria-labelledby', 'demos-heading');

  // Demo stats for animation
  const demoStats = [
    { label: 'Images Generated', value: '12.4M+', icon: '🖼️' },
    { label: 'Videos Created', value: '3.2M+', icon: '🎬' },
    { label: 'Characters Built', value: '890K+', icon: '👤' },
    { label: 'Hours Saved', value: '2.1M+', icon: '⚡' }
  ];

  section.innerHTML = `
    <!-- Animated Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="demo-orb demo-orb-1 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl animate-drift"></div>
      <div class="demo-orb demo-orb-2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl animate-drift-reverse"></div>
      <div class="demo-orb demo-orb-3 w-56 h-56 bg-pink-400/5 rounded-full blur-3xl animate-drift"></div>
    </div>

    <div class="container mx-auto max-w-7xl relative z-10">
      <!-- Section Header -->
      <div class="text-center mb-16 demos-header opacity-0">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 border border-cyan-400/30 rounded-full mb-6">
          <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          <span class="text-cyan-400 font-medium text-sm">Live Interactive Demo</span>
        </div>
        <h2 id="demos-heading" class="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
          <span class="text-cyan-400 italic">Try It Now</span> — Experience The Power
        </h2>
        <p class="text-lg text-gray-300 max-w-3xl mx-auto">
          Generate stunning images, create cinematic videos, and build consistent characters — all in real-time. No sign-up required.
        </p>
      </div>

      <!-- Animated Stats Bar -->
      <div class="demo-stats-bar grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto">
        ${demoStats.map((stat, i) => `
          <div class="demo-stat opacity-0 translate-y-4 text-center p-4 bg-white/5 border border-white/10 rounded-xl hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all duration-300" style="transition-delay: ${i * 100}ms;">
            <div class="text-2xl mb-1">${stat.icon}</div>
            <div class="text-xl md:text-2xl font-black text-cyan-400 counter" data-target="${stat.value}">${stat.value}</div>
            <div class="text-xs text-gray-400">${stat.label}</div>
          </div>
        `).join('')}
      </div>

      <!-- Demos Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <!-- Image Generation Demo -->
        <div class="demo-card-wrapper opacity-0 translate-y-8">
          <div class="demo-card relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl overflow-hidden group hover:border-cyan-400/50 transition-all duration-500">
            <!-- Animated Border Glow -->
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div class="relative z-10 p-6">
              <div class="text-center mb-4">
                <div class="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-400/30">
                  <span class="text-3xl">🎨</span>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">AI Image Generation</h3>
                <p class="text-gray-400 text-sm">Create stunning visuals from text</p>
              </div>
              
              <!-- Demo Container -->
              <div class="image-demo-placeholder"></div>
              
              <!-- Hover CTA -->
              <div class="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span class="text-xs text-cyan-400">↑ Type a prompt above to try</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Video Generation Demo -->
        <div class="demo-card-wrapper opacity-0 translate-y-8" style="transition-delay: 150ms;">
          <div class="demo-card relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl overflow-hidden group hover:border-purple-400/50 transition-all duration-500">
            <div class="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div class="relative z-10 p-6">
              <div class="text-center mb-4">
                <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-400/30">
                  <span class="text-3xl">🎬</span>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">AI Video Creation</h3>
                <p class="text-gray-400 text-sm">Generate cinematic videos</p>
              </div>
              
              <div class="video-demo-placeholder"></div>
              
              <div class="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span class="text-xs text-purple-400">↑ Describe your video to try</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Character Creation Demo -->
        <div class="demo-card-wrapper opacity-0 translate-y-8" style="transition-delay: 300ms;">
          <div class="demo-card relative bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl overflow-hidden group hover:border-green-400/50 transition-all duration-500">
            <div class="absolute inset-0 bg-gradient-to-br from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div class="relative z-10 p-6">
              <div class="text-center mb-4">
                <div class="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-400/30">
                  <span class="text-3xl">👤</span>
                </div>
                <h3 class="text-xl font-bold text-white mb-1">AI Character Studio</h3>
                <p class="text-gray-400 text-sm">Create consistent characters</p>
              </div>
              
              <div class="character-demo-placeholder"></div>
              
              <div class="mt-4 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span class="text-xs text-green-400">↑ Describe your character to try</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center demos-cta opacity-0 translate-y-4">
        <div class="inline-block p-8 bg-gradient-to-r from-cyan-400/10 via-purple-400/10 to-emerald-400/10 border border-cyan-400/30 rounded-2xl hover:shadow-xl hover:shadow-cyan-400/10 transition-all duration-500">
          <h3 class="text-xl font-bold text-white mb-3">Ready to Create Like a Pro?</h3>
          <p class="text-gray-300 mb-6">Join thousands of creators using AI Video Agency Studio</p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button class="px-8 py-4 bg-gradient-to-r from-cyan-400 to-cyan-300 text-[#020205] font-bold text-lg rounded-lg hover:from-cyan-300 hover:to-cyan-200 transition-all duration-300 shadow-2xl shadow-cyan-400/30 hover:shadow-cyan-300/50 transform hover:scale-105">
              🚀 Get Started →
            </button>
            <button class="px-8 py-4 border-2 border-purple-400/50 text-purple-100 font-bold text-lg rounded-lg hover:border-purple-400 hover:bg-purple-400/10 transition-all duration-300">
              🎬 Watch Demo Video
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes drift {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -20px) scale(1.05); }
        66% { transform: translate(-20px, 20px) scale(0.95); }
      }
      @keyframes drift-reverse {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(-30px, 20px) scale(0.95); }
        66% { transform: translate(20px, -30px) scale(1.05); }
      }
      .animate-drift { animation: drift 15s ease-in-out infinite; }
      .animate-drift-reverse { animation: drift-reverse 18s ease-in-out infinite; }
      
      .demo-card-wrapper {
        transition: opacity 0.8s ease-out-quart, transform 0.8s ease-out-quart;
      }
      .demo-card-wrapper.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .demo-stat {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart, border-color 0.3s ease, background-color 0.3s ease;
      }
      .demo-stat.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      .demo-stat:hover {
        transform: translateY(-4px);
      }
      .demos-header {
        transition: opacity 0.8s ease-out-quart;
      }
      .demos-header.animate-in { opacity: 1; }
      .demos-cta {
        transition: opacity 0.6s ease-out-quart, transform 0.6s ease-out-quart;
      }
      .demos-cta.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .animate-drift, .animate-drift-reverse { animation: none; }
        .demo-card-wrapper, .demo-stat, .demos-header, .demos-cta {
          transition: none;
          opacity: 1;
          transform: none;
        }
        .demo-stat:hover, .demo-card:hover { transform: none; }
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

    section.querySelectorAll('.demo-card-wrapper, .demo-stat, .demos-header, .demos-cta').forEach(el => {
      observer.observe(el);
    });

    // Insert demo components
    const imagePlaceholder = section.querySelector('.image-demo-placeholder');
    const videoPlaceholder = section.querySelector('.video-demo-placeholder');
    const characterPlaceholder = section.querySelector('.character-demo-placeholder');

    if (imagePlaceholder) {
      imagePlaceholder.appendChild(ImageGenDemo());
    }
    if (videoPlaceholder) {
      videoPlaceholder.appendChild(VideoGenDemo());
    }
    if (characterPlaceholder) {
      characterPlaceholder.appendChild(CharacterDemo());
    }
  }, 100);

  return section;
}
