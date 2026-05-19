export const appManifest = {
  id: 'vibe-workflow',
  name: 'Vibe Workflow',
  category: 'Workflow Builder',
  route: '/apps/vibe-workflow',
  description: 'Node-based AI workflow builder for generative image and video pipelines. Visual, modular pipelines for generative AI.',
  thumbnail: '/apps/vibe-workflow/assets/thumbnail.jpg',
  stack: {
    frontend: 'higgsfield-compatible-react-module',
    generation: 'muapi',
    llm: 'openai',
    storage: 'supabase',
    functions: 'netlify-or-supabase-edge'
  },
  outputTypes: ['image', 'video', 'text', 'workflow'],
  handoffTargets: ['library', 'render', 'director', 'timeline', 'edit-studio', 'video-agent']
};