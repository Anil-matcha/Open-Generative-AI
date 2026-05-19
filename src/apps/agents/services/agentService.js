export async function listAgentTemplates() { return []; }
export async function createAgent(agent) { return agent; }
export async function runAgent(id, input) { return { output: 'Agent response' }; }
export async function sendAgentMessage(agentId, message) { return { role: 'assistant', content: 'Reply to ' + message }; }