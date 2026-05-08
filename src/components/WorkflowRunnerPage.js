import { workflowRegistryBySlug } from '../lib/workflowRegistry.js';
import { WorkflowInputForm } from './WorkflowInputForm.js';
import { WorkflowOutputViewer } from './WorkflowOutputViewer.js';
import { runWorkflow, pollWorkflowUntilComplete } from '../lib/muapiWorkflowClient.js';
import { navigate } from '../lib/router.js';

export function WorkflowRunnerPage(slug) {
  const workflow = workflowRegistryBySlug[slug];
  const root = document.createElement('div'); root.className = 'w-full h-full p-6 text-white overflow-y-auto';
  if (!workflow) { root.textContent = 'Workflow not found'; return root; }
  root.innerHTML = `<h1 class="text-2xl font-bold mb-2">${workflow.title}</h1><p class="text-secondary mb-4">${workflow.description}</p>`;
  const form = WorkflowInputForm(workflow.inputs); root.appendChild(form);
  const status = document.createElement('div'); status.className = 'my-3 text-sm text-secondary'; root.appendChild(status);
  const actions = document.createElement('div'); actions.className = 'flex flex-wrap gap-2 my-3';
  const runBtn = document.createElement('button'); runBtn.className = 'px-3 py-2 rounded bg-primary/20'; runBtn.textContent = 'Run Workflow';
  const backBtn = document.createElement('button'); backBtn.className = 'px-3 py-2 rounded bg-white/10'; backBtn.textContent = 'Back to Workflows'; backBtn.onclick = ()=>navigate('workflows');
  actions.append(runBtn, backBtn); root.appendChild(actions);
  const outputWrap = document.createElement('div'); root.appendChild(outputWrap);
  runBtn.onclick = async () => {
    try {
      status.textContent = 'Running workflow...'; runBtn.disabled = true;
      const payload = Object.fromEntries(new FormData(form).entries());
      const start = await runWorkflow({ workflowId: workflow.id, inputs: payload });
      const runId = start.run_id || start.id;
      const out = runId ? await pollWorkflowUntilComplete({ runId }) : start;
      status.textContent = 'Completed'; outputWrap.innerHTML = ''; outputWrap.appendChild(WorkflowOutputViewer(out));
    } catch (e) { status.textContent = `Error: ${e.message}`; }
    finally { runBtn.disabled = false; }
  };
  return root;
}
