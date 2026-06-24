'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ImageStudio, VideoStudio, ClippingStudio, VibeMotionStudio, LipSyncStudio, CinemaStudio, AudioStudio, MarketingStudio, WorkflowStudio, AgentStudio, AppsStudio } from 'studio';

const DesignAgentStudio = dynamic(() => import('studio').then(mod => mod.DesignAgentStudio), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-black flex items-center justify-center text-white/20">Loading Design Studio...</div>
});
import axios from 'axios';

const TABS = [
  { id: 'image',   label: 'Image Studio' },
  { id: 'video',   label: 'Video Studio' },
  { id: 'audio',   label: 'Audio Studio' },
  { id: 'clipping', label: 'AI Clipping' },
  { id: 'vibe-motion', label: 'Vibe Motion' },
  { id: 'lipsync', label: 'Lip Sync' },
  { id: 'cinema',  label: 'Cinema Studio' },
  { id: 'marketing', label: 'Marketing Studio' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'agents', label: 'Agents' },
  { id: 'design-agent', label: 'Design Agent' },
  { id: 'apps', label: 'Explore Apps' },
];

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || [];
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

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

  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };

  // ─── 1PRA1 internal mode ──────────────────────────────────────────────────
  // No user-level MuAPI key. Server holds the master key and injects it via
  // the proxy. We only need to confirm the admin session is valid.
  const [hasMounted, setHasMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [balance, setBalance] = useState(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  // ─── Active project (for grouping generations) ────────────────────────────
  const ACTIVE_PROJECT_KEY = '1pra1_active_project_id';
  const TYPE_FILTER_KEY = '1pra1_type_filter';
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [hydratedProject, setHydratedProject] = useState(false);
  const [projectGenerations, setProjectGenerations] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [hydratedFilter, setHydratedFilter] = useState(false);

  const STUDIO_TABS_WITH_FILTER = ['image', 'video', 'audio', 'lipsync', 'cinema'];

  const loadProjects = useCallback(async () => {
    try {
      const r = await fetch('/api/projects', { credentials: 'include' });
      if (!r.ok) return;
      const data = await r.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  // Normalize DB row → studio history entry shape
  const mapDbToEntry = useCallback((row) => {
    if (!row) return null;
    let params = {};
    try { params = row.params ? JSON.parse(row.params) : {}; } catch {}
    return {
      id: row.id,
      url: row.output_url,
      prompt: row.prompt || '',
      model: row.model || '',
      type: row.type,
      aspect_ratio: params.aspect_ratio || null,
      duration: params.duration || null,
      timestamp: row.created_at,
      params,
    };
  }, []);

  // Drag and Drop
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  useEffect(() => {
    setHasMounted(true);
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async r => {
        if (!r.ok) {
          window.location.href = '/login';
          return;
        }
        const data = await r.json();
        setUserInfo(data);
        setAuthChecked(true);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  // Load projects after auth and hydrate active selection from localStorage
  useEffect(() => {
    if (!authChecked) return;
    loadProjects();
    const stored = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (stored) setActiveProjectId(stored);
    setHydratedProject(true);
    // Refresh list when user comes back to the tab (e.g. from /projects)
    const onFocus = () => loadProjects();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [authChecked, loadProjects]);

  // Hydrate type filter from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(TYPE_FILTER_KEY);
    if (stored) setTypeFilter(stored);
    setHydratedFilter(true);
  }, []);

  // Persist type filter
  useEffect(() => {
    if (!hydratedFilter) return;
    if (typeFilter && typeFilter !== 'all') localStorage.setItem(TYPE_FILTER_KEY, typeFilter);
    else localStorage.removeItem(TYPE_FILTER_KEY);
  }, [typeFilter, hydratedFilter]);

  // Load generations whenever active project changes
  const loadGenerations = useCallback(async (projectId) => {
    try {
      const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '?projectId=none';
      const r = await fetch(`/api/generations${qs}`, { credentials: 'include' });
      if (!r.ok) {
        setProjectGenerations([]);
        return;
      }
      const rows = await r.json();
      setProjectGenerations(Array.isArray(rows) ? rows.map(mapDbToEntry).filter(Boolean) : []);
    } catch {
      setProjectGenerations([]);
    }
  }, [mapDbToEntry]);

  useEffect(() => {
    if (!hydratedProject) return;
    loadGenerations(activeProjectId);
  }, [activeProjectId, hydratedProject, loadGenerations]);

  // Refresh generations when window regains focus (e.g. came back from /projects)
  useEffect(() => {
    if (!hydratedProject) return;
    const onFocus = () => loadGenerations(activeProjectId);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [hydratedProject, activeProjectId, loadGenerations]);

  // Persist active project selection
  useEffect(() => {
    if (!hydratedProject) return;
    if (activeProjectId) localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
    else localStorage.removeItem(ACTIVE_PROJECT_KEY);
  }, [activeProjectId, hydratedProject]);

  // Close project dropdown on outside click
  useEffect(() => {
    if (!projectDropdownOpen) return;
    const handler = (e) => {
      const el = e.target;
      if (el.closest && !el.closest('[data-project-selector]')) {
        setProjectDropdownOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [projectDropdownOpen]);

  // ─── Save each completed generation to the DB ────────────────────────────
  const handleGenerationComplete = useCallback((payload) => {
    if (!payload || !payload.url) return;
    // Snapshot the projectId at the moment the generation finished — if the user
    // switches projects mid-flight we still attribute the result to where it was made.
    const projectIdAtTime = activeProjectId ? parseInt(activeProjectId) : null;
    fetch('/api/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        projectId: projectIdAtTime,
        type: payload.type || 'image',
        prompt: payload.prompt || '',
        model: payload.model || '',
        outputUrl: payload.url,
        params: payload.params || {},
        creditsUsed: payload.creditsUsed || 0,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(saved => {
        // Only inject into the visible gallery if the user is still on the same project
        if (String(projectIdAtTime) !== String(activeProjectId ? parseInt(activeProjectId) : null)) return;
        const entry = mapDbToEntry({
          id: saved?.id,
          output_url: payload.url,
          prompt: payload.prompt || '',
          model: payload.model || '',
          type: payload.type || 'image',
          params: payload.params || {},
          created_at: new Date().toISOString(),
        });
        if (entry) setProjectGenerations(prev => [entry, ...prev.filter(e => e.id !== entry.id)]);
      })
      .catch(err => console.error('[gen save]', err));
  }, [activeProjectId, mapDbToEntry]);

  const activeProject = projects.find(p => String(p.id) === String(activeProjectId));

  // Apply type filter for the gallery
  const filteredGenerations = typeFilter === 'all'
    ? projectGenerations
    : projectGenerations.filter(g => g.type === typeFilter);

  // Count per type (for badges in the filter bar)
  const typeCounts = projectGenerations.reduce((acc, g) => {
    acc[g.type] = (acc[g.type] || 0) + 1;
    acc.all = (acc.all || 0) + 1;
    return acc;
  }, {});

  // Sync tab with URL
  useEffect(() => {
    const info = getWorkflowInfo();
    if (info.id) {
        setActiveTab('workflows');
    } else if (slug.includes('agents')) {
        setActiveTab('agents');
    } else if (slug.includes('design-agent')) {
        setActiveTab('design-agent');
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
    router.push(`/studio/${tabId}`);
  };

  // Auto-hide header
  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    const isDesignAgent = activeTab === 'design-agent';

    if (isEditingWorkflow || isDesignAgent) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams]);

  // Global builder CSS cleanup
  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    const fromDesignAgent = sessionStorage.getItem("fromDesignAgent");

    if ((fromBuilder && activeTab !== 'workflows') || (fromDesignAgent && activeTab !== 'design-agent')) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      sessionStorage.removeItem("fromDesignAgent");
      window.location.reload();
    }
  }, [activeTab]);

  // Fetch user balance from /api/auth/me (or dedicated endpoint) periodically
  const refreshMe = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' });
      if (r.ok) {
        const data = await r.json();
        setUserInfo(data);
        if (typeof data.credits === 'number') setBalance(data.credits);
      }
    } catch (err) {
      console.error('Me refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    refreshMe();
    const interval = setInterval(refreshMe, 30000);
    return () => clearInterval(interval);
  }, [authChecked, refreshMe]);

  // Axios: ensure no stale x-api-key header
  useEffect(() => {
    delete axios.defaults.headers.common['x-api-key'];
    delete axios.defaults.headers.common['X-Api-Key'];
  }, []);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) setDroppedFiles(files);
  }, []);
  const handleFilesHandled = useCallback(() => { setDroppedFiles(null); }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/login';
  }

  if (!hasMounted || !authChecked) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin text-[#22d3ee] text-3xl">◌</div>
      </div>
    );
  }

  // API key passed to studios is a placeholder — proxy route injects the real key
  const apiKeyProp = 'server-managed';

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
        <div className="fixed inset-0 z-[100] bg-[#22d3ee]/10 backdrop-blur-md border-4 border-dashed border-[#22d3ee]/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-[#0a0a0a] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-[#22d3ee] rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-white">Drop your media here</span>
              <span className="text-sm text-white/40">Images, videos, or audio files</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-white/[0.03] flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-40 gap-4">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="flex items-center justify-center">
              <img src="/logo.webp" alt="Criativos 1PRA1" style={{ height:"32px", objectFit:"contain" }} />
            </div>
            <span className="text-sm font-bold tracking-tight hidden sm:block">Criativos 1PRA1</span>
          </div>

          <div className="flex-1 min-w-0 mx-4 sm:mx-6 relative overflow-hidden h-full flex items-center justify-start lg:justify-center">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#030303] to-transparent pointer-events-none z-10 block lg:hidden" />
            <nav className="flex items-center gap-4 overflow-x-auto scrollbar-none w-full lg:w-auto h-full px-4 lg:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative text-[13px] font-medium transition-all duration-300 whitespace-nowrap px-1 flex-shrink-0 flex items-center h-full ${
                    activeTab === tab.id
                      ? 'text-[#22d3ee]'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#22d3ee] to-[#a855f7] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                  )}
                </button>
              ))}
            </nav>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#030303] to-transparent pointer-events-none z-10 block lg:hidden" />
          </div>

          <div className="flex-shrink-0 flex items-center gap-3">
            {/* Project selector */}
            <div className="relative" data-project-selector>
              <button
                onClick={() => setProjectDropdownOpen(o => !o)}
                title="Projeto ativo — gerações serão salvas nele"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: activeProject?.color || 'rgba(255,255,255,0.25)' }}
                />
                <span className="max-w-[140px] truncate">
                  {activeProject?.name || 'Sem projeto'}
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-50 flex-shrink-0">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {projectDropdownOpen && (
                <div
                  className="absolute top-[calc(100%+6px)] right-0 z-50 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl w-64 overflow-hidden"
                >
                  <div className="px-3 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider border-b border-white/[0.05]">
                    Projeto ativo
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => { setActiveProjectId(null); setProjectDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] hover:bg-white/[0.04] transition-colors ${!activeProjectId ? 'bg-white/[0.03]' : ''}`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white/20 flex-shrink-0" />
                      <span className="text-white/60 flex-1">Sem projeto</span>
                      {!activeProjectId && <span className="text-[#22d3ee] text-[10px]">●</span>}
                    </button>
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setActiveProjectId(String(p.id)); setProjectDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] hover:bg-white/[0.04] transition-colors ${String(p.id) === String(activeProjectId) ? 'bg-white/[0.03]' : ''}`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-white/80 flex-1 truncate">{p.name}</span>
                        <span className="text-[10px] text-white/30">{p.gen_count}</span>
                        {String(p.id) === String(activeProjectId) && <span className="text-[#22d3ee] text-[10px]">●</span>}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-white/[0.05]">
                    <a
                      href="/projects"
                      className="block px-3 py-2.5 text-[12px] text-[#22d3ee] hover:bg-white/[0.04] font-semibold"
                    >
                      Gerenciar projetos →
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 transition-colors">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/90">
                  {userInfo?.credits != null ? `${userInfo.credits.toFixed(1)} cr` : '---'}
                </span>
              </div>
            </div>

            <a
              href="/admin"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
              title="Painel administrativo"
            >
              {userInfo?.name || 'Admin'}
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-[13px] font-bold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/20 transition-colors"
            >
              Sair
            </button>
          </div>
        </header>
      )}

      {/* Studio Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        {/* Type filter bar (only for studios that read historyItems) */}
        {STUDIO_TABS_WITH_FILTER.includes(activeTab) && hydratedProject && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.06] bg-[#0a0a0a] flex-shrink-0">
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-md p-1 border border-white/[0.04]">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'image', label: 'Imagens' },
                { id: 'video', label: 'Vídeos' },
                { id: 'audio', label: 'Áudio' },
                { id: 'lipsync', label: 'Lip Sync' },
                { id: 'cinema', label: 'Cinema' },
              ].map(opt => {
                const count = typeCounts[opt.id] || 0;
                const isActive = typeFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTypeFilter(opt.id)}
                    className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {count > 0 && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-primary/20 text-primary' : 'bg-white/[0.06] text-white/40'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-white/30 font-medium">
              {activeProject ? (
                <>
                  Projeto: <span className="text-white/60">{activeProject.name}</span>
                </>
              ) : (
                <span className="text-white/40 italic">Sem projeto (gerações órfãs)</span>
              )}
            </div>
          </div>
        )}

        {/* Wrap each studio in a flex-1 div so it fills the remaining vertical space */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {activeTab === 'image'   && <ImageStudio   apiKey={apiKeyProp} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} onGenerationComplete={handleGenerationComplete} historyItems={STUDIO_TABS_WITH_FILTER.includes(activeTab) ? filteredGenerations : undefined} />}
          {activeTab === 'video'   && <VideoStudio   apiKey={apiKeyProp} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} onGenerationComplete={handleGenerationComplete} historyItems={STUDIO_TABS_WITH_FILTER.includes(activeTab) ? filteredGenerations : undefined} />}
          {activeTab === 'clipping' && <ClippingStudio apiKey={apiKeyProp} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
          {activeTab === 'vibe-motion' && <VibeMotionStudio apiKey={apiKeyProp} />}
          {activeTab === 'lipsync' && <LipSyncStudio apiKey={apiKeyProp} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} onGenerationComplete={handleGenerationComplete} historyItems={STUDIO_TABS_WITH_FILTER.includes(activeTab) ? filteredGenerations : undefined} />}
          {activeTab === 'cinema'  && <CinemaStudio  apiKey={apiKeyProp} onGenerationComplete={handleGenerationComplete} historyItems={STUDIO_TABS_WITH_FILTER.includes(activeTab) ? filteredGenerations : undefined} />}
          {activeTab === 'audio'   && <AudioStudio   apiKey={apiKeyProp} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} onGenerationComplete={handleGenerationComplete} historyItems={STUDIO_TABS_WITH_FILTER.includes(activeTab) ? filteredGenerations : undefined} />}
          {activeTab === 'marketing' && <MarketingStudio apiKey={apiKeyProp} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
          {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKeyProp} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
          {activeTab === 'agents' && <AgentStudio apiKey={apiKeyProp} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
          {activeTab === 'design-agent' && <DesignAgentStudio apiKey={apiKeyProp} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
          {activeTab === 'apps' && <AppsStudio apiKey={apiKeyProp} />}
        </div>
      </div>
    </div>
  );
}
