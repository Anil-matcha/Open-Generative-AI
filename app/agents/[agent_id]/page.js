import { cookies } from "next/headers";
import AgentChatClient from "./AgentChatClient";

/**
 * Server component — fetches agentDetails from the configured Provider
 * using the unified Provider cookie for auth, then renders the client chat component.
 *
 * URL: /agents/[agent_id]   (new chat — no conversation ID yet)
 */
export async function generateMetadata({ params }) {
  const { agent_id } = await params;
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
  
  // Try fetching by slug first
  try {
    console.log(`[AgentPage] Fetching agent by slug: ${agentId}`);
    const res = await fetch(
      `${baseUrl}/agents/by-slug/${agentId}`,
      {
        cache: "no-store",
        headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
      }
    );
    if (res.ok) return await res.json();
    
    // If by-slug fails, try fetching by direct ID (if it looks like a UUID)
    if (agentId.length > 20) {
      console.log(`[AgentPage] Fetch by slug failed, trying by ID: ${agentId}`);
      const resId = await fetch(
        `${baseUrl}/agents/${agentId}`,
        {
          cache: "no-store",
          headers: { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` },
        }
      );
      if (resId.ok) return await resId.json();
    }
    
    console.warn(`[AgentPage] Failed to fetch agent details for: ${agentId}`);
    return null;
  } catch (error) {
    console.error("[AgentPage] Fetch error:", error);
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

export default async function AgentPage({ params }) {
  const { agent_id } = await params;
  const cookieStore = await cookies();
  const provider = getProviderContext(cookieStore);

  console.log(`[AgentPage] Loading page for agent: ${agent_id}, hasKey: ${!!provider.apiKey}`);

  const [agentDetails, userData] = await Promise.all([
    fetchAgentDetails(agent_id, provider.apiKey, provider.baseUrl),
    fetchUserData(provider.apiKey, provider.baseUrl, provider.usesProviderBase)
  ]);

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={null} 
      userData={userData}
    />
  );
}
