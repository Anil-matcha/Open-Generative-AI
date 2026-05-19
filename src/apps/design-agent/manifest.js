export const appManifest = {
  id: 'design-agent',
  name: 'Design Agent',
  category: 'Creative',
  route: '/apps/design-agent',
  description: 'Brief to multi-asset design generation and planning.',
  thumbnail: '/assets/apps/design-agent.png',
  status: 'production',
  stack: { frontend: 'higgsfield-module', llm: 'openai', generation: 'muapi', persistence: 'supabase' },
  outputTypes: ['image', 'video', 'text'],
  handoffTargets: ['library', 'render', 'director', 'timeline', 'edit-studio']
};