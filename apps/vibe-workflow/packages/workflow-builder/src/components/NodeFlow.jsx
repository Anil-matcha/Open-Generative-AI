"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "reactflow";
// import "reactflow/dist/style.css";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { FiZoomIn, FiZoomOut } from "react-icons/fi";
import { TfiText } from "react-icons/tfi";
import { MdLockOutline, MdOutlineZoomOutMap, MdSave } from "react-icons/md";
import { LuLayoutTemplate, LuMousePointer2 } from "react-icons/lu";
import { FaAngleDown, FaAngleLeft, FaCheck, FaPlay, FaPlus, FaRegHand, FaToolbox, FaUpload } from "react-icons/fa6";
import { FaRegEdit, FaTelegramPlane } from "react-icons/fa";
import { IoDuplicateOutline, IoImageOutline, IoVideocamOutline } from "react-icons/io5";
import { Toaster, toast } from "react-hot-toast";
import { FiSun, FiMoon } from "react-icons/fi";
import axios from "axios";
import TextGeneration from "./TextNode";
import ImageGeneration from "./ImageNode";
import VideoGeneration from "./VideoNode";
import { setWorkflowIds } from "./WorkflowStore";
import { apiNodeModels, audioModels, concatModels, imageModels, textModels, videoModels, videoCombinerModels, presets } from "./utility";
import Link from "next/link";
import RenderField from "./RenderField";
import PromptConcate from "./PromptConcate";
import { TbArrowMerge } from "react-icons/tb";
import { RiInputMethodLine } from "react-icons/ri";
import ApiNode from "./ApiNode";
import RenderApiField from "./RenderApiField";
import AudioGeneration from "./AudioNode";
import NodesNavbar from "./NodesNavbar"
import ChatWidget from "./ChatWidget";
import { AiOutlineAudio } from "react-icons/ai";
import VideoCombiner from "./VideoCombiner";
import { useGenerationCost } from "./useGenerationCost";

const nodeTypes = {
  textNode: TextGeneration,
  imageNode: ImageGeneration,
  videoNode: VideoGeneration,
  audioNode: AudioGeneration,
  concatNode: PromptConcate,
  vidConcatNode: VideoCombiner,
  apiNode: ApiNode
}

const initialNodes = [
  { id: "text1", position: { x: 0, y: 100 }, data: {}, type: "textNode" },
  { id: "image1", position: { x: 300, y: 100 }, data: {}, type: "imageNode" },
];

const initialEdges = [];

const edgeStyles = {
  blue: {
    stroke: '#3b82f6', // blue-500
    strokeWidth: 2,
    // animated: true,
  },
  green: {
    stroke: '#22c55e', // green-500
    strokeWidth: 2,
    // animated: true,
  },
  orange: {
    stroke: '#f97316', // orange-500
    strokeWidth: 2,
    // animated: true,
  },
  gray: {
    stroke: '#6b7280', // gray-500
    strokeWidth: 2,
  },
  yellow: {
    stroke: '#eab308', // yellow-500
    strokeWidth: 2,
  },
  white: {
    stroke: '#ffffff',
    strokeWidth: 2,
  }
};

const getEdgeColor = (sourceHandle, targetHandle, sourceNode = null, targetNode = null) => {
  if (sourceHandle === "apiOutput" && sourceNode) {
    const output = sourceNode.data.outputs?.[0];
    const modelType = sourceNode.data.formValues?.model_type;

    if (output?.type === 'text' || modelType === 'chat') return "blue";
    if (output?.type === 'video_url' || modelType === 'video') return "orange";
    if (output?.type === 'audio_url' || modelType === 'audio') return "yellow";
    return "green";
  }

  if (["textOutput", "concatOutput"].includes(sourceHandle)) return "blue";
  if (["imageOutput"].includes(sourceHandle)) return "green";
  if (["videoOutput"].includes(sourceHandle)) return "orange";
  if (["audioOutput"].includes(sourceHandle)) return "yellow";

  if (["textInput", "textInput4", "imageInput", "videoInput", "audioInput2", "concatInput", "apiInput"].includes(targetHandle)) return "blue";
  if (["textInput2", "textInput3", "imageInput2", "imageInput3", "videoInput2", "videoInput3", "videoInput6", "audioInput3", "apiInput2", "apiInput3"].includes(targetHandle)) return "green";
  if (["videoInput4", "audioInput4", "videoInput7"].includes(targetHandle)) return "orange";
  if (["audioInput", "videoInput5", "videoInput8"].includes(targetHandle)) return "yellow";

  if (sourceNode) {
    const type = sourceNode.type;
    if (type === 'textNode' || type === 'concatNode') return "blue";
    if (type === 'imageNode') return "green";
    if (type === 'videoNode' || type === 'vidConcatNode') return "orange";
    if (type === 'audioNode') return "yellow";
  }

  return "white";
};

const iconMap = {
  "plus": <FaPlus size={20} />,
  "image": <IoImageOutline size={20} />,
  "video": <IoVideocamOutline size={20} />,
  "audio": <AiOutlineAudio size={20} />,
  "text": <TfiText size={20} />,
};

const SPECIAL_MODEL_NAMES = {
  "text-passthrough": "Input Text",
  "image-passthrough": "Input Image",
  "video-passthrough": "Input Video",
  "audio-passthrough": "Input Audio",
};

const formatName = (id) => id.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const getModelObjStatic = (category, modelId, nodeSchemas) => {
  if (category === "api") {
    // We can't easily access filteredApiNodeModels statically without passing it, 
    // but we can compute it on the fly or just return null and let useEffect handle it if needed.
    // For now, let's just use the shared logic.
    const apiModelsFromBackend = nodeSchemas?.categories?.api?.models ? Object.keys(nodeSchemas.categories.api.models) : [];
    const filtered = apiNodeModels.filter(model => apiModelsFromBackend.includes(model.id));
    return filtered.find(m => m.id === modelId) || null;
  }
  if (!modelId || !nodeSchemas?.categories) return null;
  const rawModel = nodeSchemas.categories[category]?.models?.[modelId];
  if (!rawModel) return null;

  return {
    ...rawModel,
    id: modelId,
    name: SPECIAL_MODEL_NAMES[modelId] || formatName(modelId)
  };
};

