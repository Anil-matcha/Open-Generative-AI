"use client";

import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { FiTrash2 } from "react-icons/fi";
import { GoWorkflow } from "react-icons/go";
import { SlOptions } from "react-icons/sl";
import { toast } from "react-hot-toast";
import { HiOutlineArrowRight } from "react-icons/hi2";
import { useRouter } from "next/navigation";

const WorkflowListingClient = ({ initialWorkflowList }) => {
  const router = useRouter();

  const [workflowList, setWorkflowList] = useState(initialWorkflowList || []);
  const [loading, setLoading] = useState(false);
  const [dropDown, setDropDown] = useState(0);
  const [workflowName, setWorkflowName] = useState("");
  const [renameId, setRenameId] = useState(null);

  useEffect(() => {
    const fromBuilder = sessionStorage.getItem("fromWorkflowBuilder");
    if (fromBuilder) {
      sessionStorage.removeItem("fromWorkflowBuilder");
      window.location.reload();
    }
  }, []);

  const getUserWorkflowDefs = () => {
    setLoading(true);
    axios.get('/api/workflow/get-workflow-defs')
      .then((response) => {
        setWorkflowList(response.data);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response?.data?.error || "Failed to fetch workflows");
        setWorkflowList([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDeleteWorkflow = (deleteId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this workflow? This action cannot be undone."
    );
    if (!confirmDelete) return;

    axios.delete(`/api/workflow/delete-workflow-def/${deleteId}`)
      .then(() => {
        setWorkflowList(prev => prev.filter(w => w.id !== deleteId));
        setDropDown(0);
        toast.success("Workflow deleted successfully");
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response?.data?.error || "Failed to delete workflow");
      });
  };

  const handleRenameWorkflow = (id, newName) => {
    if (!newName.trim()) return;
    
    setLoading(true);
    axios.post(`/api/workflow/update-name/${id}`, { name: newName })
      .then(() => {
        setRenameId(null);
        setWorkflowList((prev) =>
          prev.map((w) =>
            w.id === id
              ? { ...w, name: newName, updated_at: new Date().toISOString() }
              : w
          )
        );
        toast.success("Workflow renamed");
      })
      .catch((error) => {
        console.error(error);
        setRenameId(null);
        toast.error(error.response?.data?.error || "Failed to rename workflow");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const handleCreateWorkFlow = () => {
    const workflowPayload = {
      workflow_id: null,
      name: "Untitled Workflow",
      edges: [],
      data: { nodes: [] },
    };
    setLoading(true);
    axios.post("/api/workflow/create", workflowPayload)
      .then((response) => {
        window.location.href = `/workflow/${response.data.workflow_id}`;
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
        toast.error(error.response?.data?.detail || "Server error");
      });
  };

  return (
    <>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:px-12">
        <header className="flex flex-col gap-8 mb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
                Workflows
              </h1>
              <p className="text-zinc-500 mt-2 font-medium">Create and manage your asynchronous AI processing pipelines.</p>
            </div>
            <button
              onClick={handleCreateWorkFlow}
              disabled={loading}
              className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold transition-all shadow-[0_15px_30px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_40px_-8px_rgba(37,99,235,0.5)] active:scale-95 disabled:opacity-50"
            >
              <FaPlus />
              New Workflow
            </button>
          </div>

          <div className="flex items-center gap-1 border-b border-white/10 w-full overflow-x-auto no-scrollbar">
            <button
              type="button"
              className="px-6 py-4 text-sm font-black transition-all whitespace-nowrap border-b-2 uppercase tracking-widest text-blue-500 border-blue-500"
            >
              My Workflows
            </button>
          </div>
        </header>

        {loading && workflowList.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
            <span className="mt-4 text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Loading Flows...</span>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {workflowList.map((work) => (
                <div
                  key={work.id}
                  className="group relative aspect-[3/4] rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.05] hover:-translate-y-1 shadow-2xl"
                >
                  <Link href={`/workflow/${work.id}`} className="absolute inset-0 z-0">
                    {work.thumbnail ? (
                      <>
                        <div
                          className="absolute inset-0 bg-center bg-cover opacity-60 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-500"
                          style={{ backgroundImage: `url(${work.thumbnail})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/40 to-transparent shadow-[inset_0_-40px_80px_-20px_rgba(0,0,0,0.8)]" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-white/[0.05] transition-colors flex items-center justify-center">
                        <GoWorkflow size={48} className="text-zinc-800" />
                      </div>
                    )}
                  </Link>

                  <div className="absolute top-4 right-4 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDropDown(dropDown === work.id ? 0 : work.id);
                      }}
                      className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white transition-all hover:scale-110 shadow-lg"
                    >
                      <SlOptions size={16} />
                    </button>
                    {dropDown === work.id && (
                      <div 
                        className="absolute right-0 mt-2 w-36 py-1 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2"
                        onMouseLeave={() => setDropDown(0)}
                      >
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setRenameId(work.id);
                            setWorkflowName(work.name);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                          <FaRegEdit size={14} /> Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteWorkflow(work.id);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <FiTrash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-6 pt-12 bg-gradient-to-t from-[#030303] to-transparent flex flex-col gap-1 pointer-events-none">
                    <h4 className={`text-base font-black truncate uppercase tracking-tight transition-colors ${work.thumbnail ? "text-white group-hover:text-blue-400" : "text-zinc-300 group-hover:text-white"}`}>
                      {work.name || "Untitled Flow"}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                        Updated {formatDateTime(work.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {workflowList.length === 0 && !loading && (
                 <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center bg-white/[0.01]">
                    <div className="p-6 bg-white/5 rounded-full mb-6">
                      <GoWorkflow size={48} className="text-zinc-700" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">No Private Flows</h2>
                    <p className="text-zinc-500 mb-8 max-w-xs font-medium">Start your first orchestration by clicking the button above.</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>

      {renameId && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300"
          onClick={() => setRenameId(null)}
        >
          <div 
            className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <h3 className="text-xl font-black uppercase tracking-widest text-white">Rename Flow</h3>
                <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-tighter">Choose a descriptive identity</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">New Identity</label>
                <input
                  type="text"
                  value={workflowName}
                  autoFocus
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-tight"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameWorkflow(renameId, workflowName);
                  }}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setRenameId(null)}
                  className="flex-1 py-3 px-4 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-xs transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleRenameWorkflow(renameId, workflowName)}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg"
                >
                  Commit changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowListingClient;
