import { cookies } from "next/headers";
import AgentEditClient from "./AgentEditClient";

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

export default async function EditAgentPage({ params }) {
  const { id } = await params; // although we don't use id on server here, it's used by useParams in client
  const cookieStore = await cookies();
  const provider = getProviderContext(cookieStore);

  const userData = await fetchUserData(provider.apiKey, provider.baseUrl, provider.usesProviderBase);

  return (
    <AgentEditClient userData={userData} />
  );
}
