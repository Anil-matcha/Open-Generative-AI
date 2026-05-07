export function HeadshotUploadPanel({ onFile }) {
  const wrap = document.createElement('div');
  wrap.className = 'p-4 rounded-2xl border border-white/10 bg-white/5';
  wrap.innerHTML = `<label class="block text-sm font-semibold text-white mb-2">Upload source photo</label>`;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.className = 'w-full text-xs text-secondary';
  input.onchange = (e) => onFile(e.target.files?.[0] || null);
  wrap.appendChild(input);
  return wrap;
}
