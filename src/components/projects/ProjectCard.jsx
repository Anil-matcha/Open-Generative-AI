/**
 * ProjectCard Component - Individual project display card
 * @param {Object} project - Project data
 * @param {Function} onClick - Click handler
 * @param {Function} onEdit - Edit handler
 * @param {Function} onDelete - Delete handler
 * @param {Function} onDuplicate - Duplicate handler
 */
export function ProjectCard(project, onClick, onEdit, onDelete, onDuplicate) {
  const card = document.createElement('div');
  card.className = 'bg-bg-card border border-border-color rounded-lg p-4 cursor-pointer hover:bg-bg-panel transition-all duration-200 group relative overflow-hidden';

  // Thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'aspect-video bg-bg-panel rounded-md mb-3 overflow-hidden relative';
  thumbnail.style.backgroundImage = project.thumbnail_url ? `url(${project.thumbnail_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  thumbnail.style.backgroundSize = 'cover';
  thumbnail.style.backgroundPosition = 'center';

  // Thumbnail overlay for no image
  if (!project.thumbnail_url) {
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 flex items-center justify-center';
    overlay.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="m21 15-3.086-3.086a2 2 0 00-2.828 0L6 21"/>
      </svg>
    `;
    thumbnail.appendChild(overlay);
  }

  // Status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.className = `absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
    project.status === 'published' ? 'bg-green-500/20 text-green-400' :
    project.status === 'archived' ? 'bg-gray-500/20 text-gray-400' :
    'bg-yellow-500/20 text-yellow-400'
  }`;
  statusIndicator.textContent = project.status;
  thumbnail.appendChild(statusIndicator);

  // Project info
  const info = document.createElement('div');
  info.className = 'space-y-2';

  const title = document.createElement('h3');
  title.className = 'text-text-primary font-medium text-sm truncate';
  title.textContent = project.title || 'Untitled Project';

  const description = document.createElement('p');
  description.className = 'text-text-muted text-xs line-clamp-2';
  description.textContent = project.description || 'No description';

  const meta = document.createElement('div');
  meta.className = 'flex items-center justify-between text-xs text-text-muted';

  const date = document.createElement('span');
  date.textContent = new Date(project.updated_at || project.created_at).toLocaleDateString();

  const template = document.createElement('span');
  template.className = 'flex items-center gap-1';
  if (project.template_id) {
    template.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
      Template
    `;
  }

  meta.appendChild(date);
  meta.appendChild(template);

  info.appendChild(title);
  info.appendChild(description);
  info.appendChild(meta);

  // Hover actions menu
  const actionsMenu = document.createElement('div');
  actionsMenu.className = 'absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1';

  const editBtn = document.createElement('button');
  editBtn.className = 'w-8 h-8 bg-bg-glass backdrop-blur-sm rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors';
  editBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  `;
  editBtn.title = 'Edit project';
  editBtn.onclick = (e) => {
    e.stopPropagation();
    onEdit(project);
  };

  const duplicateBtn = document.createElement('button');
  duplicateBtn.className = 'w-8 h-8 bg-bg-glass backdrop-blur-sm rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors';
  duplicateBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="6" height="6" rx="1"/>
      <path d="M15 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9"/>
    </svg>
  `;
  duplicateBtn.title = 'Duplicate project';
  duplicateBtn.onclick = (e) => {
    e.stopPropagation();
    onDuplicate(project);
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
  deleteBtn.title = 'Delete project';
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    onDelete(project);
  };

  actionsMenu.appendChild(editBtn);
  actionsMenu.appendChild(duplicateBtn);
  actionsMenu.appendChild(deleteBtn);

  // Click handler for the card
  card.onclick = () => onClick(project);

  // Assemble card
  card.appendChild(thumbnail);
  card.appendChild(actionsMenu);
  card.appendChild(info);

  return card;
}