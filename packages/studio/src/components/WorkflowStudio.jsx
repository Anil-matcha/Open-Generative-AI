"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getTemplateWorkflows,
  getUserWorkflows,
  getPublishedWorkflows,
  createWorkflow,
  updateWorkflowName,
  deleteWorkflow,
  getWorkflowInputs,
  executeWorkflow,
  getAllNodeSchemas,
  getWorkflowData,
} from "../muapi.js";
import { getActiveProvider, providerSupports } from "../apiProviders.js";
import dynamic from "next/dynamic";

const WorkflowUI = dynamic(() => import("./WorkflowUI"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/5 border-t-[#d9ff00] rounded-full animate-spin" />
        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          正在加载编辑器...
        </div>
      </div>
    </div>
  ),
});
const MODULE_IN_DEVELOPMENT = true;

const WORKFLOW_LABELS = {
  prompt: "提示词",
  Prompt: "提示词",
  image: "图片",
  image_url: "图片链接",
  video: "视频",
  video_url: "视频链接",
  audio: "音频",
  audio_url: "音频链接",
  aspect_ratio: "画幅",
  "Aspect Ratio": "画幅",
  width: "宽度",
  Width: "宽度",
  height: "高度",
  Height: "高度",
  resolution: "分辨率",
  Resolution: "分辨率",
  quality: "质量",
  Quality: "质量",
  duration: "时长",
  Duration: "时长",
  seed: "随机种子",
  Seed: "随机种子",
  model: "模型",
  Model: "模型",
  num_images: "生成数量",
  "Number of images": "生成数量",
  negative_prompt: "负面提示词",
  "Negative Prompt": "负面提示词",
  "LoRA Ids": "LoRA 模型",
};

const getWorkflowFieldLabel = (key, prop) => {
  const title = prop?.title || key;
  return WORKFLOW_LABELS[key] || WORKFLOW_LABELS[title] || title;
};

const getWorkflowFieldPlaceholder = (key, prop) =>
  prop?.enum?.length
    ? `请选择${getWorkflowFieldLabel(key, prop)}`
    : `请输入${getWorkflowFieldLabel(key, prop)}`;

