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
  getAllNodeSchemas,
  getWorkflowData,
  executeWorkflow,
} from "../muapi.js";

// Only these image models are exposed in the workflow builder's Generate Image
// menu. Editing models are dropped entirely (Edit Image is disabled). Applied to
// the node schema here (studio rebuilds reliably) so it works regardless of the
// prebuilt workflow-builder package.
const ALLOWED_WORKFLOW_IMAGE_MODELS = new Set([
  "gpt-image-2",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
]);

// Correct input parameters for each model's Properties panel (label = title,
// options = enum). These keys are honoured by the workflow proxy at run time.
const GEMINI_WORKFLOW_AR = ["1:1", "16:9", "9:16", "4:3", "3:4", "2:3", "3:2", "4:5", "5:4", "1:4", "4:1", "1:8", "8:1", "21:9"];
// Reference images (optional, up to 16). A single images_list input replaces
// the old separate single-image field. Wiring it switches the model into
// editing/reference mode (handled by the workflow proxy).
const REF_IMAGES_FIELD = { type: "array", items: { type: "string" }, title: "Reference Images", field: "images_list", maxItems: 16 };
const GEMINI_WORKFLOW_PROPS = {
  prompt: { type: "string", title: "Prompt" },
  images_list: REF_IMAGES_FIELD,
  aspect_ratio: { type: "string", title: "Aspect Ratio", enum: GEMINI_WORKFLOW_AR, default: "1:1" },
  imageSize: { type: "string", title: "Resolution", enum: ["1K", "2K", "4K", "512"], default: "1K" },
};
const WORKFLOW_IMAGE_SCHEMA_PROPS = {
  "gpt-image-2": {
    prompt: { type: "string", title: "Prompt" },
    images_list: REF_IMAGES_FIELD,
    size: { type: "string", title: "Size", enum: ["1024x1024", "1536x1024", "1024x1536", "2048x2048", "2048x1152", "3840x2160", "2160x3840"], default: "1024x1024" },
    quality: { type: "string", title: "Quality", enum: ["auto", "high", "medium", "low"], default: "auto" },
    format: { type: "string", title: "Format", enum: ["jpeg", "png", "webp"], default: "jpeg" },
  },
  "gemini-3.1-flash-image-preview": GEMINI_WORKFLOW_PROPS,
  "gemini-3-pro-image-preview": GEMINI_WORKFLOW_PROPS,
};

function filterWorkflowImageModels(schemas) {
  const models = schemas?.categories?.image?.models;
  if (!models || typeof models !== "object") return schemas;
  const kept = {};
  for (const [id, model] of Object.entries(models)) {
    // Keep passthrough/input models (e.g. image-passthrough = "Input Image").
    if (id.includes("passthrough")) {
      kept[id] = model;
      continue;
    }
    if (!ALLOWED_WORKFLOW_IMAGE_MODELS.has(id)) continue;
    const props = WORKFLOW_IMAGE_SCHEMA_PROPS[id];
    kept[id] = props
      ? {
          ...model,
          input_schema: {
            ...(model.input_schema || {}),
            schemas: {
              ...(model.input_schema?.schemas || {}),
              input_data: { type: "object", properties: props, required: ["prompt"] },
            },
          },
        }
      : model;
  }
  const result = {
    ...schemas,
    categories: {
      ...schemas.categories,
      image: { ...schemas.categories.image, models: kept },
    },
  };

  // Video menu: keep only Seedance 2.0 and 2.0 Fast, plus the input/passthrough
  // node. Older Seedance (1.5, 1.0, Lite) and everything else (Veo, Sora, Grok,
  // Kling, Happyhorse…) is removed.
  const videoModels = schemas?.categories?.video?.models;
  if (videoModels && typeof videoModels === "object") {
    const keptVideo = {};
    for (const [id, model] of Object.entries(videoModels)) {
      // Match on id and display name/title so it works regardless of how the
      // backend keys the model. Keep only Seedance 2.0 / 2.0 Fast.
      const hay = `${id} ${model?.name || ""} ${model?.title || ""}`;
      // Version "2.0" / "2-0" / "2_0" / "2 0" bounded by non-digits so it never
      // matches the 6-digit date suffix (e.g. 260128).
      const isSeedance2 = /seedance/i.test(hay) && /(^|[^0-9])2[._\- ]?0([^0-9]|$)/.test(hay);
      if (id.includes("passthrough") || isSeedance2) {
        keptVideo[id] = model;
      }
    }
    result.categories.video = { ...schemas.categories.video, models: keptVideo };
  }

  return result;
}

