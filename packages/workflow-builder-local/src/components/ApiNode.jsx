'use client';

import React, { useEffect, useRef, useState } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { apiNodeModels } from "./utility";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import axios from "axios";
import { toast } from "react-hot-toast";
import { IoClose, IoTrashOutline } from "react-icons/io5";
import { RiInputMethodLine } from "react-icons/ri";
import NodeSendButton from "./NodeSendButton";
import NodeOptionsMenu from "./NodeOptionsMenu";

const outputHandles = [
  "apiOutput",
];

const ApiNode = ({ id, data, selected }) => {
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || apiNodeModels[0]);
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState(data.formValues || {});
  const [taskData, setTaskData] = useState(apiNodeModels[0].input_params?.properties || {});
  const exposedHandles = data.exposedHandles || [];
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
  const modelSchema = nodeSchemas?.categories?.api?.models[selectedModel.id];  
  const textareaRef = useRef(null);

  useEffect(() => {
    if (data.cost !== 0.025) {
      data.onDataChange?.(id, { cost: 0.025 });
    }
  }, [id, data.cost]);

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
    // Merge from both prop data and current local state
    const currentValues = { ...(data.formValues || {}), ...formValues };
    const filteredFormValues = Object.entries(currentValues).reduce((acc, [key, val]) => {
      if (validKeys?.includes(key)) acc[key] = val;
      return acc;
    }, {});

    const merged = Object.entries({ ...defaults, ...filteredFormValues }).reduce(
      (acc, [key, val]) => {
        const meta = properties[key];
        if (meta?.enum) {
          const optionValues = meta.enum.map(opt => typeof opt === 'object' ? opt.value : opt);
          if (!optionValues?.includes(val)) {
            const firstOption = meta.enum[0];
            acc[key] = meta.default ?? (typeof firstOption === 'object' ? firstOption.value : firstOption) ?? "";
          } else {
            acc[key] = val;
          }
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
  
  const fetchSchema = (workflowId) => {
    if (!workflowId) {
      toast.error("Failed to save workflow before running node");
      setLoading(0);
      return;
    }

    axios.get(`/api/workflow/${workflowId}/api-node-schemas`)
      .then((response) => {
        const schemas = response.data.api_node_schemas;
        if (schemas[id]) {
          const schemaObj = schemas[id]?.schema;
          const inputSchema = schemaObj?.input_schema;
          const modelProps = selectedModel.input_params?.properties || {};
          const configProps = {};
        
        Object.entries(modelProps).forEach(([key, schema]) => {
          configProps[key] = {
            ...schema,
            default: formValues[key] || schema.default || "",
            required: selectedModel.input_params?.required?.includes(key) || schema.required
          };
        });

        if (selectedModel.id === 'straico') {
          const currentDynamicSchemas = modelSchema?.dynamic_schemas || data.dynamicSchemas;
          if (currentDynamicSchemas) {
            const modelNames = Object.values(currentDynamicSchemas).map(m => m.model_id);
            if (configProps['model_name']) {
              configProps['model_name'] = {
                ...configProps['model_name'],
                enum: modelNames,
                allowManual: true
              };
            }
          }
        }

        if (selectedModel.id === 'runware') {
          const runwareModels = schemaObj?.dynamic_schemas?.models || inputSchema?.model_name?.enum || inputSchema?.model_id?.enum;
          if (runwareModels && configProps['model_name']) {
            configProps['model_name'] = {
              ...configProps['model_name'],
              enum: runwareModels,
              allowManual: true
            };
          }
        }

        const fullProps = {
          ...configProps,
          ...inputSchema,
        };
        addFormValuesInTaskData(fullProps);
        setTaskData(fullProps);

        const keysToExpose = Object.entries(inputSchema || {})
          .filter(([key, schema]) => schema?.ui?.can_link_from_node === true)
          .map(([key]) => key);

        if (keysToExpose.length > 0) {
          setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
              const currentExposed = n.data.exposedHandles || [];
              const uniqueExposed = [...new Set([...currentExposed, ...keysToExpose])];
              
              if (uniqueExposed.length !== currentExposed.length) {
                return { ...n, data: { ...n.data, exposedHandles: uniqueExposed } };
              }
            }
            return n;
          }));
        }
      } else {
        toast.warn(`No schema found for id: ${id}`);
      }
      setLoading(0);
    })
      .catch((error) => {
      setLoading(0);
      toast.error(error.response?.data?.detail || "Failed to fetch model details.");
      console.error(error);
    })
  };

  useEffect(() => {    
    let baseProperties = { ...(selectedModel.input_params?.properties || {}) };
    
    if (selectedModel.id === 'straico' && modelSchema?.dynamic_schemas) {
      const modelNames = Object.values(modelSchema.dynamic_schemas).map(m => m.model_id);
      if (baseProperties['model_name']) {
        baseProperties['model_name'] = { 
          ...baseProperties['model_name'], 
          enum: modelNames,
          allowManual: true 
        };
      }
    }

    if (selectedModel.id === 'runware' && modelSchema?.dynamic_schemas) {
      const taskType = formValues.task_type || "imageInference";
      const taskSchema = modelSchema.dynamic_schemas[taskType];
      
      if (taskSchema && taskSchema.schema?.input_schema) {
        const inputSchema = taskSchema.schema.input_schema;
        const modelEnum = inputSchema.model_name?.enum || inputSchema.model_id?.enum;
        
        if (modelEnum && baseProperties['model_name']) {
          baseProperties['model_name'] = { 
            ...baseProperties['model_name'], 
            enum: modelEnum,
            allowManual: true 
          };
        }
      }
    }
    setTaskData(baseProperties);
    
    // Ensure formValues has defaults for the current model
    if (Object.keys(formValues).length === 0 || (selectedModel.id === 'runware' && !formValues.task_type)) {
      addFormValuesInTaskData(baseProperties);
    }

    const requiredFields = selectedModel.input_params?.required || [];
    const allRequiredPresent = requiredFields.every(field => (formValues?.[field] || data?.formValues?.[field]) && (formValues?.[field] || data?.formValues?.[field]) !== "");
    
    if (requiredFields.length > 0 && allRequiredPresent) {
      fetchSchema(workflowId);
    }
  }, [selectedModel, modelSchema, formValues.task_type]);

  useEffect(() => {
    if (data.triggerRun) {
      handleRunSingleNode();
      data.onDataChange(id, { triggerRun: false });
    }

    if (data.triggerInputs) {
      fetchInputs();
      data.onDataChange(id, { triggerInputs: false });
    }

    if (data.selectedModel) {
      setSelectedModel(data.selectedModel);
    }

    if (data.outputHistory && data.outputHistory.length > 0) {
      if (currentHistoryIndex === -1) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentOutputIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        // If history grew, move to the latest
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentOutputIndex(0);
      }
    }
    prevHistoryLengthRef.current = data.outputHistory?.length || 0;
  }, [data.isLoading, data.selectedModel, data.triggerRun, data.triggerInputs, data.outputHistory]);
  
  useEffect(() => {
    updateNodeInternals(id);
  }, [formValues, id]);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setDropDown(-1);
  };

  const handleToggleHandle = (field) => {
    const current = data.exposedHandles || [];
    const isRemoving = current?.includes(field);

    if (isRemoving) {
      setEdges((eds) => eds.filter(e => !(e.target === id && e.targetHandle === field)));
    }

    const updated = isRemoving
      ? current.filter(h => h !== field)
      : [...current, field];
    
    setNodes((nds) => nds.map((n) => 
      n.id === id ? { ...n, data: { ...n.data, exposedHandles: updated } } : n
    ));
  };

  useEffect(() => {
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
    if (data?.onDataChange) {
      data.onDataChange(id, { selectedModel, formValues, taskData, loading });
    }
  }, [selectedModel, formValues, taskData, loading]);

  const pollNodeStatus = (run_id) => {
    const interval = setInterval(() => {
      axios.get(`/api/workflow/run/${run_id}/status`)
      .then((response) => {
        const nodesInRes = response.data.nodes || {};
        const nodeData = nodesInRes[id] || Object.entries(nodesInRes).find(([key]) => 
          key.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '')
        )?.[1];
        
        console.log(`[ApiNode ${id}] Polling status. Node data found:`, !!nodeData);
        if (!nodeData || nodeData.length === 0) {
          console.log(`[ApiNode ${id}] No data for this ID. Available keys:`, Object.keys(nodesInRes));
          return;
        }
        const latest = nodeData[nodeData.length - 1];
        console.log(`[ApiNode ${id}] Latest status:`, latest.status);
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
        toast.error(`Failed to get workflow status Api ${id.replace(/^\D+/g, "")}`);
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

      if (!modelSchema || !modelSchema.input_schema) {
        toast.error("No input schema found for this model");
        data.onDataChange(id, { isLoading: false });
        return;
      }
      const params = {};
      const inputSchema = modelSchema?.input_schema || {};
      const localSources = formValues || {};
      for (const [key, meta] of Object.entries(inputSchema)) {
        if (localSources.hasOwnProperty(key)) {
          params[key] = localSources[key];
        } else {
          params[key] = meta.default ?? null;
        }
      }

      const filteredInputParams = Object.fromEntries(
        Object.entries(formValues).filter(([key]) =>
          key !== "model_url" && key !== "api_key" && key !== "model_type" && key !== "model_name"
        )
      );
      params["params"] = filteredInputParams;

      const response = await axios.post(`/api/workflow/${workflow_id}/node/${id}/run`,
        {
          run_id: runId,
          model: selectedModel.id,
          params: params,
          cost: 0.025,
          node_id: "API Node"
        }
      );
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

  const fetchInputs = async () => {
    const requiredFields = selectedModel.input_params?.required || [];
    const missingFields = requiredFields.filter(field => !formValues?.[field] || !formValues[field].trim());

    if (missingFields.length > 0) {
      toast.error(`${missingFields} required before fetching schema`);
      return;
    }

    setLoading(1);
    const workflow_id = await data.handleSaveWorkFlow();

    if (!workflow_id) {
      toast.error("Failed to save workflow before running node");
      setLoading(0);
      return;
    }
    fetchSchema(workflow_id);
  };

  useEffect(() => {
    const connectedOutputs = {};
    outputHandles.forEach((h) => {
      connectedOutputs[h] = edges.some(
        (e) => e.source === id && e.sourceHandle === h
      );
    });

    const connectedInputs = {};
    Object.keys(taskData).forEach((key) => {
      connectedInputs[key] = edges.some(
        (e) => e.target === id && e.targetHandle === key
      );
    });

    setConnectedOutputs(connectedOutputs);
    setConnectedInputs(connectedInputs);
  }, [edges, id, taskData]);

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);

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
      textarea.style.height = `${Math.max(scrollHeight, 60)}px`;
    }
  }, [currentOutput, currentHistoryIndex]);

  const hardcodedKeys = Object.keys(selectedModel.input_params?.properties || {});
  const filteredTaskDataEntries = Object.entries(taskData).filter(([key]) => !hardcodedKeys?.includes(key));
  const minHeight = Math.max(208, 150 + filteredTaskDataEntries.length * 50);

  return (
    <div 
      style={{ minHeight }} 
      className={`
        nowheel group flex flex-col w-80 
        rounded-2xl border-2 relative transition-all duration-300 ease-in-out 
        ${selected 
          ? "border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.02] ring-1 ring-blue-500/20" 
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"} 
        bg-[#0c0d0f]/95 backdrop-blur-sm
      `}
    >
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Api {id.replace(/^\D+/g, "")}
        </h3>
        <span className="text-xs text-blue-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80">
          $0.025
        </span>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <RiInputMethodLine size={14} />
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
                  currentOutputIndex={currentOutputIndex}
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
      <div className="flex items-center flex-grow justify-center w-full h-full rounded transition-all duration-500">
        {data.isLoading ? (
          <div className="flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1] bg-white/5 animate-pulse rounded-b-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-bold text-blue-500 tracking-wider uppercase">Processing...</span>
            </div>
          </div>
        ) : data.errorMsg ? (
          <div className="text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 m-3 w-full">
            {data.errorMsg || "API failure"}
          </div>
        ) : currentOutput && !data.isLoading ? (
          <div className="w-full h-full relative group/api">
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center">
              {currentOutputList[currentOutputIndex]?.type === 'video_url' ? (
                <video
                  src={currentOutput}
                  controls
                  className="w-full h-full rounded-md object-contain"
                />
              ) : (currentOutputList[currentOutputIndex]?.type === 'image_url' || currentOutputList[currentOutputIndex]?.type === 'image') ? (
                <img
                  src={currentOutput}
                  alt="Generated"
                  className="w-full h-full rounded-md object-contain"
                />
              ) : currentOutputList[currentOutputIndex]?.type === 'audio_url' ? (
                <div className="w-full px-4">
                  <p className="text-[10px] text-white/40 mb-2 truncate">{currentOutput}</p>
                  <audio src={currentOutput} controls className="w-full" />
                </div>
              ) : (
                <div className="flex-1 w-full p-2">
                  <textarea
                    ref={textareaRef}
                    readOnly
                    value={typeof currentOutput === 'object' ? JSON.stringify(currentOutput, null, 2) : String(currentOutput)}
                    className="w-full text-[10px] leading-relaxed outline-none bg-[#1c1e21] border border-gray-700 rounded-lg p-2 resize-none overflow-hidden text-white font-medium shadow-inner"
                    style={{ minHeight: "60px" }}
                  />
                </div>
              )}
            </div>
            {currentOutputList.length > 1 && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover/api:opacity-100 transition-opacity">
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
            <RiInputMethodLine size={32} />
            <span className="text-[10px] italic">Result appeared here...</span>
          </div>
        )}
      </div>    
      {(() => {
        let outputColor = "green";
        let activeClass = "!bg-green-500 !border-white shadow-[0_0_20px_rgba(34,197,94,1)]";
        let inactiveClass = "!bg-black !border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]";
        let labelText = "Image";
        let labelColor = "text-green-500";
        
        const output = data.outputs?.[0];
        const modelType = formValues.model_type; // || selectedModel.model_type?

        if (output?.type === 'text' || modelType === 'chat') {
          outputColor = "blue";
          activeClass = "!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]";
          inactiveClass = "!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm";
          labelText = "Text";
          labelColor = "text-blue-500";
        } else if (output?.type === 'video_url' || modelType === 'video') {
          outputColor = "orange";
          activeClass = "!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]";
          inactiveClass = "!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm";
          labelText = "Video";
          labelColor = "text-orange-500";
        } else if (output?.type === 'audio_url' || modelType === 'audio') {
          outputColor = "yellow";
          activeClass = "!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]";
          inactiveClass = "!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm";
          labelText = "Audio";
          labelColor = "text-yellow-500";
        } else {
          outputColor = "green";
          activeClass = "!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]";
          inactiveClass = "!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm";
          labelText = "Image";
          labelColor = "text-emerald-500";
        }

        return (
          <>
          <Handle 
            type="source" 
            position={Position.Right} 
            id="apiOutput" 
            style={{ 
              top: 100,
              width: 12,
              height: 12,
              transition: 'all 0.2s ease-in-out',
            }} 
            className={`!rounded-full !border-2 transition-all duration-200 !right-[-7px]
              ${connectedOutputs.apiOutput 
                ? activeClass
                : inactiveClass
              }
            `}
            data-type={outputColor}
          />
          <p 
            className={`absolute -right-10 top-[100px] text-xs ${labelColor} transition-opacity duration-200 ${
              data.activeHandleColor === outputColor
                ? "opacity-100" 
                : "opacity-0 group-hover:opacity-100"
            }`}
          > 
            {labelText}
          </p>
          </>
        );
      })()}

      {filteredTaskDataEntries.map(([key, meta], idx) => {
        const isExposed = connectedInputs[key] || exposedHandles?.includes(key);
        return (
          <React.Fragment key={key}>
            <Handle 
              type="target" 
              position={Position.Left} 
              id={key} 
              style={{ 
                top: 150 + idx * 50,
                width: 12,
                height: 12,
                transition: 'all 0.2s ease-in-out',
                opacity: isExposed ? 1 : 0,
                pointerEvents: isExposed ? 'all' : 'none',
              }} 
              className={`!rounded-full !border-[3px] !left-[-8px] transition-all
                ${connectedInputs[key] 
                  ? '!bg-white !border-zinc-900 shadow-[0_0_15px_rgba(255,255,255,0.8)]' 
                  : '!bg-zinc-900 !border-white hover:!border-zinc-500 shadow-sm'
                }
              `}
              data-type="white"
            />
            <p 
              className={`absolute -left-20 top-[${150 + idx * 50}px] text-xs text-white text-right w-16 transition-opacity duration-200 ${
                isExposed
                  ? "opacity-100" 
                  : "opacity-0 group-hover:opacity-100"
              }`}
               style={{ top: 150 + idx * 50, opacity: isExposed ? undefined : 0, pointerEvents: isExposed ? 'all' : 'none' }} 
            > 
              {key} 
            </p>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ApiNode;
