import { WorkflowsPage } from './WorkflowsPage.js';
import { WorkflowRunnerPage } from './WorkflowRunnerPage.js';
import { WorkflowEmbedPage } from './WorkflowEmbedPage.js';

export function WorkflowStudio(page = 'workflows') {
  if (page === 'workflows/editor') return WorkflowEmbedPage();
  if (page === 'workflows/history') {
    const el = document.createElement('div'); el.className = 'w-full h-full p-6 text-white'; el.innerHTML = '<h1 class="text-2xl font-bold">Workflow History</h1><p class="text-secondary mt-2">MVP placeholder for workflow run history.</p>'; return el;
  }
  if (page === 'workflows/settings') {
    const el = document.createElement('div'); el.className = 'w-full h-full p-6 text-white';
    el.innerHTML = '<h1 class="text-2xl font-bold mb-3">Workflow Settings</h1><label class="block text-sm text-secondary mb-2">MuAPI User API Key (stored in localStorage for MVP)</label><input id="muapi-key" type="password" class="w-full max-w-xl rounded-lg bg-white/5 border border-white/10 p-2"/><p class="text-xs text-secondary mt-2">Never paste master platform keys in browser clients.</p>';
    const input = el.querySelector('#muapi-key'); input.value = localStorage.getItem('muapi_user_api_key') || ''; input.onchange = ()=>localStorage.setItem('muapi_user_api_key', input.value.trim());
    return el;
  }
  if (page.startsWith('workflows/')) return WorkflowRunnerPage(page.replace('workflows/', ''));
  return WorkflowsPage();
}
