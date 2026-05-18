import { cinegen } from '../lib/cinegen.js';

export function RetakePanel({ clip, onRetake, onClose }) {
  if (!clip) return null;
  
  let isGenerating = false;

  const handleRetake = async () => {
    isGenerating = true;
    const result = await cinegen.applyEditTool('extend', {
      prompt: document.querySelector('.retake-panel textarea')?.value || clip.prompt,
      extendDuration: parseInt(document.querySelector('.retake-panel input[type="number"]')?.value || '5')
    });
    isGenerating = false;
    
    if (result.success) {
      onRetake?.(clip, result.data);
      onClose?.();
    } else {
      
    }
  };

  return `
    <div class="retake-panel fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div class="bg-[#1a1a1f] rounded-xl p-6 w-full max-w-md border border-white/10">
        <h3 class="text-lg font-bold mb-4">Retake Clip</h3>
        <p class="text-sm text-white/60 mb-4">Regenerate this clip with new parameters</p>
        
        <div class="space-y-3">
          <div>
            <label class="text-xs text-white/50 mb-1 block">Prompt</label>
            <textarea class="w-full bg-[#0d0d11] border border-white/10 rounded px-3 py-2 text-sm" placeholder="Describe the retake..." rows="3">${clip.prompt || ''}</textarea>
          </div>
          
          <div>
            <label class="text-xs text-white/50 mb-1 block">Duration (seconds)</label>
            <input type="number" min="1" max="30" value="${clip.duration || 5}" class="w-full bg-[#0d0d11] border border-white/10 rounded px-3 py-2 text-sm" />
          </div>
        </div>
        
        <div class="flex gap-2 mt-6">
          <button class="flex-1 px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20" onclick="${onClose?.}">Cancel</button>
          <button class="flex-1 px-4 py-2 bg-primary rounded text-sm font-semibold hover:opacity-90" id="retakeConfirmBtn">
            ${isGenerating ? 'Generating...' : 'Retake'}
          </button>
        </div>
      </div>
    </div>
  `;
}

export default RetakePanel;