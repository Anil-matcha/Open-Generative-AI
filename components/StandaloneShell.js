'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ImageStudio,
  VideoStudio,
  LipSyncStudio,
  CinemaStudio,
  MarketingStudio,
  WorkflowStudio,
  AgentStudio,
  AppsStudio,
  ApiHealthStudio,
  ApiProviderStudio,
  StudioShell,
  TaskCenter,
  buildProviderRequestHeaders,
  createUnavailableLocalRuntime,
  normalizeApiKey,
  useApiProviderState,
} from 'studio';
import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';
import { createNextStudioAdapter } from './nextStudioAdapter';

const TABS = [
  { id: 'image',   label: '图像创作' },
  { id: 'video',   label: '视频创作' },
  { id: 'lipsync', label: '口型同步', status: '开发中' },
  { id: 'cinema',  label: '电影创作', status: '开发中' },
  { id: 'marketing', label: '营销创作' },
  { id: 'workflows', label: '工作流', status: '开发中' },
  { id: 'agents', label: '智能体', status: '开发中' },
  { id: 'apps', label: '应用中心', status: '开发中' },
  { id: 'api-providers', label: 'API管理' },
  { id: 'api-health', label: 'API检测' },
];

const PRIMARY_TABS = TABS.filter((tab) => ['image', 'video', 'lipsync', 'cinema', 'marketing'].includes(tab.id));
const OTHER_TABS = TABS.filter((tab) => ['workflows', 'agents', 'apps', 'api-providers', 'api-health'].includes(tab.id));
const TEAM_ACCESS_STORAGE_KEY = 'mozen_team_access_v1';
const TEAM_INVITE_CODE = 'AIGC2026';

