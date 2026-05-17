export function ImportTimelineModal({ onImport, onClose }) {
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target.result);
        onImport?.(content);
        onClose?.();
      } catch (err) {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  return `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div class="bg-[#1a1a1f] rounded-xl p-6 w-full max-w-md border border-white/10">
        <h3 class="text-lg font-bold mb-4">Import Timeline</h3>
        <p class="text-sm text-white/60 mb-4">Import an existing timeline from JSON or EDL</p>
        
        <div class="border border-dashed border-white/20 rounded-lg p-6 text-center">
          <input type="file" id="timelineFileInput" accept=".json,.xml,.edl" class="hidden" 
                 onchange="this.files[0] && handleFile(this.files[0])" />
          <label for="timelineFileInput" class="cursor-pointer flex flex-col items-center gap-2">
            <span class="text-3xl">📁</span>
            <span class="text-sm">Click to browse files</span>
            <span class="text-xs text-white/40">JSON, XML, EDL supported</span>
          </label>
        </div>
        
        <button class="w-full mt-4 px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20" onclick="${onClose?.}">
          Cancel
        </button>
      </div>
    </div>
  `;
}

export default ImportTimelineModal;