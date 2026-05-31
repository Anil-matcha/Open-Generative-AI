import React, { useEffect, useRef, useState } from "react";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import { toast } from "react-hot-toast";
import { IoClose } from "react-icons/io5";
import { concatModels } from "./utility";
import { TbArrowMerge } from "react-icons/tb";
import NodeOptionsMenu from "./NodeOptionsMenu";

const inputHandles = [
  "concatInput",
];

const outputHandles = [
  "concatOutput",
];

const PromptConcate = ({ id, data, selected }) => {  
  const [selectedModel, setSelectedModel] = useState(concatModels[0]);
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState({});
  const [dropDown, setDropDown] = useState(0);
  const workflowId = getWorkflowId();
  const runId = data.runId ?? getRunId();
  const nodeSchemas = data.nodeSchemas || {};
  const textareaRef = useRef(null);
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);
  const properties = selectedModel?.input_params?.properties || {};

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
  
  useEffect(() => {
    const defaults = initializeFormData(properties);

    const validKeys = Object.keys(properties);
    const filteredFormValues = Object.entries(data.formValues || {}).reduce((acc, [key, val]) => {
      if (validKeys?.includes(key)) acc[key] = val;
      return acc;
    }, {});

    const merged = Object.entries({ ...defaults, ...filteredFormValues }).reduce(
      (acc, [key, val]) => {
        const meta = properties[key];
        if (meta?.enum && !meta.enum?.includes(val)) {
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
  }, [selectedModel]);

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
    if (!data?.onDataChange) return;
    
    const currentData = {
      formValues: data.formValues
    };
    
    const newData = {
      formValues
    };
    
    if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
      data.onDataChange(id, newData);
    }
  }, [formValues]);

  const handleDeleteNode = () => {
    if (window.confirm(`Are you sure you want to delete this ${id} node?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      toast.success(`Deleted node ${id}`);
    };
  };

  const hasPrompt = properties && "prompt" in properties;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const validHandles = [
        hasPrompt && "concatInput",
      ].filter(Boolean);

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => {
          if (edge.target !== id) return true;
          return validHandles?.includes(edge.targetHandle);
        })
      );
    }, 2000);
    return () => clearTimeout(timeout);
  }, [hasPrompt, id, setEdges]);

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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(scrollHeight, 210)}px`;
    }
  }, [formValues, selectedModel.name]);

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
      <h3 className="absolute -top-5 left-0 text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
        Prompt Concatenator {id.replace(/^\D+/g, "")}
      </h3>
      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <TbArrowMerge size={14} className="rotate-90" />
            </div>
            <h3 className="text-xs font-bold text-zinc-100">
              {selectedModel.name}
            </h3>
          </div>
          <NodeOptionsMenu 
            nodeId={id}
            onDuplicate={data.duplicateNode}
            onDelete={handleDeleteNode}
          />
        </div>
      </div>
      <div className="relative flex flex-col gap-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 w-full h-full p-2">
        <textarea
          type="text"
          ref={textareaRef}
          readOnly
          value={formValues?.prompt || ""}
          className="w-full h-full max-h-96 text-xs leading-relaxed outline-none bg-transparent resize-none text-zinc-100 font-medium placeholder:italic placeholder:opacity-50"
        />
      </div>
      {hasPrompt && (
        <>
          <Handle  
            type="target" 
            position={Position.Left} 
            id="concatInput" 
            style={{ 
              top: 100,
              width: 12,
              height: 12,
              transition: 'all 0.2s ease-in-out',
            }} 
            className={`!rounded-full !border-2 transition-all duration-200 !left-[-7px]
              ${connectedInputs.concatInput 
                ? '!bg-blue-500 !border-white shadow-[0_0_20px_rgba(59,130,246,1)]' 
                : '!bg-black !border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
              }
              hover:!scale-125 hover:shadow-[0_0_20px_rgba(59,130,246,1)]
            `}
            data-type="blue"
          />
          <p 
            className={`absolute -left-7 top-[100px] text-xs text-blue-500 transition-opacity duration-200 ${
              data.activeHandleColor === "blue" 
                ? "opacity-100" 
                : "opacity-0 group-hover:opacity-100"
            }`}
          > 
            Text 
          </p>
        </>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="concatOutput" 
        style={{ 
          top: 100,
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-2 transition-all duration-200 !right-[-7px]
          ${connectedOutputs.concatOutput 
            ? '!bg-blue-500 !border-white shadow-[0_0_20px_rgba(59,130,246,1)]' 
            : '!bg-black !border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
          }
          hover:!scale-125 hover:shadow-[0_0_20px_rgba(59,130,246,1)]
        `}
        data-type="blue"
      />
      <p 
        className={`absolute -right-7 top-[100px] text-xs text-blue-500 transition-opacity duration-200 ${
          data.activeHandleColor === "blue" 
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100"
        }`}
      > 
        Text 
      </p>
    </div>
  );
};

export default PromptConcate;
