// Sign In Page - Landing Page Style
// Full-page sign-in with matching aesthetic

export function SignInPage() {
  const container = document.createElement('div');
  container.className = 'signin-page min-h-screen bg-[#020205] flex flex-col';
  container.setAttribute('lang', document.documentElement.lang || 'en');

  container.innerHTML = `
    <!-- Header -->
    <header class="sticky top-0 z-50 w-full h-16 backdrop-blur-md bg-[#0a0b0f] border-b border-white/10">
      <nav class="grid grid-cols-[1fr_auto_1fr] md:grid-cols-[auto_1fr_auto] pr-4 h-full items-center relative container">
        <a href="/" class="shrink-0 flex items-center gap-2 transition hover:text-[#22d3ee] active:opacity-60">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center border border-cyan-400/30 bg-cyan-400/10" style="box-shadow: 0 0 16px rgba(56,189,248,0.12);">
            <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
              <rect width="80" height="80" rx="16" fill="#22d3ee"/>
              <path d="M64.2786 39.6003L64.2323 39.0943C63.7939 34.2383 60.6336 25.102 51.8677 25.102C45.3627 25.102 40.4487 31.5229 36.112 37.1838C32.6515 41.7173 29.6533 45.6063 26.3542 45.6063C25.4773 45.5146 24.3472 45.0772 23.6555 44.0877C23.0326 43.1898 22.8712 42.0393 23.1939 40.6585C23.7011 38.4722 26.6081 36.447 29.6758 34.2838C31.3594 33.1333 33.09 31.9135 34.2895 30.7399C37.75 27.4031 39.5031 24.9866 39.5031 21.0976C39.5031 17.2087 37.3579 15.2751 35.5585 14.4465C31.9598 12.79 26.6775 13.7564 23.3096 16.6565C22.8024 17.117 22.2946 17.5537 21.833 17.968C18.442 20.9828 16.1586 23.0312 10.9219 21.4657V27.7712C17.8653 30.8322 23.7018 24.9866 25.9164 22.2943C27.6232 20.5223 29.4225 19.4866 30.7609 19.4866H30.8304C31.4302 19.5097 31.9374 19.7399 32.307 20.1542C32.9068 20.8449 33.1376 21.6504 33.0219 22.5476C32.7679 24.4351 30.8072 26.6437 27.2085 29.0602C22.9869 31.891 15.9284 36.6317 15.3743 42.5921C14.959 46.8729 17.1736 51.1531 20.6341 52.8096C28.7077 56.63 33.6216 50.0481 38.8345 43.0981C42.8253 37.736 46.6085 32.6504 51.8684 32.6504C56.5972 32.6504 58.3502 36.5624 58.3502 39.0251V39.5086L57.8887 39.6003C46.424 41.6256 40.1723 52.3498 40.1723 57.2976C40.1723 62.2454 44.3708 66.48 49.538 66.48C55.5821 66.48 63.0559 61.3251 64.2555 46.8267L64.3017 46.2977H69.0769V39.601H64.2786V39.6003ZM58.0269 47.0332C57.1044 55.709 52.652 59.7596 49.9533 59.7596C48.7306 59.7596 47.0238 58.7469 47.0238 56.8602C47.0238 54.7432 50.1841 48.3223 57.2889 46.4125L58.1194 46.2053L58.0269 47.0339V47.0332Z" fill="#020205"/>
            </svg>
          </div>
          <span class="hidden md:block text-lg font-bold text-white">Timeline Editor</span>
        </a>
        
        <div class="hidden md:flex items-center gap-6">
          <a href="/explore" class="py-1 px-3 text-[#e4e4e7] font-medium transition hover:text-[#22d3ee] text-sm">Explore</a>
          <a href="/image" class="py-1 px-3 text-[#e4e4e7] font-medium transition hover:text-[#22d3ee] text-sm">Image</a>
          <a href="/video" class="py-1 px-3 text-[#e4e4e7] font-medium transition hover:text-[#22d3ee] text-sm">Video</a>
          <a href="/timeline" class="py-1 px-3 text-[#e4e4e7] font-medium transition hover:text-[#22d3ee] text-sm">Timeline</a>
        </div>
        
        <div class="shrink-0 flex items-center gap-3">
          <a href="/" class="px-4 py-2 text-sm text-[#e4e4e7] hover:text-[#22d3ee] transition font-medium">Sign Up</a>
          <a href="/" class="px-4 py-2 text-sm bg-cyan-400 text-[#020205] hover:bg-cyan-300 transition font-medium" style="letter-spacing: 0.05em; text-transform: uppercase;">Home</a>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md mx-auto">
        <!-- Sign In Card -->
        <div class="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-10">
          <div class="text-center mb-8">
            <h1 class="text-3xl md:text-4xl font-bold text-white mb-3">Welcome Back</h1>
            <p class="text-slate-400">Sign in to continue your creative journey</p>
          </div>

          <form id="signin-form" class="space-y-6">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div class="relative">
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autocomplete="email"
                  class="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                  placeholder="you@example.com"
                  value=""
                />
                <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div class="relative">
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autocomplete="current-password"
                  class="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                  placeholder="Enter your password"
                  value=""
                />
                <svg class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input type="checkbox" name="remember" class="w-4 h-4 rounded border-white/20 bg-slate-800 text-cyan-400 focus:ring-cyan-400/20" />
                <span class="ml-2 text-sm text-slate-300">Remember me</span>
              </label>
              <button type="button" class="text-sm text-cyan-400 hover:text-cyan-300 transition">
                Forgot password?
              </button>
            </div>

            <!-- Error Message -->
            <div id="error-message" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 p-3 text-sm"></div>

            <!-- Submit Button -->
            <button
              type="submit"
              id="signin-btn"
              class="w-full px-6 py-3 bg-gradient-to-r from-cyan-400 to-cyan-300 text-[#020205] font-bold rounded-lg hover:from-cyan-300 hover:to-cyan-200 transition-all duration-200 shadow-lg shadow-cyan-400/25 hover:shadow-cyan-300/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign In
            </button>
          </form>

          <!-- Sign Up Link -->
          <div class="mt-8 text-center">
            <p class="text-slate-300">
              Don't have an account?
              <a href="/signup" class="ml-1 text-cyan-400 hover:text-cyan-300 font-medium transition">
                Start free trial
              </a>
            </p>
          </div>
        </div>

        <!-- Trust indicators -->
        <div class="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span>✓ No credit card required</span>
          <span>✓ 7-day free trial</span>
          <span>✓ Cancel anytime</span>
        </div>
      </div>
    </main>

    <script>
      (function() {
        const form = document.getElementById('signin-form');
        const btn = document.getElementById('signin-btn');
        const errorMsg = document.getElementById('error-message');

        async function handleSubmit(e) {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;

          btn.disabled = true;
          btn.textContent = 'Signing In...';
          errorMsg.classList.add('hidden');

          try {
            const response = await fetch('/api/auth/signin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.session) {
              window.location.href = '/';
            } else {
              errorMsg.textContent = data.error || 'Sign in failed';
              errorMsg.classList.remove('hidden');
            }
          } catch (err) {
            errorMsg.textContent = 'Network error. Please try again.';
            errorMsg.classList.remove('hidden');
          } finally {
            btn.disabled = false;
            btn.textContent = 'Sign In';
          }
        }

        form.addEventListener('submit', handleSubmit);
      })();
    </script>
  `;

  return container;
}