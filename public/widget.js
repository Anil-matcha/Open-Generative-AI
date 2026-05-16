(function() {
  'use strict';

  const defaultConfig = {
    personalizerUrl: window.location.origin,
    appId: 'ai-video-agency',
    mode: 'cold-email',
    userId: null,
    projectId: null
  };

  const ERROR_MESSAGES = {
    'Unauthorized': 'Please sign in to continue.',
    'Rate limit exceeded': 'Too many requests. Please wait a minute and try again.',
    'default': 'An error occurred. Please try again.'
  };

  function getErrorMessage(error) {
    const msg = (error && error.message ? error.message : error) || '';
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (msg.includes(key)) return message;
    }
    return ERROR_MESSAGES['default'];
  }

  class HiggsfieldPersonalizer {
    constructor() {
      this.config = { ...defaultConfig };
      this.iframe = null;
      this.callbacks = {};
      this.messageHandler = null;
    }

    init(config = {}) {
      this.config = { ...this.config, ...config };
      return this;
    }

    open(config = {}) {
      const finalConfig = { ...this.config, ...config };
      const params = new URLSearchParams({
        app: finalConfig.appId,
        mode: finalConfig.mode,
        ...(finalConfig.userId && { userId: finalConfig.userId }),
        ...(finalConfig.projectId && { projectId: finalConfig.projectId })
      });

      const url = `${finalConfig.personalizerUrl}/personalizer?${params.toString()}`;

      const overlay = document.createElement('div');
      overlay.id = 'hf-personalizer-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;';

      const container = document.createElement('div');
      container.style.cssText = 'width:100%;height:100%;max-width:100%;max-height:100%;position:relative;';

      this.iframe = document.createElement('iframe');
      this.iframe.src = url;
      this.iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:0;background:transparent;';
      this.iframe.setAttribute('allow', 'clipboard-write');

      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'position:absolute;top:12px;right:12px;z-index:10000;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:white;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      closeBtn.onclick = () => this.close();

      container.appendChild(this.iframe);
      container.appendChild(closeBtn);
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      this.messageHandler = (event) => {
        if (event.data && event.data.type === 'hf-personalizer-close') this.close();
        if (event.data && event.data.type === 'hf-personalizer-complete') {
          if (this.callbacks.onComplete) this.callbacks.onComplete(event.data.output);
        }
      };
      window.addEventListener('message', this.messageHandler);

      return this;
    }

    close() {
      const overlay = document.getElementById('hf-personalizer-overlay');
      if (overlay) overlay.remove();
      if (this.messageHandler) window.removeEventListener('message', this.messageHandler);
      this.iframe = null;
      if (this.callbacks.onClose) this.callbacks.onClose();
      return this;
    }

    onComplete(callback) { this.callbacks.onComplete = callback; return this; }
    onClose(callback) { this.callbacks.onClose = callback; return this; }
  }

  window.HiggsfieldPersonalizer = HiggsfieldPersonalizer;

  if (!window.hfPersonalizerAutoInit) {
    const script = document.currentScript;
    if (script && script.getAttribute('data-auto-init') === 'true') {
      const personalizer = new HiggsfieldPersonalizer();
      const appId = script.getAttribute('data-app-id') || 'ai-video-agency';
      const mode = script.getAttribute('data-mode') || 'cold-email';
      personalizer.init({ appId, mode });
      window.hfPersonalizer = personalizer;
    }
  }
})();
