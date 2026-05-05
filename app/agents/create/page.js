import { cookies } from "next/headers";
import AgentCreateClient from "./AgentCreateClient";

const BASE_URL = 'https://api.muapi.ai';

async function fetchUserData(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`${BASE_URL}/api/v1/account/balance`, {
      cache: "no-store",
      headers: { "x-api-key": apiKey },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function CreateAgentPage() {
  const cookieStore = await cookies();
  const apiKey = cookieStore.get("muapi_key")?.value;

  const userData = await fetchUserData(apiKey);

  return (
    <AgentCreateClient userData={userData} />
  );
}