function WorkflowCard({ workflow, onClick, activeTab, onRename, onDelete }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      onClick={() => onClick(workflow)}
      className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/5 bg-[#0a0a0a] transition-all hover:border-[#d9ff00]/30 hover:scale-[1.02] shadow-2xl"
    >
      {workflow.thumbnail ? (
        <img
          src={workflow.thumbnail}
          alt={workflow.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-20"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Options Dropdown for My Workflows */}
      {activeTab === 'my-workflows' && (
        <div 
          className="absolute top-2 right-2 z-30"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <button
            onClick={() => setShowOptions(!showOptions)}
            onBlur={() => setTimeout(() => setShowOptions(false), 200)}
            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          
          {showOptions && (
            <div className="absolute top-10 right-0 w-32 bg-[#111] border border-white/10 rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in duration-200">
              <button
                onClick={() => onRename(workflow)}
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-white/70 hover:text-[#d9ff00] hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                重命名
              </button>
              <button
                onClick={() => onDelete(workflow.id)}
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                删除
              </button>
            </div>
          )}
        </div>
      )}

      {/* Community Profile Info */}
      {activeTab === 'published' && workflow.user_name && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          <img src={workflow.user_profile || "/user_profile.png"} alt="profile" className="w-4 h-4 rounded-full" />
          <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">{workflow.user_name}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-[10px] font-bold text-[#d9ff00] uppercase tracking-wider mb-1 opacity-80">
          {workflow.category || "通用"}
        </div>
        <h3 className="text-sm font-bold text-white truncate group-hover:text-[#d9ff00] transition-colors">
          {workflow.name || "未命名流程"}
        </h3>
      </div>
    </div>
  );
}

function AuthRequiredState({ title, message }) {
  return (
    <div className="flex-1 bg-[#050505] flex items-center justify-center p-8">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.03] rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-[#d9ff00]/10 border border-[#d9ff00]/20 flex items-center justify-center text-[#d9ff00]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-3">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-white/45">
          {message}
        </p>
      </div>
    </div>
  );
}

export default function WorkflowStudio({ apiKey, apiConfig, isHeaderVisible = true, onToggleHeader }) {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || [];
  const idFromParams = params?.id;     // exists on /workflow/[id]/[tab] route
  const tabFromParams = params?.tab;   // exists on /workflow/[id]/[tab] route
  
  // Robustly extract ID and Tab from either route structure
  const getWorkflowInfo = useCallback(() => {
    // Priority 1: Dedicated /workflow/[id]/[tab] route  
    if (idFromParams) {
      return { id: idFromParams, tab: tabFromParams || null };
    }
    // Priority 2: Catch-all /studio/[[...slug]] route
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId, tab: urlTab } = getWorkflowInfo();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("playground"); // 'playground' | 'builder'
  const [activeMainTab, setActiveMainTab] = useState("templates"); // 'templates' | 'my-workflows' | 'published'
  const [renamingWorkflow, setRenamingWorkflow] = useState(null);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [inputSchema, setInputSchema] = useState(null);
  const [nodeSchemas, setNodeSchemas] = useState(null);
  const [workflowDef, setWorkflowDef] = useState(null);
  const [formData, setFormData] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const normalizedApiKey = typeof apiKey === "string" ? apiKey.trim() : apiKey;
  const hasApiKey = typeof normalizedApiKey === "string"
    ? Boolean(normalizedApiKey && normalizedApiKey !== "null" && normalizedApiKey !== "undefined")
    : Boolean(normalizedApiKey);
  const activeProvider = apiConfig ? getActiveProvider(apiConfig) : null;
  const providerLabel = activeProvider?.shortName || activeProvider?.name || "当前通道";
  const supportsWorkflow = apiConfig ? providerSupports(apiConfig, "workflow") : true;
  

  // Handlers defined early so they can be used in effects
  const handleSelectWorkflow = useCallback(
    async (wf, fromUrl = false) => {
      setSelectedWorkflow(wf);
      setResult(null);
      setError(null);
      
      const targetTab = urlTab || "playground";
      setActiveSubTab(targetTab);

      if (!fromUrl) {
        // Always route to /workflow/[id] so the builder library's useParams().id resolves correctly
        router.push(`/workflow/${wf.id}/${targetTab}`);
      }
    },
    [router, urlTab],
  );

  // Dedicated data fetching effect for the active workflow
  useEffect(() => {
    if (!selectedWorkflow?.id || !hasApiKey) return;

    async function loadWorkflowDetails() {
      try {
        setLoading(true);
        const wfId = selectedWorkflow.id;
        
        // Fetch everything in parallel with allSettled so one failure doesn't block the others
        const results = await Promise.allSettled([
          getWorkflowInputs(apiKey, wfId),
          getAllNodeSchemas(apiKey, wfId),
          getWorkflowData(apiKey, wfId)
        ]);

        // Process Input Schema
        if (results[0].status === 'fulfilled') {
          const response = results[0].value;
          const schema = response.input_data || response;
          setInputSchema(schema);

          const initial = {};
          Object.entries(schema.properties || {}).forEach(([key, prop]) => {
            initial[key] =
              prop.default ||
              (Array.isArray(prop.examples) ? prop.examples[0] : prop.examples) ||
              "";
          });
          setFormData(initial);
        } else {
          console.warn("Input schema not available for this workflow:", results[0].reason);
          setInputSchema(null);
          setFormData({});
        }

        // Process Builder State
        const nodes = results[1].status === 'fulfilled' ? results[1].value : [];
        const def = results[2].status === 'fulfilled' ? results[2].value : { nodes: [], edges: [] };

        setNodeSchemas(nodes);
        setWorkflowDef(def);

        if (results[1].status === 'rejected' || results[2].status === 'rejected') {
          console.error("Builder components failed to load:", results[1].reason, results[2].reason);
          if (!nodes.length && !def.nodes?.length) {
             setError("工作流编辑器数据加载失败，部分功能可能不可用。");
          }
        }
      } catch (err) {
        console.error("Critical error loading pulse details:", err);
        setError("编辑器严重错误：" + err.message);
        setNodeSchemas([]);
        setWorkflowDef({ nodes: [], edges: [] });
      } finally {
        setLoading(false);
      }
    }

    loadWorkflowDetails();
  }, [selectedWorkflow?.id, apiKey, hasApiKey]);

  const handleCreateWorkflow = useCallback(
    async (fromUrl = false) => {
      try {
        setLoading(true);
        if (!supportsWorkflow) {
          setError(`当前 ${providerLabel} 未标记支持工作流。请先在 API 管理中切换通道。`);
          return;
        }
        if (!fromUrl) {
          const payload = {
            workflow_id: null,
            name: "未命名工作流",
            edges: [],
            data: { nodes: [] },
          };
          const response = await createWorkflow(apiKey, payload);
          // Route to /workflow/[id] so useParams().id works in the builder library
          router.push(`/workflow/${response.workflow_id}/builder`);
          return;
        }

        // Initialize state for the new flow
        setSelectedWorkflow({ id: null, name: "未命名工作流" });
        setNodeSchemas([]);
        setWorkflowDef({ nodes: [], edges: [] });
        setActiveSubTab("builder");
      } catch (err) {
        setError("初始化工作流失败：" + err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, providerLabel, router, supportsWorkflow],
  );

  const handleDeleteWorkflow = async (wfId) => {
    if (!confirm("确定要删除这个工作流吗？")) return;
    setIsDeletingId(wfId);
    try {
      await deleteWorkflow(apiKey, wfId);
      setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("删除工作流失败");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleRenameWorkflow = async (e) => {
    e?.preventDefault();
    if (!renamingWorkflow || !newWorkflowName.trim()) return;

    const wfId = renamingWorkflow.id;
    try {
      await updateWorkflowName(apiKey, wfId, newWorkflowName);
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wfId ? { ...w, name: newWorkflowName } : w)),
      );
      if (selectedWorkflow?.id === wfId) {
        setSelectedWorkflow({ ...selectedWorkflow, name: newWorkflowName });
      }
      setRenamingWorkflow(null);
    } catch (err) {
      console.error("Rename failed:", err);
      alert("重命名工作流失败");
    }
  };

  // KEY FIX: If the user is on /studio/workflows/[id], redirect to /workflow/[id]
  // so the builder library's useParams().id resolves correctly, preventing duplicate creation.
  useEffect(() => {
    if (typeof window !== 'undefined' && urlWorkflowId && urlWorkflowId !== 'new') {
      const path = window.location.pathname;
      if (path.startsWith('/studio/workflows/')) {
        const tab = urlTab || 'builder';
        router.replace(`/workflow/${urlWorkflowId}/${tab}`);
      }
    }
  }, [urlWorkflowId, urlTab, router]);

  // 1. Sync state with URL on mount or URL change
  useEffect(() => {
    if (loading) return;

    if (urlWorkflowId) {
      if (urlWorkflowId === "new") {
        if (!selectedWorkflow || selectedWorkflow.id !== null) {
          handleCreateWorkflow(true);
        }
      } else {
        const found = workflows.find((wf) => wf.id === urlWorkflowId);
        if (found) {
          if (!selectedWorkflow || selectedWorkflow.id !== urlWorkflowId) {
            handleSelectWorkflow(found, true);
          }
        } else if (
          !selectedWorkflow ||
          selectedWorkflow.id !== urlWorkflowId
        ) {
          // Fallback for deep-linking: attempt to open even if not in the current tab's list
          // handleSelectWorkflow fetches official name/data anyway
          handleSelectWorkflow(
            { id: urlWorkflowId, name: "加载中..." },
            true,
          );
        }
      }
    } else if (selectedWorkflow) {
      setSelectedWorkflow(null);
    }
  }, [
    urlWorkflowId,
    workflows,
    loading,
    selectedWorkflow,
    handleCreateWorkflow,
    handleSelectWorkflow,
  ]);

  // Handle reload on exit to clear builder CSS
  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder && (!urlWorkflowId || activeSubTab !== "builder")) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, [urlWorkflowId, activeSubTab]);

  useEffect(() => {
    async function loadWorkflows() {
      try {
        setLoading(true);
        setError(null);
        let data = [];
        if (activeMainTab === "templates") {
          data = await getTemplateWorkflows(apiKey);
        } else if (activeMainTab === "my-workflows") {
          if (!supportsWorkflow) {
            setWorkflows([]);
            setError(`当前 ${providerLabel} 未标记支持工作流。请在 API 管理切换或开启支持工作流的通道。`);
            return;
          }
          if (!hasApiKey) {
            setWorkflows([]);
            setError(`请先在 API 管理中保存 ${providerLabel} API Key，再查看你的工作流。`);
            return;
          }
          data = await getUserWorkflows(apiKey);
        } else if (activeMainTab === "published") {
          if (!supportsWorkflow) {
            setWorkflows([]);
            setError(`当前 ${providerLabel} 未标记支持工作流。请在 API 管理切换或开启支持工作流的通道。`);
            return;
          }
          data = await getPublishedWorkflows(apiKey);
        }
        setWorkflows(data);
      } catch (err) {
        console.error("Failed to load workflows:", err);
        setError("工作流列表加载失败。");
      } finally {
        setLoading(false);
      }
    }
    loadWorkflows();
  }, [apiKey, activeMainTab, hasApiKey, providerLabel, supportsWorkflow]);

  const handleRun = async (e) => {
    e.preventDefault();
    if (isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const inputs = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (!value) return;
        if (key.startsWith("text")) inputs[key] = { prompt: value };
        else if (key.startsWith("image")) inputs[key] = { image_url: value };
        else if (key.startsWith("video")) inputs[key] = { video_url: value };
        else inputs[key] = value;
      });

      const data = await executeWorkflow(apiKey, selectedWorkflow.id, inputs);
      setResult(data);
    } catch (err) {
      console.error("Execution failed:", err);
      setError(err.message || "执行失败");
    } finally {
      setIsExecuting(false);
    }
  };

  if (loading && !selectedWorkflow) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin text-[#d9ff00] text-3xl">◌</div>
      </div>
    );
  }

  if (selectedWorkflow) {
    return (
      <div className="h-full flex flex-col bg-[#030303] text-white">
        {/* Immersive Sub-header / Floating Toggle */}
        {isHeaderVisible ? (
          <div className="flex-shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 z-30">
            <div className="flex items-center gap-8 h-full">
              <button
                onClick={() => router.push("/studio/workflows")}
                className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                全部工作流
              </button>

              <div className="h-4 w-[1px] bg-white/10" />

              <div className="flex h-full">
                <div className="flex bg-white/5 p-1 rounded-lg my-auto">
                  <button
                    onClick={() => {
                        setActiveSubTab("playground");
                        if (selectedWorkflow?.id) router.push(`/workflow/${selectedWorkflow.id}/playground`);
                    }}
                    type="button"
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      activeSubTab === "playground"
                        ? "bg-[#d9ff00] text-black shadow-[0_0_15px_rgba(217,255,0,0.2)]"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    试用台
                  </button>
                  <button
                    onClick={() => {
                        setActiveSubTab("builder");
                        if (selectedWorkflow?.id) router.push(`/workflow/${selectedWorkflow.id}/builder`);
                    }}
                    type="button"
                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                      activeSubTab === "builder"
                        ? "bg-[#d9ff00] text-black shadow-[0_0_15px_rgba(217,255,0,0.2)]"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    完整工作流
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-[#d9ff00] uppercase tracking-widest">
                {selectedWorkflow.name}
              </span>
              <button
                onClick={() => onToggleHeader?.(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                title="进入专注模式"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          /* Floating Immersive Mode Controller */
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-fade-in-down">
            <button
               onClick={() => router.push("/studio/workflows")}
               className="p-1.5 text-white/40 hover:text-white transition-colors"
               title="返回全部工作流"
               type="button"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            
            <div className="h-4 w-[1px] bg-white/10" />
            
            <div className="flex bg-white/5 p-1 rounded-lg">
               <button
                 onClick={() => setActiveSubTab("playground")}
                 type="button"
                 className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${
                   activeSubTab === "playground" ? "bg-[#d9ff00] text-black" : "text-white/40"
                 }`}
               >
                 试用
               </button>
               <button
                 onClick={() => setActiveSubTab("builder")}
                 type="button"
                 className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${
                   activeSubTab === "builder" ? "bg-[#d9ff00] text-black" : "text-white/40"
                 }`}
               >
                 编辑器
               </button>
            </div>

            <div className="h-4 w-[1px] bg-white/10" />

            <button
              onClick={() => onToggleHeader?.(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[9px] font-black text-white uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 14h6v6M20 10h-6V4M10 20l-7-7M14 4l7 7"/></svg>
              退出专注
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {!hasApiKey ? (
            <AuthRequiredState
              title="需要 API Key"
              message={`模板可以浏览，但打开工作流详情、试用参数和编辑器需要有效的 ${providerLabel} API Key。请在 API 管理中保存后再继续。`}
            />
          ) : activeSubTab === "playground" ? (
            <>
              {/* Controls Panel */}
              <div className="w-full lg:w-[400px] border-r border-white/5 flex flex-col bg-black/20">
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <form onSubmit={handleRun} className="space-y-6">
                    <div>
                      <h3 className="text-xs font-black text-white/30 uppercase tracking-widest mb-4">
                        参数配置
                      </h3>
                      <div className="space-y-4">
                        {inputSchema &&
                          Object.entries(inputSchema.properties || {}).map(
                            ([key, prop]) => (
                              <div key={key} className="space-y-2">
                                <label className="block text-[11px] font-bold text-white/80 uppercase tracking-wider">
                                  {getWorkflowFieldLabel(key, prop)}
                                </label>
                                {prop.type === "string" && !prop.enum ? (
                                  <textarea
                                    value={formData[key] || ""}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [key]: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#d9ff00]/50 transition-colors min-h-[80px] resize-none"
                                    placeholder={getWorkflowFieldPlaceholder(key, prop)}
                                  />
                                ) : prop.enum ? (
                                  <select
                                    value={formData[key] || ""}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [key]: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#d9ff00]/50 transition-colors"
                                  >
                                    {prop.enum.map((opt) => (
                                      <option
                                        key={opt}
                                        value={opt}
                                        className="bg-black"
                                      >
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={formData[key] || ""}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [key]: e.target.value,
                                      })
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#d9ff00]/50 transition-colors"
                                    placeholder={getWorkflowFieldPlaceholder(key, prop)}
                                  />
                                )}
                              </div>
                            ),
                          )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={MODULE_IN_DEVELOPMENT || isExecuting || !selectedWorkflow.id}
                      className="w-full py-4 bg-[#d9ff00] text-black text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_0_30px_rgba(217,255,0,0.15)] flex items-center justify-center gap-3 mt-8"
                    >
                      {isExecuting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          <span>生成中...</span>
                        </>
                      ) : MODULE_IN_DEVELOPMENT ? (
                        <>
                          <span>开发中</span>
                        </>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path d="M5 3l14 9-14 9V3z" />
                          </svg>
                          <span>开始运行</span>
                        </>
                      )}
                    </button>
                    {!selectedWorkflow.id && (
                      <p className="text-[10px] text-white/30 text-center mt-4">
                        请先保存工作流，才能执行。
                      </p>
                    )}
                  </form>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-[#050505] flex items-center justify-center min-h-[500px]">
                {error && (
                  <div className="w-full max-w-md p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center gap-4 animate-shake">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest block mb-1">
                        执行出错
                      </span>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {!isExecuting && !result && !error && (
                  <div className="flex flex-col items-center gap-6 opacity-40">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white/20">
                      <svg
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <p className="text-xs text-white/40 max-w-[200px] mx-auto text-center font-medium">
                        配置参数并运行工作流，即可查看结果。
                      </p>
                  </div>
                )}

                {isExecuting && (
                  <div className="flex flex-col items-center gap-6 animate-fade-in">
                    <div className="relative">
                      <div className="w-24 h-24 border-[3px] border-white/5 border-t-[#d9ff00] rounded-full animate-spin shadow-[0_0_40px_rgba(217,255,0,0.1)]" />
                      <div className="absolute inset-0 flex items-center justify-center text-[#d9ff00]">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="animate-pulse"
                        >
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-[10px] font-black text-[#d9ff00] uppercase tracking-[0.3em] animate-pulse">
                        正在运行流程
                      </div>
                      <div className="text-[13px] text-white/40 font-medium">
                        正在处理节点并生成素材...
                      </div>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-black text-white/30 uppercase tracking-widest">
                        工作流结果
                      </h3>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/20">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />{" "}
                        已完成
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {result.outputs?.map((out, idx) => (
                        <div
                          key={idx}
                          className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#d9ff00]/30 transition-all shadow-2xl"
                        >
                          {out.type === "image_url" ? (
                            <img
                              src={out.value}
                              className="w-full aspect-square object-cover"
                              alt="Output"
                            />
                          ) : out.type === "video_url" ? (
                            <video
                              src={out.value}
                              controls
                              className="w-full aspect-square object-cover"
                            />
                          ) : (
                            <div className="p-6 min-h-[200px] flex items-center justify-center italic text-white/60">
                              {out.value}
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-[#d9ff00] uppercase tracking-widest">
                                {out.id}
                              </span>
                              <a
                                href={out.value}
                                target="_blank"
                                rel="noreferrer"
                                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#d9ff00] hover:text-black transition-colors"
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 relative bg-[#050505]">
              {nodeSchemas && workflowDef ? (
                <WorkflowUI
                  workflowId={selectedWorkflow?.id}
                  initialNodeSchemas={nodeSchemas}
                  initialWorkflowData={{
                    ...workflowDef,
                    // Inject ID to prevent builder from assuming this is a new unsaved flow
                    workflow_id: selectedWorkflow?.id
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-white/5 border-t-[#d9ff00] rounded-full animate-spin" />
                    <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      正在加载编辑器...
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render main workflow list
  return (
    <div className="h-full w-full flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6 mb-12">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                工作流
              </h1>
              <p className="text-white/40 text-sm font-medium">
                创建并管理异步 AI 处理流程
              </p>
            </div>
            <button
              onClick={() => handleCreateWorkflow()}
              disabled={MODULE_IN_DEVELOPMENT || !hasApiKey || !supportsWorkflow}
              title={
                !supportsWorkflow
                  ? `当前 ${providerLabel} 未标记支持工作流`
                  : hasApiKey
                    ? "新建工作流"
                    : `请先在 API 管理中保存 ${providerLabel} API Key`
              }
              className="px-6 py-3 bg-[#d9ff00] text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(217,255,0,0.3)] flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#d9ff00] disabled:hover:scale-100"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {MODULE_IN_DEVELOPMENT ? "开发中" : "新建工作流"}
            </button>
          </div>

          {!supportsWorkflow && (
            <div className="rounded-lg border border-yellow-300/15 bg-yellow-400/10 px-4 py-3 text-[12px] leading-5 text-yellow-100/75">
              当前 {providerLabel} 未标记支持工作流。模板可以浏览，个人工作流、运行和编辑建议切换到支持工作流的通道。
            </div>
          )}

          <div className="flex items-center gap-2 border-b border-white/5">
            <button
              onClick={() => setActiveMainTab("templates")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "templates"
                  ? "text-[#d9ff00] border-[#d9ff00]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              模板
            </button>
            <button
              onClick={() => setActiveMainTab("my-workflows")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "my-workflows"
                  ? "text-[#d9ff00] border-[#d9ff00]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              我的工作流
            </button>
            <button
              onClick={() => setActiveMainTab("published")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "published"
                  ? "text-[#d9ff00] border-[#d9ff00]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              社区
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/5 border-t-[#d9ff00] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
            <div className="text-white/30 text-sm font-medium">
              {error}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onClick={handleSelectWorkflow}
                activeTab={activeMainTab}
                onRename={(wf) => {
                   setRenamingWorkflow(wf);
                   setNewWorkflowName(wf.name);
                }}
                onDelete={handleDeleteWorkflow}
              />
            ))}
            {!loading && workflows.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                  <div className="text-white/20 text-sm font-medium italic">
                  该分区暂无工作流。
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renamingWorkflow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setRenamingWorkflow(null)} />
          <form 
            onSubmit={handleRenameWorkflow}
            className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300"
          >
            <h3 className="text-xl font-bold text-white mb-2">重命名工作流</h3>
            <p className="text-white/40 text-sm mb-6">输入一个更清晰的名称，方便你识别这条流程。</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#d9ff00] uppercase tracking-widest">工作流名称</label>
                <input
                  autoFocus
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="例如：电影感视频流程"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#d9ff00]/50 transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRenamingWorkflow(null)}
                  className="flex-1 px-4 py-3 text-xs font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#d9ff00] text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                >
                  保存名称
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