const API_STATUS_TONE = {
  ok: {
    label: 'API已连接',
    dotClass: 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.55)]',
    pillClass: 'border-green-400/15 bg-green-400/10 text-green-100',
    badgeClass: 'border-green-400/20 bg-green-400/10 text-green-200',
  },
  warn: {
    label: 'API部分异常',
    dotClass: 'bg-yellow-300 shadow-[0_0_12px_rgba(253,224,71,0.55)]',
    pillClass: 'border-yellow-300/20 bg-yellow-300/10 text-yellow-100',
    badgeClass: 'border-yellow-300/20 bg-yellow-300/10 text-yellow-100',
  },
  error: {
    label: 'API异常',
    dotClass: 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.55)]',
    pillClass: 'border-red-400/20 bg-red-400/10 text-red-100',
    badgeClass: 'border-red-400/20 bg-red-400/10 text-red-100',
  },
  checking: {
    label: 'API检查中',
    dotClass: 'bg-white/40',
    pillClass: 'border-white/[0.06] bg-white/[0.04] text-white/60',
    badgeClass: 'border-white/[0.08] bg-white/[0.04] text-white/50',
  },
};

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || []; 
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;
  const slugKey = Array.isArray(slug) ? slug.join('/') : String(slug || '');
  const studioAdapter = useMemo(
    () =>
      createNextStudioAdapter({
        router,
        slug,
        idFromParams,
        tabFromParams,
        tabs: TABS,
      }),
    [router, slugKey, idFromParams, tabFromParams],
  );
  const localRuntime = useMemo(() => createUnavailableLocalRuntime({ kind: 'next' }), []);

  const { id: urlWorkflowId } = studioAdapter.routing.getWorkflowInfo();
  
  const [activeTab, setActiveTab] = useState(() => studioAdapter.routing.getActiveTab('image'));
  const {
    apiConfig,
    apiKey,
    activeProvider,
    apiReady,
    requireApiKey,
    hasMounted,
    saveApiConfig,
    saveApiKey,
    setRequireApiKey: setSharedRequireApiKey,
  } = useApiProviderState(studioAdapter);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showApiStatus, setShowApiStatus] = useState(false);
  const [apiModelStatus, setApiModelStatus] = useState(null);
  const [apiModelStatusLoading, setApiModelStatusLoading] = useState(false);
  const [apiModelStatusError, setApiModelStatusError] = useState('');
  const [teamCodeDraft, setTeamCodeDraft] = useState('');
  const [teamCodeError, setTeamCodeError] = useState('');
  const [teamAccessGranted, setTeamAccessGranted] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const [showOtherApps, setShowOtherApps] = useState(false);
  const otherAppsRef = useRef(null);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Sync tab with URL if user navigates manually or via browser back/forward
  useEffect(() => {
    setActiveTab(studioAdapter.routing.getActiveTab('image'));
  }, [studioAdapter]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    studioAdapter.routing.setActiveTab(tabId);
  }, [studioAdapter]);

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

  const refreshApiModelStatus = useCallback(async () => {
    setApiModelStatusLoading(true);
    setApiModelStatusError('');
    try {
      const response = await fetch('/api/provider/status', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`状态检查失败：${response.status}`);
      }
      const data = await response.json();
      setApiModelStatus(data);
    } catch (error) {
      setApiModelStatusError(error?.message || '状态检查失败');
      setApiModelStatus(null);
    } finally {
      setApiModelStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    setTeamAccessGranted(studioAdapter.storage.getItem(TEAM_ACCESS_STORAGE_KEY) === 'granted');
  }, [studioAdapter]);

  useEffect(() => {
    if (hasMounted) refreshApiModelStatus();
  }, [hasMounted, refreshApiModelStatus]);

  const handleApiConfigSave = useCallback((nextConfig) => {
    saveApiConfig(nextConfig);
  }, [saveApiConfig]);

  const handleKeySave = useCallback((key) => {
    const nextConfig = saveApiKey(key);
    if (!nextConfig) return;
    setShowSettings(false);
  }, [saveApiKey]);

  const handleTeamInviteSubmit = useCallback(() => {
    const normalizedCode = String(teamCodeDraft || '').trim();
    if (!normalizedCode) {
      setTeamCodeError('请输入团队邀请码');
      return;
    }
    if (normalizedCode !== TEAM_INVITE_CODE) {
      setTeamCodeError('团队邀请码不正确');
      return;
    }
    studioAdapter.storage.setItem(TEAM_ACCESS_STORAGE_KEY, 'granted');
    setTeamAccessGranted(true);
    setTeamCodeDraft('');
    setTeamCodeError('');
  }, [studioAdapter, teamCodeDraft]);

  const handleTeamAccessClear = useCallback(() => {
    studioAdapter.storage.removeItem(TEAM_ACCESS_STORAGE_KEY);
    setTeamAccessGranted(false);
    setTeamCodeDraft('');
    setTeamCodeError('');
  }, [studioAdapter]);

  const handleRequireApiKeyChange = useCallback((enabled) => {
    setSharedRequireApiKey(enabled);
    setShowSettings(false);
  }, [setSharedRequireApiKey]);

  // Inject API key into all outgoing Axios requests (prop-based approach)
  // We use an interceptor to be selective and NOT send the key to external domains like S3
  useEffect(() => {
    // Safety: Clear any global defaults that might have been set previously
    delete axios.defaults.headers.common['x-api-key'];
    delete axios.defaults.headers.common.Authorization;

    const interceptorId = axios.interceptors.request.use((config) => {
      const requestUrl = config.url || '';
      const isProviderProxy = requestUrl.includes('/api/provider') || requestUrl.includes('/api/yunwu');
      const isMuapiSurface =
        requestUrl.includes('/api/api/v1') ||
        requestUrl.includes('/api/workflow') ||
        requestUrl.includes('/api/agents') ||
        requestUrl.includes('/api/app');

      if (isProviderProxy) {
        config.headers = {
          ...config.headers,
          ...buildProviderRequestHeaders(apiConfig),
        };
      }

      if (isMuapiSurface) {
        const headers = buildProviderRequestHeaders(apiConfig);
        const activeKey = normalizeApiKey(activeProvider.apiKey);
        config.headers = {
          ...config.headers,
          ...headers,
          ...(activeKey ? { 'x-api-key': activeKey } : {}),
        };
      }
      
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [activeProvider, apiConfig]);

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

  useEffect(() => {
    if (!showOtherApps) return undefined;
    const handler = (event) => {
      if (otherAppsRef.current && !otherAppsRef.current.contains(event.target)) {
        setShowOtherApps(false);
      }
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [showOtherApps]);

  if (!hasMounted) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="animate-spin text-[#d9ff00] text-3xl">◌</div>
    </div>
  );

  if (!teamAccessGranted) {
    return (
      <div className="min-h-screen bg-[#030303] px-4 text-white flex items-center justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl">
          <div className="border-b border-white/[0.06] px-5 py-4">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-black">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-sm font-black tracking-tight">MozenAIGC</span>
            </div>
            <h1 className="text-base font-black text-white/90">团队邀请码</h1>
            <p className="mt-1 text-[12px] font-semibold leading-relaxed text-white/35">
              首次使用需要验证团队邀请码，验证后会在当前浏览器保持登录状态。
            </p>
          </div>

          <div className="p-5">
            <label className="mb-2 block text-xs font-bold text-white/35">
              输入团队邀请码
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={teamCodeDraft}
                onChange={(event) => {
                  setTeamCodeDraft(event.target.value);
                  setTeamCodeError('');
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleTeamInviteSubmit();
                }}
                placeholder="团队邀请码"
                className="h-10 min-w-0 flex-1 rounded-md border border-white/[0.06] bg-black/30 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/50"
                autoFocus
                suppressHydrationWarning
              />
              <button
                type="button"
                onClick={handleTeamInviteSubmit}
                className="h-10 shrink-0 rounded-md bg-[#d9ff00] px-4 text-xs font-bold text-black transition-colors hover:bg-[#e5ff33]"
              >
                进入
              </button>
            </div>
            {teamCodeError && (
              <p className="mt-2 text-[12px] font-semibold text-red-300">{teamCodeError}</p>
            )}
            <div className="mt-4 rounded-md border border-white/[0.05] bg-white/[0.025] px-3 py-2 text-[11px] font-semibold leading-relaxed text-white/30">
              这是工作台的轻量访问标记，不会连接或保存任何上游 API Key。
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (requireApiKey && !apiReady) {
    return (
      <ApiKeyModal
        onSave={handleKeySave}
        requireApiKey={requireApiKey}
        onToggleRequireApiKey={handleRequireApiKeyChange}
        providerName={activeProvider.name}
        providerUrl={activeProvider.id === 'yunwu' ? 'https://yunwu.ai/' : activeProvider.baseUrl}
      />
    );
  }

  const apiStatusLevel = apiModelStatusError
    ? 'error'
    : apiModelStatusLoading && !apiModelStatus
      ? 'checking'
      : apiModelStatus?.status || 'checking';
  const apiStatusTone = API_STATUS_TONE[apiStatusLevel] || API_STATUS_TONE.checking;
  const apiStatusSummary = apiModelStatus?.summary || { total: 0, ok: 0, warn: 0, error: 0 };
  const apiStatusLabel =
    apiStatusLevel === 'ok'
      ? 'API已连接'
      : apiStatusLevel === 'warn'
        ? `API部分异常 ${apiStatusSummary.warn + apiStatusSummary.error}`
        : apiStatusLevel === 'error'
          ? 'API异常'
          : 'API检查中';
  const imageStatusModels = (apiModelStatus?.models || []).filter((model) => model.kind === 'image');
  const videoStatusModels = (apiModelStatus?.models || []).filter((model) => model.kind === 'video');
  const apiStatusAction = (
    <button
      type="button"
      onClick={() => {
        setShowApiStatus(true);
        refreshApiModelStatus();
      }}
      className={`hidden items-center gap-3 rounded-full border px-3 py-1.5 transition-colors hover:border-[#d9ff00]/35 lg:flex ${apiStatusTone.pillClass}`}
      title="查看生图和生视频模型配置状态"
    >
      <div className={`h-2 w-2 rounded-full ${apiStatusTone.dotClass}`} />
      <div className="flex flex-col text-left">
        <span className="text-xs font-bold text-white/90">
          {apiStatusLabel}
        </span>
      </div>
    </button>
  );
  const settingsAction = (
    <button
      onClick={() => setShowSettings(true)}
      title={teamAccessGranted ? '团队访问已验证' : '输入团队邀请码'}
      className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[13px] font-bold text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white md:px-3"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      <span className="hidden sm:inline">设置</span>
    </button>
  );

  return (
    <StudioShell
      title="MozenAIGC"
      activeTab={activeTab}
      primaryTabs={PRIMARY_TABS}
      secondaryTabs={OTHER_TABS}
      onTabChange={handleTabChange}
      headerVisible={isHeaderVisible}
      onOpenTaskCenter={() => setShowTaskCenter(true)}
      apiStatusAction={apiStatusAction}
      rightActions={settingsAction}
      otherAppsRef={otherAppsRef}
      otherAppsOpen={showOtherApps}
      onToggleOtherApps={() => setShowOtherApps((value) => !value)}
      onCloseOtherApps={() => setShowOtherApps(false)}
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

      <TaskCenter
        open={showTaskCenter}
        onClose={() => setShowTaskCenter(false)}
        storage={studioAdapter.storage}
      />

      {/* API Status Modal */}
      {showApiStatus && (
        <div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowApiStatus(false);
          }}
        >
          <div className="flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-black text-white/90">模型 API 状态</h2>
                <p className="mt-1 text-[12px] font-semibold text-white/35">
                  只检查服务端是否配置了必要入口，不显示任何密钥内容
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowApiStatus(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00]"
                title="关闭"
              >
                ×
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.05] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[12px] font-black ${apiStatusTone.badgeClass}`}>
                  <span className={`h-2 w-2 rounded-full ${apiStatusTone.dotClass}`} />
                  {apiStatusLabel}
                </span>
                <span className="text-[11px] font-semibold text-white/35">
                  正常 {apiStatusSummary.ok}/{apiStatusSummary.total}
                </span>
              </div>
              <button
                type="button"
                onClick={refreshApiModelStatus}
                disabled={apiModelStatusLoading}
                className="h-8 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-bold text-white/55 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00] disabled:opacity-40"
              >
                {apiModelStatusLoading ? '检查中' : '重新检查'}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-5">
              {apiModelStatusError ? (
                <div className="rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-[12px] font-bold text-red-100">
                  {apiModelStatusError}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: '生图模型', models: imageStatusModels },
                    { title: '生视频模型', models: videoStatusModels },
                  ].map((group) => (
                    <div key={group.title} className="rounded-md border border-white/[0.06] bg-white/[0.025] p-4">
                      <div className="mb-3 text-[12px] font-black text-white/70">{group.title}</div>
                      <div className="space-y-2">
                        {group.models.map((model) => {
                          const tone = API_STATUS_TONE[model.status] || API_STATUS_TONE.checking;
                          const label = model.status === 'ok' ? '正常' : model.status === 'warn' ? '注意' : '异常';
                          return (
                            <div key={model.id} className="rounded-md border border-white/[0.05] bg-black/25 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[12px] font-black text-white/80" title={model.label}>
                                    {model.label}
                                  </div>
                                  <div className="mt-1 truncate text-[10px] font-semibold text-white/28" title={model.provider}>
                                    {model.provider}
                                  </div>
                                </div>
                                <span className={`shrink-0 rounded border px-2 py-1 text-[10px] font-black ${tone.badgeClass}`}>
                                  {label}
                                </span>
                              </div>
                              <div className="mt-2 line-clamp-2 text-[11px] font-semibold leading-relaxed text-white/38" title={model.detail}>
                                {model.detail}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApiStatus(false);
                    handleTabChange('api-health');
                  }}
                  className="h-9 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-bold text-white/55 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00]"
                >
                  打开 API 检测
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApiStatus(false);
                    handleTabChange('api-providers');
                  }}
                  className="h-9 rounded-md border border-white/[0.06] bg-white/[0.03] px-3 text-[11px] font-bold text-white/55 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00]"
                >
                  高级 API 管理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Studio Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'image'   && <ImageStudio   apiKey={apiKey} apiConfig={apiConfig} localRuntime={localRuntime} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} onMissingApiKey={() => handleTabChange('api-providers')} />}
        {activeTab === 'video'   && <VideoStudio   apiKey={apiKey} apiConfig={apiConfig} localRuntime={localRuntime} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'lipsync' && <LipSyncStudio apiKey={null} localRuntime={localRuntime} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'cinema'  && <CinemaStudio  apiKey={null} localRuntime={localRuntime} />}
        {activeTab === 'marketing' && <MarketingStudio apiKey={apiKey} apiConfig={apiConfig} localRuntime={localRuntime} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKey} apiConfig={apiConfig} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'agents' && <AgentStudio apiKey={apiKey} apiConfig={apiConfig} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'apps' && <AppsStudio apiKey={apiKey} apiConfig={apiConfig} />}
        {activeTab === 'api-providers' && <ApiProviderStudio apiConfig={apiConfig} onSave={handleApiConfigSave} />}
        {activeTab === 'api-health' && <ApiHealthStudio apiKey={apiKey} apiConfig={apiConfig} onSave={handleApiConfigSave} onMissingApiKey={() => handleTabChange('api-providers')} />}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSettings(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-md border border-white/[0.08] bg-[#080808]/95 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-black text-white/90">团队邀请码</h2>
                <p className="mt-1 text-[12px] font-semibold text-white/35">
                  当前浏览器已保持团队访问状态
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-white/45 transition-colors hover:border-[#d9ff00]/35 hover:text-[#d9ff00]"
                title="关闭"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-md border border-green-400/15 bg-green-400/10 px-3 py-2 text-[11px] font-black text-green-100">
                已验证
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-white/35">
                  重新输入团队邀请码
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={teamCodeDraft}
                    onChange={(event) => {
                      setTeamCodeDraft(event.target.value);
                      setTeamCodeError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleTeamInviteSubmit();
                    }}
                    placeholder="团队邀请码"
                    className="h-10 min-w-0 flex-1 rounded-md border border-white/[0.06] bg-black/30 px-3 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-[#d9ff00]/50"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={handleTeamInviteSubmit}
                    className="h-10 shrink-0 rounded-md bg-[#d9ff00] px-4 text-xs font-bold text-black transition-colors hover:bg-[#e5ff33]"
                  >
                    验证
                  </button>
                </div>
                {teamCodeError && (
                  <p className="mt-2 text-[12px] font-semibold text-red-300">{teamCodeError}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleTeamAccessClear}
                  className="flex-1 h-10 rounded-md bg-white/5 text-white/45 hover:bg-white/10 text-xs font-semibold transition-all border border-white/5"
                >
                  退出团队
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 h-10 rounded-md bg-white/5 text-white/80 hover:bg-white/10 text-xs font-semibold transition-all border border-white/5"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudioShell>
  );
}
