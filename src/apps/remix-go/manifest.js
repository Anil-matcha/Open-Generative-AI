export const appManifest = {
  id: 'remix-go',
  name: 'Remix Go',
  category: 'Video Editing',
  route: '/apps/remix-go',
  description: 'Lightweight editor for personalized videos. Create, edit, and publish video projects with timeline editing, effects, and export capabilities.',
  thumbnail: '/apps/remix-go/assets/thumbnail.jpg',
  stack: {
    frontend: 'higgsfield-compatible-react-module',
    generation: 'muapi',
    llm: 'openai',
    storage: 'supabase',
    functions: 'netlify-or-supabase-edge'
  },
  outputTypes: ['video', 'image'],
  handoffTargets: ['library', 'render', 'director', 'timeline', 'edit-studio', 'video-agent']
};