async function publishWorkflow(apiKey, id, isPublished) {
  const r = await fetch(`/api/workflow/${id}/publish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_published: isPublished }),
  });
  if (!r.ok) throw new Error('Publish failed');
  return await r.json();
}
import dynamic from "next/dynamic";

const WorkflowUI = dynamic(() => import("./WorkflowUI"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin" />
        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          Loading Builder...
        </div>
      </div>
    </div>
  ),
});

function WorkflowCard({ workflow, onClick, activeTab, onRename, onDelete, onPublish }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      onClick={() => onClick(workflow)}
      className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-white/5 bg-[#0a0a0a] transition-all hover:border-[#22d3ee]/30 hover:scale-[1.02] shadow-2xl"
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
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-white/70 hover:text-[#22d3ee] hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Rename
              </button>
              <button
                onClick={() => onPublish(workflow, !workflow.is_published)}
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-white/70 hover:text-[#22d3ee] hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                {workflow.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                onClick={() => onDelete(workflow.id)}
                className="w-full px-4 py-2 text-left text-[11px] font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* Published badge on my-workflows */}
      {activeTab === 'my-workflows' && workflow.is_published && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-[#22d3ee]/20 border border-[#22d3ee]/40 rounded-full">
          <span className="text-[9px] font-black text-[#22d3ee] uppercase tracking-widest">Published</span>
        </div>
      )}

      {/* Community nodes count */}
      {activeTab === 'published' && workflow.nodes_count > 0 && (
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">{workflow.nodes_count} nodes</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider mb-1 opacity-80">
          {workflow.category || "General"}
        </div>
        <h3 className="text-sm font-bold text-white truncate group-hover:text-[#22d3ee] transition-colors">
          {workflow.name || "Untitled Flow"}
        </h3>
      </div>
    </div>
  );
}

export default function WorkflowStudio({ apiKey, isHeaderVisible = true, onToggleHeader }) {
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
  const [activeSubTab, setActiveSubTab] = useState("builder");
  const [activeMainTab, setActiveMainTab] = useState("my-workflows");
  const [renamingWorkflow, setRenamingWorkflow] = useState(null);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [nodeSchemas, setNodeSchemas] = useState(null);
  const [workflowDef, setWorkflowDef] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
  

  // Handlers defined early so they can be used in effects
  const handleSelectWorkflow = useCallback(
    async (wf, fromUrl = false) => {
      setSelectedWorkflow(wf);
      setError(null);
      
      const targetTab = "builder";
      setActiveSubTab(targetTab);

      if (!fromUrl) {
        router.push(`/workflow/${wf.id}/builder`);
      }
    },
    [router],
  );

  // Dedicated data fetching effect for the active workflow
  useEffect(() => {
    if (!selectedWorkflow?.id || !apiKey) return;

    async function loadWorkflowDetails() {
      try {
        setLoading(true);
        const wfId = selectedWorkflow.id;

        const [nodes, def] = await Promise.all([
          getAllNodeSchemas(apiKey, wfId).catch(() => []),
          getWorkflowData(apiKey, wfId).catch(() => ({ nodes: [], edges: [] })),
        ]);

        setNodeSchemas(filterWorkflowImageModels(nodes));
        setWorkflowDef(def);
      } catch (err) {
        console.error("Error loading workflow:", err);
        setNodeSchemas([]);
        setWorkflowDef({ nodes: [], edges: [] });
      } finally {
        setLoading(false);
      }
    }

    loadWorkflowDetails();
  }, [selectedWorkflow?.id, apiKey]);

  const handleCreateWorkflow = useCallback(
    async (fromUrl = false) => {
      try {
        setLoading(true);
        if (!fromUrl) {
          const payload = {
            workflow_id: null,
            name: "Untitled Workflow",
            edges: [],
            data: { nodes: [] },
          };
          const response = await createWorkflow(apiKey, payload);
          // Route to /workflow/[id] so useParams().id works in the builder library
          router.push(`/workflow/${response.workflow_id}/builder`);
          return;
        }

        // Initialize state for the new flow
        setSelectedWorkflow({ id: null, name: "Untitled Workflow" });
        setNodeSchemas([]);
        setWorkflowDef({ nodes: [], edges: [] });
        setActiveSubTab("builder");
      } catch (err) {
        setError("Failed to initialize workflow: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [apiKey, router],
  );

  const handleRunWorkflow = async () => {
    if (isRunning || !selectedWorkflow?.id) return;
    setIsRunning(true);
    setRunResult(null);
    setShowResults(true);
    try {
      const data = await executeWorkflow(apiKey, selectedWorkflow.id, {});
      setRunResult(data);
    } catch (err) {
      setRunResult({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handlePublishWorkflow = async (wf, publish) => {
    try {
      await publishWorkflow(apiKey, wf.id, publish);
      setWorkflows((prev) => prev.map((w) => w.id === wf.id ? { ...w, is_published: publish } : w));
    } catch (err) {
      console.error("Publish failed:", err);
      alert("Failed to publish workflow");
    }
  };

  const handleDeleteWorkflow = async (wfId) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    setIsDeletingId(wfId);
    try {
      await deleteWorkflow(apiKey, wfId);
      setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete workflow");
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
      alert("Failed to rename workflow");
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
            { id: urlWorkflowId, name: "Loading..." },
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
        let data = [];
        if (activeMainTab === "templates") {
          data = await getTemplateWorkflows(apiKey);
        } else if (activeMainTab === "my-workflows") {
          data = await getUserWorkflows(apiKey);
        } else if (activeMainTab === "published") {
          data = await getPublishedWorkflows(apiKey);
        }
        setWorkflows(data);
      } catch (err) {
        console.error("Failed to load workflows:", err);
        setError("Failed to load workflows list.");
      } finally {
        setLoading(false);
      }
    }
    loadWorkflows();
  }, [apiKey, activeMainTab]);

  if (loading && !selectedWorkflow) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin text-[#22d3ee] text-3xl">◌</div>
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
                All Workflows
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-[#22d3ee] uppercase tracking-widest">
                {selectedWorkflow.name}
              </span>
              <button
                onClick={() => onToggleHeader?.(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                title="Enter Zen Mode"
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
               title="Back to All Workflows"
               type="button"
            >
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>

            <div className="h-4 w-[1px] bg-white/10" />

            <button
              onClick={() => onToggleHeader?.(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-[9px] font-black text-white uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2"
              type="button"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 14h6v6M20 10h-6V4M10 20l-7-7M14 4l7 7"/></svg>
              Exit Zen
            </button>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div className="flex-1 relative h-full bg-[#050505]">
            {nodeSchemas && workflowDef ? (
              <WorkflowUI
                workflowId={selectedWorkflow?.id}
                initialNodeSchemas={nodeSchemas}
                initialWorkflowData={{
                  ...workflowDef,
                  workflow_id: selectedWorkflow?.id
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin" />
                  <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    Loading Builder...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results overlay */}
        {showResults && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
            <div className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <span className="text-xs font-black text-white/50 uppercase tracking-widest">Results</span>
                <button onClick={() => setShowResults(false)} className="text-white/40 hover:text-white transition-colors" type="button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                {isRunning && (
                  <div className="flex flex-col items-center gap-4 py-12">
                    <div className="w-16 h-16 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin" />
                    <span className="text-xs text-white/40 uppercase tracking-widest animate-pulse">Generating...</span>
                  </div>
                )}
                {runResult?.error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{runResult.error}</div>
                )}
                {runResult?.outputs?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {runResult.outputs.map((out, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        {out.type === 'image_url' ? (
                          <img src={out.value} alt="output" className="w-full object-cover" />
                        ) : out.type === 'video_url' ? (
                          <video src={out.value} controls className="w-full" />
                        ) : out.type === 'audio_url' ? (
                          <audio src={out.value} controls className="w-full p-4" />
                        ) : (
                          <div className="p-4 text-white/70 text-sm italic">{out.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {runResult && !runResult.error && (!runResult.outputs || runResult.outputs.length === 0) && (
                  <div className="text-center py-8 text-white/30 text-sm">No outputs returned</div>
                )}
              </div>
            </div>
          </div>
        )}
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
                Workflows
              </h1>
              <p className="text-white/40 text-sm font-medium">
                Create and manage your asynchronous AI processing pipelines
              </p>
            </div>
            <button
              onClick={() => handleCreateWorkflow()}
              className="px-6 py-3 bg-[#22d3ee] text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(34, 211, 238,0.3)] flex items-center gap-2"
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
              Create Workflow
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-white/5">
            <button
              onClick={() => setActiveMainTab("my-workflows")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "my-workflows"
                  ? "text-[#22d3ee] border-[#22d3ee]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              My Workflows
            </button>
            <button
              onClick={() => setActiveMainTab("published")}
              className={`px-6 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
                activeMainTab === "published"
                  ? "text-[#22d3ee] border-[#22d3ee]"
                  : "text-white/30 border-transparent hover:text-white"
              }`}
            >
              Community
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-white/5 border-t-[#22d3ee] rounded-full animate-spin" />
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
                onPublish={handlePublishWorkflow}
              />
            ))}
            {!loading && workflows.length === 0 && (
              <div className="col-span-full py-24 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="text-white/20 text-sm font-medium italic">
                  No workflows found in this section.
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
            <h3 className="text-xl font-bold text-white mb-2">Rename Workflow</h3>
            <p className="text-white/40 text-sm mb-6">Enter a new descriptive name for your pipeline.</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-[#22d3ee] uppercase tracking-widest">Workflow Name</label>
                <input
                  autoFocus
                  type="text"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g. Cinematic Video Flow"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#22d3ee]/50 transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRenamingWorkflow(null)}
                  className="flex-1 px-4 py-3 text-xs font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#22d3ee] text-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all transform hover:scale-105 active:scale-95"
                >
                  Save Name
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
