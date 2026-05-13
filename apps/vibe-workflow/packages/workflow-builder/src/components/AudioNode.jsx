"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import { toast } from "react-hot-toast";
import { IoClose, IoTrashOutline } from "react-icons/io5";
import { AiOutlineAudio } from "react-icons/ai";
import UploadNode from "./UploadNode";
import { audioModels, downloadFile } from "./utility";
import AudioPlayer from "./AudioPlayer";
import axios from "axios";
import { SlOptions } from "react-icons/sl";
import { MdOutlineFileDownload } from "react-icons/md";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import NodeSendButton from "./NodeSendButton";
import NodeOptionsMenu from "./NodeOptionsMenu";
import { useGenerationCost } from "./useGenerationCost";

const inputHandles = [
  "audioInput",
  "audioInput2",
  "audioInput3",
  "audioInput4",
];

const outputHandles = [
  "audioOutput",
];

const AudioGeneration = ({ id, data, selected }) => {
  const models = useMemo(() => {
    return data.nodeSchemas?.categories?.audio?.models 
      ? Object.values(data.nodeSchemas.categories.audio.models) 
      : [];
  }, [data.nodeSchemas]);
  
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || models[1] || models[0] || {});
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState(data.formValues || {});
  const [dropDown, setDropDown] = useState(0);
  const [loading, setLoading] = useState(0);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const outputHistory = data.outputHistory || [];
  const prevHistoryLengthRef = useRef(outputHistory.length);
  const workflowId = getWorkflowId();
  const runId = data.runId ?? getRunId();
  const nodeSchemas = data.nodeSchemas || {};
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);
  const properties = nodeSchemas?.categories?.audio?.models?.[selectedModel.id]?.input_schema?.schemas?.input_data?.properties;
  const { generationCost, isRefreshingCost } = useGenerationCost(selectedModel, formValues);
  
  useEffect(() => {
    if (data.cost !== generationCost) {
      data.onDataChange?.(id, { cost: generationCost });
    }
  }, [id, generationCost, data.cost]);

  const initializeFormData = (schemaProperties) => {
    const initialData = {};
    const fieldEntries = Object.entries(schemaProperties || {});

    fieldEntries.forEach(([fieldName, fieldSchema]) => {
      if (fieldSchema.type === "array") {
        if (fieldSchema.items?.type === "object") {
          const examples = fieldSchema.examples;
          if (Array.isArray(examples) && examples.length > 0) {
            initialData[fieldName] = examples.map((ex) => ({ ...ex }));
          } else {
            initialData[fieldName] = [];
          }
        } else {
          initialData[fieldName] = fieldSchema.examples || [];
        }

      } else if (fieldSchema.type === "object") {
        const nestedProps = fieldSchema.properties || {};
        initialData[fieldName] = initializeFormData(nestedProps);

      } else if (fieldSchema.default !== undefined) {
        initialData[fieldName] = fieldSchema.default;

      } else if (fieldSchema.examples && fieldSchema.examples.length > 0) {
        initialData[fieldName] = fieldSchema.examples[0];

      } else {
        switch (fieldSchema.type) {
          case "boolean":
            initialData[fieldName] = false;
            break;
          case "int":
          case "number":
            initialData[fieldName] = 0;
            break;
          default:
            initialData[fieldName] = "";
        }
      }
    });

    return initialData;
  };
  
  const addFormValuesInTaskData = (properties) => {
    const defaults = initializeFormData(properties);
    const validKeys = Object.keys(properties);
    const filteredFormValues = Object.entries(data.formValues || {}).reduce((acc, [key, val]) => {
      if (validKeys.includes(key)) acc[key] = val;
      return acc;
    }, {});

    const merged = Object.entries({ ...defaults, ...filteredFormValues }).reduce(
      (acc, [key, val]) => {
        const meta = properties[key];
        if (meta?.enum && !meta.enum.includes(val)) {
          acc[key] = meta.default ?? meta.enum[0] ?? "";
        } else {
          acc[key] = val;
        }
        return acc;
      },
      {}
    );

    // Preserve UI-only flags that are not part of the model schema
    const UI_KEYS = ["make_output", "make_input"];
    UI_KEYS.forEach((k) => {
      if (data.formValues?.[k] !== undefined) merged[k] = data.formValues[k];
    });

    setFormValues(merged);
  };

  useEffect(() => {
    setLoading(1);
    
    if (properties) {
      addFormValuesInTaskData(properties);
    }
    setLoading(0);
  }, [selectedModel]);

  useEffect(() => {
    if (data.selectedModel) {
      setSelectedModel(data.selectedModel);
    }

    if (data.triggerRun) {
      handleRunSingleNode();

      data.onDataChange(id, { triggerRun: false });
    }

    if (data.outputHistory && data.outputHistory.length > 0) {
      if (currentHistoryIndex === -1) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentAudioIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentAudioIndex(0);
      }
    }
    prevHistoryLengthRef.current = data.outputHistory ? data.outputHistory.length : 0;
  }, [data.selectedModel, data.triggerRun, data.outputHistory]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [formValues, id]);

  useEffect(() => {
    if (!data.formValues) return;
    const incoming = JSON.stringify(data.formValues);
    const current = JSON.stringify(formValues);
    if (incoming === current) return;

    const timer = setTimeout(() => {
      if (Object.entries(data.formValues || {}).length > 0) {
        setFormValues(data.formValues);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [data.formValues]);

  useEffect(() => {
    if (data?.onDataChange && data?.selectedModel?.id !== "audio-passthrough") {
      data.onDataChange(id, { selectedModel, formValues, loading });
    }
  }, [selectedModel, formValues, loading]);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setDropDown(-1);
  };

  const pollNodeStatus = (run_id) => {
    const interval = setInterval(() => {
      axios.get(`/api/workflow/run/${run_id}/status`)
      .then((response) => {
        const nodesInRes = response.data.nodes || {};
        const nodeData = nodesInRes[id] || Object.entries(nodesInRes).find(([key]) => 
          key.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '')
        )?.[1];

        if (!nodeData || nodeData.length === 0) return;
        const latest = nodeData[nodeData.length - 1];
        if (latest.status === "succeeded" || latest.status === "completed") {
          const output = latest.result.outputs;
          const val = output[0]?.value || "";
          
          const currentHistory = data.outputHistory || [];
          const result = latest.result;
          const isAlreadyInHistory = currentHistory.some(h => h.result?.id === result.id);
          const newHistory = isAlreadyInHistory 
            ? currentHistory.map(h => h.result?.id === result.id ? latest : h)
            : [...currentHistory, latest];

          data?.onDataChange?.(id, { outputs: output, resultUrl: val, isLoading: false, errorMsg: null, outputHistory: newHistory });
          setCurrentHistoryIndex(newHistory.length - 1);
          setCurrentAudioIndex(0);
          clearInterval(interval);
        }

        if (latest.status === "failed") {
          const outputs = latest?.result?.outputs;
          let errorMsg = "Generation failed";

          if (outputs && outputs[0]?.value?.error) {
            errorMsg = outputs[0].value.error; 
          }
          toast.error(`Node ${id} failed`);
          const currentHistory = data.outputHistory || [];
          data.onDataChange(id, { isLoading: false, errorMsg, outputHistory: currentHistory });
          clearInterval(interval);
        }
      })
      .catch((error) => {
        console.log(error);
        clearInterval(interval);
        data.onDataChange(id, { isLoading: false });
        toast.error(`Failed to get workflow status Audio ${id.replace(/^\D+/g, "")}`);
      });
    }, 3000);
  };

  const handleRunSingleNode = async () => {
    if (!runId) {
      toast.error("No run_id available!. Click 'Run All' button");
      return;
    };

    try {
      data.onDataChange(id, { isLoading: true });
      const workflow_id = await data.handleSaveWorkFlow();

      if (!workflow_id) {
        toast.error("Failed to save workflow before running node");
        data.onDataChange(id, { isLoading: false });
        return;
      }

      const modelSchema = nodeSchemas?.categories?.audio?.models[selectedModel.id]?.input_schema?.schemas?.input_data;
      if (!modelSchema || !modelSchema.properties) {
        toast.error("No input schema found for this model");
        data.onDataChange(id, { isLoading: false });
        return;
      }
      const params = {};
      const inputSchema = modelSchema.properties;
      const localSources = formValues || {};
      for (const [key, meta] of Object.entries(inputSchema)) {
        if (localSources.hasOwnProperty(key)) {
          params[key] = localSources[key];
        } else {
          params[key] = meta.default ?? null;
        }
      }

      const response = await axios.post(`/api/workflow/${workflow_id}/node/${id}/run`, {
        run_id: runId,
        model: selectedModel.id,
        params: params,
        cost: generationCost,
        node_id: "AI Audio"
      });
      pollNodeStatus(response.data.run_id);
    } catch(error) {
      data.onDataChange(id, { isLoading: false });
      toast.error(error.response?.data?.detail || "Error running node");
      console.error(error);
    };
  };

  const handleDeleteNode = () => {
    if (window.confirm(`Are you sure you want to delete this ${id} node?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      toast.success(`Deleted node ${id}`);
    };
  };

  const hasPrompt = properties && "prompt" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasImageUrl = properties && "image_url" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasVideoUrl = properties && "video_url" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasAudioUrl = properties && "audio_url" in properties && !data.selectedModel?.id.includes("passthrough");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const validHandles = [
        hasAudioUrl && "audioInput",
        hasPrompt && "audioInput2",
        hasImageUrl && "audioInput3",
        hasVideoUrl && "audioInput4",
      ].filter(Boolean);

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        })
      );
      }, 2000);
    return () => clearTimeout(timeout);
  }, [hasAudioUrl, hasPrompt, hasImageUrl, hasVideoUrl, id, setEdges]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentAudioIndex(0);
      const viewing = outputHistory[newIndex]?.result?.outputs?.[0]?.value;
      setNodes((nds) => nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, viewingOutput: viewing } };
        }
        return n;
      }));
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentHistoryIndex < outputHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentAudioIndex(0);
      const viewing = outputHistory[newIndex]?.result?.outputs?.[0]?.value;
      setNodes((nds) => nds.map((n) => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, viewingOutput: viewing } };
        }
        return n;
      }));
    }
  };

  const handleDeleteHistory = async (e) => {
    e.stopPropagation();
    const currentHistory = outputHistory[currentHistoryIndex];
    if (!currentHistory || !currentHistory.node_run_id) return;

    if (window.confirm("Are you sure you want to delete this history entry?")) {
      try {
        await axios.delete(`/api/workflow/node-run/${currentHistory.node_run_id}`);
        const newHistory = outputHistory.filter((_, i) => i !== currentHistoryIndex);
        
        data?.onDataChange?.(id, { 
          outputHistory: newHistory,
          ...(newHistory.length === 0 ? { outputs: [], resultUrl: null } : {})
        });

        if (newHistory.length === 0) {
          setCurrentHistoryIndex(-1);
        } else {
          setCurrentHistoryIndex(Math.max(0, currentHistoryIndex - 1));
        }
        toast.success("History entry deleted");
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to delete history entry");
        console.error(error);
      }
    }
  };

  useEffect(() => {
    const connectedInputs = {};
    inputHandles.forEach((h) => {
      connectedInputs[h] = edges.some(
        (e) => e.target === id && e.targetHandle === h
      );
    });

    const connectedOutputs = {};
    outputHandles.forEach((h) => {
      connectedOutputs[h] = edges.some(
        (e) => e.source === id && e.sourceHandle === h
      );
    });

    setConnectedInputs(connectedInputs);
    setConnectedOutputs(connectedOutputs);
  }, [edges, id]);

  const currentOutputList = currentHistoryIndex !== -1 && outputHistory[currentHistoryIndex]
    ? outputHistory[currentHistoryIndex]?.result?.outputs || []
    : (data.outputs || []);

  const currentOutput = currentOutputList.length > 0
    ? currentOutputList[currentAudioIndex]?.value || currentOutputList[0]?.value || data.resultUrl
    : data.resultUrl;

  return (
    <div 
      style={{ minHeight: 220, '--loader-color': '#eab308' }}
      className={`
        nowheel group flex flex-col flex-1 w-80 
        rounded-2xl border-2 relative transition-all duration-300 ease-in-out 
        ${selected 
          ? "border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.3)] scale-[1.02] ring-1 ring-yellow-500/20" 
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"} 
        bg-[#0c0d0f]/95 backdrop-blur-sm
      `}
    >
      {data.isLoading && (
        <div className="loader-border" />
      )}
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Audio {id.replace(/^\D+/g, "")}
        </h3>
        {generationCost !== null && !selectedModel?.id.includes("passthrough") && (
          <span className="text-xs text-yellow-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80">
            {isRefreshingCost ? (
              <span className="flex items-center gap-1 italic text-yellow-200">
                <div className="w-2 h-2 border-[1.5px] border-yellow-200/30 border-t-yellow-400 rounded-full animate-spin"></div>
              </span>
            ) : (
              <span>
                {generationCost === 0 ? 'Free' : (`$${generationCost}`)}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-yellow-500 text-black" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <AiOutlineAudio size={14} />
            </div>
            <h3 className="text-xs font-bold text-zinc-100">
              {selectedModel.name}
            </h3>
          </div>
          {outputHistory.length > 0 && (
            <div className="absolute -top-10 right-0 bg-[#0c0d0f]/95 flex items-center gap-1 p-1 border border-white/10 rounded-full ml-auto">
              <button 
                type="button"
                suppressHydrationWarning={true}
                onClick={handlePrev}
                disabled={currentHistoryIndex <= 0}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous"
              >
                <FaAngleLeft size={10} />
              </button>
              <div className="flex items-center gap-1.5 px-0.5">
                <span className="text-[9px] font-medium text-white/90 tabular-nums tracking-wide">
                  {currentHistoryIndex + 1}/{outputHistory.length}
                </span>
                <div className="w-[1px] h-2.5 bg-white/10" />
                <button 
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={handleDeleteHistory}
                  className="p-1 hover:bg-red-500/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center"
                  title="Delete history"
                >
                  <IoTrashOutline size={10} />
                </button>
                <div className="w-[1px] h-2.5 bg-white/10" />
                <NodeSendButton 
                  id={id} 
                  data={data} 
                  outputHistory={outputHistory} 
                  currentHistoryIndex={currentHistoryIndex} 
                  currentOutputIndex={currentAudioIndex}
                />
              </div>
              <button 
                type="button"
                suppressHydrationWarning={true}
                onClick={handleNext}
                disabled={currentHistoryIndex >= outputHistory.length - 1}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next"
              >
                <FaAngleRight size={10} />
              </button>
            </div>
          )}
          <NodeOptionsMenu 
            nodeId={id}
            onDuplicate={data.duplicateNode}
            onDelete={handleDeleteNode}
            downloadUrl={currentOutput}
          />
        </div>
      </div>
      {data.selectedModel?.id === "audio-passthrough" ? (
        <div className="w-full h-full flex-1">
          <UploadNode id={id} data={data} formValues={formValues} setFormValues={setFormValues} selectedModel={selectedModel} loading={loading} uploadType="upload" acceptType="audio" />
        </div>
      ) : (
        <div className="flex items-center flex-grow justify-center w-full h-full rounded transition-all duration-500">
          {data.isLoading ? (
            <div className="flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1] bg-white/5 animate-pulse rounded-b-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase">Generating...</span>
              </div>
            </div>
          ) : data.errorMsg ? (
            <div className="text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 m-3 w-full">
              {data.errorMsg || "Generation failed"}
            </div>
          ) : currentOutput && !data.isLoading ? (
            <div className="w-full h-full relative group/audio flex flex-col items-center justify-center">
              <AudioPlayer 
                src={currentOutput} 
                nodeId={id}
                className="flex flex-col items-center justify-center px-5 py-4 w-full h-full relative group transition-all duration-500 select-none bg-black/10 rounded-b-2xl"
              />
              {currentOutputList.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2 py-1 z-10 shadow-xl">
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAudioIndex((prev) => (prev > 0 ? prev - 1 : currentOutputList.length - 1));
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <FaAngleLeft size={12} />
                  </button>
                  <span className="text-[10px] font-medium text-white/90 tabular-nums">
                    {currentAudioIndex + 1}/{currentOutputList.length}
                  </span>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentAudioIndex((prev) => (prev < currentOutputList.length - 1 ? prev + 1 : 0));
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <FaAngleRight size={12} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
              <AiOutlineAudio size={32} />
              <span className="text-[10px] italic">Result appeared here...</span>
            </div>
          )}
        </div>
      )}
      <Handle  
        type="target" 
        position={Position.Left} 
        id="audioInput" 
        style={{ 
          top: 70,
          opacity: hasAudioUrl ? 1 : 0,
          pointerEvents: hasAudioUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }}  
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.audioInput 
            ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' 
            : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm'
          }
        `}
        data-type="yellow"
      />
      {hasAudioUrl && (
        <p 
          className={`absolute -left-7 top-[70px] text-xs text-yellow-500 transition-opacity duration-200 ${
            data.activeHandleColor === "yellow" 
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Audio 
        </p>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="audioInput2" 
        style={{ 
          top: 100,
          opacity: hasPrompt ? 1 : 0,
          pointerEvents: hasPrompt ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.audioInput2 
            ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' 
            : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasPrompt && (
        <p 
          className={`absolute -left-8 top-[100px] text-xs text-blue-500 transition-opacity duration-200 ${
            data.activeHandleColor === "blue"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Text 
        </p>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="audioInput3" 
        style={{ 
          top: 130,
          opacity: hasImageUrl ? 1 : 0,
          pointerEvents: hasImageUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.audioInput3 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green" 
      />
      {hasImageUrl && (
        <p 
          className={`absolute -left-10 top-[130px] text-xs text-green-500 transition-opacity duration-200 ${
            data.activeHandleColor === "green"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Image 
        </p>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="audioInput4"
        style={{ 
          top: 160,
          opacity: hasVideoUrl ? 1 : 0,
          pointerEvents: hasVideoUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.audioInput4 
            ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' 
            : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm'
          }
        `}
        data-type="orange"
      />
      {hasVideoUrl && (
        <p 
          className={`absolute -left-10 top-[160px] text-xs text-orange-500 transition-opacity duration-200 ${
            data.activeHandleColor === "orange"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Video
        </p>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="audioOutput" 
        style={{ 
          top: 100,
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !right-[-8px] transition-all
          ${connectedOutputs.audioOutput 
            ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' 
            : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm'
          }
        `}
        data-type="yellow"
      />
      <p 
        className={`absolute -right-10 top-[100px] text-xs text-yellow-500 transition-opacity duration-200 ${
          data.activeHandleColor === "yellow" 
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100"
        }`}
      > 
        Audio 
      </p>
    </div>
  );
};

export default AudioGeneration;