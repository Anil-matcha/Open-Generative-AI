/**
 * Base Component Class
 * Provides consistent component architecture with event handling and lifecycle methods
 */
export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.element = null;
    this.eventListeners = [];
    this.subscriptions = [];
  }

  /**
   * Set component state and trigger re-render
   * @param {Object} newState - New state object to merge
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    if (this.onUpdate) {
      this.onUpdate();
    }
    this.update();
  }

  /**
   * Subscribe to store changes
   * @param {Object} store - Store instance to subscribe to
   * @param {Function} callback - Callback function for state changes
   */
  subscribeToStore(store, callback) {
    this.subscriptions.push(store.subscribe(callback));
  }

  /**
   * Add event listener to element
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler function
   */
  addEventListener(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
      element.addEventListener(event, handler);
      this.eventListeners.push({ element, event, handler });
    }
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler);
      }
    });
    this.eventListeners = [];
  }

  /**
   * Unsubscribe from all stores
   */
  unsubscribeFromStores() {
    this.subscriptions.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  /**
   * Create element from HTML string
   * @param {string} html - HTML string to create element from
   * @returns {HTMLElement} Created element
   */
  createElementFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstElementChild;
  }

  /**
   * Render component (to be implemented by subclasses)
   * @returns {HTMLElement} Rendered element
   */
  render() {
    throw new Error('Component must implement render() method');
  }

  /**
   * Update component (to be implemented by subclasses)
   */
  update() {
    // Default implementation - subclasses can override
  }

  /**
   * Mount component to DOM
   * @param {HTMLElement} container - Container element to mount to
   */
  mount(container) {
    if (this.onMount) {
      this.onMount();
    }
    this.element = this.render();
    if (container && this.element) {
      container.appendChild(this.element);
    }
    return this.element;
  }

  /**
   * Unmount component from DOM
   */
  unmount() {
    this.removeEventListeners();
    this.unsubscribeFromStores();
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.onUnmount) {
      this.onUnmount();
    }
  }

  /**
   * Destroy component completely
   */
  destroy() {
    this.unmount();
    this.element = null;
    this.props = null;
    this.state = null;
  }
}