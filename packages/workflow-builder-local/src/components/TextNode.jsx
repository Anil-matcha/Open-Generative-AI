import React, { useEffect, useMemo, useState, useRef } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { textModels } from "./utility";
import axios from "axios";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import { toast } from "react-hot-toast";
import { IoClose, IoTrashOutline } from "react-icons/io5";
import UploadNode from "./UploadNode"
import { TfiText } from "react-icons/tfi";
import NodeSendButton from "./NodeSendButton";
import NodeOptionsMenu from "./NodeOptionsMenu";
import { useGenerationCost } from "./useGenerationCost";

const inputHandles = [
  "textInput",
  "textInput2",
  "textInput3",
  "textInput4",
];

const outputHandles = [
  "textOutput",
];

const TextGeneration = ({ id, data, selected }) => {
  const models = useMemo(() => {
    return data.nodeSchemas?.categories?.text?.models 
      ? Object.values(data.nodeSchemas.categories.text.models) 
      : [];
  }, [data.nodeSchemas]);
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || models[1] || models[0] || {});
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState(data.formValues || {});
  const [dropDown, setDropDown] = useState(0);
  const [loading, setLoading] = useState(0);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentOutputIndex, setCurrentOutputIndex] = useState(0);
  const outputHistory = data.outputHistory || [];
  const prevHistoryLengthRef = useRef(outputHistory.length);
  const workflowId = getWorkflowId();
  const runId = data.runId ?? getRunId();
  const nodeSchemas = data.nodeSchemas || {};
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);
  const properties = nodeSchemas?.categories?.text?.models?.[selectedModel.id]?.input_schema?.schemas?.input_data?.properties;
  const { generationCost, isRefreshingCost } = useGenerationCost(selectedModel, formValues);
  
  useEffect(() => {
    if (data.cost !== generationCost) {
      data.onDataChange?.(id, { cost: generationCost });
    }
  }, [id, generationCost, data.cost]);

  const textareaRef = useRef(null);

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
  }
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
        setCurrentOutputIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentOutputIndex(0);
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
    if (data?.onDataChange && data?.selectedModel?.id !== "text-passthrough") {
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
          setCurrentOutputIndex(0);
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
        toast.error(`Failed to get workflow status Text ${id.replace(/^\D+/g, "")}`);
      });
    }, 3000);
  };

  const handleRunSingleNode = async () => {
    if (!runId) {
      toast.error("No run_id available!. Click 'Run All' button");
      return;
    }

    try {
      data.onDataChange(id, { isLoading: true });
      const workflow_id = await data.handleSaveWorkFlow();

      if (!workflow_id) {
        toast.error("Failed to save workflow before running node");
        data.onDataChange(id, { isLoading: false });
        return;
      }

      const modelSchema = nodeSchemas?.categories?.text?.models[selectedModel.id]?.input_schema?.schemas?.input_data;
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
        node_id: "AI Text"
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

  const hasPrompt = properties && "prompt" in properties && !data.selectedModel?.id?.includes("passthrough");
  const hasImagesList = properties && "images_list" in properties && !data.selectedModel?.id?.includes("passthrough");
  const hasImageUrl = properties && "image_url" in properties && !data.selectedModel?.id?.includes("passthrough");
  const hasSystemPrompt = properties && "system_prompt" in properties && !data.selectedModel?.id?.includes("passthrough");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const validHandles = [
        hasPrompt && "textInput",
        hasImageUrl && "textInput2",
        hasImagesList && "textInput3",
        hasSystemPrompt && "textInput4",
      ].filter(Boolean);

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        })
      );
      }, 2000);
    return () => clearTimeout(timeout);
  }, [hasPrompt, hasImageUrl, hasImagesList, hasSystemPrompt, id, setEdges]);

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

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentOutputIndex(0);
      
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
      setCurrentOutputIndex(0);
      
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

  const currentOutputList = currentHistoryIndex !== -1 && outputHistory[currentHistoryIndex]
    ? outputHistory[currentHistoryIndex]?.result?.outputs || []
    : (data.outputs || []);

  const currentOutput = currentOutputList.length > 0
    ? currentOutputList[currentOutputIndex]?.value || currentOutputList[0]?.value || data.resultUrl
    : data.resultUrl;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(scrollHeight, 210)}px`;
    }
  }, [currentOutput, currentHistoryIndex, selectedModel.name]);

  return (
    <div 
      style={{ minHeight: 280, '--loader-color': '#2563eb' }} 
      className={`
        nowheel group flex flex-col flex-1 w-80 
        rounded-2xl border-2 relative transition-all duration-300 ease-in-out 
        ${selected 
          ? "border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.02] ring-1 ring-blue-500/20" 
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"} 
        bg-[#0c0d0f]/95 backdrop-blur-sm
      `}
    >
      {data.isLoading && (
        <div className="loader-border" />
      )}
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Text {id.replace(/^\D+/g, "")}
        </h3>
        {generationCost !== null && !selectedModel?.id.includes("passthrough") && (
          <span className="text-xs text-blue-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80">
            {isRefreshingCost ? (
              <span className="flex items-center gap-1 italic text-blue-200">
                <div className="w-2 h-2 border-[1.5px] border-blue-200/30 border-t-blue-400 rounded-full animate-spin"></div>
              </span>
            ) : (
              <span>
                {generationCost === 0 ? 'Free' : `$${generationCost}`}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <TfiText size={14} />
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
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous"
              >
                <FaAngleLeft size={10} />
              </button>
                
              <div className="flex items-center gap-1.5 px-1">
                <span className="text-[9px] font-bold text-white/90 tabular-nums tracking-wide">
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
                  currentOutputIndex={currentOutputIndex}
                />
              </div>
              <button 
                type="button"
                suppressHydrationWarning={true}
                onClick={handleNext}
                disabled={currentHistoryIndex >= outputHistory.length - 1}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
          />
        </div>
      </div>
      {data.selectedModel?.id === "text-passthrough" ? (
        <div className="w-full h-full flex-1 flex flex-col">
          <UploadNode id={id} data={data} formValues={formValues} setFormValues={setFormValues} selectedModel={selectedModel} loading={loading} uploadType="text" acceptType="text" />
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 w-full h-full bg-black/20">
          {data.isLoading ? (
            <div className="flex flex-col gap-2.5 w-full h-full overflow-hidden animate-pulse">
              <div className="h-2.5 bg-white/5 rounded-full w-full"></div>
              <div className="h-2.5 bg-white/5 rounded-full w-[90%]"></div>
              <div className="h-2.5 bg-white/5 rounded-full w-[75%]"></div>
              <div className="my-1"/>
              <div className="h-2.5 bg-white/5 rounded-full w-full"></div>
              <div className="h-2.5 bg-white/5 rounded-full w-[85%]"></div>
              <div className="h-2.5 bg-white/5 rounded-full w-[60%]"></div>
            </div>
          ) : data.errorMsg ? (
            <div className="text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 w-full">
              {data.errorMsg || "Generation failed"}
            </div>
          ) : currentOutput && !data.isLoading ? ( 
            <div className="relative flex flex-col gap-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 w-full h-full p-2">
              <textarea
                ref={textareaRef}
                readOnly
                value={currentOutput || ""}
                placeholder="Output will appear here..."
                className="w-full h-full max-h-96 text-xs leading-relaxed outline-none bg-transparent resize-none text-zinc-100 overflow-hidden font-medium placeholder:italic placeholder:opacity-50"
              />
              {currentOutputList.length > 1 && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover/text:opacity-100 transition-opacity">
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentOutputIndex((prev) => (prev > 0 ? prev - 1 : currentOutputList.length - 1));
                    }}
                    className="text-white hover:text-blue-400 p-0.5"
                  >
                    <FaAngleLeft size={12} />
                  </button>
                  <span className="text-[10px] text-white/80 tabular-nums">
                    {currentOutputIndex + 1}/{currentOutputList.length}
                  </span>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentOutputIndex((prev) => (prev < currentOutputList.length - 1 ? prev + 1 : 0));
                    }}
                    className="text-white hover:text-blue-400 p-0.5"
                  >
                    <FaAngleRight size={12} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
              <TfiText size={32} />
              <span className="text-[10px] italic">Result appeared here...</span>
            </div>
          )}
        </div>
      )}
      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput" 
        style={{ 
          top: 100,
          width: 14,
          height: 14,
          opacity: hasPrompt ? 1 : 0,
          pointerEvents: hasPrompt ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}  
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput 
            ? '!bg-blue-500 !border-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]' 
            : '!bg-zinc-900 !border-blue-500/50 hover:!border-blue-500 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasPrompt && (
        <p 
          className={`absolute -left-9 top-[100px] text-[10px] font-bold tracking-tight text-blue-500 transition-all duration-300 ${
            data.activeHandleColor === "blue" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
        > 
          TEXT 
        </p>
      )}
      
      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput2" 
        style={{ 
          top: 150,
          width: 14,
          height: 14,
          opacity: hasImageUrl ? 1 : 0,
          pointerEvents: hasImageUrl ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput2 
            ? '!bg-emerald-500 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-500/50 hover:!border-emerald-500 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasImageUrl && (
        <p 
          className={`absolute -left-11 top-[150px] text-[10px] font-bold tracking-tight text-emerald-500 transition-all duration-300 ${
            data.activeHandleColor === "green" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
        > 
          IMAGE 
        </p>
      )}

      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput3" 
        style={{ 
          top: 200,
          width: 14,
          height: 14,
          opacity: hasImagesList ? 1 : 0,
          pointerEvents: hasImagesList ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput3 
            ? '!bg-emerald-500 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-500/50 hover:!border-emerald-500 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasImagesList && (
        <p 
          className={`absolute -left-11 top-[200px] text-[10px] font-bold tracking-tight text-emerald-500 transition-all duration-300 ${
            data.activeHandleColor === "green" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
        > 
          IMAGE 
        </p>
      )}

      <Handle  
        type="target" 
        position={Position.Left} 
        id="textInput4" 
        style={{ 
          top: 250,
          width: 14,
          height: 14,
          opacity: hasSystemPrompt ? 1 : 0,
          pointerEvents: hasSystemPrompt ? 'auto' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.textInput4 
            ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' 
            : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasSystemPrompt && (
        <p 
          className={`absolute -left-14 top-[250px] text-[10px] font-bold tracking-tight text-blue-600 transition-all duration-300 ${
            data.activeHandleColor === "blue" 
              ? "opacity-100 translate-x-0" 
              : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
          }`}
        > 
          SYSTEM 
        </p>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        id="textOutput" 
        style={{ 
          top: 100,
          width: 14,
          height: 14,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }} 
        className={`
          !rounded-full !border-[3px] !right-[-8px] transition-all
          ${connectedOutputs.textOutput 
            ? '!bg-blue-500 !border-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]' 
            : '!bg-zinc-900 !border-blue-500/50 hover:!border-blue-500 shadow-sm'
          }
        `}
        data-type="blue"
      />
      <p 
        className={`absolute -right-9 top-[100px] text-[10px] font-bold tracking-tight text-blue-500 transition-all duration-300 ${
          data.activeHandleColor === "blue" 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
        }`}
      > 
        TEXT 
      </p>
    </div>
  );
};

export default TextGeneration;
