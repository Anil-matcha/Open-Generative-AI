export function WorkflowTile(workflow, navigateTo) {
  const card = document.createElement('article');
  card.className = 'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 flex flex-col gap-2';
  card.innerHTML = `<h3 class="text-white font-semibold">${workflow.title}</h3><p class="text-xs text-secondary">${workflow.category}</p><p class="text-sm text-secondary">${workflow.description}</p><div class="text-xs text-primary">${workflow.outputType}</div>`;
  const btn = document.createElement('button');
  btn.className = 'mt-auto px-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30';
  btn.textContent = 'Open Workflow';
  btn.onclick = () => navigateTo(workflow.slug);
  card.appendChild(btn);
  return card;
}
