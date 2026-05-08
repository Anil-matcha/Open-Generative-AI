export function WorkflowEmbedPage() {
  const root = document.createElement('div'); root.className = 'w-full h-full p-6 text-white';
  const url = import.meta.env.VITE_WORKFLOW_APP_URL;
  if (!url) { root.innerHTML = '<h1 class="text-xl font-bold mb-2">Workflow Editor Setup</h1><p>Set <code>VITE_WORKFLOW_APP_URL</code> to embed/link your Vibe-Workflow app.</p>'; return root; }
  root.innerHTML = `<h1 class="text-xl font-bold mb-3">Advanced Workflow Editor</h1><a href="${url}" target="_blank" rel="noreferrer" class="text-primary underline">Open in new tab</a><iframe src="${url}" class="w-full h-[80vh] mt-3 rounded-xl border border-white/10" referrerpolicy="no-referrer"></iframe>`;
  return root;
}
