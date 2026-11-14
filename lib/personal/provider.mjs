import { buildProviderPayload, getProvider, normalizeOutput } from './catalog.mjs';
import { validateAsset } from './validation.mjs';
import { diagnoseProviderFailure } from './providerDiagnostics.mjs';

function abortable(promise, signal) {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

/** VideoProvider: getCapabilities, submitGeneration, getGenerationStatus,
 * getGenerationResult, cancel. Jobs and streams live in the browser, not in a
 * Vercel function or process-global server map. No tokens or paid fallback. */
export function createVideoProvider(id, { loadClient = () => import('@gradio/client') } = {}) {
  const capabilities = getProvider(id);
  return {
    getCapabilities: () => capabilities,
    async submitGeneration(input, { signal } = {}) {
      await validateAsset(input.image, 'image');
      let phase = 'client';
      let cspBlocked = false;
      const cspListener = event => {
        if (event.effectiveDirective === 'connect-src' && [capabilities.host, 'https://huggingface.co'].some(host => String(event.blockedURI).startsWith(host))) cspBlocked = true;
      };
      const release = () => { if (typeof window !== 'undefined') window.removeEventListener('securitypolicyviolation', cspListener); };
      if (typeof window !== 'undefined') window.addEventListener('securitypolicyviolation', cspListener);
      let app;
      try {
        const { Client } = await loadClient();
        signal?.throwIfAborted();
        phase = 'connect';
        const connecting = Client.connect(capabilities.space, { events: ['status', 'data'] });
        connecting.then(app => { if (signal?.aborted) app.close(); }).catch(() => {});
        app = await abortable(connecting, signal);
        if (signal?.aborted) { app.close(); signal.throwIfAborted(); }
        phase = 'schema';
        // Named parameters are verified against the Space's current API schema.
        const api = await abortable(app.view_api(), signal);
        signal?.throwIfAborted();
        const endpoint = api.named_endpoints[capabilities.endpoint];
        const payload = buildProviderPayload(id, input, input.image);
        if (!endpoint || Object.keys(payload).some(key => !endpoint.parameters.some(item => item.parameter_name === key))) {
          throw new Error('Space API şeması değişti; resmi üreticiyi kullanın.');
        }
        phase = 'submit';
        const stream = app.submit(capabilities.endpoint, payload);
        const handle = { id: crypto.randomUUID(), stream, app, result: null, signal, release, cspBlocked: () => cspBlocked };
        handle.abort = () => { stream.cancel().catch(() => {}); app.close(); release(); };
        signal?.addEventListener('abort', handle.abort, { once: true });
        return handle;
      } catch (error) {
        release(); app?.close();
        if (signal?.aborted) throw signal.reason;
        throw diagnoseProviderFailure(error, id, phase, cspBlocked);
      }
    },
    async *getGenerationStatus(handle) {
      try {
        const iterator = handle.stream[Symbol.asyncIterator]();
        while (true) {
          const { value: event, done } = await abortable(iterator.next(), handle.signal);
          if (done) break;
          handle.signal?.throwIfAborted();
          if (event.type === 'data') {
            handle.result = normalizeOutput(id, event.data);
            yield { status: 'completed', result: handle.result };
            return;
          }
          if (event.type === 'status') {
            if (event.stage === 'error') throw new Error(event.message || 'Provider error');
            // No invented percentages: expose only information Gradio reports.
            const progress = event.progress_data?.find(item => Number.isFinite(item.progress));
            yield {
              status: event.stage === 'generating' || event.stage === 'streaming' || progress ? 'generating' : 'queued',
              position: Number.isFinite(event.position) ? event.position : null,
              progress: progress ? Math.round(progress.progress * 100) : null,
            };
          }
        }
        throw new Error('Space connection ended before completion');
      } catch (error) {
        if (handle.signal?.aborted) throw handle.signal.reason;
        throw diagnoseProviderFailure(error, id, 'events', handle.cspBlocked?.());
      } finally {
        handle.signal?.removeEventListener('abort', handle.abort);
        handle.app.close();
        handle.release?.();
      }
    },
    getGenerationResult(handle) {
      if (!handle.result) throw new Error('Video henüz hazır değil.');
      return handle.result;
    },
    cancel(handle) { handle.abort(); },
  };
}
