"use client";

import { AiAgent } from "ai-agent";
import "ai-agent/dist/tailwind.css";
import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const STORAGE_KEY = "muapi_key";

const normalizeApiKey = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== "null" && trimmed !== "undefined" ? trimmed : null;
};

/**
 * AgentChatClient — mirrors muapiapp's AgentClient.js.
 * Renders the AiAgent library component with server-fetched agent details
 * and optional initial history.
 *
 * IMPORTANT: StandaloneShell is NOT in the tree on /agents/* pages, so we
 * must set up our own axios interceptor here to inject the API key into
 * all requests made by the AiAgent library.
 */
export default function AgentChatClient({ agentDetails, initialHistory, userData }) {
  const interceptorRef = useRef(null);
  const router = useRouter();

  console.log("[AgentChatClient] Rendering", { 
    hasAgentDetails: !!agentDetails, 
    hasHistory: !!initialHistory, 
    hasUserData: !!userData 
  });

  useEffect(() => {
    const getKey = () => {
      if (typeof window === "undefined") return null;
      const fromStorage = normalizeApiKey(localStorage.getItem(STORAGE_KEY));
      if (fromStorage) return fromStorage;
      const match = document.cookie.match(/muapi_key=([^;]+)/);
      return match ? normalizeApiKey(match[1]) : null;
    };

    const apiKey = getKey();
    if (!apiKey) return;

    interceptorRef.current = axios.interceptors.request.use((config) => {
      const isRelative =
        config.url.startsWith("/") || !config.url.startsWith("http");
      // Include specific proxy paths to be sure
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');
      
      if (isRelative || isInternalProxy) {
        config.headers["x-api-key"] = apiKey;
      }
      return config;
    });

    return () => {
      if (interceptorRef.current !== null) {
        axios.interceptors.request.eject(interceptorRef.current);
      }
    };
  }, []);

  const useUser = useCallback(
    () => ({
      user: {
        username: userData?.email?.split("@")[0] || "Studio User",
        name: userData?.email?.split("@")[0] || "Studio User",
        email: userData?.email || null,
        profile_photo: null,
        balance: userData?.balance || 0,
      },
      isAuthorized: !!userData,
    }),
    [userData]
  );

  if (!agentDetails) {
    return (
      <div className="h-screen w-full bg-[#030303] text-white flex items-center justify-center p-8">
        <div className="w-full max-w-md border border-white/10 bg-white/[0.03] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-[#d9ff00]/10 border border-[#d9ff00]/20 flex items-center justify-center text-[#d9ff00]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] mb-3">
            智能体详情加载失败
          </h1>
          <p className="text-sm leading-relaxed text-white/45 mb-6">
            打开智能体对话需要有效的 Muapi API Key。请回到工作台，在设置里保存 API Key 后再进入。
          </p>
          <button
            type="button"
            onClick={() => router.push("/studio/agents")}
            className="px-5 py-2.5 rounded-lg bg-[#d9ff00] text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-colors"
          >
            返回智能体
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <AiAgent
        initialAgentDetails={agentDetails}
        initialHistory={initialHistory}
        useUser={useUser}
        usedIn="muapiapp"
      />
    </div>
  );
}
