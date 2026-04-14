/**
 * Reusable Tooltip Component
 * @param {Object} options - Configuration options
 * @param {string} options.text - Tooltip text content
 * @param {string} options.placement - Position: 'top', 'bottom', 'left', 'right' (default: 'top')
 * @param {number} options.delay - Show delay in ms (default: 300)
 * @param {boolean} options.noIcon - Hide the help icon (default: false)
 * @param {string} options.iconColor - Icon color class (default: 'text-secondary')
 * @returns {HTMLElement} The tooltip wrapper element
 */
export function Tooltip(options = {}) {
  const {
    text = '',
    placement = 'top',
    delay = 300,
    noIcon = false,
    iconColor = 'text-secondary'
  } = options;

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'relative inline-block';
  wrapper.style.display = 'inline-block';

  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'absolute z-50 px-2 py-1 text-xs text-white bg-black/80 backdrop-blur-sm rounded border border-white/10 whitespace-nowrap pointer-events-none opacity-0 transition-opacity duration-200';
  tooltip.textContent = text;
  tooltip.style.fontSize = '11px';
  tooltip.style.fontWeight = '500';

  // Position the tooltip
  switch (placement) {
    case 'top':
      tooltip.style.bottom = '100%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%) translateY(-4px)';
      break;
    case 'bottom':
      tooltip.style.top = '100%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translateX(-50%) translateY(4px)';
      break;
    case 'left':
      tooltip.style.right = '100%';
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translateX(-4px) translateY(-50%)';
      break;
    case 'right':
      tooltip.style.left = '100%';
      tooltip.style.top = '50%';
      tooltip.style.transform = 'translateX(4px) translateY(-50%)';
      break;
  }

  let showTimeout;
  let hideTimeout;

  // Show tooltip
  const showTooltip = () => {
    clearTimeout(hideTimeout);
    showTimeout = setTimeout(() => {
      tooltip.classList.remove('opacity-0');
      tooltip.classList.add('opacity-100');
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    clearTimeout(showTimeout);
    hideTimeout = setTimeout(() => {
      tooltip.classList.remove('opacity-100');
      tooltip.classList.add('opacity-0');
    }, 100);
  };

  // If no icon, just add tooltip functionality to wrapper
  if (noIcon) {
    wrapper.addEventListener('mouseenter', showTooltip);
    wrapper.addEventListener('mouseleave', hideTooltip);
    wrapper.appendChild(tooltip);
    return wrapper;
  }

  // Create help icon
  const iconContainer = document.createElement('div');
  iconContainer.className = `inline-flex items-center justify-center w-4 h-4 rounded-full cursor-help ${iconColor} hover:text-white transition-colors`;
  iconContainer.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  `;

  iconContainer.addEventListener('mouseenter', showTooltip);
  iconContainer.addEventListener('mouseleave', hideTooltip);

  wrapper.appendChild(iconContainer);
  wrapper.appendChild(tooltip);

  return wrapper;
}

/**
 * Add tooltip to existing element
 * @param {HTMLElement} element - Element to add tooltip to
 * @param {Object} options - Tooltip options
 */
export function addTooltip(element, options = {}) {
  const tooltipWrapper = Tooltip({ ...options, noIcon: true });
  const parent = element.parentNode;

  if (parent) {
    parent.replaceChild(tooltipWrapper, element);
    tooltipWrapper.appendChild(element);
  }

  return tooltipWrapper;
}