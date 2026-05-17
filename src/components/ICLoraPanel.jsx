import { cinegen } from '../lib/cinegen.js';

export function ICLoraPanel({ onApply, onClose }) {
  const [selected, setSelected] = useState(null);
  const [strength, setStrength] = useState(0.8);

  const loras = [
    { id: 'character', name: 'Character Consistency', strength: 0.8 },
    { id: 'style', name: 'Style Lock', strength: 0.75 },
    { id: 'motion', name: 'Motion Transfer', strength: 0.9 }
  ];

  const handleApply = async () => {
    if (!selected) return;
    const result = await cinegen.applyEditTool('gap-fill', { 
      type: 'character-consistency',
      loraId: selected,
      strength 
    });
    if (result.success) {
      onApply?.(selected, strength);
      onClose?.();
    } else {
      alert(`Failed: ${result.error}`);
    }
  };

  return `
    <div class="ic-lora-panel fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div class="bg-[#1a1a1f] rounded-xl p-6 w-full max-w-md border border-white/10">
        <h3 class="text-lg font-bold mb-4">IC-LoRA Character Consistency</h3>
        <p class="text-sm text-white/60 mb-4">Apply to selected clips</p>
        
        <div class="space-y-3">
          ${loras.map(l => `
            <label class="flex items-center gap-3 p-3 bg-[#0d0d11] rounded cursor-pointer">
              <input type="radio" name="lora" value="${l.id}" onchange="setSelected('${l.id}')" />
              <div class="flex-1">
                <div class="text-sm font-medium">${l.name}</div>
                <div class="text-xs text-white/50">Strength: ${l.strength}</div>
              </div>
            </label>
          `).join('')}
        </div>
        
        <div class="mt-4">
          <label class="text-xs text-white/50 mb-1 block">Strength: ${strength}</label>
          <input type="range" min="0" max="1" step="0.05" value="${strength}" onchange="setStrength(this.value)" class="w-full" />
        </div>
        
        <div class="flex gap-2 mt-6">
          <button class="flex-1 px-4 py-2 bg-white/10 rounded text-sm hover:bg-white/20" onclick="${onClose?.}">Cancel</button>
          <button class="flex-1 px-4 py-2 bg-primary rounded text-sm font-semibold hover:opacity-90" onclick="handleApply()">Apply</button>
        </div>
      </div>
    </div>
  `;
}

export default ICLoraPanel;