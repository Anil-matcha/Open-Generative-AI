import { cookies } from "next/headers";
import AgentChatClient from "../AgentChatClient";

/**
 * Server component — fetches both agentDetails and initialHistory
 * using the unified Provider cookie, then renders
 * the client chat component with existing conversation messages pre-loaded.
 *
 * URL: /agents/[agent_id]/[conversation_id]
 */
export async function generateMetadata({ params }) {
  return {
    title: `Agent Chat — MozenAIGC`,
  };
}

const DEFAULT_PROVIDER_BASE_URL = 'https://api.muapi.ai';
const PROVIDER_BASE_URL_COOKIE = 'provider_base_url';

function normalizeApiKey(value) {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== "null" && trimmed !== "undefined" ? trimmed : null;
}

function decodeCookieValue(value) {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeBaseUrl(value) {
  const raw = normalizeApiKey(decodeCookieValue(value));
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return raw.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function getProviderContext(cookieStore) {
  const baseUrl = normalizeBaseUrl(cookieStore.get(PROVIDER_BASE_URL_COOKIE)?.value);
  return {
    baseUrl: baseUrl || DEFAULT_PROVIDER_BASE_URL,
    usesProviderBase: Boolean(baseUrl),
    apiKey:
      normalizeApiKey(cookieStore.get("provider_api_key")?.value) ||
      normalizeApiKey(cookieStore.get("yunwu_api_key")?.value) ||
      normalizeApiKey(cookieStore.get("muapi_key")?.value),
  };
}

function buildAccountUrl(baseUrl, usesProviderBase) {
  return usesProviderBase ? `${baseUrl}/account/balance` : `${baseUrl}/api/v1/account/balance`;
}

async function fetchAgentDetails(agentId, apiKey, baseUrl) {
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `${baseUrl}/agents/by-slug/${agentId}`,
      {
        cache: "no-store",
        headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
      }
    );
    if (res.ok) return await res.json();
    
    if (agentId.length > 20) {
      const resId = await fetch(
        `${baseUrl}/agents/${agentId}`,
        {
          cache: "no-store",
          headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
        }
      );
      if (resId.ok) return await resId.json();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchHistory(agentId, conversationId, apiKey, baseUrl) {
  if (!apiKey) return null;
  try {
    // Try by slug first
    const res = await fetch(
      `${baseUrl}/agents/by-slug/${agentId}/${conversationId}`,
      {
        cache: "no-store",
        headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
      }
    );
    if (res.ok) return await res.json();
    
    // Fallback to direct agent ID if needed
    if (agentId.length > 20) {
      const resId = await fetch(
        `${baseUrl}/agents/${agentId}/${conversationId}`,
        {
          cache: "no-store",
          headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
        }
      );
      if (resId.ok) return await resId.json();
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchUserData(apiKey, baseUrl, usesProviderBase) {
  if (!apiKey) return null;
  try {
    const res = await fetch(buildAccountUrl(baseUrl, usesProviderBase), {
      cache: "no-store",
      headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AgentConversationPage({ params }) {
  const { agent_id, conversation_id } = await params;
  const cookieStore = await cookies();
  const provider = getProviderContext(cookieStore);

  console.log(`[ConvPage] Loading for agent: ${agent_id}, conv: ${conversation_id}, hasKey: ${!!provider.apiKey}`);

  const [agentDetails, initialHistory, userData] = await Promise.all([
    fetchAgentDetails(agent_id, provider.apiKey, provider.baseUrl),
    fetchHistory(agent_id, conversation_id, provider.apiKey, provider.baseUrl),
    fetchUserData(provider.apiKey, provider.baseUrl, provider.usesProviderBase)
  ]);

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={initialHistory} 
      userData={userData}
    />
  );
}
