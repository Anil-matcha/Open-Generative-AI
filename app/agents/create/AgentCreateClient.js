"use client";

import { CreateAgentPage } from 'ai-agent';
import 'ai-agent/dist/tailwind.css';
import { useCallback } from 'react';
import { AgentAuthState, useAgentAuth } from '../useAgentAuth';

export default function AgentCreateClient() {
  const auth = useAgentAuth();
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
  return <CreateAgentPage useUser={useUser} usedIn="studio" />;
}
