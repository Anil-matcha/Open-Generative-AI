export function HeadshotSettingsModal({ onSave, onClose, currentApiKey = '' }) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center';
  modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111] p-5"><h3 class="text-lg font-bold text-white">Headshot Settings</h3><p class="text-xs text-secondary mt-1">Use your own provider API key (BYOK). Keys are stored in local browser storage for MVP.</p></div>`;
  const body = modal.firstElementChild;
  const input = document.createElement('input');
  input.className = 'mt-4 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white';
  input.placeholder = 'MUAPI API key';
  input.value = currentApiKey;
  const row = document.createElement('div');
  row.className = 'mt-4 flex justify-end gap-2';
  row.innerHTML = '<button class="px-3 py-2 rounded-lg bg-white/10 text-white" data-cancel>Cancel</button><button class="px-3 py-2 rounded-lg bg-primary/20 text-primary" data-save>Save</button>';
  body.appendChild(input); body.appendChild(row);
  row.querySelector('[data-cancel]').onclick = onClose;
  row.querySelector('[data-save]').onclick = () => onSave(input.value.trim());
  return modal;
}
