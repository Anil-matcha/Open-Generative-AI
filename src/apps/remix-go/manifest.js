export const appManifest = {
  id: 'remix-go',
  name: 'Remix Go',
  category: 'Video Editing',
  route: '/apps/remix-go',
  description: 'Lightweight editor for personalized videos. Create, edit, and publish video projects with timeline editing, effects, and export capabilities.',
  thumbnail: '/apps/remix-go/assets/thumbnail.jpg',
  status: 'production',
  sourceRepos: {
    upstream: 'https://github.com/strategic-limited/remix-go',
    fork: 'https://github.com/deangilmoreremix/remix-go'
  },
  stack: {
    frontend: 'higgsfield-module',
    llm: 'openai',
    generation: 'muapi',
    persistence: 'supabase',
    storage: 'supabase-storage',
    functions: 'netlify-or-supabase-edge'
  },
  outputTypes: ['video', 'image'],
  handoffTargets: ['library', 'render', 'director', 'timeline', 'edit-studio', 'video-agent']
};
