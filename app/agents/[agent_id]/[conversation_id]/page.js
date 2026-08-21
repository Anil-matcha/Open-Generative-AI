import AgentChatClient from '../AgentChatClient';

export async function generateMetadata() {
  return { title: 'Agent Chat — Open Generative AI' };
}

export default async function AgentConversationPage({ params }) {
  const { agent_id, conversation_id } = await params;
  return <AgentChatClient agentId={agent_id} conversationId={conversation_id} />;
}
