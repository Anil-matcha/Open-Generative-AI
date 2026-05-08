export function WorkflowOutputViewer(data) {
  const box = document.createElement('div');
  box.className = 'rounded-xl border border-white/10 bg-white/5 p-3';
  const outputs = data?.outputs || [];
  if (!outputs.length) { box.textContent = JSON.stringify(data, null, 2); return box; }
  outputs.forEach(url => {
    const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noreferrer'; a.className = 'block text-primary underline break-all mb-2'; a.textContent = url;
    box.appendChild(a);
  });
  return box;
}
