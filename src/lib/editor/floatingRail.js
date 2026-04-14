/**
 * Floating Rail Module
 * Handles the floating action rail with quick tools and commands
 */

export function renderFloatingRail(railActions, container, onActionClick, showToast) {
  if (!container) return;

  container.innerHTML = '';
  railActions.forEach(([icon, label, active]) => {
    const btn = document.createElement('button');
    btn.className = `rail-btn ${active ? 'active' : ''}`;
    btn.innerHTML = `<span class="emoji">${icon}</span><span>${label}</span>`;
    btn.addEventListener('click', () => {
      onActionClick(icon, label);
      showToast(`${label} action triggered`);
    });
    container.appendChild(btn);
  });
}

export function handleRailAction(icon, label, state, showToast) {
  switch (label) {
    case 'Generate':
      // Trigger generate panel
      showToast('Generate panel opened');
      break;

    case 'Split':
      if (state.selectedClipId) {
        // Split selected clip
        showToast('Clip split');
      } else {
        showToast('Select a clip to split');
      }
      break;

    case 'Scenes':
      showToast('Scene management opened');
      break;

    case 'Subtitle':
      // Add subtitle track or caption
      showToast('Subtitle tools opened');
      break;

    case 'B-Roll':
      showToast('B-Roll library opened');
      break;

    case 'Speed':
      showToast('Speed adjustment opened');
      break;

    case 'Stabilize':
      showToast('Stabilization tools opened');
      break;

    case 'Text':
      showToast('Text tools opened');
      break;

    default:
      showToast(`${label} action`);
  }
}

export function updateRailState(railActions, activeAction) {
  return railActions.map(([icon, label, wasActive]) => [
    icon,
    label,
    label === activeAction
  ]);
}

export function showRailContextMenu(actions, position, onActionSelect) {
  // Remove existing context menu
  const existing = document.querySelector('.rail-context-menu');
  if (existing) existing.remove();

  const menu = document.createElement('div');
  menu.className = 'rail-context-menu';
  menu.style.position = 'fixed';
  menu.style.left = position.x + 'px';
  menu.style.top = position.y + 'px';
  menu.style.background = 'rgba(0,0,0,0.9)';
  menu.style.border = '1px solid rgba(255,255,255,0.2)';
  menu.style.borderRadius = '8px';
  menu.style.padding = '8px';
  menu.style.zIndex = '1000';

  actions.forEach(action => {
    const item = document.createElement('button');
    item.className = 'context-menu-item';
    item.textContent = action.label;
    item.style.display = 'block';
    item.style.width = '100%';
    item.style.padding = '6px 12px';
    item.style.border = 'none';
    item.style.background = 'transparent';
    item.style.color = 'white';
    item.style.textAlign = 'left';
    item.style.cursor = 'pointer';
    item.style.borderRadius = '4px';

    item.addEventListener('click', () => {
      onActionSelect(action);
      menu.remove();
    });

    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255,255,255,0.1)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.background = 'transparent';
    });

    menu.appendChild(item);
  });

  document.body.appendChild(menu);

  // Remove on click outside
  const removeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', removeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', removeMenu), 10);
}

export function toggleRailVisibility(container, visible) {
  if (container) {
    container.style.opacity = visible ? '1' : '0';
    container.style.pointerEvents = visible ? 'auto' : 'none';
  }
}

export function animateRailAction(button, action) {
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 100);
}