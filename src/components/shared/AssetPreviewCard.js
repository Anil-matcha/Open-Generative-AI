import { openInTimeline, sendToRenderQueue } from '../../lib/assets/assetActions.js';

export function createAssetPreviewCard(asset) {
  const card = document.createElement('div');
  card.className = 'asset-preview-card';
  card.dataset.assetId = asset.id;
  card.style.cssText = `
    border: 1px solid #4a4a6a;
    border-radius: 8px;
    overflow: hidden;
    background: #1a1a2e;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  `;
  
  const thumbnail = asset.media?.thumbnail || asset.media?.url || 'https://via.placeholder.com/300x200/1a1a2e/4a4a6a?text=Asset';
  
  card.innerHTML = `
    <div class="card-thumbnail" style="position: relative; padding-bottom: 56.25%;">
      <img src="${thumbnail}" alt="${asset.title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" />
      <div class="card-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: space-between; padding: 8px;">
        <span class="asset-type" style="background: #4fc3f7; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">${asset.type?.toUpperCase()}</span>
        <div class="card-actions" style="display: none; gap: 4px;">
          <button data-action="use" style="background: #4fc3f7; color: #000; border: none; border-radius: 4px; width: 24px; height: 24px; font-size: 12px;">➡️</button>
        </div>
      </div>
    </div>
    <div class="card-content" style="padding: 12px;">
      <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #e0e0e0;">${asset.title}</h4>
      <p style="margin: 0; font-size: 11px; color: #888;">${asset.sourceApp} • ${asset.metadata?.duration || 0}s</p>
    </div>
  `;
  
  card.addEventListener('click', async (e) => {
    if (e.target.dataset.action === 'use') return;
    
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.transform = 'scale(0.95)';
    setTimeout(() => card.style.transform = '', 200);
  });
  
  card.addEventListener('contextmenu', async (e) => {
    e.preventDefault();
    
    const menu = document.createElement('div');
    menu.style.cssText = `
      position: fixed;
      top: ${e.clientY}px;
      left: ${e.clientX}px;
      background: #1a1a2e;
      border: 1px solid #4a4a6a;
      border-radius: 8px;
      padding: 8px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    menu.innerHTML = `
      <button data-action="use-timeline" style="padding: 8px; text-align: left; background: none; border: none; color: #e0e0e0;">Use in Timeline</button>
      <button data-action="send-render" style="padding: 8px; text-align: left; background: none; border: none; color: #e0e0e0;">Send to Render</button>
    `;
    
    document.body.appendChild(menu);
    
    menu.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      if (action === 'use-timeline') {
        await openInTimeline(asset.id);
      } else if (action === 'send-render') {
        await sendToRenderQueue(asset.id);
      }
      menu.remove();
    });
    
    setTimeout(() => {
      menu.remove();
    }, 3000);
  });
  
  return card;
}