const processWorkflowData = (workflowData, nodeSchemas, id) => {
  if (!workflowData || !nodeSchemas?.categories) return null;

  const workflow = workflowData?.data;
  if (!workflow?.nodes) return null;

  const restoredNodes = workflow.nodes.map(n => ({
    id: n.id,
    type: n.category === "utility" 
      ? (n.model === "video-combiner" ? "vidConcatNode" : "concatNode") 
      : `${n.category}Node`,
    position: {
      x: n.position?.x ?? 350,
      y: n.position?.y ?? 0
    },
    data: {
      nodeSchemas,
      modelId: n.model,
      selectedModel: getModelObjStatic(n.category, n.model, nodeSchemas),
      outputs: n.output_params?.outputs || [],
      resultUrl: n.output_params?.resultUrl || null,
      formValues: n.input_params || {},
      outputHistory: (workflowData.run_history?.[n.id] || [])
        .sort((a, b) => new Date(a.started_at) - new Date(b.started_at)),
    }
  }));

  const restoredEdges = (workflowData.edges || []).map((e) => {
    const sourceNode = restoredNodes.find(n => n.id === e.source);
    const targetNode = restoredNodes.find(n => n.id === e.target);
    let edgeColor = getEdgeColor(e.sourceHandle, e.targetHandle, sourceNode, targetNode);

    return {
      id: e.id || `${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      style: edgeStyles[edgeColor],
    }
  });

  return {
    nodes: restoredNodes,
    edges: restoredEdges,
    metadata: {
      workflowId: id,
      runId: workflowData?.run_id,
      workflowName: workflowData.name,
      interactionMode: workflowData.is_owner,
      publishWorkflow: workflowData.is_published,
      template: {
        showTemplateBtn: workflowData.show_temp_button,
        isPublishedTemplate: workflowData.is_template,
      },
      category: workflowData?.category || "General"
    }
  };
};

const NodeFlow = ({ initialNodeSchemas, initialWorkflowData }) => {
  const params = useParams();
  const { id } = params;

  // Pre-calculate initial state if data is provided
  const initialState = useMemo(() => {
    return processWorkflowData(initialWorkflowData, initialNodeSchemas, id);
  }, [initialWorkflowData, initialNodeSchemas, id]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialState?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState?.edges || initialEdges);
  const [activeHandleColor, setActiveHandleColor] = useState(null);
  const [loadingNodes, setLoadingNodes] = useState({});
  const [isRunning, setIsRunning] = useState(0);
  const [dropDown, setDropDown] = useState(0);
  const [workflowName, setWorkflowName] = useState(initialState?.metadata?.workflowName || "Untitled");
  const [workflowId, setWorkflowId] = useState(id);
  const [runId, setRunId] = useState(initialState?.metadata?.runId || null);
  const [hasFit, setHasFit] = useState(false);
  const [nodeSchemas, setNodeSchemas] = useState(initialNodeSchemas || {});
  const [contextMenu, setContextMenu] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [draggedEdgeInfo, setDraggedEdgeInfo] = useState(null);
  const [edgePicker, setEdgePicker] = useState(null);
  const connectionMadeRef = useRef(false);
  const onConnectRef = useRef(null);
  const [interactionMode, setInteractionMode] = useState(initialState?.metadata?.interactionMode || false);
  const [publishWorkflow, setPublishWorkflow] = useState(initialState?.metadata?.publishWorkflow || false);
  const [template, setTemplate] = useState(initialState?.metadata?.template || {
    showTemplateBtn: false,
    isPublishedTemplate: false
  });
  const [isDragging, setIsDragging] = useState(true);
  const [modelSearch, setModelSearch] = useState("");
  const [isPresetsDismissed, setIsPresetsDismissed] = useState(true);
  const [isRestoring, setIsRestoring] = useState(!initialState);
  const [totalWorkflowCost, setTotalWorkflowCost] = useState(0);

  useEffect(() => {
    const total = nodes.reduce((sum, node) => {
      const cost = parseFloat(node.data?.cost) || 0;
      return sum + cost;
    }, 0);
    setTotalWorkflowCost(total.toFixed(3));
  }, [nodes]);

  // Sync global store with initial data if provided
  useEffect(() => {
    if (initialState?.metadata) {
      setWorkflowIds(id, initialState.metadata.runId);
    }
  }, [id, initialState]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [workflowCategory, setWorkflowCategory] = useState(initialState?.metadata?.category || "General");
  const [categoryInput, setCategoryInput] = useState(initialState?.metadata?.category || "General");
  const [isCategoryPopupOpen, setIsCategoryPopupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isModelDropdownUp, setIsModelDropdownUp] = useState(false);
  const modelDropdownTriggerRef = useRef(null);

  const { zoomIn, zoomOut, fitView, getNodes, screenToFlowPosition } = useReactFlow();

  const apiModelsFromBackend =
    nodeSchemas?.categories?.api?.models
      ? Object.keys(nodeSchemas.categories.api.models)
      : [];

  const filteredApiNodeModels = apiNodeModels.filter(model =>
    apiModelsFromBackend.includes(model.id)
  );

  const loadPreset = (preset) => {
    setIsPresetsDismissed(true);
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setTimeout(() => fitView({ padding: 0.4, duration: 500 }), 100);
  };

  // Moved SPECIAL_MODEL_NAMES, formatName and getModelObj logic to static helpers above

  useEffect(() => {
    if (!initialNodeSchemas) {
      axios.get(`/api/workflow/${id}/node-schemas`)
        .then(res => setNodeSchemas(res.data || {}))
        .catch(err => console.error("Failed to load node schemas", err));
    }

    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useLayoutEffect(() => {
    if (dropDown === 3 && modelDropdownTriggerRef.current) {
      const rect = modelDropdownTriggerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      setIsModelDropdownUp(spaceBelow < 250);
    }
  }, [dropDown]);

  useEffect(() => {
    if (!nodeSchemas?.categories) return;
    setNodes((prev) => {
      const needsUpdate = prev.some((n) => n.data.nodeSchemas !== nodeSchemas);
      if (!needsUpdate) return prev;

      return prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          nodeSchemas,
        },
      }));
    });
  }, [nodeSchemas]);
  const getModelObj = useCallback((category, modelId) => {
    return getModelObjStatic(category, modelId, nodeSchemas);
  }, [nodeSchemas]);

  const restoreWorkflow = useCallback((workflowData) => {
    const workflow = workflowData?.data;
    if (!workflow?.nodes) return;

    const restoredNodes = workflow.nodes.map(n => ({
      id: n.id,
      type: n.category === "utility" 
        ? (n.model === "video-combiner" ? "vidConcatNode" : "concatNode") 
        : `${n.category}Node`,
      position: {
        x: n.position?.x ?? 350,
        y: n.position?.y ?? 0
      },
      data: {
        nodeSchemas,
        modelId: n.model,
        selectedModel: getModelObj(n.category, n.model),
        outputs: n.output_params?.outputs || [],
        resultUrl: n.output_params?.resultUrl || null,
        formValues: n.input_params || {},
        outputHistory: (workflowData.run_history?.[n.id] || [])
          .sort((a, b) => new Date(a.started_at) - new Date(b.started_at)),
      }
    }));

    const restoredEdges = (workflowData.edges || []).map((e) => {
      const sourceNode = restoredNodes.find(n => n.id === e.source);
      const targetNode = restoredNodes.find(n => n.id === e.target);
      let edgeColor = getEdgeColor(e.sourceHandle, e.targetHandle, sourceNode, targetNode);

      return {
        id: e.id || `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
        style: edgeStyles[edgeColor],
      }
    });

    setNodes(restoredNodes);
    setEdges(restoredEdges);
    setWorkflowId(id);
    setRunId(workflowData?.run_id);
    setWorkflowName(workflowData.name);
    setWorkflowCategory(workflowData?.category || "General");
    setWorkflowIds(workflowData.workflow_id, workflowData?.run_id);
    setInteractionMode(workflowData.is_owner);
    setPublishWorkflow(workflowData.is_published);
    setTemplate(prev => ({
      ...prev,
      showTemplateBtn: workflowData.show_temp_button,
      isPublishedTemplate: workflowData.is_template,
    }));
    setIsRestoring(false);
  }, [id, nodeSchemas, getModelObj, setNodes, setEdges]);

  useEffect(() => {
    if (initialWorkflowData && nodeSchemas?.categories) {
      return;
    }

    if (!id || !nodeSchemas?.categories) return;

    axios.get(`/api/workflow/get-workflow-def/${id}`)
      .then(res => {
        restoreWorkflow(res.data);
      })
      .catch((error) => {
        console.log(error);
        setInteractionMode(false);
        setIsRestoring(false);
      });
  }, [id, nodeSchemas, initialWorkflowData, restoreWorkflow]);

  useEffect(() => {
    if (isRestoring) return;

    if (nodes.length > 0 && !hasFit) {
      const timeout = setTimeout(() => {
        fitView({ padding: 0.4, duration: 500, minZoom: 0.2 });
        setHasFit(true);
      }, 100);
      return () => clearTimeout(timeout);
    } else if (nodes.length === 0) {
      setIsPresetsDismissed(false);
    };
  }, [nodes, hasFit, fitView, isRestoring]);

  const arrangeNodesInRow = useCallback(() => {
    const spacing = 350;
    const y = 100;
    setNodes((nds) =>
      nds.map((node, index) => ({
        ...node,
        position: { x: index * spacing, y },
      }))
    );
  }, [setNodes]);

  useEffect(() => {
    if (workflowId) return;
    arrangeNodesInRow();
  }, [arrangeNodesInRow]);

  useEffect(() => {
    setNodes((prevNodes) => {
      const edgesBySource = {};
      edges.forEach((edge) => {
        if (!edgesBySource[edge.source]) edgesBySource[edge.source] = [];
        edgesBySource[edge.source].push(edge);
      });

      const needsUpdate = prevNodes.some((node) => {
        const currentEdges = node.data.connectedEdges || [];
        const newEdges = edgesBySource[node.id] || [];
        if (currentEdges.length !== newEdges.length) return true;
        const currentIds = currentEdges.map(e => e.id).sort().join(',');
        const newIds = newEdges.map(e => e.id).sort().join(',');
        return currentIds !== newIds;
      });

      if (!needsUpdate) return prevNodes;

      return prevNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          connectedEdges: edgesBySource[node.id] || [],
        },
      }));
    });
  }, [edges, setNodes]);

  const onDataChange = (id, newData, targetNodeId = null) => {
    setNodes((prevNodes) => {
      let updatedNodes = prevNodes.map((node) => {
        const match = node.id.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '');
        return match
          ? { ...node, data: { ...node.data, ...newData } }
          : node;
      });

      if (newData.errorMsg && newData.errorMsg !== null) {
        updatedNodes = updatedNodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, errorMsg: newData.errorMsg } }
            : node
        );
        return updatedNodes;
      }

      let connectedEdges = edges.filter((e) => e.source === id);
      if (targetNodeId) {
        connectedEdges = connectedEdges.filter((e) => e.target === targetNodeId);
      }

      if (!connectedEdges.length) return updatedNodes;

      const resultValue = newData.resultUrl || newData.outputs?.[0]?.value;
      // if (!resultValue) return updatedNodes;

      updatedNodes = updatedNodes.map((node) => {
        const edge = connectedEdges.find((e) => e.target === node.id);
        if (!edge) return node;

        const targetHandle = edge.targetHandle;
        let updatedFormValues = { ...node.data.formValues };

        const sourceNode = updatedNodes.find((n) => n.id === edge.source);
        const sourceValue = sourceNode?.type === "concatNode"
          ? sourceNode?.data?.formValues?.prompt
          : resultValue;

        if (["textInput", "imageInput", "videoInput", "audioInput2", "apiInput"].includes(targetHandle)) {
          updatedFormValues.prompt = sourceValue;
        }

        else if (targetHandle === "textInput4") {
          updatedFormValues.system_prompt = sourceValue;
        }

        else if (["textInput3", "imageInput2", "videoInput6"].includes(targetHandle)) {
          const list = Array.isArray(updatedFormValues.images_list)
            ? [...updatedFormValues.images_list]
            : [];
          if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") list.push(resultValue);
          updatedFormValues.images_list = list;
        }

        else if (targetHandle === "apiInput2") {
          const list = Array.isArray(updatedFormValues.images)
            ? [...updatedFormValues.images]
            : [];
          if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") list.push(resultValue);
          updatedFormValues.images = list;
        }

        else if (["textInput2", "videoInput2", "imageInput3", "audioInput3"].includes(targetHandle)) {
          updatedFormValues.image_url = resultValue;
        }

        else if (targetHandle === "apiInput3") {
          updatedFormValues.image = resultValue;
        }

        else if (targetHandle === "videoInput3") {
          updatedFormValues.last_image = resultValue;
        }

        else if (["videoInput4", "audioInput4"].includes(targetHandle)) {
          updatedFormValues.video_url = resultValue;
        }

        else if (targetHandle === "videoInput7") {
          const key = updatedFormValues.video_files ? "video_files" : "videos_list";
          const list = Array.isArray(updatedFormValues[key])
            ? [...updatedFormValues[key]]
            : [];
          if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") list.push(resultValue);
          updatedFormValues[key] = list;
        }

        else if (targetHandle === "videoInput8") {
          const key = updatedFormValues.audio_files ? "audio_files" : "audios_list";
          const list = Array.isArray(updatedFormValues[key])
            ? [...updatedFormValues[key]]
            : [];
          if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") list.push(resultValue);
          updatedFormValues[key] = list;
        }

        else if (["videoInput5", "audioInput"].includes(targetHandle)) {
          updatedFormValues.audio_url = resultValue;
        }

        else if (node.type === "apiNode") {
          const listFields = ["images", "image_urls", "images_list"];
          const isList = listFields.includes(targetHandle) || node.data.taskData?.[targetHandle]?.type === "array";

          if (isList) {
            const list = Array.isArray(updatedFormValues[targetHandle])
              ? [...updatedFormValues[targetHandle]]
              : [];
            if (sourceValue && sourceValue.trim() !== "" && !list.includes(sourceValue)) {
              list.push(sourceValue);
            }
            updatedFormValues[targetHandle] = list;
          } else {
            updatedFormValues[targetHandle] = sourceValue;
          }
        }

        return {
          ...node,
          data: {
            ...node.data,
            formValues: updatedFormValues,
          },
        };
      });

      updatedNodes = updatedNodes.map((node) => {
        if (node.type !== "concatNode") return node;

        const allConcatEdges = edges.filter((e) =>
          e.target === node.id && e.targetHandle === "concatInput"
        );

        if (allConcatEdges.length === 0) {
          return {
            ...node,
            data: {
              ...node.data,
              formValues: {
                ...node.data.formValues,
                prompt: "",
              },
            },
          };
        }

        const concatValues = allConcatEdges.map((e) => {
          const sourceNode = updatedNodes.find((n) => n.id === e.source);
          return sourceNode?.data?.resultUrl || sourceNode?.data?.outputs?.[0]?.value || "";
        }).filter((v) => typeof v === "string" && v.trim() !== "");

        return {
          ...node,
          data: {
            ...node.data,
            formValues: {
              ...node.data.formValues,
              prompt: concatValues.length > 0 ? concatValues.join(" ").trim() : "",
            },
          },
        };
      });

      return updatedNodes;
    });

    if (newData.hasOwnProperty('isLoading')) {
      setLoadingNodes(prev => {
        const newLoadingNodes = { ...prev };
        if (newData.isLoading) {
          newLoadingNodes[id] = true;
        } else {
          delete newLoadingNodes[id];
        }
        return newLoadingNodes;
      });
    }
  };

  const onConnect = useCallback(
    (params) => {
      const targetNodeExists = nodes.some(n => n.id === params.target);
      if (targetNodeExists) {
        connectionMadeRef.current = true;
      }
      setEdges((eds) => {
        const sourceNode = nodes.find((n) => n.id === params.source) || {};
        const targetNode = nodes.find((n) => n.id === params.target) || {};
        let color = getEdgeColor(params.sourceHandle, params.targetHandle, sourceNode, targetNode);

        if (color === "blue" && targetNode?.type !== "concatNode" && targetNode.type !== "apiNode") {
          const hasExistingBlueConnection = eds.some(edge => {
            if (edge.target !== params.target) return false;
            // // Allow different handles to coexist even if they are both blue
            if (edge.targetHandle !== params.targetHandle) return false;

            const edgeColor =
              ["textInput", "imageInput", "videoInput", "audioInput2", "concatInput", "textInput4"].includes(edge.targetHandle) ||
                ["textOutput", "concatOutput"].includes(edge.sourceHandle)
                ? "blue"
                : "other";

            return edgeColor === "blue";
          });

          if (hasExistingBlueConnection) {
            return eds;
          }
        }

        const newEdges = addEdge({ ...params, style: edgeStyles[color] }, eds);
        if (!sourceNode || !targetNode || !sourceNode.data) return newEdges;

        const sourceData = sourceNode.data;
        const resultValue = sourceData.viewingOutput !== undefined
          ? sourceData.viewingOutput
          : (sourceData.resultUrl || sourceData.outputs?.[0]?.value || null);
        // if (!resultValue || resultValue.trim() === "") return newEdges;

        const sourceValue = sourceNode?.type === "concatNode"
          ? sourceNode?.data?.formValues?.prompt
          : resultValue;

        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== targetNode.id) return n;

            let updatedFormValues = { ...n.data.formValues };

            if (n.id === params.target && n.type === "apiNode") {
              const listFields = ["images", "image_urls", "images_list"];
              const isList = listFields.includes(params.targetHandle) || n.data.taskData?.[params.targetHandle]?.type === "array";

              if (isList) {
                const list = Array.isArray(updatedFormValues[params.targetHandle]) ? [...updatedFormValues[params.targetHandle]] : [];
                if (sourceValue && sourceValue.trim() !== "" && !list.includes(sourceValue)) {
                  list.push(sourceValue);
                }
                updatedFormValues[params.targetHandle] = list;
              } else {
                updatedFormValues[params.targetHandle] = sourceValue;
              }
            }

            if (color === "blue") {
              if (targetNode.type === "concatNode" && params.targetHandle === "concatInput") {
                const allConcatEdges = newEdges.filter((e) =>
                  e.target === targetNode.id && e.targetHandle === "concatInput"
                );

                const concatValues = allConcatEdges.map((e) => {
                  if (e.source === params.source) return resultValue;
                  const sourceNode = prev.find((node) => node.id === e.source);
                  return sourceNode?.data?.resultUrl || sourceNode?.data?.outputs?.[0]?.value || "";
                }).filter(v => v);

                updatedFormValues.prompt = concatValues.join(" ");
              }

              else if (["textInput", "imageInput", "videoInput", "audioInput2", "apiInput"].includes(params.targetHandle)) {
                updatedFormValues.prompt = sourceValue || "";
              }
              else if (params.targetHandle === "textInput4") {
                updatedFormValues.system_prompt = sourceValue || "";
              }
            }

            if (color === "green") {
              if (["textInput2", "videoInput2", "imageInput3", "audioInput3"].includes(params.targetHandle)) {
                updatedFormValues.image_url = resultValue || null;
              } else if (["textInput3", "imageInput2", "videoInput6"].includes(params.targetHandle)) {
                const list = Array.isArray(updatedFormValues.images_list) ? [...updatedFormValues.images_list] : [];
                if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                  list.push(resultValue);
                }
                updatedFormValues.images_list = list;
              } else if (params.targetHandle === "apiInput2") {
                const list = Array.isArray(updatedFormValues.images) ? [...updatedFormValues.images] : [];
                if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                  list.push(resultValue);
                }
                updatedFormValues.images = list;
              } else if (params.targetHandle === "videoInput3") {
                updatedFormValues.last_image = resultValue || null;
              } else if (params.targetHandle === "apiInput3") {
                updatedFormValues.image = resultValue || null;
              }
            }

            if (color === "orange") {
              if (["videoInput4", "audioInput4"].includes(params.targetHandle)) {
                updatedFormValues.video_url = resultValue || null;
              } else if (params.targetHandle === "videoInput7") {
                const key = updatedFormValues.video_files ? "video_files" : "videos_list";
                const list = Array.isArray(updatedFormValues[key]) ? [...updatedFormValues[key]] : [];
                if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                  list.push(resultValue);
                }
                updatedFormValues[key] = list;
              }
            }

            if (color === "yellow") {
              if (["audioInput", "videoInput5"].includes(params.targetHandle)) {
                updatedFormValues.audio_url = resultValue !== undefined ? resultValue : null;
              }
              if (params.targetHandle === "videoInput8") {
                const key = updatedFormValues.audio_files ? "audio_files" : "audios_list";
                const list = Array.isArray(updatedFormValues[key]) ? [...updatedFormValues[key]] : [];
                if (!list.includes(resultValue) && resultValue && resultValue.trim() !== "") {
                  list.push(resultValue);
                }
                updatedFormValues[key] = list;
              }
            }

            return {
              ...n,
              data: {
                ...n.data,
                formValues: updatedFormValues,
              },
            };
          })
        );

        return newEdges;
      });
    },
    [nodes]
  );

  const pollArchitectStatus = (request_id) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/workflow/poll-architect/${request_id}/result`);
        const finalData = response.data;
        const status = finalData.status;

        if (status === "completed") {
          clearInterval(interval);
          const { message, suggestions, workflow } = finalData;

          const newAgentMessage = {
            role: "agent",
            content: message || "Tasks complete. Your workflow has been updated.",
            suggestions: suggestions || [],
            timestamp: new Date().toISOString()
          };
          setChatMessages((prev) => [...prev, newAgentMessage]);

          if (workflow && workflow.nodes) {
            const idMapping = {};
            const counts = { text: 0, image: 0, video: 0, audio: 0 };

            const newNodes = workflow.nodes.map((n) => {
              let newId = n.id;
              const category = n.category;

              if (["user_text", "prompt_gen"].includes(n.id) || category === "text") {
                counts.text++;
                newId = `text${counts.text}`;
              } else if (n.id === "image_gen" || category === "image") {
                counts.image++;
                newId = `image${counts.image}`;
              } else if (category === "video") {
                counts.video++;
                newId = `video${counts.video}`;
              } else if (category === "audio") {
                counts.audio++;
                newId = `audio${counts.audio}`;
              }

              idMapping[n.id] = newId;
              const existingNode = nodes.find((en) => en.id === newId);

              return {
                id: newId,
                type: n.category === "utility" ? (n.model === "video-combiner" ? "vidConcatNode" : "concatNode") : `${n.category}Node`,
                position: existingNode?.position || {
                  x: n.position?.x ?? 350,
                  y: n.position?.y ?? 0
                },
                data: {
                  ...existingNode?.data,
                  nodeSchemas,
                  modelId: n.model,
                  selectedModel: getModelObj(n.category, n.model),
                  outputs: n.output_params?.outputs || [],
                  resultUrl: n.output_params?.resultUrl || null,
                  formValues: n.input_params || n.params || {},
                  outputHistory: existingNode?.data?.outputHistory || [],
                }
              };
            });

            setNodes(newNodes);

            if (workflow.edges && workflow.edges.length > 0) {
              const newEdges = workflow.edges.map((e) => {
                const source = idMapping[e.source] || e.source;
                const target = idMapping[e.target] || e.target;

                const sourceNode = newNodes.find(n => n.id === source);
                const targetNode = newNodes.find(n => n.id === target);

                let sourceHandle = e.sourceHandle;
                let targetHandle = e.targetHandle;

                if ((!sourceHandle || sourceHandle === 'output') && sourceNode) {
                  if (sourceNode.type === 'textNode') sourceHandle = 'textOutput';
                  else if (sourceNode.type === 'imageNode') sourceHandle = 'imageOutput';
                  else if (sourceNode.type === 'videoNode') sourceHandle = 'videoOutput';
                  else if (sourceNode.type === 'audioNode') sourceHandle = 'audioOutput';
                  else if (sourceNode.type === 'concatNode') sourceHandle = 'concatOutput';
                }

                if ((!targetHandle || targetHandle === 'prompt') && targetNode) {
                  if (targetNode.type === 'textNode') targetHandle = 'textInput';
                  else if (targetNode.type === 'imageNode') targetHandle = 'imageInput';
                  else if (targetNode.type === 'videoNode') targetHandle = 'videoInput';
                  else if (targetNode.type === 'audioNode') targetHandle = 'audioInput2';
                  else if (targetNode.type === 'concatNode') targetHandle = 'concatInput';
                }

                let edgeColor = getEdgeColor(sourceHandle, targetHandle, sourceNode, targetNode);

                return {
                  id: `e-${source}-${target}`,
                  source,
                  target,
                  sourceHandle,
                  targetHandle,
                  style: edgeStyles[edgeColor],
                };
              });

              setEdges(newEdges);
            }
          }
          setIsChatLoading(false);
        } else if (status === "failed") {
          clearInterval(interval);
          throw new Error("Architect processing failed");
        }
      } catch (error) {
        clearInterval(interval);
        console.error("Polling error:", error);
        const errorMessage = {
          role: "agent",
          content: "Sorry, I encountered an error while updating your workflow.",
          timestamp: new Date().toISOString()
        };
        setChatMessages((prev) => [...prev, errorMessage]);
        setIsChatLoading(false);
      }
    }, 3000);
  };

  const handleSendMessage = async (content) => {
    const newMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString()
    };
    setChatMessages((prev) => [...prev, newMessage]);

    setIsChatLoading(true);
    try {
      const savedWorkflowId = await handleSaveWorkFlow();

      const history = chatMessages.map(msg => ({
        role: msg.role === "agent" ? "assistant" : msg.role,
        content: msg.content
      }));

      const response = await axios.post("/api/workflow/architect", {
        prompt: content,
        workflow_id: savedWorkflowId,
        history: history,
      });

      const { request_id, status } = response.data;
      pollArchitectStatus(request_id);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        role: "agent",
        content: "Sorry, I encountered an error processing your request.",
        timestamp: new Date().toISOString()
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  const onEdgeClick = (event, edge) => {
    event.stopPropagation();
    setEdges((eds) => {
      const updatedEdges = eds.filter((e) => e.id !== edge.id);

      const targetNode = nodes.find((n) => n.id === edge.target);
      if (targetNode?.type === "concatNode" && edge.targetHandle === "concatInput") {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== targetNode.id) return n;
            const remainingConcatEdges = updatedEdges.filter((e) =>
              e.target === targetNode.id && e.targetHandle === "concatInput"
            );

            let updatedFormValues = { ...n.data.formValues };

            if (remainingConcatEdges.length > 0) {
              const concatValues = remainingConcatEdges.map((e) => {
                const sourceNode = prev.find((node) => node.id === e.source);
                return sourceNode?.data?.resultUrl || sourceNode?.data?.outputs?.[0]?.value || "";
              }).filter(v => v);

              updatedFormValues.prompt = concatValues.join(" ");
            } else {
              updatedFormValues.prompt = "";
            }

            return {
              ...n,
              data: {
                ...n.data,
                formValues: updatedFormValues,
              },
            };
          })
        );
      }

      if (targetNode?.type === "vidConcatNode" && edge.targetHandle === "videoInput7") {
        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== targetNode.id) return n;
            const removedSourceNode = prev.find((node) => node.id === edge.source);
            const removedUrl = removedSourceNode?.data?.resultUrl || removedSourceNode?.data?.outputs?.[0]?.value;
            const remainingVideoEdges = updatedEdges.filter((e) =>
              e.target === targetNode.id && e.targetHandle === "videoInput7"
            );
            const remainingUrls = remainingVideoEdges.map((e) => {
              const src = prev.find((node) => node.id === e.source);
              return src?.data?.resultUrl || src?.data?.outputs?.[0]?.value || "";
            }).filter(v => v);

            let updatedFormValues = { ...n.data.formValues };
            if (remainingUrls.length > 0) {
              const key = updatedFormValues.video_files ? "video_files" : "videos_list";
              updatedFormValues[key] = remainingUrls;
            } else {
              const key = updatedFormValues.video_files ? "video_files" : "videos_list";
              const currentList = Array.isArray(updatedFormValues[key])
                ? updatedFormValues[key].filter(v => v !== removedUrl)
                : [];
              updatedFormValues[key] = currentList;
            }

            return {
              ...n,
              data: { ...n.data, formValues: updatedFormValues },
            };
          })
        );
      }

      return updatedEdges;
    });
  };

  const buildWorkflowPayload = () => {
    const nodeData = nodes.map((node) => {

      const connectedEdges = edges.filter((e) => e.target === node.id);
      const inputNodes = connectedEdges.map((e) => e.source);
      const category = node.type === "textNode" ? "text" : node.type === "imageNode" ? "image" : node.type === "videoNode" ? "video" : node.type === "apiNode" ? "api" : node.type === "audioNode" ? "audio" : "utility";
      const isVideoCombiner = node.type === "vidConcatNode";
      const model = node.data?.selectedModel?.id ? node.data?.selectedModel?.id : category === "utility" ? (isVideoCombiner ? "video-combiner" : "prompt-concatenator") : `${category}-passthrough`;
      const modelSchema = nodeSchemas?.categories?.[category]?.models?.[model]?.input_schema?.schemas?.input_data;
      const inputSchema = modelSchema?.properties || {};
      const wavespeedSchema = nodeSchemas?.categories?.api?.models?.[model]?.input_schema;
      const concatSchema = nodeSchemas?.categories?.utility?.models?.["prompt-concatenator"]?.input_schema;
      const videoCombinerSchema = nodeSchemas?.categories?.utility?.models?.["video-combiner"]?.input_schema?.schemas?.input_data?.properties;
      const formValues = node.data?.formValues || {};

      let dynamicPrompt = "";

      if (node.type === "concatNode") {
        const promptConnections = connectedEdges.filter((e) =>
          ["concatInput"].includes(e.targetHandle)
        );
        dynamicPrompt = promptConnections.length > 0
          ? promptConnections.map((conn) => `{{ ${conn.source}.outputs[0].value }}`)
          : [];
      } else {
        const promptConnections = connectedEdges.filter((e) =>
          ["textInput", "imageInput", "videoInput", "audioInput2", "apiInput"].includes(e.targetHandle)
        );
        dynamicPrompt = promptConnections.length > 0
          ? `{{ ${promptConnections[0].source}.outputs[0].value }}`
          : "";
      }

      const systemPromptConnections = connectedEdges.filter((e) =>
        e.targetHandle === "textInput4"
      );
      const dynamicSystemPrompt =
        systemPromptConnections.length > 0
          ? `{{ ${systemPromptConnections[0].source}.outputs[0].value }}`
          : formValues?.system_prompt || null;

      const imageListConnections = connectedEdges.filter((e) =>
        ["textInput3", "imageInput2", "videoInput6", "apiInput2"].includes(e.targetHandle)
      );

      const dynamicImagesList =
        imageListConnections.length > 0
          ? imageListConnections.map(
            (conn) => `{{ ${conn.source}.outputs[0].value }}`
          )
          : formValues?.images_list || []; // || [node.data?.outputs?.[0]?.value] 

      const imageUrlConnections = connectedEdges.filter((e) =>
        ["textInput2", "videoInput2", "imageInput3", "audioInput3", "apiInput3"].includes(e.targetHandle)
      );

      const videoUrlConnections = connectedEdges.filter((e) =>
        ["videoInput4", "audioInput4"].includes(e.targetHandle)
      );

      const videoListConnections = connectedEdges.filter((e) =>
        e.targetHandle === "videoInput7"
      );

      const audioListConnections = connectedEdges.filter((e) =>
        e.targetHandle === "videoInput8"
      );

      const dynamicVideosKey = formValues?.video_files ? "video_files" : "videos_list";
      const dynamicVideosList =
        videoListConnections.length > 0
          ? videoListConnections.map((conn) => `{{ ${conn.source}.outputs[0].value }}`)
          : formValues[dynamicVideosKey] || [];

      const dynamicAudiosKey = formValues?.audio_files ? "audio_files" : "audios_list";
      const dynamicAudiosList =
        audioListConnections.length > 0
          ? audioListConnections.map((conn) => `{{ ${conn.source}.outputs[0].value }}`)
          : formValues[dynamicAudiosKey] || [];

      const audioUrlConnections = connectedEdges.filter((e) =>
        ["audioInput", "videoInput5"].includes(e.targetHandle)
      );

      const dynamicImageUrl =
        imageUrlConnections.length > 0
          ? `{{ ${imageUrlConnections[0].source}.outputs[0].value }}`
          : formValues?.image_url || null;

      const lastImageConnections = connectedEdges.filter(
        (e) => e.targetHandle === "videoInput3"
      );

      const dynamicVideoUrl =
        videoUrlConnections.length > 0
          ? `{{ ${videoUrlConnections[0].source}.outputs[0].value }}`
          : formValues?.video_url || null;

      const dynamicAudioUrl =
        audioUrlConnections.length > 0
          ? `{{ ${audioUrlConnections[0].source}.outputs[0].value }}`
          : formValues?.audio_url || null;

      const dynamicLastImage =
        lastImageConnections.length > 0
          ? `{{ ${lastImageConnections[0].source}.outputs[0].value }}`
          : formValues?.last_image || null; // || node.data?.outputs?.[0]?.value 

      const localSources = {
        ...formValues,
        prompt: dynamicPrompt ? dynamicPrompt : formValues?.prompt,
        system_prompt: dynamicSystemPrompt,
        images_list: dynamicImagesList,
        images: dynamicImagesList,
        image_urls: dynamicImagesList,
        image_url: dynamicImageUrl,
        video_url: dynamicVideoUrl,
        audio_url: dynamicAudioUrl,
        image: dynamicImageUrl,
        last_image: dynamicLastImage,
        videos_list: dynamicVideosList,
        video_files: dynamicVideosList,
        audios_list: dynamicAudiosList,
        audio_files: dynamicAudiosList,
      };

      if (node.type === "apiNode") {
        const listFields = ["images", "image_urls", "images_list"];
        connectedEdges.forEach((edge) => {
          if (edge.target === node.id) {
            const val = `{{ ${edge.source}.outputs[0].value }}`;
            const isList = listFields.includes(edge.targetHandle) || wavespeedSchema?.[edge.targetHandle]?.type === "array";

            if (isList) {
              if (!Array.isArray(localSources[edge.targetHandle])) {
                localSources[edge.targetHandle] = [];
              }
              if (!localSources[edge.targetHandle].includes(val)) {
                localSources[edge.targetHandle].push(val);
              }
            } else {
              localSources[edge.targetHandle] = val;
            }
          }
        });
      }

      let params = {};
      const input_params = formValues || {};
      let output_params = {};

      if (node.type === "apiNode") {
        for (const [key, meta] of Object.entries(wavespeedSchema)) {
          if (localSources[key] !== undefined && localSources[key] !== null) {
            params[key] = localSources[key];
          } else {
            params[key] = meta.default ?? null;
          }
        }

        const filteredInputParams = Object.fromEntries(
          Object.entries(input_params).filter(([key]) =>
            key !== "model_url" && key !== "api_key" && key !== "model_name" && key !== "model_type"
          )
        );

        params["params"] = filteredInputParams;

        for (const [key, meta] of Object.entries(filteredInputParams)) {
          if (localSources[key] !== undefined && localSources[key] !== null) {
            params.params[key] = localSources[key];
          } else {
            params.params[key] = meta?.default ?? null;
          }
        }
      } else if (node.type === "vidConcatNode") {
        const vcSchema = videoCombinerSchema || { videos_list: { default: [] }, aspect_ratio: { default: "auto" } };
        for (const [key, meta] of Object.entries(vcSchema)) {
          if (localSources[key] !== undefined && localSources[key] !== null) {
            params[key] = localSources[key];
          } else {
            params[key] = meta.default ?? null;
          }
        }
      } else if (node.type === "concatNode") {
        for (const [key, meta] of Object.entries(concatSchema)) {
          if (localSources[key] !== undefined && localSources[key] !== null) {
            params[key] = localSources[key];
          } else {
            params[key] = meta.default ?? null;
          }
        }
      } else {
        for (const [key, meta] of Object.entries(inputSchema)) {
          if (localSources[key] !== undefined && localSources[key] !== null) {
            params[key] = localSources[key];
          } else {
            params[key] = meta.default ?? null;
          }
        }
      }

      if (node.type === "textNode") {
        output_params = {
          resultUrl: node.data?.resultUrl || "",
          outputs: node.data?.outputs || [],
        }
      } else if (["imageNode", "videoNode", "audioNode", "apiNode", "concatNode", "vidConcatNode"].includes(node.type)) {
        output_params = {
          resultUrl: node.data?.resultUrl || null,
          outputs: node.data?.outputs || [],
        }
      }

      return {
        id: node.id,
        category,
        model,
        input_params,
        output_params,
        params,
        position: node.position,
        ...(inputNodes.length > 0 ? { inputs: inputNodes } : {}),
      };
    });

    return {
      workflow_id: interactionMode ? workflowId || null : null,
      source_workflow_id: !interactionMode ? workflowId : null,
      name: workflowName || "Untitled",
      edges: edges,
      data: {
        nodes: nodeData
      },
      is_vadoo: false,
      category: workflowCategory,
    };
  };

  const handleSaveWorkFlow = async () => {
    if (!interactionMode) return;
    const workflowPayload = buildWorkflowPayload();

    try {
      const response = await axios.post("/api/workflow/create", workflowPayload);
      console.log("Workflow created:", response.data);
      setDropDown(0);
      setWorkflowIds(response.data.workflow_id, runId);
      setWorkflowId(response.data.workflow_id);
      return response.data.workflow_id;
    } catch (error) {
      console.log(error);
      if (error.response) {
        toast.error(`Failed: ${error.response.data.detail || "Server error"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  const handleDuplicateWorkflow = async () => {
    if (interactionMode) return;
    setIsRunning(3);
    const workflowPayload = buildWorkflowPayload();

    try {
      const response = await axios.post("/api/workflow/create", workflowPayload);
      console.log("Workflow created:", response.data);
      window.location.href = `/workflow/${response.data.workflow_id}`;
    } catch (error) {
      console.log(error);
      setIsRunning(0);
      if (error.response) {
        toast.error(`Failed: ${error.response.data.detail || "Server error"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      handleSaveWorkFlow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [handleSaveWorkFlow]);

  const pollRunIdStatus = (runId) => {
    const interval = setInterval(() => {
      axios.get(`/api/workflow/run/${runId}/status`)
        .then((response) => {
          const runData = response.data;
          const nodesStatus = runData?.nodes || {};
          setWorkflowIds(workflowId, runId);

          Object.entries(nodesStatus).forEach(([id, runs]) => {
            if (!runs || runs.length === 0) return;

            const latestRun = runs[runs.length - 1];
            const status = latestRun?.status;
            const result = latestRun?.result;
            const outputs = result?.outputs || [];
            const first = outputs?.[0]?.value || "";

            if (status === "processing" || status === "running") {
              setLoadingNodes((prev) => ({ ...prev, [id]: true }));
              return;
            } else {
              setLoadingNodes((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              });
            }

            if (status === "succeeded" || status === "completed") {
              setLoadingNodes((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              });

              setNodes((prevNodes) => {
                let updatedNodes = prevNodes.map((node) => {
                  const nodeIdMatch = id.toLowerCase().replace(/\s+/g, '') === node.id.toLowerCase().replace(/\s+/g, '');
                  if (!nodeIdMatch || !result) return node;

                  if (["textNode", "imageNode", "videoNode", "audioNode", "concatNode", "apiNode", "vidConcatNode"].includes(node.type)) {
                    const currentHistory = node.data.outputHistory || [];
                    const isAlreadyInHistory = currentHistory.some(h => h.result?.id === result.id);
                    const newHistory = isAlreadyInHistory
                      ? currentHistory.map(h => h.result?.id === result.id ? latestRun : h)
                      : [...currentHistory, latestRun];

                    return {
                      ...node,
                      data: {
                        ...node.data,
                        outputs,
                        resultUrl: first,
                        isLoading: false,
                        errorMsg: null,
                        outputHistory: newHistory,
                      },
                    };
                  }

                  return node;
                });

                updatedNodes = updatedNodes.map((node) => {
                  if (node.id === id) {
                    return node;
                  }
                  return node;
                });

                return updatedNodes;
              });

              onDataChange(id, { outputs, resultUrl: first, isLoading: false });
            } else if (status === "failed") {
              setLoadingNodes((prev) => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
              });
              setNodes((prevNodes) => prevNodes.map(n => {
                if (n.id === id) {
                  return { ...n, data: { ...n.data, isLoading: false, errorMsg: "Generation Failed" } };
                }
                return n;
              }));
            }
          });

          const allCompleted = Object.values(nodesStatus).every(
            (nodeRuns) => nodeRuns[0]?.status === "succeeded"
          );

          const anyFailed = Object.values(nodesStatus).some(
            (nodeRuns) => nodeRuns[0]?.status === "failed"
          );
          if (allCompleted) {
            clearInterval(interval);
            setLoadingNodes({});
            setIsRunning(0);
          } else if (anyFailed) {
            toast.error("Workflow failed on some nodes");
            clearInterval(interval);
            setLoadingNodes({});
            setIsRunning(0);
          }
          console.log("run", runData);
        })
        .catch((error) => {
          console.log(error);
          clearInterval(interval);
          setLoadingNodes({});
          setIsRunning(0);
          toast.error("Failed to get workflow status");
        });
    }, 3000);
  };

  const handleRunWorkflow = async () => {
    if (!interactionMode) return;
    try {
      setIsRunning(1);
      setLoadingNodes({});
      const savedWorkflowId = await handleSaveWorkFlow();

      const response = await axios.post(`/api/workflow/${workflowId}/run`, {
        cost: totalWorkflowCost
      });
      console.log("run data:", response.data);
      const newRunId = response.data.run_id;
      setRunId(newRunId);
      setWorkflowIds(workflowId, newRunId);
      pollRunIdStatus(newRunId);
    } catch (error) {
      console.log(error);
      if (error.response) {
        toast.error(`Failed: ${error.response.data.detail || "Server error"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
      setLoadingNodes({});
      setIsRunning(0);
    }
  };

  const handlePublishWorkflow = async () => {
    if (!interactionMode) return;
    try {
      setIsRunning(2);
      const savedWorkflowId = await handleSaveWorkFlow();

      const response = await axios.post(`/api/workflow/workflow/${savedWorkflowId}/publish`, {
        publish: !publishWorkflow
      });
      setIsRunning(0);
      toast.success(response.data.publish ? "Published successfully" : "Unpublished successfully");
      setPublishWorkflow(response.data.publish);
    } catch (error) {
      console.log(error);
      if (error.response) {
        toast.error(`Failed: ${error.response.data.detail || "Server error"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
      setLoadingNodes({});
      setIsRunning(0);
    }
  };

  const handleTemplatePublish = async () => {
    if (!interactionMode) return;
    try {
      setIsRunning(4);
      const savedWorkflowId = await handleSaveWorkFlow();

      const response = await axios.post(`/api/workflow/workflow/${savedWorkflowId}/template`, {
        is_template: !template.isPublishedTemplate
      });
      const is_template = response.data.is_template;
      setIsRunning(0);
      toast.success(is_template ? "Published successfully" : "Unpublished successfully");
      setTemplate(prev => ({ ...prev, isPublishedTemplate: is_template }));
    } catch (error) {
      console.log(error);
      if (error.response) {
        toast.error(`Failed: ${error.response.data.detail || "Server error"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
      setIsRunning(0);
    }
  };

  const handleCategorySave = async () => {
    if (!workflowId) {
      toast.error("Workflow ID not found. Save the workflow first.");
      return;
    }

    try {
      const response = await axios.post(`/api/workflow/update-category/${workflowId}`, {
        category: categoryInput
      });
      console.log("Category updated:", response.data);
      setWorkflowCategory(categoryInput);
      setIsCategoryPopupOpen(false);
      toast.success("Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      if (error.response) {
        toast.error(`Failed: ${error.response.data.detail || "Server error"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };

  const runNodeFromFlow = (nodeId) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, triggerRun: true } }
          : n
      )
    );
  };

  const runNodeInputsFromFlow = (nodeId) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, triggerInputs: true } }
          : n
      )
    );
  };

  const getNextId = (type) => {
    const baseType = type.replace("Node","");
    const existingIds = nodes.map(n => n.id);
    let count = 1;
    while (existingIds.includes(`${baseType}${count}`)) {
      count++;
    }
    return `${baseType}${count}`;
  };

  const duplicateNode = useCallback((nodeId) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNodeId = getNextId(nodeToDuplicate.type);
    const newNode = {
      ...nodeToDuplicate,
      id: newNodeId,
      position: {
        x: nodeToDuplicate.position.x + 40,
        y: nodeToDuplicate.position.y + 40,
      },
      selected: true,
      data: {
        ...nodeToDuplicate.data,
      }
    };

    setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(newNode));
    toast.success(`Duplicated node ${nodeId} to ${newNodeId}`);
  }, [nodes, setNodes]);

  const nodesWithHandlers = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      nodeSchemas,
      onDataChange,
      handleSaveWorkFlow,
      isLoading: loadingNodes[node.id] || false,
      activeHandleColor,
      triggerRun: node.data.triggerRun || false,
      triggerInputs: node.data.triggerInputs || false,
      runNodeFromFlow,
      runNodeInputsFromFlow,
      runId,
      duplicateNode,
      setNodes,
      setEdges,
      handleTypes: {
        ...(node.type === 'apiNode' ? Object.keys(node.data?.formValues || {}).reduce((acc, key) => ({ ...acc, [key]: 'white' }), {}) : {}),
        concatInput: "blue", concatOutput: "blue",
        apiInput: "blue", apiInput2: "green", apiInput3: "green",
        apiOutput: (() => {
          if (node.type !== 'apiNode') return "green";
          const output = node.data?.outputs?.[0];
          const modelType = node.data?.formValues?.model_type;
          if (output?.type === 'text' || modelType === 'chat') return "blue";
          if (output?.type === 'video_url' || modelType === 'video') return "orange";
          if (output?.type === 'audio_url' || modelType === 'audio') return "yellow";
          return "green";
        })(),
        textInput: "blue", textInput2: "green", textInput3: "green", textInput4: "blue", textOutput: "blue",
        imageInput: "blue", imageInput2: "green", imageInput3: "green", imageOutput: "green",
        videoInput: "blue", videoInput2: "green", videoInput3: "green", videoInput4: "orange", videoInput5: "yellow", videoInput6: "green", videoInput7: "orange", videoInput8: "yellow", videoOutput: "orange",
        audioInput: "yellow", audioInput2: "blue", audioInput3: "green", audioInput4: "orange", audioOutput: "yellow",
      }
    },
  }));

  const isValidConnection = (connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (source === target) return false;

    const sourceNode = nodesWithHandlers.find(n => n.id === source);
    const targetNode = nodesWithHandlers.find(n => n.id === target);

    if (!sourceNode || !targetNode) return false;

    const sourceType = sourceNode?.data?.handleTypes?.[sourceHandle];
    const targetType = targetNode?.data?.handleTypes?.[targetHandle];

    if (!sourceType || !targetType || (sourceType !== targetType && targetType !== 'white')) return false;

    const isSourceOutput = sourceHandle.toLowerCase().includes("output");
    const isTargetInput = targetHandle.toLowerCase().includes("input") || (targetNode.type === "apiNode" && targetHandle !== "apiOutput");
    if (!isSourceOutput || !isTargetInput) return false;

    const formValues = targetNode.data?.formValues || {};
    let validHandles = [];

    switch (targetNode.type) {
      case "textNode":
        const hasTextPrompt = "prompt" in formValues
        const hasTextImageUrl = "image_url" in formValues;
        const hasTextImagesList = "images_list" in formValues;
        const hasTextSystemPrompt = "system_prompt" in formValues;
        validHandles = [
          hasTextPrompt && "textInput",
          hasTextImageUrl && "textInput2",
          hasTextImagesList && "textInput3",
          hasTextSystemPrompt && "textInput4",
        ].filter(Boolean);
        break;

      case "imageNode":
        const hasImagePrompt = "prompt" in formValues;
        const hasImagesList = "images_list" in formValues;
        const hasImageImageUrl = "image_url" in formValues;
        validHandles = [
          hasImagePrompt && "imageInput",
          hasImagesList && "imageInput2",
          hasImageImageUrl && "imageInput3",
        ].filter(Boolean);
        break;

      case "videoNode":
        const hasVideoPrompt = "prompt" in formValues;
        const hasVideoImagesList = "images_list" in formValues;
        const hasVideoImageUrl = "image_url" in formValues;
        const hasLastImage = "last_image" in formValues;
        const hasVideoUrl = "video_url" in formValues;
        const hasVideoAudioUrl = "audio_url" in formValues;
        const hasVideosList = "videos_list" in formValues || "video_files" in formValues;
        const hasAudiosList = "audios_list" in formValues || "audio_files" in formValues;
        validHandles = [
          hasVideoPrompt && "videoInput",
          hasVideoImageUrl && "videoInput2",
          hasLastImage && "videoInput3",
          hasVideoUrl && "videoInput4",
          hasVideoAudioUrl && "videoInput5",
          hasVideoImagesList && "videoInput6",
          hasVideosList && "videoInput7",
          hasAudiosList && "videoInput8",
        ].filter(Boolean);
        break;

      case "audioNode":
        const hasAudioUrl = "audio_url" in formValues;
        const hasAudioPrompt = "prompt" in formValues;
        const hasAudioImageUrl = "image_url" in formValues;
        const hasAudioVideoUrl = "video_url" in formValues;
        validHandles = [
          hasAudioUrl && "audioInput",
          hasAudioPrompt && "audioInput2",
          hasAudioImageUrl && "audioInput3",
          hasAudioVideoUrl && "audioInput4",
        ].filter(Boolean);
        break;

      case "apiNode":
        const apiInputs = Object.keys(targetNode.data?.formValues || {});
        const exposedHandles = targetNode.data?.exposedHandles || [];
        validHandles = apiInputs.filter(k => k !== 'apiOutput' && exposedHandles.includes(k));
        break;

      case "vidConcatNode":
        validHandles = ["videoInput7"];
        break;

      default:
        return true;
    }

    if (!validHandles.includes(targetHandle)) {
      return false;
    }

    return true;
  };

  const onConnectStart = (event, params) => {
    const node = nodesWithHandlers.find(n => n.id === params.nodeId);
    const handleColor = node?.data?.handleTypes?.[params.handleId];
    setActiveHandleColor(handleColor);

    const isOutput = params.handleId.toLowerCase().includes("output");
    setDraggedEdgeInfo({
      nodeId: params.nodeId,
      handleId: params.handleId,
      handleColor: handleColor,
      isOutput: isOutput,
    });
  };

  const onConnectEnd = useCallback((event) => {
    setActiveHandleColor(null);

    if (draggedEdgeInfo && !connectionMadeRef.current) {
      const cursorX = event?.clientX || mousePos.x;
      const cursorY = event?.clientY || mousePos.y;

      setEdgePicker({
        sourceNodeId: draggedEdgeInfo.isOutput ? draggedEdgeInfo.nodeId : null,
        targetNodeId: draggedEdgeInfo.isOutput ? null : draggedEdgeInfo.nodeId,
        sourceHandleId: draggedEdgeInfo.isOutput ? draggedEdgeInfo.handleId : null,
        targetHandleId: draggedEdgeInfo.isOutput ? null : draggedEdgeInfo.handleId,
        handleColor: draggedEdgeInfo.handleColor,
        isOutput: draggedEdgeInfo.isOutput,
        cursorPos: { x: cursorX, y: cursorY }
      });
    }

    setDraggedEdgeInfo(null);
    connectionMadeRef.current = false;
  }, [draggedEdgeInfo, nodesWithHandlers, mousePos]);

  const handleSelectNodeFromEdgePicker = (nodeType, position = null, initialData = {}) => {
    if (!edgePicker) return;
    const newNodeId = getNextId(nodeType);

    const handleTypesMap = {
      concatInput: "blue", concatOutput: "blue",
      apiInput: "blue", apiInput2: "green", apiInput3: "green", apiOutput: "green",
      textInput: "blue", textInput2: "green", textInput3: "green", textInput4: "blue", textOutput: "blue",
      imageInput: "blue", imageInput2: "green", imageInput3: "green", imageOutput: "green",
      videoInput: "blue", videoInput2: "green", videoInput3: "green", videoInput4: "orange", videoInput5: "yellow", videoInput6: "green", videoInput7: "orange", videoInput8: "yellow", videoOutput: "orange",
      audioInput: "yellow", audioInput2: "blue", audioInput3: "green", audioInput4: "orange", audioOutput: "yellow",
    };

    const flowPosition = screenToFlowPosition({
      x: edgePicker.cursorPos.x,
      y: edgePicker.cursorPos.y,
    });

    const newNode = {
      id: newNodeId,
      type: nodeType,
      position: {
        x: flowPosition.x - 160,
        y: flowPosition.y - 100,
      },
      data: { ...initialData },
    };

    setNodes((prev) => [...prev, newNode]);
    let connection;

    if (edgePicker.isOutput) {
      const nodeTypeToHandles = {
        textNode: ["textInput", "textInput2", "textInput3", "textInput4"],
        imageNode: ["imageInput", "imageInput2", "imageInput3"],
        videoNode: ["videoInput", "videoInput2", "videoInput3", "videoInput4", "videoInput5", "videoInput6", "videoInput7", "videoInput8"],
        audioNode: ["audioInput", "audioInput2", "audioInput3", "audioInput4"],
        apiNode: ["apiInput", "apiInput2", "apiInput3"],
        concatNode: ["concatInput"],
        vidConcatNode: ["videoInput7"],
      };

      const sourceHandleColor = handleTypesMap[edgePicker.sourceHandleId];
      const compatibleHandles = nodeTypeToHandles[nodeType] || [];
      const targetHandle = compatibleHandles.find(h =>
        handleTypesMap[h] === sourceHandleColor
      );

      if (targetHandle) {
        connection = {
          source: edgePicker.sourceNodeId,
          target: newNodeId,
          sourceHandle: edgePicker.sourceHandleId,
          targetHandle: targetHandle,
        };
      }
    } else {
      const nodeTypeToHandles = {
        textNode: ["textOutput"],
        imageNode: ["imageOutput"],
        videoNode: ["videoOutput"],
        audioNode: ["audioOutput"],
        apiNode: ["apiOutput"],
        concatNode: ["concatOutput"],
        vidConcatNode: ["videoOutput"],
      };

      const targetHandleColor = handleTypesMap[edgePicker.targetHandleId];
      const compatibleHandles = nodeTypeToHandles[nodeType] || [];
      const sourceHandle = compatibleHandles.find(h =>
        handleTypesMap[h] === targetHandleColor
      );

      if (sourceHandle) {
        connection = {
          source: newNodeId,
          target: edgePicker.targetNodeId,
          sourceHandle: sourceHandle,
          targetHandle: edgePicker.targetHandleId,
        };
      }
    }

    if (connection) {
      setTimeout(() => {
        connectionMadeRef.current = false;
        onConnectRef.current(connection);
      }, 100);
    }

    setEdgePicker(null);
    setDraggedEdgeInfo(null);
  };

  const getCompatibleNodeTypes = (handleColor, isOutput) => {
    if (isOutput) {
      const compatibilityMap = {
        blue: ['textNode', 'imageNode', 'videoNode', 'audioNode', 'apiNode', 'concatNode'],
        green: ['imageNode', 'videoNode', 'apiNode'],
        orange: ['videoNode', 'vidConcatNode'],
        yellow: ['audioNode', 'videoNode']
      };
      return compatibilityMap[handleColor] || [];
    } else {
      const compatibilityMap = {
        blue: ['textNode', 'concatNode', 'apiNode'],
        green: ['imageNode', 'apiNode'],
        orange: ['videoNode', 'vidConcatNode'],
        yellow: ['audioNode']
      };
      return compatibilityMap[handleColor] || [];
    }
  };

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      position,
    });
  }, [screenToFlowPosition]);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getNewNodePosition = (lastNode) => {
    if (!lastNode) return { x: 250, y: 250 };

    const NODE_WIDTH = 320;
    const NODE_HEIGHT = 300;
    const GAP = 10;
    const MAX_ROW_WIDTH = 1200;

    // const offsetX = Math.random() * 200 - 100;
    // const offsetY = Math.random() * 200 - 100;

    // return {
    //   x: lastNode.position.x + offsetX,
    //   y: lastNode.position.y + offsetY
    // };
    const nextX = lastNode.position.x + NODE_WIDTH + GAP;

    if (nextX > MAX_ROW_WIDTH) {
      return {
        x: 250,
        y: lastNode.position.y + NODE_HEIGHT + GAP,
      };
    }

    return {
      x: nextX,
      y: lastNode.position.y,
    };
  };

  const addNode = (nodeType, position = null, initialData = {}) => {
    const isEmptyCanvas = nodes.length === 0;
    const id = getNextId(nodeType);
    let nodePosition;
    if (position) {
      nodePosition = position;
    } else {
      const lastNode = nodes[nodes.length - 1];
      nodePosition = getNewNodePosition(lastNode);
    }

    const newNode = {
      id,
      type: nodeType,
      position: nodePosition,
      data: { ...initialData },
    };

    setNodes((prev) => [...prev, newNode]);
    setDropDown(0);
    setContextMenu(null);
    if (!position) {
      setTimeout(() => fitView({ padding: isEmptyCanvas ? 1.2 : 0.8, duration: 500, minZoom: isEmptyCanvas ? 0.15 : 0.2 }), 0);
    }
  };

  const onKeyDown = useCallback((e) => {
    if (e.key === "Delete") {
      setNodes((nds) => {
        const deletedIds = nds.filter((n) => n.selected).map((n) => n.id);
        const remainingNodes = nds.filter((n) => !n.selected);
        setEdges((eds) => eds.filter(
          (e) => !deletedIds?.includes(e.source) && !deletedIds?.includes(e.target)
        ));
        return remainingNodes;
      });
    }
  }, []);

  const selectedNodes = nodes.filter(node => node.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const { generationCost, isRefreshingCost } = useGenerationCost(selectedNode?.data?.selectedModel, selectedNode?.data?.formValues);
  
  const updateNodeFromPanel = useCallback((key, value) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode?.id) {
          return {
            ...node,
            data: {
              ...node.data,
              formValues: {
                ...node.data.formValues,
                [key]: value,
              },
            },
          };
        }
        return node;
      })
    );
  }, [selectedNode, setNodes]);

  const updateModel = useCallback((model) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              selectedModel: model,
            },
          };
        }
        return node;
      })
    );
    setDropDown(0);
  }, [selectedNode, setNodes]);

  const getModelsForNode = (node) => {
    if (!node || !nodeSchemas?.categories) return [];

    const mapModels = (modelsMap) =>
      modelsMap ? Object.entries(modelsMap).map(([id, model]) => ({
        ...model,
        id,
        name: SPECIAL_MODEL_NAMES[id] || formatName(id)
      })) : [];

    if (node.type === "textNode") return mapModels(nodeSchemas.categories.text?.models);
    if (node.type === "imageNode") return mapModels(nodeSchemas.categories.image?.models);
    if (node.type === "videoNode") return mapModels(nodeSchemas.categories.video?.models);
    if (node.type === "audioNode") return mapModels(nodeSchemas.categories.audio?.models);
    if (node.type === "apiNode") return filteredApiNodeModels;
    return [];
  };

  const getFilteredModelsForNode = (node) => {
    const models = getModelsForNode(node);

    if (!modelSearch.trim()) return models;
    const normalize = (text = "") =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    const normalizedSearch = normalize(modelSearch);

    return models.filter((model) => {
      const name = normalize(model.name);
      const id = normalize(model.id);

      return (
        name.includes(normalizedSearch) ||
        id.includes(normalizedSearch)
      );
    });
  };

  const connectionLineStyle = {
    stroke: activeHandleColor === 'blue' ? '#3b82f6'
      : activeHandleColor === 'green' ? '#22c55e'
        : activeHandleColor === 'orange' ? '#f97316'
          : activeHandleColor === 'yellow' ? '#eab308'
            : '#ffffffff',
    strokeWidth: 2,
  };

  return (
    <div tabIndex={0} onKeyDown={onKeyDown} className="flex h-dvh w-full relative">
      {isRestoring && (
        <div className="fixed inset-0 flex items-center justify-center gap-2 bg-black w-full h-full z-20">
          <div className="w-6 h-6 rounded-full border-[4px] border-white border-t-transparent animate-spin"></div>
          <div className="text-white text-xl font-bold">Loading...</div>
        </div>
      )}
      <div className="flex items-center justify-center absolute top-0 z-20 bg-[#151618] w-full py-3 border-b border-gray-800">
        <div className="flex items-center justify-between w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[80%] overflow-x-auto">
          <div className="flex items-center gap-2 w-[35%]">
            <Link
              href="/workflow"
              className="text-white"
            >
              <FaAngleLeft />
            </Link>
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={() => setDropDown(prev => prev === 2 ? 0 : 2)}
              disabled={!interactionMode}
              className="flex items-center gap-2 text-base outline-none text-[#adacaa] hover:text-white cursor-pointer bg-transparent max-w-[90%]"
            >
              <span className="truncate block w-full">{workflowName ? workflowName : "Untitled"}</span> <FaRegEdit size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {template.showTemplateBtn && (
              <div
                className="relative"
                onBlur={(e) => {
                  const currentTarget = e.currentTarget;
                  setTimeout(() => {
                    if (currentTarget && !currentTarget.contains(document.activeElement)) {
                      setIsSettingsOpen(false);
                    }
                  }, 150);
                }}
                tabIndex={0}
              >
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-white text-black text-sm rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  <FaToolbox size={14} /> Settings <FaAngleDown size={12} className={`transition-transform duration-300 ${isSettingsOpen ? "rotate-180" : ""}`} />
                </button>

                {isSettingsOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1b1e23] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <button
                      type="button"
                      suppressHydrationWarning={true}
                      disabled={isRunning === 4}
                      onClick={() => {
                        handleTemplatePublish();
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#2c3037] hover:text-white transition-colors border-b border-gray-700/50 disabled:opacity-50"
                    >
                      {isRunning === 4 ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-gray-300 rounded-full animate-spin"></div>
                      ) : (
                        <LuLayoutTemplate size={16} />
                      )}
                      <span>{template.isPublishedTemplate ? "Undo Template" : "Make Template"}</span>
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning={true}
                      onClick={() => {
                        setIsCategoryPopupOpen(true);
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-[#2c3037] hover:text-white transition-colors"
                    >
                      <RiInputMethodLine size={16} />
                      <span>Category</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {interactionMode ? (
              <>
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  disabled={isRunning === 2 || !interactionMode}
                  onClick={handlePublishWorkflow}
                  className="flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-white text-black text-sm rounded-full group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white"
                >
                  {isRunning === 2 ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-black group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin"></div> Publishing...
                    </>
                  ) : (
                    <>
                      <FaTelegramPlane size={16} /> {publishWorkflow ? "Unpublish" : "Publish"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  disabled={isRunning === 1 || !interactionMode}
                  onClick={handleRunWorkflow}
                  className="flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-blue-500 text-white text-sm rounded-full font-semibold group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white whitespace-nowrap"
                >
                  {isRunning === 1 ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-black group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin"></div> Running...
                    </>
                  ) : (
                    <>
                      <FaPlay size={16} /> Run All {parseFloat(totalWorkflowCost) > 0 && `($${totalWorkflowCost})`}
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                suppressHydrationWarning={true}
                disabled={interactionMode}
                onClick={handleDuplicateWorkflow}
                className="flex items-center gap-2 px-4 py-1.5 border border-gray-600/70 bg-white text-black text-sm rounded-full group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white"
              >
                {isRunning === 3 ? (
                  <>
                    <div className="w-4 h-4 border-2 border-t-transparent border-black group-hover:border-white group-hover:border-t-transparent rounded-full animate-spin"></div> Duplicating...
                  </>
                ) : (
                  <>
                    <IoDuplicateOutline size={16} /> Duplicate
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className={`absolute left-4 self-center z-20 flex flex-col gap-2 bg-[#151618] p-1 rounded-full border border-gray-700 shadow-xl ${isRestoring && "hidden"}`}>
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={() => toast.error("This workflow can't be edited.")}
          className={`p-3 rounded-full bg-white hover:bg-[#1b1e23] cursor-pointer outline-none text-black active:bg-gray-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${interactionMode && "hidden"}`}
        >
          <MdLockOutline size={18} />
        </button>
        <div
          className={`relative ${!interactionMode && "hidden"}`}
          onBlur={(e) => {
            const currentTarget = e.currentTarget;
            setTimeout(() => {
              if (currentTarget && !currentTarget.contains(document.activeElement)) {
                setDropDown(0);
              }
            }, 100);
          }}
          tabIndex={0}
        >
          <button
            type="button"
            suppressHydrationWarning={true}
            disabled={!interactionMode}
            onClick={() => setDropDown((prev) => prev === 1 ? 0 : 1)}
            className={`p-3 rounded-full cursor-pointer outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${dropDown === 1 ? "bg-white text-black" : "text-gray-300 active:bg-gray-600 hover:text-white hover:bg-[#1b1e23]"}`}
          >
            <FaPlus size={18} />
          </button>
          {dropDown === 1 && (
            <div className="absolute left-14 top-0 z-50">
              <NodesNavbar addNode={addNode} apiNodeModels={filteredApiNodeModels} nodeSchemas={nodeSchemas} />
            </div>
          )}
        </div>
        <div
          className={`relative ${!interactionMode && "hidden"}`}
          onBlur={(e) => {
            const currentTarget = e.currentTarget;
            setTimeout(() => {
              if (currentTarget && !currentTarget.contains(document.activeElement)) {
                setDropDown(0);
              }
            }, 100);
          }}
          tabIndex={0}
        >
          <button
            type="button"
            suppressHydrationWarning={true}
            disabled={!interactionMode}
            onClick={() => setDropDown((prev) => prev === 4 ? 0 : 4)}
            className={`p-3 rounded-full cursor-pointer outline-none transition disabled:opacity-50 disabled:cursor-not-allowed ${dropDown === 4 ? "bg-white text-black" : "text-gray-300 active:bg-gray-600 hover:text-white hover:bg-[#1b1e23]"}`}
          >
            <FaToolbox size={18} />
          </button>
          {dropDown === 4 && (
            <div className="absolute left-14 top-0 bg-[#1b1e23] border border-gray-700 p-3 rounded-lg flex flex-col gap-2 w-52">
              <h3 className="w-full text-center text-sm text-gray-300">Utility Node</h3>
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={() => addNode("concatNode", null, { selectedModel: concatModels[0] })}
                  className="flex gap-2 justify-center items-center py-3 px-4 text-white cursor-pointer bg-[#2c3037] rounded hover:bg-[#212326]"
                >
                  <TbArrowMerge className="rotate-90" /> <span className="text-xs font-medium">Prompt Concatenator</span>
                </button>
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={() => addNode("vidConcatNode", null, { selectedModel: videoCombinerModels[0] })}
                  className="flex gap-2 justify-center items-center py-3 px-4 text-white cursor-pointer bg-[#2c3037] rounded hover:bg-[#212326]"
                >
                  <TbArrowMerge className="rotate-90" /> <span className="text-xs font-medium">Video Combiner</span>
                </button>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={zoomIn}
          className="p-3 rounded-full hover:bg-[#1b1e23] cursor-pointer outline-none text-gray-300 active:bg-gray-600 hover:text-white transition"
        >
          <FiZoomIn size={18} />
        </button>
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={zoomOut}
          className="p-3 rounded-full hover:bg-[#1b1e23] cursor-pointer outline-none text-gray-300 active:bg-gray-600 hover:text-white transition"
        >
          <FiZoomOut size={18} />
        </button>
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={() => fitView({ padding: 0.4, duration: 500, minZoom: 0.2 })}
          className="p-3 rounded-full hover:bg-[#1b1e23] cursor-pointer outline-none text-gray-300 active:bg-blue-600 hover:text-white transition"
        >
          <MdOutlineZoomOutMap size={18} />
        </button>
        <button
          type="button"
          suppressHydrationWarning={true}
          onClick={() => setIsDragging(!isDragging)}
          className={`p-3 rounded-full cursor-pointer outline-none active:bg-gray-600 transition ${!isDragging ? "bg-white text-black" : "text-gray-300 hover:bg-[#1b1e23] hover:text-white"}`}
        >
          <LuMousePointer2 size={18} />
        </button>
      </div>
      <div className="z-10 w-full h-full">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={interactionMode ? onConnect : null}
          isValidConnection={isValidConnection}
          connectionMode="loose"
          onConnectStart={interactionMode ? onConnectStart : null}
          onConnectEnd={interactionMode ? onConnectEnd : null}
          nodeTypes={nodeTypes}
          onEdgeClick={interactionMode ? onEdgeClick : null}
          onPaneContextMenu={interactionMode ? onPaneContextMenu : null}
          onPaneClick={interactionMode ? onPaneClick : null}
          nodesDraggable={interactionMode}
          nodesConnectable={interactionMode}
          elementsSelectable={interactionMode}
          minZoom={0.1}
          maxZoom={4}
          selectionOnDrag={!isDragging}
          panOnDrag={isDragging}
          selectionMode={!isDragging ? "partial" : null}
          multiSelectionKeyCode="Shift"
          connectionLineStyle={connectionLineStyle}
          fitView={() => fitView({ padding: 0.4, duration: 500, minZoom: 0.2 })}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          {edgePicker && (() => {
            const compatibleTypes = getCompatibleNodeTypes(edgePicker.handleColor, edgePicker.isOutput);

            return (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setEdgePicker(null)}
                  style={{ pointerEvents: 'auto' }}
                />
                <div
                  className="fixed z-50 pointer-events-auto"
                  style={{
                    left: `${edgePicker.cursorPos.x + 10}px`,
                    top: `${edgePicker.cursorPos.y}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NodesNavbar
                    addNode={handleSelectNodeFromEdgePicker}
                    apiNodeModels={filteredApiNodeModels}
                    filterNodeTypes={compatibleTypes}
                    nodeSchemas={nodeSchemas}
                  />
                </div>
              </>
            );
          })()}
        </ReactFlow>
      </div>
      {selectedNode && !["concatNode"].includes(selectedNode.type) && (
        <div className="absolute right-2 top-16 z-50 w-80 h-full max-h-[90%] bg-[#09090b]/80 backdrop-blur-xl border border-white/20 rounded-2xl flex transition-all duration-300 ease-in-out shadow-2xl">
          <button
            type="button"
            suppressHydrationWarning={true}
            className="absolute top-2 right-2 text-zinc-400 hover:text-white cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all duration-200"
            onClick={() => {
              setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
            }}
          >
            &#10005;
          </button>
          <div className="flex flex-col gap-4 h-full w-full">
            <h3 className="text-base font-semibold text-center text-white mt-6 tracking-tight">Properties</h3>
            <h1 className="flex items-center gap-2 text-sm font-medium text-start text-white mx-4 bg-zinc-800/50 border border-white/5 rounded-xl px-3 py-2 transition-all">
              {selectedNode.id.startsWith("text") ? <TfiText className="text-blue-400" /> : selectedNode.id.startsWith("image") ? <IoImageOutline className="text-green-400" /> : selectedNode.id.startsWith("video") ? <IoVideocamOutline className="text-orange-400" /> : selectedNode.id.startsWith("audio") ? <AiOutlineAudio className="text-yellow-400" /> : <RiInputMethodLine className="text-purple-400" />}
              {selectedNode.id.replace(/(\D+)(\d+)/, "$1 $2").replace(/^./, (c) => c.toUpperCase())}
            </h1>
            <div className="flex flex-col gap-4 w-full h-full overflow-y-auto px-4 custom-scrollbar-thin">
              <div className="flex flex-col gap-4 w-full h-full">
                <div
                  className="flex flex-col gap-1 relative w-full"
                  onBlur={(e) => {
                    const currentTarget = e.currentTarget;
                    setTimeout(() => {
                      if (currentTarget && !currentTarget.contains(document.activeElement)) {
                        setDropDown(-1);
                      }
                    }, 100);
                  }}
                  tabIndex={0}
                >
                  <label className="text-[10px] font-bold text-zinc-500 text-start px-1">Model</label>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    ref={modelDropdownTriggerRef}
                    onClick={() => setDropDown(prev => prev === 3 ? 0 : 3)}
                    className="flex items-center justify-between gap-1 text-sm text-center text-white w-full h-full cursor-pointer whitespace-nowrap px-3 py-2 bg-zinc-900/50 border border-white/10 hover:border-white/20 focus:outline-none rounded-lg transition-all"
                  >
                    {selectedNode?.data?.selectedModel?.name || ""}
                    <FaAngleDown size={14} className={`transition-all duration-300 ${dropDown === 3 && "rotate-180"}`} />
                  </button>
                  {dropDown === 3 && (
                    <div className={`absolute left-0 ${isModelDropdownUp ? "bottom-full mb-2" : "top-16"} bg-zinc-900/95 backdrop-blur-3xl z-20 border border-white/10 p-1 rounded-xl flex flex-col gap-2 shadow-2xl max-h-64 w-full animate-in fade-in zoom-in duration-200`}>
                      <input
                        type="search"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search models..."
                        className="px-3 py-2 text-xs bg-black/40 border border-white/5 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                      <div className="flex flex-col overflow-y-auto">
                        {getFilteredModelsForNode(selectedNode).length > 0 ? (
                          getFilteredModelsForNode(selectedNode).map((model, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg transition-all ${selectedNode?.data?.selectedModel?.id === model.id
                                  ? "bg-blue-500/10 text-blue-400"
                                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                }`}
                              onClick={() => {
                                updateModel(model);
                                setDropDown(0);
                                setModelSearch("");
                              }}
                            >
                              <h2 className="text-sm whitespace-nowrap">{model.name}</h2>
                              {selectedNode?.data?.selectedModel?.id === model.id && (
                                <FaCheck size={12} className="ml-auto" />
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-2">
                            No models found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {selectedNode?.data?.selectedModel ? (
                  (() => {
                    const nodeType = selectedNode.id.startsWith("text") ? "text" : selectedNode.id.startsWith("image") ? "image" : selectedNode.id.startsWith("video") ? "video" : selectedNode.id.startsWith("audio") ? "audio": "utility";
                    const fullSchema = nodeSchemas?.categories?.[nodeType]?.models[selectedNode?.data?.selectedModel?.id]?.input_schema;
                    const inputSchema = fullSchema?.schemas?.input_data || fullSchema || {};

                    return selectedNode?.data?.loading === 1 ? (
                      <div className="flex flex-col items-center justify-center gap-2 h-full w-full">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-white">Fetching model...</span>
                      </div>
                    ) : selectedNode.type === "apiNode" ? (
                      <div className="flex flex-col gap-2 w-full h-full relative pt-2">
                        <button
                          type="button"
                          suppressHydrationWarning={true}
                          onClick={() => selectedNode && runNodeInputsFromFlow(selectedNode.id)}
                          disabled={selectedNode?.data?.loading === 1}
                          className="absolute top-0 z-10 text-[10px] font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 group disabled:cursor-not-allowed rounded-full text-white bg-blue-600 px-3 py-1 border border-blue-500/50 hover:bg-blue-500 transition-all self-end shadow-lg shadow-blue-900/20"
                        >
                          {selectedNode?.data?.loading === 1 ? (
                            <><div className="w-3 h-3 rounded-full border border-t-transparent group-hover:border-t-transparent border-black group-hover:border-white animate-spin"></div>Generating...</>
                          ) : (
                            <>Fetch Model</>
                          )}
                        </button>
                        {Object.entries(selectedNode?.data?.taskData || {}).map(([key, meta], idx) => {
                          const hardcodedKeys = Object.keys(selectedNode?.data?.selectedModel?.input_params?.properties || {});
                          const isHardcoded = hardcodedKeys?.includes(key);

                          return (
                            <RenderApiField
                              key={key}
                              fieldName={key}
                              meta={meta}
                              idx={idx}
                              formValues={selectedNode?.data?.formValues || {}}
                              setFormValues={(newValues) => {
                                setNodes((nds) =>
                                  nds.map((node) => {
                                    if (node.id === selectedNode?.id) {
                                      let updatedFormValues = typeof newValues === 'function'
                                        ? newValues(node.data?.formValues || {})
                                        : newValues;

                                      if (key === 'model_name' && node.data.dynamicSchemas) {
                                        const modelNameValue = updatedFormValues.model_name;
                                        const matchedModel = Object.values(node.data.dynamicSchemas).find(m => m.model_id === modelNameValue);
                                        if (matchedModel && matchedModel.model_type) {
                                          updatedFormValues = { ...updatedFormValues, model_type: matchedModel.model_type };
                                        }
                                      }

                                      return {
                                        ...node,
                                        data: {
                                          ...node.data,
                                          formValues: updatedFormValues,
                                        },
                                      };
                                    }
                                    return node;
                                  })
                                );
                              }}
                              exposedHandles={selectedNode?.data?.exposedHandles || []}
                              onToggleHandle={isHardcoded ? null : (field) => {
                                const current = selectedNode?.data?.exposedHandles || [];
                                const isRemoving = current?.includes(field);
                                if (isRemoving) {
                                  setEdges((eds) => eds.filter(e => !(e.target === selectedNode?.id && e.targetHandle === field)));
                                }
                                setNodes((nds) =>
                                  nds.map((node) => {
                                    if (node.id === selectedNode?.id) {
                                      const updated = isRemoving
                                        ? current.filter(h => h !== field)
                                        : [...current, field];
                                      return {
                                        ...node,
                                        data: {
                                          ...node.data,
                                          exposedHandles: updated,
                                        },
                                      };
                                    }
                                    return node;
                                  })
                                );
                              }}
                              handleChange={(field, value) => {
                                updateNodeFromPanel(field, value);

                                if (field === 'model_name' && selectedNode.data.dynamicSchemas) {
                                  const matchedModel = Object.values(selectedNode.data.dynamicSchemas).find(m => m.model_id === value);
                                  if (matchedModel && matchedModel.model_type) {
                                    updateNodeFromPanel('model_type', matchedModel.model_type);
                                  }
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (inputSchema?.properties || (inputSchema && Object.keys(inputSchema).length > 0)) ? (
                      Object.entries(inputSchema?.properties || inputSchema).map(([key, meta], idx) => {
                        if (key === "schemas") return null;
                        return (
                          <RenderField
                            key={key}
                            fieldName={key}
                            meta={meta}
                            idx={idx}
                            formValues={selectedNode?.data?.formValues || {}}
                            setFormValues={(newValues) => {
                              setNodes((nds) =>
                                nds.map((node) => {
                                  if (node.id === selectedNode?.id) {
                                    return {
                                      ...node,
                                      data: {
                                        ...node.data,
                                        formValues: typeof newValues === 'function'
                                          ? newValues(node.data?.formValues || {})
                                          : newValues,
                                      },
                                    };
                                  }
                                  return node;
                                })
                              );
                            }}
                            handleChange={updateNodeFromPanel}
                            data={inputSchema}
                            modelName={selectedNode?.data?.selectedModel?.name}
                          />
                        );
                      }).filter(Boolean)
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-400">No properties available</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">Please select a model first</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Make Output Toggle */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-xs text-gray-300 font-medium">Mark as Output</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={selectedNode?.data?.formValues?.make_output === true}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNodes((nds) =>
                        nds.map((n) =>
                          n.id === selectedNode.id
                            ? {
                              ...n,
                              data: {
                                ...n.data,
                                formValues: {
                                  ...n.data.formValues,
                                  make_output: checked,
                                },
                              },
                            }
                            : n
                        )
                      );
                    }}
                  />
                  <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
                </div>
              </label>
              {!selectedNode?.data?.selectedModel?.id?.includes("passthrough") && (
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  onClick={() => selectedNode && runNodeFromFlow(selectedNode.id)}
                  disabled={loadingNodes[selectedNode.id]}
                  className="text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 group disabled:cursor-not-allowed rounded-lg text-white bg-blue-500 px-4 py-2 border border-blue-500/50 hover:bg-blue-600 w-full transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                >
                  {loadingNodes[selectedNode.id] ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>Generating...</>
                  ) : (
                    <>
                      <FaPlay size={16} /> 
                      Generate
                      {generationCost !== null && (
                        <span className="text-xs font-medium">
                          {isRefreshingCost ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block align-middle"></div>
                          ) : (
                            generationCost === 0 ? 'Free' : `$${generationCost}`
                          )}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {contextMenu && (
        <div
          className="fixed z-40"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <NodesNavbar
            addNode={(type, _, data) => addNode(type, contextMenu.position, data)}
            apiNodeModels={filteredApiNodeModels}
            nodeSchemas={nodeSchemas}
          />
        </div>
      )}
      <div
        className={`fixed inset-0 flex flex-col items-center justify-center z-50 overflow-auto bg-black/30 backdrop-blur transition-all duration-200 ease-in-out ${
          dropDown === 2 ? "opacity-100 scale-100 visible" : "opacity-0 scale-80 invisible"
        }`}
        onClick={() => setDropDown(0)}
      >
        <div className="bg-[#242629] rounded-lg p-4 w-72 shadow-lg flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-base text-center font-semibold text-white">Save Workflow</h3>
          <div className="flex flex-col gap-2 w-full">
            <label className="text-xs text-start text-gray-300">Workflow Name</label>
            <input
              type="text"
              value={workflowName}
              autoFocus
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter Workflow Name"
              className="border border-gray-700 px-2 py-1.5 text-sm text-white rounded bg-transparent w-full"
            />
          </div>
          <div className="flex items-center w-full gap-2">
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={() => setDropDown(0)}
              className="px-4 py-2 bg-gray-700/50 text-white rounded-full text-sm hover:bg-gray-600/50 transition w-full cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={handleSaveWorkFlow}
              className="px-4 py-2 bg-white text-black rounded-full hover:bg-blue-500 hover:text-white transition w-full text-sm cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      {nodes.length === 0 && !isPresetsDismissed && interactionMode && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300 transform scale-90 md:scale-100 overflow-y-auto custom-scrollbar max-w-[90%] max-h-[80%] p-10">
            <div className="flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md px-6 py-3 rounded-lg border border-white/10 shadow-xl">
              <h2 className="text-xl font-semibold text-white tracking-tight">Select a Workflow</h2>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">or start from scratch</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {presets.map((preset) => (
                <button
                  type="button"
                  suppressHydrationWarning={true}
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="group relative flex flex-col bg-[#151618] aspect-[4/3] border border-gray-700 hover:border-gray-500 rounded-lg shadow-xl hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-200 overflow-hidden text-left"
                >
                  <div className="z-10 p-2 bg-[#242629] border-b border-gray-700 flex items-center px-3 justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${preset.id === "empty-workflow" ? "bg-gray-400" : "bg-blue-500"}`}></div>
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{preset.id === "empty-workflow" ? "NEW" : "PRESET"}</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                    </div>
                  </div>
                  <div className="z-0 p-4 flex flex-col gap-3 h-full">
                    <div className="flex items-center justify-center gap-2 z-10 w-full h-full">
                      <div className="text-white group-hover:text-blue-400 transition-colors">
                        {iconMap[preset.icon] || <RiInputMethodLine size={16} />}
                      </div>
                      <h3 className="text-sm font-medium text-white leading-tight group-hover:text-blue-400 transition-colors">
                        {preset.title}
                      </h3>
                    </div>
                    {preset.image && (
                      <div className="absolute inset-0 z-0 w-full h-full rounded overflow-hidden border border-gray-800">
                        <img src={preset.image} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 z-10 w-full h-full bg-black/60"></div>
                      </div>
                    )}
                    {preset.description && (
                      <p className="z-10 text-[11px] text-gray-300 leading-relaxed border-t border-gray-500 pt-2 mt-auto">
                        {preset.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              suppressHydrationWarning={true}
              onClick={() => setIsPresetsDismissed(true)}
              className="mt-4 px-5 py-2 rounded-full bg-gray-800/80 hover:bg-gray-700 text-xs text-gray-300 font-medium transition-colors border border-gray-700 hover:border-gray-500"
            >
              Dismiss & Enter Empty Canvas
            </button>
          </div>
        </div>
      )}
      {interactionMode && (
        <ChatWidget
          isOpen={isChatOpen}
          toggleChat={() => setIsChatOpen(!isChatOpen)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
          onClearHistory={() => setChatMessages([])}
        />
      )}
      {isCategoryPopupOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1b1e23] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Workflow Category</h3>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-gray-400 uppercase tracking-wider">Category Name</label>
                  <input
                    type="text"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    placeholder="Enter category..."
                    className="w-full px-4 py-3 bg-[#151618] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-600 transition-all"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="p-4 bg-[#151618]/50 flex items-center justify-end gap-3 border-t border-gray-700/50">
              <button
                type="button"
                suppressHydrationWarning={true}
                onClick={() => setIsCategoryPopupOpen(false)}
                className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                suppressHydrationWarning={true}
                onClick={handleCategorySave}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              >
                <MdSave size={18} />
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default NodeFlow;
