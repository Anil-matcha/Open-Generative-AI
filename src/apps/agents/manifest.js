export const appManifest = {
  id: 'agents',
  name: 'Agents',
  category: 'AI Agents',
  route: '/apps/agents',
  description: 'Custom agents with tools, chat, and output handoff.',
  thumbnail: '/assets/apps/agents.png',
  status: 'production',
  stack: { frontend: 'higgsfield-module', llm: 'openai', generation: 'muapi', persistence: 'supabase' },
  outputTypes: ['text', 'agent-output'],
  handoffTargets: ['library', 'video-agent']
};