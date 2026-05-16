import { assetStore } from '../../lib/assets/assetStore.js';
import { createAssetPreviewCard } from './AssetPreviewCard.js';

export function createAssetPickerModal(onSelect, options = {}) {
  const { multiple = false, acceptTypes = [], title = 'Select Asset' } = options;
  
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: #1a1a2e;
    border-radius: 12px;
    padding: 24px;
    max-width: 800px;
    max-height: 80vh;
    overflow: auto;
    width: 90%;
    max-width: 600px;
  `;
  
  content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <h3 style="margin: 0; color: #e0e0e0;">${title}</h3>
      <button class="close-btn" style="background: none; border: none; color: #888; font-size: 20px;">×</button>
    </div>
    <div class="asset-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; max-height: 60vh; overflow-y: auto;"></div>
  `;
  
  modal.appendChild(content);
  
  const grid = content.querySelector('.asset-grid');
  const closeModal = () => modal.remove();
  
  content.querySelector('.close-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  loadAssets();
  
  async function loadAssets() {
    const assets = await assetStore.getAssets();
    grid.innerHTML = '';
    
    for (const asset of assets) {
      const card = createAssetPreviewCard(asset);
      card.addEventListener('click', () => {
        if (multiple) {
          card.style.outline = '2px solid #4fc3f7';
        } else {
          onSelect(asset);
          closeModal();
        }
      });
      grid.appendChild(card);
    }
  }
  
  return modal;
}