/**
 * TemplateCard Component - Individual template display card
 * @param {Object} template - Template data
 * @param {Function} onClick - Click handler
 * @param {Function} onPreview - Preview handler
 * @param {boolean} showActions - Whether to show action buttons
 */
export function TemplateCard(template, onClick, onPreview, showActions = true) {
  const card = document.createElement('div');
  card.className = 'bg-bg-card border border-border-color rounded-lg p-4 cursor-pointer hover:bg-bg-panel transition-all duration-200 group relative overflow-hidden';

  // Thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'aspect-video bg-bg-panel rounded-md mb-3 overflow-hidden relative';
  thumbnail.style.backgroundImage = template.thumbnail_url ? `url(${template.thumbnail_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  thumbnail.style.backgroundSize = 'cover';
  thumbnail.style.backgroundPosition = 'center';

  // Template type indicator
  if (template.is_built_in) {
    const builtInBadge = document.createElement('div');
    builtInBadge.className = 'absolute top-2 left-2 px-2 py-1 bg-color-primary text-black text-xs font-medium rounded-full';
    builtInBadge.textContent = 'Built-in';
    thumbnail.appendChild(builtInBadge);
  }

  // Category badge
  const categoryBadge = document.createElement('div');
  categoryBadge.className = 'absolute top-2 right-2 px-2 py-1 bg-bg-glass backdrop-blur-sm text-text-primary text-xs font-medium rounded-full';
  categoryBadge.textContent = template.category;
  thumbnail.appendChild(categoryBadge);

  // Template info
  const info = document.createElement('div');
  info.className = 'space-y-2';

  const title = document.createElement('h3');
  title.className = 'text-text-primary font-medium text-sm line-clamp-2';
  title.textContent = template.name;

  const description = document.createElement('p');
  description.className = 'text-text-muted text-xs line-clamp-2';
  description.textContent = template.description || 'No description available';

  const meta = document.createElement('div');
  meta.className = 'flex items-center justify-between text-xs text-text-muted';

  const created = document.createElement('span');
  if (template.created_at) {
    created.textContent = new Date(template.created_at).toLocaleDateString();
  } else {
    created.textContent = 'Built-in';
  }

  const icon = document.createElement('span');
  icon.className = 'text-lg';
  // Try to get icon from template data, fallback to generic
  if (template.data && template.data.icon) {
    icon.textContent = template.data.icon;
  } else {
    icon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    `;
  }

  meta.appendChild(created);
  meta.appendChild(icon);

  info.appendChild(title);
  info.appendChild(description);
  info.appendChild(meta);

  // Action buttons (if enabled)
  if (showActions) {
    const actionsMenu = document.createElement('div');
    actionsMenu.className = 'absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1';

    const previewBtn = document.createElement('button');
    previewBtn.className = 'w-8 h-8 bg-bg-glass backdrop-blur-sm rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors';
    previewBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
    previewBtn.title = 'Preview template';
    previewBtn.onclick = (e) => {
      e.stopPropagation();
      onPreview(template);
    };

    actionsMenu.appendChild(previewBtn);

    // Only show edit/delete for user templates
    if (!template.is_built_in && template.created_by) {
      const editBtn = document.createElement('button');
      editBtn.className = 'w-8 h-8 bg-bg-glass backdrop-blur-sm rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors';
      editBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      `;
      editBtn.title = 'Edit template';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        // TODO: Implement edit template
        console.log('Edit template:', template.id);
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'w-8 h-8 bg-bg-glass backdrop-blur-sm rounded-md flex items-center justify-center text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors';
      deleteBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      `;
      deleteBtn.title = 'Delete template';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        // TODO: Implement delete template with confirmation
        console.log('Delete template:', template.id);
      };

      actionsMenu.appendChild(editBtn);
      actionsMenu.appendChild(deleteBtn);
    }

    card.appendChild(actionsMenu);
  }

  // Click handler for the card
  card.onclick = () => onClick(template);

  // Assemble card
  card.appendChild(thumbnail);
  card.appendChild(info);

  return card;
}