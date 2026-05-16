export function createUniversalDropzone(onDrop, acceptTypes = []) {
  const zone = document.createElement('div');
  zone.className = 'universal-dropzone';
  zone.style.cssText = `
    border: 2px dashed #4a4a6a;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(74, 74, 106, 0.1);
  `;
  zone.innerHTML = `
    <div class="dropzone-content">
      <div class="drop-icon" style="font-size: 32px; margin-bottom: 12px;">📁</div>
      <div class="drop-text" style="font-size: 16px; color: #e0e0e0; margin-bottom: 4px;">Drop files here</div>
      <div class="drop-subtext" style="font-size: 12px; color: #888;">or drag from any app</div>
    </div>
  `;
  
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.style.borderColor = '#4fc3f7';
    zone.style.background = 'rgba(79, 195, 247, 0.1)';
  });
  
  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '#4a4a6a';
    zone.style.background = 'rgba(74, 74, 106, 0.1)';
  });
  
  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.style.borderColor = '#4a4a6a';
    zone.style.background = 'rgba(74, 74, 106, 0.1)';
    
    const files = Array.from(e.dataTransfer.files);
    if (onDrop) await onDrop(files);
  });
  
  return zone;
}