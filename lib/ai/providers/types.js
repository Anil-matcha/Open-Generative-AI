/**
 * Provider-neutral result contracts for Open Generative AI.
 *
 * Providers may implement only the capabilities they support. The router uses
 * `supports()` before dispatching work so unsupported tasks fail early with a
 * useful message instead of leaking provider-specific errors into the UI.
 */

/** @typedef {'text'|'image'|'video'|'audio'} AITask */

/**
 * @typedef {Object} AIRequest
 * @property {AITask} task
 * @property {string} prompt
 * @property {string=} model
 * @property {Object=} input
 * @property {Object=} options
 */

/**
 * @typedef {Object} AIResult
 * @property {string} provider
 * @property {string} model
 * @property {AITask} task
 * @property {string=} text
 * @property {string=} url
 * @property {Object=} data
 */

/**
 * Minimal provider interface.
 *
 * Each provider module should export an object implementing:
 *   id, label, supports(request), generate(request), health()
 *
 * @typedef {Object} AIProvider
 * @property {string} id
 * @property {string} label
 * @property {(request: AIRequest) => boolean} supports
 * @property {(request: AIRequest) => Promise<AIResult>} generate
 * @property {() => Promise<{ok:boolean,message?:string}>} health
 */

export function assertTask(task) {
  const allowed = new Set(['text', 'image', 'video', 'audio']);
  if (!allowed.has(task)) {
    throw new Error(`Unsupported AI task: ${task}`);
  }
}
