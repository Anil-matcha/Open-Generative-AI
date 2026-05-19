export const appManifest = {
  id: 'ai-headshot-generator',
  name: 'AI Headshot Generator',
  category: 'Image Studio',
  route: '/apps/ai-headshot-generator',
  description: 'Professional AI headshot generator for LinkedIn photos, team portraits, and personal branding. Upload a photo and select styles.',
  thumbnail: '/apps/ai-headshot-generator/assets/thumbnail.jpg',
  stack: {
    frontend: 'higgsfield-compatible-react-module',
    generation: 'muapi',
    llm: 'openai',
    storage: 'supabase',
    functions: 'netlify-or-supabase-edge'
  },
  outputTypes: ['image'],
  handoffTargets: ['library', 'edit-studio']
};