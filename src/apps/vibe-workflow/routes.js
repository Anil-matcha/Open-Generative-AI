export const routes = [
  { path: '/', name: 'Workflows' },
  { path: '/new', name: 'New Workflow' },
  { path: '/:workflowId', name: 'Workflow Detail' },
  { path: '/:workflowId/run/:runId', name: 'Run Result' }
];