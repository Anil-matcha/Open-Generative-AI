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

function WorkflowCard({ workflow, onClick, activeTab, onRename, onDelete }) {
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

      {/* Community Profile Info */}
      {activeTab === 'published' && workflow.user_name && (
        <div className="absolute top-2 left-2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          <img src={workflow.user_profile || "/user_profile.png"} alt="profile" className="w-4 h-4 rounded-full" />
          <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">{workflow.user_name}</span>
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

export default function WorkflowStudio({
  apiKey,
  isHeaderVisible = true,
  onToggleHeader,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
}) {
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
    if (!selectedWorkflow?.id || !apiKey) return;

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
             setError("Failed to load full builder data. Some features may be disabled.");
          }
        }
      } catch (err) {
        console.error("Critical error loading pulse details:", err);
        setError("Critical error loading builder: " + err.message);
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

  const handleRun = async (e) => {
    e.preventDefault();
    if (isExecuting) return;

    onGeneratioãn}¶‰žËkºwµçUÙ¥•ÜA…¹•°€¨½ô(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à´Ä½Ù•É™±½Üµäµ…ÕÑ¼À´à±œéÀ´ÄÈ‰œµlŒÀÔÀÔÀÕt™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•Èµ¥¸µ µlÔÀÁÁátˆø(€€€€€€€€€€€€€€€í•ÉÉ½È€˜˜€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Üµ™Õ±°µ…àµÜµµÀ´Ø‰œµÉ•´ÔÀÀ¼ÄÀ‰½É‘•È‰½É‘•ÈµÉ•´ÔÀÀ¼ÈÀÉ½Õ¹‘•´Éá°™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È…À´Ð…¹¥µ…Ñ”µÍ¡…­”ˆø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´ÄÈ ´ÄÈ‰œµÉ•´ÔÀÀ¼ÈÀÉ½Õ¹‘•µ™Õ±°™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÑ•áÐµÉ•´ÔÀÀˆø(€€€€€€€€€€€€€€€€€€€€€€ñÍÙœ(€€€€€€€€€€€€€€€€€€€€€€€Ý¥‘Ñ ôˆÈÐˆ(€€€€€€€€€€€€€€€€€€€€€€€¡•¥¡ÐôˆÈÐˆ(€€€€€€€€€€€€€€€€€€€€€€€Ù¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ(€€€€€€€€€€€€€€€€€€€€€€€™¥±°ô‰¹½¹”ˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÈ¸Ôˆ(€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€ñ¥É±”àôˆÄÈˆäôˆÄÈˆÈôˆÄÀˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÄÈˆäÄôˆàˆàÈôˆÄÈˆäÈôˆÄÈˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÄÈˆäÄôˆÄØˆàÈôˆÄÈ¸ÀÄˆäÈôˆÄØˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ•áÐµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹Ðµ‰±…¬Ñ•áÐµÉ•´ÔÀÀÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐ‰±½¬µˆ´Äˆø(€€€€€€€€€€€€€€€€€€€€€€€á•ÕÑ¥½¸ÉÉ½È(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ØÀÑ•áÐµÍ´±•…‘¥¹œµÉ•±…á•ˆø(€€€€€€€€€€€€€€€€€€€€€€€í•ÉÉ½Éô(€€€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¥ô((€€€€€€€€€€€€€€€ì…¥Íá•ÕÑ¥¹œ€˜˜€…É•ÍÕ±Ð€˜˜€…•ÉÉ½È€˜˜€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È…À´Ø½Á…¥Ñä´ÐÀˆø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´ÈÀ ´ÈÀ‰œµÝ¡¥Ñ”¼ÔÉ½Õ¹‘•´Íá°™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÑ•áÐµÝ¡¥Ñ”¼ÈÀˆø(€€€€€€€€€€€€€€€€€€€€€€ñÍÙœ(€€€€€€€€€€€€€€€€€€€€€€€Ý¥‘Ñ ôˆÐÀˆ(€€€€€€€€€€€€€€€€€€€€€€€¡•¥¡ÐôˆÐÀˆ(€€€€€€€€€€€€€€€€€€€€€€€Ù¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ(€€€€€€€€€€€€€€€€€€€€€€€™¥±°ô‰¹½¹”ˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ(€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4ÄÈ€É0È€Ý°ÄÀ€Ô€ÄÀ´Ô´ÄÀ´Õé4È€ÄÝ°ÄÀ€Ô€ÄÀ´Õ4È€ÄÉ°ÄÀ€Ô€ÄÀ´Ôˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµáÌÑ•áÐµÝ¡¥Ñ”¼ÐÀµ…àµÜµlÈÀÁÁátµàµ…ÕÑ¼Ñ•áÐµ•¹Ñ•È™½¹Ðµµ•‘¥Õ´ˆø(€€€€€€€€€€€€€€€€€€€€€½¹™¥ÕÉ”Á…É…µ•Ñ•ÉÌ…¹ÉÕ¸Ñ¡”Ý½É­™±½ÜÑ¼Í•”É•ÍÕ±ÑÌ¸(€€€€€€€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¥ô((€€€€€€€€€€€€€€€í¥Íá•ÕÑ¥¹œ€˜˜€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È…À´Ø…¹¥µ…Ñ”µ™…‘”µ¥¸ˆø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”ˆø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´ÈÐ ´ÈÐ‰½É‘•ÈµlÍÁát‰½É‘•ÈµÝ¡¥Ñ”¼Ô‰½É‘•ÈµÐµlŒÈÉÍ••tÉ½Õ¹‘•µ™Õ±°…¹¥µ…Ñ”µÍÁ¥¸Í¡…‘½ÜµlÁ|Á|ÐÁÁá}É‰„ ÌÐ°€ÈÄÄ°€ÈÌà°À¸Ä¥tˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ð´À™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÑ•áÐµlŒÈÉÍ••tˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñÍÙœ(€€€€€€€€€€€€€€€€€€€€€€€€€Ý¥‘Ñ ôˆÌÈˆ(€€€€€€€€€€€€€€€€€€€€€€€€€¡•¥¡ÐôˆÌÈˆ(€€€€€€€€€€€€€€€€€€€€€€€€€Ù¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ(€€€€€€€€€€€€€€€€€€€€€€€€€™¥±°ô‰¹½¹”ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÈ¸Ôˆ(€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰…¹¥µ…Ñ”µÁÕ±Í”ˆ(€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€€ñÁ½±å±¥¹”Á½¥¹ÑÌôˆÈÈ€ÄÈ€Äà€ÄÈ€ÄÔ€ÈÄ€ä€Ì€Ø€ÄÈ€È€ÄÈˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ•áÐµ•¹Ñ•ÈÍÁ…”µä´Èˆø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹Ðµ‰±…¬Ñ•áÐµlŒÈÉÍ••tÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸Í•µt…¹¥µ…Ñ”µÁÕ±Í”ˆø(€€€€€€€€€€€€€€€€€€€€€€€IÕ¹¹¥¹œA¥Á•±¥¹”(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÍÁátÑ•áÐµÝ¡¥Ñ”¼ÐÀ™½¹Ðµµ•‘¥Õ´ˆø(€€€€€€€€€€€€€€€€€€€€€€€AÉ½•ÍÍ¥¹œ¹½‘•Ì…¹•¹•É…Ñ¥¹œ…ÍÍ•ÑÌ¸¸¸(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¥ô((€€€€€€€€€€€€€€€íÉ•ÍÕ±Ð€˜˜€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Üµ™Õ±°µ…àµÜ´Ñá°ÍÁ…”µä´à…¹¥µ…Ñ”µ™…‘”µ¥¸µÕÀˆø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸µˆ´Èˆø(€€€€€€€€€€€€€€€€€€€€€€ñ Ì±…ÍÍ9…µ”ô‰Ñ•áÐµáÌ™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”¼ÌÀÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐˆø(€€€€€€€€€€€€€€€€€€€€€€€]½É­™±½ÜI•ÍÕ±ÑÌ(€€€€€€€€€€€€€€€€€€€€€€ð½ Ìø(€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÈÁà´ÌÁä´Ä‰œµÉ••¸´ÔÀÀ¼ÄÀÑ•áÐµÉ••¸´ÔÀÀÉ½Õ¹‘•µ™Õ±°Ñ•áÐµlÄÁÁát™½¹Ðµ‰½±‰½É‘•È‰½É‘•ÈµÉ••¸´ÔÀÀ¼ÈÀˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´Ä ´Ä‰œµÉ••¸´ÔÀÀÉ½Õ¹‘•µ™Õ±°…¹¥µ…Ñ”µÁÕ±Í”ˆ€¼ùìˆ€‰ô(€€€€€€€€€€€€€€€€€€€€€€€=5A1Q(€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥É¥µ½±Ì´ÄµéÉ¥µ½±Ì´È…À´Øˆø(€€€€€€€€€€€€€€€€€€€€€íÉ•ÍÕ±Ð¹½ÕÑÁÕÑÌü¹µ…À ¡½ÕÐ°¥‘à¤€ôø€ (€€€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø(€€€€€€€€€€€€€€€€€€€€€€€€€­•äõí¥‘áô(€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰É½ÕÀÉ•±…Ñ¥Ù”‰œµÝ¡¥Ñ”¼Ô‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÉ½Õ¹‘•´Éá°½Ù•É™±½Üµ¡¥‘‘•¸¡½Ù•Èé‰½É‘•ÈµlŒÈÉÍ••t¼ÌÀÑÉ…¹Í¥Ñ¥½¸µ…±°Í¡…‘½Ü´Éá°ˆ(€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€í½ÕÐ¹ÑåÁ”€ôôô€‰¥µ…•}ÕÉ°ˆ€ü€ (€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ÍÉŒõí½ÕÐ¹Ù…±Õ•ô(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±°…ÍÁ•ÐµÍÅÕ…É”½‰©•Ðµ½Ù•Èˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€…±Ðô‰=ÕÑÁÕÐˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€€€¤€è½ÕÐ¹ÑåÁ”€ôôô€‰Ù¥‘•½}ÕÉ°ˆ€ü€ (€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñÙ¥‘•¼(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ÍÉŒõí½ÕÐ¹Ù…±Õ•ô(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€½¹ÑÉ½±Ì(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±°…ÍÁ•ÐµÍÅÕ…É”½‰©•Ðµ½Ù•Èˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰À´Øµ¥¸µ µlÈÀÁÁát™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È¥Ñ…±¥ŒÑ•áÐµÝ¡¥Ñ”¼ØÀˆø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€í½ÕÐ¹Ù…±Õ•ô(€€€€€€€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€€€€€¥ô((€€€€€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ðµà´À‰½ÑÑ½´´ÀÀ´Ð‰œµÉ…‘¥•¹ÐµÑ¼µÐ™É½´µ‰±…¬¼àÀÑ¼µÑÉ…¹ÍÁ…É•¹ÐÑÉ…¹Í±…Ñ”µäµ™Õ±°É½ÕÀµ¡½Ù•ÈéÑÉ…¹Í±…Ñ”µä´ÀÑÉ…¹Í¥Ñ¥½¸µÑÉ…¹Í™½É´ˆø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ‰•ÑÝ••¸ˆø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹Ðµ‰±…¬Ñ•áÐµlŒÈÉÍ••tÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐˆø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€í½ÕÐ¹¥‘ô(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñ„(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€¡É•˜õí½ÕÐ¹Ù…±Õ•ô(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€Ñ…É•Ðô‰}‰±…¹¬ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€É•°ô‰¹½É•™•ÉÉ•Èˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ü´à ´àÉ½Õ¹‘•µ±œ‰œµÝ¡¥Ñ”¼ÄÀ™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È¡½Ù•Èé‰œµlŒÈÉÍ••t¡½Ù•ÈéÑ•áÐµ‰±…¬ÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñÍÙœ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€Ý¥‘Ñ ôˆÄÐˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€¡•¥¡ÐôˆÄÐˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€Ù¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€™¥±°ô‰¹½¹”ˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÈ¸Ôˆ(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4Äà€ÄÍØÙ„È€È€À€ÀÄ´È€É Õ„È€È€À€ÀÄ´È´ÉXá„È€È€À€ÀÄÈ´É Ù4ÄÔ€Í ÙØÙ4ÄÀ€ÄÑ0ÈÄ€Ìˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€ð½„ø(€€€€€€€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð¼ø(€€€€€€€€€€¤€è€ (€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à´ÄÉ•±…Ñ¥Ù”‰œµlŒÀÔÀÔÀÕtˆø(€€€€€€€€€€€€€í¹½‘•M¡•µ…Ì€˜˜Ý½É­™±½Ý•˜€ü€ (€€€€€€€€€€€€€€€€ñ]½É­™±½ÝU$(€€€€€€€€€€€€€€€€€Ý½É­™±½Ý%õíÍ•±•Ñ•‘]½É­™±½Üü¹¥‘ô(€€€€€€€€€€€€€€€€€¥¹¥Ñ¥…±9½‘•M¡•µ…Ìõí¹½‘•M¡•µ…Íô(€€€€€€€€€€€€€€€€€¥¹¥Ñ¥…±]½É­™±½Ý…Ñ„õíì(€€€€€€€€€€€€€€€€€€€€¸¸¹Ý½É­™±½Ý•˜°(€€€€€€€€€€€€€€€€€€€€¼¼%¹©•Ð%Ñ¼ÁÉ•Ù•¹Ð‰Õ¥±‘•È™É½´…ÍÍÕµ¥¹œÑ¡¥Ì¥Ì„¹•ÜÕ¹Í…Ù•™±½Ü(€€€€€€€€€€€€€€€€€€€Ý½É­™±½Ý}¥èÍ•±•Ñ•‘]½É­™±½Üü¹¥(€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€½¹•¹•É…Ñ¥½¹MÑ…ÉÐõí½¹•¹•É…Ñ¥½¹MÑ…ÉÑô(€€€€€€€€€€€€€€€€€½¹•¹•É…Ñ¥½¹¹õí½¹•¹•É…Ñ¥½¹¹‘ô(€€€€€€€€€€€€€€€€€½¹•¹•É…Ñ¥½¹½µÁ±•Ñ”õí½¹•¹•É…Ñ¥½¹½µÁ±•Ñ•ô(€€€€€€€€€€€€€€€€€½¹•¹•É…Ñ¥½¹ÉÉ½Èõí½¹•¹•É…Ñ¥½¹ÉÉ½Éô(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ð´À™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È…À´Ðˆø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´ÄÈ ´ÄÈ‰½É‘•È´Ð‰½É‘•ÈµÝ¡¥Ñ”¼Ô‰½É‘•ÈµÐµlŒÈÉÍ••tÉ½Õ¹‘•µ™Õ±°…¹¥µ…Ñ”µÍÁ¥¸ˆ€¼ø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”¼ÈÀÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐˆø(€€€€€€€€€€€€€€€€€€€€€1½…‘¥¹œ	Õ¥±‘•È¸¸¸(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€¥ô(€€€€€€€€ð½‘¥Øø(€€€€€€ð½‘¥Øø(€€€€¤ì(€ô((€€¼¼I•¹‘•Èµ…¥¸Ý½É­™±½Ü±¥ÍÐ(€É•ÑÕÉ¸€ (€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ µ™Õ±°Üµ™Õ±°™±•à™±•àµ½°À´à½Ù•É™±½Üµäµ…ÕÑ¼ÕÍÑ½´µÍÉ½±±‰…Èˆø(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ…àµÜ´Ýá°µàµ…ÕÑ¼Üµ™Õ±°ˆø(€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°…À´Øµˆ´ÄÈˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹©ÕÍÑ¥™äµ‰•ÑÝ••¸ˆø(€€€€€€€€€€€€ñ‘¥Øø(€€€€€€€€€€€€€€ñ Ä±…ÍÍ9…µ”ô‰Ñ•áÐ´Íá°™½¹Ðµ‰½±Ñ•áÐµÝ¡¥Ñ”µˆ´ÈÑÉ…­¥¹œµÑ¥¡Ðˆø(€€€€€€€€€€€€€€€]½É­™±½ÝÌ(€€€€€€€€€€€€€€ð½ Äø(€€€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ÐÀÑ•áÐµÍ´™½¹Ðµµ•‘¥Õ´ˆø(€€€€€€€€€€€€€€€É•…Ñ”…¹µ…¹…”å½ÕÈ…Íå¹¡É½¹½ÕÌ$ÁÉ½•ÍÍ¥¹œÁ¥Á•±¥¹•Ì(€€€€€€€€€€€€€€ð½Àø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø¡…¹‘±•É•…Ñ•]½É­™±½Ü ¥ô(€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Áà´ØÁä´Ì‰œµlŒÈÉÍ••tÑ•áÐµ‰±…¬Ñ•áÐµáÌ™½¹Ðµ‰±…¬ÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐÉ½Õ¹‘•µ±œ¡½Ù•Èé‰œµÝ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µ…±°ÑÉ…¹Í™½É´¡½Ù•ÈéÍ…±”´ÄÀÔ…Ñ¥Ù”éÍ…±”´äÔÍ¡…‘½ÜµlÁ|Á|ÈÁÁá}É‰„ ÌÐ°€ÈÄÄ°€ÈÌà°À¸Ì¥t™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆ(€€€€€€€€€€€€ø(€€€€€€€€€€€€€€ñÍÙœ(€€€€€€€€€€€€€€€Ý¥‘Ñ ôˆÄÐˆ(€€€€€€€€€€€€€€€¡•¥¡ÐôˆÄÐˆ(€€€€€€€€€€€€€€€Ù¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ(€€€€€€€€€€€€€€€™¥±°ô‰¹½¹”ˆ(€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÌˆ(€€€€€€€€€€€€€€€ÍÑÉ½­•1¥¹•…Àô‰É½Õ¹ˆ(€€€€€€€€€€€€€€€ÍÑÉ½­•1¥¹•©½¥¸ô‰É½Õ¹ˆ(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÄÈˆäÄôˆÔˆàÈôˆÄÈˆäÈôˆÄäˆøð½±¥¹”ø(€€€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÔˆäÄôˆÄÈˆàÈôˆÄäˆäÈôˆÄÈˆøð½±¥¹”ø(€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€É•…Ñ”]½É­™±½Ü(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´È‰½É‘•Èµˆ‰½É‘•ÈµÝ¡¥Ñ”¼Ôˆø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÑ¥Ù•5…¥¹Q…ˆ ‰Ñ•µÁ±…Ñ•Ìˆ¥ô(€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁà´ØÁä´ÐÑ•áÐµáÌ™½¹Ðµ‰±…¬ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸É•µtÑÉ…¹Í¥Ñ¥½¸µ…±°‰½É‘•Èµˆ´È€‘ì(€€€€€€€€€€€€€€€…Ñ¥Ù•5…¥¹Q…ˆ€ôôô€‰Ñ•µÁ±…Ñ•Ìˆ(€€€€€€€€€€€€€€€€€€ü€‰Ñ•áÐµlŒÈÉÍ••t‰½É‘•ÈµlŒÈÉÍ••tˆ(€€€€€€€€€€€€€€€€€€è€‰Ñ•áÐµÝ¡¥Ñ”¼ÌÀ‰½É‘•ÈµÑÉ…¹ÍÁ…É•¹Ð¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€Q•µÁ±…Ñ•Ì(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÑ¥Ù•5…¥¹Q…ˆ ‰µäµÝ½É­™±½ÝÌˆ¥ô(€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁà´ØÁä´ÐÑ•áÐµáÌ™½¹Ðµ‰±…¬ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸É•µtÑÉ…¹Í¥Ñ¥½¸µ…±°‰½É‘•Èµˆ´È€‘ì(€€€€€€€€€€€€€€€…Ñ¥Ù•5…¥¹Q…ˆ€ôôô€‰µäµÝ½É­™±½ÝÌˆ(€€€€€€€€€€€€€€€€€€ü€‰Ñ•áÐµlŒÈÉÍ••t‰½É‘•ÈµlŒÈÉÍ••tˆ(€€€€€€€€€€€€€€€€€€è€‰Ñ•áÐµÝ¡¥Ñ”¼ÌÀ‰½É‘•ÈµÑÉ…¹ÍÁ…É•¹Ð¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€5ä]½É­™±½ÝÌ(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÑ¥Ù•5…¥¹Q…ˆ ‰ÁÕ‰±¥Í¡•ˆ¥ô(€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁà´ØÁä´ÐÑ•áÐµáÌ™½¹Ðµ‰±…¬ÕÁÁ•É…Í”ÑÉ…­¥¹œµlÀ¸É•µtÑÉ…¹Í¥Ñ¥½¸µ…±°‰½É‘•Èµˆ´È€‘ì(€€€€€€€€€€€€€€€…Ñ¥Ù•5…¥¹Q…ˆ€ôôô€‰ÁÕ‰±¥Í¡•ˆ(€€€€€€€€€€€€€€€€€€ü€‰Ñ•áÐµlŒÈÉÍ••t‰½É‘•ÈµlŒÈÉÍ••tˆ(€€€€€€€€€€€€€€€€€€è€‰Ñ•áÐµÝ¡¥Ñ”¼ÌÀ‰½É‘•ÈµÑÉ…¹ÍÁ…É•¹Ð¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ˆ(€€€€€€€€€€€€€õô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€½µµÕ¹¥Ñä(€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½‘¥Øø((€€€€€€€í±½…‘¥¹œ€ü€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Áä´ÈÀ™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•Èˆø(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´ÄÀ ´ÄÀ‰½É‘•È´Ð‰½É‘•ÈµÝ¡¥Ñ”¼Ô‰½É‘•ÈµÐµlŒÈÉÍ••tÉ½Õ¹‘•µ™Õ±°…¹¥µ…Ñ”µÍÁ¥¸ˆ€¼ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¤€è€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É¥É¥µ½±Ì´ÈµéÉ¥µ½±Ì´Ì±œéÉ¥µ½±Ì´Ðá°éÉ¥µ½±Ì´Ô€Éá°éÉ¥µ½±Ì´Ø…À´Øˆø(€€€€€€€€€€€íÝ½É­™±½ÝÌ¹µ…À ¡Ý˜¤€ôø€ (€€€€€€€€€€€€€€ñ]½É­™±½Ý…É(€€€€€€€€€€€€€€€­•äõíÝ˜¹¥‘ô(€€€€€€€€€€€€€€€Ý½É­™±½ÜõíÝ™ô(€€€€€€€€€€€€€€€½¹±¥¬õí¡…¹‘±•M•±•Ñ]½É­™±½Ýô(€€€€€€€€€€€€€€€…Ñ¥Ù•Q…ˆõí…Ñ¥Ù•5…¥¹Q…‰ô(€€€€€€€€€€€€€€€½¹I•¹…µ”õì¡Ý˜¤€ôøì(€€€€€€€€€€€€€€€€€€Í•ÑI•¹…µ¥¹]½É­™±½Ü¡Ý˜¤ì(€€€€€€€€€€€€€€€€€€Í•Ñ9•Ý]½É­™±½Ý9…µ”¡Ý˜¹¹…µ”¤ì(€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€½¹•±•Ñ”õí¡…¹‘±••±•Ñ•]½É­™±½Ýô(€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€¤¥ô(€€€€€€€€€€€ì…±½…‘¥¹œ€˜˜Ý½É­™±½ÝÌ¹±•¹Ñ €ôôô€À€˜˜€ (€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰½°µÍÁ…¸µ™Õ±°Áä´ÈÐÑ•áÐµ•¹Ñ•È‰½É‘•È´È‰½É‘•Èµ‘…Í¡•‰½É‘•ÈµÝ¡¥Ñ”¼ÔÉ½Õ¹‘•´Éá°‰œµÝ¡¥Ñ”½lÀ¸ÀÉtˆø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ÈÀÑ•áÐµÍ´™½¹Ðµµ•‘¥Õ´¥Ñ…±¥Œˆø(€€€€€€€€€€€€€€€€€9¼Ý½É­™±½ÝÌ™½Õ¹¥¸Ñ¡¥ÌÍ•Ñ¥½¸¸(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¥ô(€€€€€€ð½‘¥Øø((€€€€€ì¼¨I•¹…µ”5½‘…°€¨½ô(€€€€€íÉ•¹…µ¥¹]½É­™±½Ü€˜˜€ (€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™¥á•¥¹Í•Ð´ÀèµlÄÀÁt™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÀ´Øˆø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ð´À‰œµ‰±…¬¼àÀ‰…­‘É½Àµ‰±ÕÈµµˆ½¹±¥¬õì ¤€ôøÍ•ÑI•¹…µ¥¹]½É­™±½Ü¡¹Õ±°¥ô€¼ø(€€€€€€€€€€ñ™½É´€(€€€€€€€€€€€½¹MÕ‰µ¥Ðõí¡…¹‘±•I•¹…µ•]½É­™±½Ýô(€€€€€€€€€€€±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”Üµ™Õ±°µ…àµÜµÍ´‰œµlŒÁ„Á„Á…t‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÉ½Õ¹‘•´Éá°À´àÍ¡…‘½Ü´Éá°…¹¥µ…Ñ”µ¥¸™…‘”µ¥¸é½½´µ¥¸‘ÕÉ…Ñ¥½¸´ÌÀÀˆ(€€€€€€€€€€ø(€€€€€€€€€€€€ñ Ì±…ÍÍ9…µ”ô‰Ñ•áÐµá°™½¹Ðµ‰½±Ñ•áÐµÝ¡¥Ñ”µˆ´ÈˆùI•¹…µ”]½É­™±½Üð½ Ìø(€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ÐÀÑ•áÐµÍ´µˆ´Øˆù¹Ñ•È„¹•Ü‘•ÍÉ¥ÁÑ¥Ù”¹…µ”™½Èå½ÕÈÁ¥Á•±¥¹”¸ð½Àø(€€€€€€€€€€€€(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÁ…”µä´Ðˆø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰ÍÁ…”µä´Èˆø(€€€€€€€€€€€€€€€€ñ±…‰•°±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹Ðµ‰±…¬Ñ•áÐµlŒÈÉÍ••tÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐˆù]½É­™±½Ü9…µ”ð½±…‰•°ø(€€€€€€€€€€€€€€€€ñ¥¹ÁÕÐ(€€€€€€€€€€€€€€€€€…ÕÑ½½ÕÌ(€€€€€€€€€€€€€€€€€ÑåÁ”ô‰Ñ•áÐˆ(€€€€€€€€€€€€€€€€€Ù…±Õ”õí¹•Ý]½É­™±½Ý9…µ•ô(€€€€€€€€€€€€€€€€€½¹¡…¹”õì¡”¤€ôøÍ•Ñ9•Ý]½É­™±½Ý9…µ”¡”¹Ñ…É•Ð¹Ù…±Õ”¥ô(€€€€€€€€€€€€€€€€€Á±…•¡½±‘•Èô‰”¹œ¸¥¹•µ…Ñ¥ŒY¥‘•¼±½Üˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±°‰œµÝ¡¥Ñ”¼Ô‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÉ½Õ¹‘•µá°Áà´ÐÁä´ÌÑ•áÐµÍ´Ñ•áÐµÝ¡¥Ñ”™½ÕÌé½ÕÑ±¥¹”µ¹½¹”™½ÕÌé‰½É‘•ÈµlŒÈÉÍ••t¼ÔÀÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌˆ(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à…À´ÌÁÐ´Ðˆø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑI•¹…µ¥¹]½É­™±½Ü¡¹Õ±°¥ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰™±•à´ÄÁà´ÐÁä´ÌÑ•áÐµáÌ™½¹Ðµ‰±…¬Ñ•áÐµÝ¡¥Ñ”¼ÐÀÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐ¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€…¹•°(€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€ÑåÁ”ô‰ÍÕ‰µ¥Ðˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰™±•à´Ä‰œµlŒÈÉÍ••tÑ•áÐµ‰±…¬Áà´ÐÁä´ÌÉ½Õ¹‘•µá°Ñ•áÐµáÌ™½¹Ðµ‰±…¬ÕÁÁ•É…Í”ÑÉ…­¥¹œµÝ¥‘•ÍÐ¡½Ù•Èé‰œµÝ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µ…±°ÑÉ…¹Í™½É´¡½Ù•ÈéÍ…±”´ÄÀÔ…Ñ¥Ù”éÍ…±”´äÔˆ(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€M…Ù”9…µ”(€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ð½™½É´ø(€€€€€€€€ð½‘¥Øø(€€€€€€¥ô(€€€€ð½‘¥Øø(€€¤ì)ô(