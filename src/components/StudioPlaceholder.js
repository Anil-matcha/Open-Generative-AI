export function StudioPlaceholder() {
  const element = document.createElement('div');
  element.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg text-white';
  
  element.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="margin-bottom: 20px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
        </svg>
      </div>
      <p style="font-size: 18px; font-weight: 600; margin-bottom: 8px; opacity: 0.8;">Studio</p>
      <p style="font-size: 14px; opacity: 0.5;">Select a module from the sidebar to begin</p>
    </div>
  `;
  
  return element;
}