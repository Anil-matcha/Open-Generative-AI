export const appManifest = {
  id: 'workflows',
  name: 'Workflows',
  category: 'Workflow Builder',
  route: '/apps/workflows',
  description: 'Unified node-based AI workflow builder.',
  thumbnail: '/assets/apps/workflows.png',
  status: 'production',
  stack: { frontend: 'higgsfield-module', llm: 'openai', generation: 'muapi', persistence: 'supabase' },
  outputTypes: ['image', 'video', 'workflow'],
  handoffTargets: ['library', 'render', 'director', 'timeline', 'edit-studio']
};