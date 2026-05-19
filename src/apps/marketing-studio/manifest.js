export const appManifest = {
  id: 'marketing-studio',
  name: 'Marketing Studio',
  category: 'Marketing',
  route: '/apps/marketing-studio',
  description: 'Campaign brief to multi-platform creative generation.',
  thumbnail: '/assets/apps/marketing-studio.png',
  status: 'production',
  stack: { frontend: 'higgsfield-module', llm: 'openai', generation: 'muapi', persistence: 'supabase' },
  outputTypes: ['image', 'video', 'text', 'campaign'],
  handoffTargets: ['library', 'render', 'director', 'timeline']
};