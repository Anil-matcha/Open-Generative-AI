export const appManifest = {
  id: 'open-pomelli',
  name: 'Open Pomelli',
  category: 'Marketing Studio',
  route: '/apps/open-pomelli',
  description: 'Paste any website URL to get editable Brand DNA, on-brand campaign concepts, platform-specific creatives, and short-form videos.',
  thumbnail: '/apps/open-pomelli/assets/thumbnail.jpg',
  stack: {
    frontend: 'higgsfield-compatible-react-module',
    generation: 'muapi',
    llm: 'openai',
    storage: 'supabase',
    functions: 'netlify-or-supabase-edge'
  },
  outputTypes: ['image', 'video', 'text', 'campaign'],
  handoffTargets: ['library', 'render', 'director', 'edit-studio']
};