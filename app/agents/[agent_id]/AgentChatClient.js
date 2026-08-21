"use client";

import { AiAgent } from 'ai-agent';
import 'ai-agent/dist/tailwind.css';
import { useCallback, useEffect, useState } from 'react';
import { AgentAuthState, fetchWithApiKey, useAgentAuth } from '../useAgentAuth';

async function fetchJson(url, apiKey) {
  const response = await fetchWithApiKey(url, apiKey);
  return response.ok ? response.json() : null;
}

async function fetchAgent(agentId, apiKey) {
  const encodedAgentId = encodeURIComponent(agentId);
  const bySlug = await fetchJson(`/api/agents/by-slug/${encodedAgentId}`, apiKey);
  if (bySlug || agentId.length <= 20) return bySlug;
  return fetchJson(`/api/agents/${encodedAgentId}`, apiKey);
}

async function fetchHistory(agentId, conversationId, apiKey) {
  if (!conversationId) return null;
  const encodedAgentId = encodeURIComponent(agentId);
  const encodedConversationId = encodeURIComponent(conversationId);
  const bySlug = await fetchJson(
    `/api/agents/by-slug/${encodedAgentId}/${encodedConversationId}`,
    apiKey,
  );
  if (bySlug || agentId.length <= 20) return bySlug;
  return fetchJson(`/api/agents/${encodedAgentId}/${encodedConversationId}`, apiKey);
}

export default function AgentChatClient({ agentId, conversationId }) {
  const auth = useAgentAuth();
  const [chatState, setChatState] = useState({ loading: true, agentDetails: null, initialHistory: null });

  useEffect(() => {
    if (auth.status !== 'ready') return;
    let cancelled = false;

    Promise.all([
      fetchAgent(agentId, auth.apiKey),
      fetchHistory(agentId, conversationId, auth.apiKey),
    ]).then(([agentDetails, initialHistory]) => {
      if (!cancelled) setChatState({ loading: false, agentDetails, initialHistory });
    }).catch(() => {
      if (!cancelled) setChatState({ loading: false, agentDetails: null, initialHistory: null });
    });

    return () => { cancelled = true; };
  }, [agentId, conversationId, auth.apiKey, auth.status]);

  const useUser = useCallback(
    () => ({
      user: {
        username: auth.userData?.email?.split('@')[0] || 'Studio User',
        name: auth.userData?.email?.split('@')[0] || 'Studio User',
        email: auth.userData?.email || null,
        profile_photo: null,
        balance: auth.userData?.balance || 0,
      },
      isAuthorized: auth.status === 'ready',
    }),
    [auth.status, auth.userData],
  );

  if (auth.status !== 'ready') return <AgentAuthState status={auth.status} />;
  if (chatState.loading) return <AgentAuthState status="loading" />;
  if (!chatState.agentDetails) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-sm text-white/70">
        Agent not found or unavailable.
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <AiAgent
        initialAgentDetails={chatState.agentDetails}
        initialHistory={chatState.initialHistory}
        useUser={useUser}
        usedIn="muapiapp"
      />
    </div>
  );
}
