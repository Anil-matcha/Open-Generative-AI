'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ImageStudio, VideoStudio, LipSyncStudio, CinemaStudio, MarketingStudio, WorkflowStudio, AgentStudio, AppsStudio, getUserBalance } from 'studio';
import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';

const TABS = [
  { id: 'image',   label: '图像创作' },
  { id: 'video',   label: '视频创作' },
  { id: 'lipsync', label: '口型同步' },
  { id: 'cinema',  label: '电影创作' },
  { id: 'marketing', label: '营销创作' },
  { id: 'workflows', label: '工作流' },
  { id: 'agents', label: '智能体' },
  { id: 'apps', label: '应用中心' },
];

const STORAGE_KEY = 'muapi_key';
const REQUIRE_KEY_STORAGE_KEY = 'muapi_require_key';

const normalizeApiKey = (value) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== 'null' && trimmed !== 'undefined' ? trimmed : null;
};

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || []; 
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  // Helper to extract workflow details precisely from either route structure
  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  // Initialize activeTab from URL slug/params or default to 'image'
  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };
  
  const [apiKey, setApiKey] = useState(null);
  const [requireApiKey, setRequireApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  
  const [balance, setBalance] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Sync tab with URL if user navigates manually or via browser back/forward
  useEffect(() => {
    const info = getWorkflowInfo();
    if (info.id) {
        setActiveTab('workflows');
    } else if (slug.includes('agents')) {
        setActiveTab('agents');
    } else if (slug.includes('apps')) {
        setActiveTab('apps');
    } else {
        const firstSegment = slug[0];
        if (firstSegment && TABS.find(t => t.id === firstSegment)) {
          setActiveTab(firstSegment);
        }
    }
  }, [slug, getWorkflowInfo]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    router.push(`/studio/${tabId}`);
  };

  // Auto-hide header when inside a specific workflow view
  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    if (isEditingWorkflow) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams]);

  // Global builder CSS cleanup when switching away from Workflows tab
  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder && activeTab !== 'workflows') {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, [activeTab]);

  const fetchBalance = useCallback(async (key) => {
    try {
      const data = await getUserBalance(key);
      setBalance(data.balance);
    } catch (err) {
      console.error('Balance fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    const stored = normalizeApiKey(localStorage.getItem(STORAGE_KEY));
    const storedRequireKey = localStorage.getItem(REQUIRE_KEY_STORAGE_KEY) === 'true';
    setRequireApiKey(storedRequireKey);
    if (stored) {
      setApiKey(stored);
      fetchBalance(stored);
      // Sync cookie immediately on mount to establish identity for background requests
      document.cookie = `muapi_key=${stored}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem(STORAGE_KEY);
      document.cookie = "muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [fetchBalance]);

  const handleKeySave = useCallback((key) => {
    const normalizedKey = normalizeApiKey(key);
    if (!normalizedKey) return;
    localStorage.setItem(STORAGE_KEY, normalizedKey);
    setApiKey(normalizedKey);
    fetchBalance(normalizedKey);
    document.cookie = `muapi_key=${normalizedKey}; path=/; max-age=31536000; SameSite=Lax`;
  }, [fetchBalance]);

  const handleRequireApiKeyChange = useCallback((enabled) => {
    localStorage.setItem(REQUIRE_KEY_STORAGE_KEY, String(enabled));
    setRequireApiKey(enabled);
    setShowSettings(false);

    if (!enabled && !apiKey) {
      document.cookie = "muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [apiKey]);

  const handleKeyChange = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey(null);
    setBalance(null);
    setShowSettings(false);
    document.cookie = "muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }, []);

  // Inject API key into all outgoing Axios requests (prop-based approach)
  // We use an interceptor to be selective and NOT send the key to external domains like S3
  useEffect(() => {
    // Safety: Clear any global defaults that might have been set previously
    delete axios.defaults.headers.common['x-api-key'];

    if (!apiKey) return;

    const interceptorId = axios.interceptors.request.use((config) => {
      // Check if URL is local/proxied
      const isRelative = config.url.startsWith('/') || !config.url.startsWith('http');
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');

      if (isRelative || isInternalProxy) {
        config.headers['x-api-key'] = apiKey;
      }
      
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [apiKey]);

  // Poll for balance every 30 seconds if key is present
  useEffect(() => {
    if (!apiKey) return;
    const interval = setInterval(() => fetchBalance(apiKey), 30000);
    return () => clearInterval(interval);
  }, [apiKey, fetchBalance]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the container itself, not moving between children
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDroppedFiles(files);
    }
  }, []);

  const handleFilesHandled = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  if (!hasMounted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin text-[#d9ff00] text-3xl">◌</div>
    </div>
  );

  if (requireApiKey && !apiKey) {
    return (
      <ApiKeyModal
        onSave={handleKeySave}
        requireApiKey={requireApiKey}
        onToggleRequireApiKey={handleRequireApiKeyChange}
      />
    );
  }

  const hasApiKey = Boolean(apiKey);
  const balanceLabel = hasApiKey
    ? `余额 ${balance !== null ? `$${balance}` : '—'}`
    : '游客模式';

  return (
    <div 
      className="h-screen bg-[#030303] flex flex-col overflow-hidden text-white relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-[#d9ff00]/10 backdrop-blur-md border-4 border-dashed border-[#d9ff00]/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-[#d9ff00] rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">把素材拖到这里</span>
              <span className="text-sm text-white/40">图片、视频或音频都可以</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-40">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">Open Generative AI</span>
          </div>

          {/* Center: Navigation */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-4 text-[13px] font-medium transition-all whitespace-nowrap px-1 ${
                  activeTab === tab.id
                    ? 'text-[#d9ff00]'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d9ff00] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 transition-colors">
              <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 animate-pulse' : 'bg-white/30'}`} />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/90">
                  {balanceLabel}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              title={hasApiKey ? '设置 — API 密钥、本地模型、偏好' : '设置 — 登录开关、本地模型、偏好'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>设置</span>
            </button>
          </div>
        </header>
      )}

      {/* Studio Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'image'   && <ImageStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'video'   && <VideoStudio   apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'lipsync' && <LipSyncStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'cinema'  && <CinemaStudio  apiKey={apiKey} />}
        {activeTab === 'marketing' && <MarketingStudio apiKey={apiKey} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'agents' && <AgentStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'apps' && <AppsStudio apiKey={apiKey} />}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-2">设置</h2>
            <p className="text-white/40 text-[13px] mb-8">
              管理你的创作偏好、登录方式和本地设置。
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="bg-white/5 border border-white/[0.03] rounded-md p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-white/30 mb-2">
                      进入时要求输入 API Key
                    </label>
                    <p className="text-[12px] leading-relaxed text-white/40">
                      默认关闭。需要时再打开，系统就会在进入工作台前先检查是否已保存 Muapi API Key。
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={requireApiKey}
                    aria-label="进入时要求输入 API Key"
                    onClick={() => handleRequireApiKeyChange(!requireApiKey)}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full border transition-colors ${
                      requireApiKey ? 'border-[#d9ff00] bg-[#d9ff00]' : 'border-white/10 bg-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-black transition-transform ${
                        requireApiKey ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/[0.03] rounded-md p-4">
                <label className="block text-xs font-bold text-white/30 mb-2">
                   {hasApiKey ? '当前 API Key' : 'API Key'}
                </label>
                <div className="text-[13px] font-mono text-white/80">
                  {hasApiKey ? `${apiKey.slice(0, 8)}••••••••••••••••` : '尚未保存 API Key'}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {hasApiKey && (
                <button
                  onClick={handleKeyChange}
                  className="flex-1 h-10 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
                >
                  清除 API Key
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className={`h-10 rounded-md bg-white/5 text-white/80 hover:bg-white/10 text-xs font-semibold transition-all border border-white/5 ${hasApiKey ? 'flex-1' : 'flex-1'}`}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
