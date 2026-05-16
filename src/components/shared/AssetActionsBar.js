import { openInDirector, openInTimeline, openInEditor, openInRender, sendToRenderQueue, downloadAsset } from '../../../lib/assets/assetActions.js';

export function createAssetActionsBar(assetId) {
  const bar = document.createElement('div');
  bar.className = 'asset-actions-bar';
  bar.style.cssText = `
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #1a1a2e;
    border-radius: 8px;
    align-items: center;
  `;
  bar.innerHTML = `
    <button class="action-btn" data-action="director" title="Open in Director">🎬</button>
    <button class="action-btn" data-action="timeline" title="Open in Timeline">⏱️</button>
    <button class="action-btn" data-action="editor" title="Open in Editor">✂️</button>
    <button class="action-btn" data-action="render" title="Send to Render">📤</button>
    <button class="action-btn" data-action="download" title="Download">⬇️</button>
  `;
  
  bar.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    switch (action) {
      case 'director': 
        e.preventDefault();
        await openInDirector(assetId); 
        break;
      case 'timeline': 
        e.preventDefault();
        await openInTimeline(assetId); 
        break;
      case 'editor': 
        e.preventDefault();
        await openInEditor(assetId); 
        break;
      case 'render': 
        e.preventDefault();
        await sendToRenderQueue(assetId); 
        break;
      case 'download': 
        e.preventDefault();
        await downloadAsset(assetId); 
        break;
    }
  });
  
  return bar;
}