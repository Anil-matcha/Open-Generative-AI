// JSX to DOM Conversion Utilities
// Provides createElementFromHTML and JSX-like functionality for vanilla JS

// Main JSX conversion function
export function jsx(tag, props, ...children) {
  return { tag, props: props || {}, children: children.flat() };
}

// Fragment support
export const Fragment = 'fragment';

// Convert JSX element to DOM element
export function createElementFromJSX(jsxElement, componentInstance = null) {
  if (!jsxElement || typeof jsxElement !== 'object') {
    return document.createTextNode(String(jsxElement || ''));
  }

  const { tag, props, children } = jsxElement;

  // Handle fragments
  if (tag === Fragment) {
    const fragment = document.createDocumentFragment();
    children.forEach(child => {
      fragment.appendChild(createElementFromJSX(child, componentInstance));
    });
    return fragment;
  }

  // Create element
  const element = document.createElement(tag);

  // Set properties
  if (props) {
    Object.entries(props).forEach(([key, value]) => {
      setJSXProperty(element, key, value, componentInstance);
    });
  }

  // Add children
  if (children && children.length > 0) {
    children.forEach(child => {
      if (child == null || child === false) return;

      const childElement = createElementFromJSX(child, componentInstance);
      element.appendChild(childElement);
    });
  }

  return element;
}

// Set property on DOM element (handles special JSX cases)
function setJSXProperty(element, key, value, componentInstance) {
  if (key === 'className') {
    element.className = value;
  } else if (key === 'htmlFor') {
    element.htmlFor = value;
  } else if (key === 'style' && typeof value === 'object') {
    Object.assign(element.style, value);
  } else if (key.startsWith('on') && typeof value === 'function') {
    // Event handler
    const eventName = key.toLowerCase().substring(2);
    if (componentInstance) {
      componentInstance.addEventListener(element, eventName, value);
    } else {
      element.addEventListener(eventName, value);
    }
  } else if (key === 'ref' && typeof value === 'function') {
    value(element);
  } else if (key === 'key') {
    // Store key for reconciliation (if needed)
    element._key = value;
  } else if (key === 'dangerouslySetInnerHTML') {
    element.innerHTML = value.__html;
  } else if (typeof value === 'boolean') {
    if (value) {
      element.setAttribute(key, '');
    } else {
      element.removeAttribute(key);
    }
  } else {
    element.setAttribute(key, String(value));
  }
}

// Convert HTML string to DOM element
export function createElementFromHTML(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    return document.createTextNode('');
  }

  // Trim whitespace
  htmlString = htmlString.trim();

  // Handle empty strings
  if (!htmlString) {
    return document.createTextNode('');
  }

  // Create template element for parsing
  const template = document.createElement('template');
  template.innerHTML = htmlString;

  // Handle single element
  if (template.content.children.length === 1) {
    return template.content.firstElementChild;
  }

  // Handle multiple elements (return document fragment)
  const fragment = document.createDocumentFragment();
  Array.from(template.content.children).forEach(child => {
    fragment.appendChild(child);
  });

  return fragment;
}

// Create element with JSX-like syntax
export function createElement(tagName, attributes = {}, ...children) {
  // Handle JSX pragma
  if (typeof tagName === 'function') {
    // Component function
    return tagName({ ...attributes, children });
  }

  const element = document.createElement(tagName);

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.toLowerCase().substring(2);
      element.addEventListener(eventName, value);
    } else if (key === 'ref' && typeof value === 'function') {
      value(element);
    } else if (key === 'dangerouslySetInnerHTML' && value && value.__html) {
      element.innerHTML = value.__html;
    } else if (typeof value === 'boolean') {
      if (value) {
        element.setAttribute(key, '');
      } else {
        element.removeAttribute(key);
      }
    } else if (value != null) {
      element.setAttribute(key, String(value));
    }
  });

  // Add children
  children.forEach(child => {
    if (child == null || child === false) return;

    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof HTMLElement || child instanceof DocumentFragment) {
      element.appendChild(child);
    } else if (child instanceof Component) {
      element.appendChild(child.render());
    } else if (Array.isArray(child)) {
      child.forEach(c => {
        if (c instanceof HTMLElement || c instanceof DocumentFragment) {
          element.appendChild(c);
        } else if (c instanceof Component) {
          element.appendChild(c.render());
        } else if (typeof c === 'string' || typeof c === 'number') {
          element.appendChild(document.createTextNode(String(c)));
        }
      });
    }
  });

  return element;
}

// ========== ADVANCED JSX FEATURES ==========

// Conditional rendering
export function Conditional({ condition, children, fallback = null }) {
  if (condition) {
    return children;
  }
  return fallback;
}

// List rendering with keys
export function List({ items, render, keyFn = (item, index) => index }) {
  return items.map((item, index) => {
    const key = keyFn(item, index);
    const element = render(item, index);
    if (element && typeof element === 'object' && element.props) {
      element.props.key = key;
    }
    return element;
  });
}

// Portal for rendering outside component tree
export class Portal {
  constructor(container, child) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    this.child = child;
  }

  render() {
    if (this.child instanceof Component) {
      return this.child.render();
    }
    return this.child;
  }

  mount() {
    if (this.container && this.child) {
      const element = this.render();
      this.container.appendChild(element);
    }
  }

  unmount() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Context provider (simplified)
export class ContextProvider {
  constructor(value, children) {
    this.value = value;
    this.children = children;
  }

  render() {
    // Store context value for children to access
    const contextElement = createElement('div', {
      'data-context': JSON.stringify(this.value),
      style: { display: 'contents' }
    });

    this.children.forEach(child => {
      if (child instanceof Component) {
        child.context = this.value;
        contextElement.appendChild(child.render());
      } else if (child instanceof HTMLElement) {
        contextElement.appendChild(child);
      }
    });

    return contextElement;
  }
}

// ========== UTILITY FUNCTIONS ==========

// Clone element with new props
export function cloneElement(element, newProps = {}, ...newChildren) {
  if (!element || typeof element !== 'object') {
    return element;
  }

  const cloned = { ...element };
  cloned.props = { ...cloned.props, ...newProps };

  if (newChildren.length > 0) {
    cloned.children = newChildren.flat();
  }

  return cloned;
}

// Check if element is valid JSX
export function isValidJSXElement(element) {
  return element &&
         typeof element === 'object' &&
         typeof element.tag === 'string' &&
         'props' in element &&
         'children' in element;
}

// Sanitize HTML content
export function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Create styled component
export function styled(tagName) {
  return function(styles) {
    return function(props = {}, ...children) {
      const styleProps = { ...props };

      // Apply styles
      if (typeof styles === 'function') {
        styleProps.style = { ...styleProps.style, ...styles(props) };
      } else {
        styleProps.style = { ...styleProps.style, ...styles };
      }

      return jsx(tagName, styleProps, ...children);
    };
  };
}

// ========== REACT COMPATIBILITY ==========

// React.createElement compatibility
export function createElementCompat(type, props, ...children) {
  return jsx(type, props, ...children);
}

// React.Fragment compatibility
export { Fragment as ReactFragment };

// Export as default for JSX pragma
export default {
  jsx,
  createElement,
  createElementFromJSX,
  createElementFromHTML,
  Fragment,
  Portal,
  ContextProvider,
  Conditional,
  List,
  cloneElement,
  isValidJSXElement,
  sanitizeHTML,
  styled,
  createElementCompat
};
