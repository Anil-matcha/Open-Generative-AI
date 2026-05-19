export const routes = [
  { path: '/', name: 'Templates' },
  { path: '/new', name: 'New Workflow' },
  { path: '/:workflowId', name: 'Workflow Editor' },
  { path: '/:workflowId/run/:runId', name: 'Run Results' },
  { path: '/history', name: 'History' }
];