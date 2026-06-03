import { downloadFile, videoModels, stableStringify } from "./utility";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { BsArrowUpCircleFill } from "react-icons/bs";
import { IoTimeOutline, IoVideocamOutline, IoTrashOutline, IoPlay, IoPause, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { Handle, Position, useReactFlow, useStore, useUpdateNodeInternals } from "reactflow";
import { getRunId, getWorkflowId } from "./WorkflowStore";
import axios from "axios";
import { toast } from "react-hot-toast";
import UploadNode from "./UploadNode";
import { SlOptions } from "react-icons/sl";
import { MdOutlineFileDownload } from "react-icons/md";
import NodeSendButton from "./NodeSendButton";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import NodeOptionsMenu from "./NodeOptionsMenu";
import { useGenerationCost } from "./useGenerationCost";
import VideoPlayer from "./VideoPlayer";

const inputHandles = [
  "videoInput",   // prompt
  "videoInput2",  // image_url
  "videoInput3",  // last_image
  "videoInput4",  // video_url
  "videoInput5",  // audio_url
  "videoInput6",  // images_list
  "videoInput7",  // videos_list, video_files
  "videoInput8",  // audios_list, audio_files
];

const outputHandles = [
  "videoOutput",
];

const VideoGeneration = ({ id, data, selected }) => {
  const models = useMemo(() => {
    return data.nodeSchemas?.categories?.video?.models 
      ? Object.values(data.nodeSchemas.categories.video.models) 
      : [];
  }, [data.nodeSchemas]);
  
  const [selectedModel, setSelectedModel] = useState(data.selectedModel || models[1] || models[0] || {});
  const [connectedInputs, setConnectedInputs] = useState({});
  const [connectedOutputs, setConnectedOutputs] = useState({});
  const [formValues, setFormValues] = useState(data.formValues || {});
  const [dropDown, setDropDown] = useState(0);
  const [loading, setLoading] = useState(0);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef(null);
  const outputHistory = data.outputHistory || [];
  const prevHistoryLengthRef = useRef(outputHistory.length);
  const inFlightRef = useRef(false); // guards against duplicate concurrent generation requests
  const pollIntervalRef = useRef(null); // ref to current polling interval so it can be cancelled
  const arkCancelRef = useRef(false); // set by Cancel to break the ARK browser poll loop
  const workflowId = getWorkflowId();
  const runId = data.runId ?? getRunId();
  const nodeSchemas = data.nodeSchemas || {};
  const { setNodes, setEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const edges = useStore((state) => state.edges);
  const properties = nodeSchemas?.categories?.video?.models?.[selectedModel.id]?.input_schema?.schemas?.input_data?.properties;
  const { generationCost, isRefreshingCost } = useGenerationCost(selectedModel, formValues);
  
  useEffect(() => {
    if (data.cost !== generationCost) {
      data.onDataChange(id, { cost: generationCost });
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

    // const merged = { ...defaults, ...filteredFormValues };
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
    const UI_KEYS = ["make_output", "make_input", "face_asset", "face_thumbnail"];
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

    if (data.outputHistory && data.outputHistory.length > 0) {
      if (currentHistoryIndex === -1) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentVideoIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentVideoIndex(0);
      }
    }
    prevHistoryLengthRef.current = data.outputHistory ? data.outputHistory.length : 0;
  }, [data.selectedModel, data.outputHistory]);

  // Run trigger in its OWN effect, keyed ONLY on data.triggerRun. The combined
  // effect above also fired on selectedModel/outputHistory changes, so while a
  // run was in flight (which bumps outputHistory) it re-entered handleRunSingleNode
  // with triggerRun still true → a second call hit the inFlightRef guard and got
  // stuck on "Генерация уже идёт". Reset triggerRun FIRST so it's consumed once.
  useEffect(() => {
    if (!data.triggerRun) return;
    data.onDataChange(id, { triggerRun: false });
    handleRunSingleNode();
  }, [data.triggerRun]);

  useEffect(() => {
    updateNodeInternals(id);
  }, [formValues, id, selectedModel]);

  const handleChange = (key, value) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
    setDropDown(-1);
  };

  useEffect(() => {
    if (!data.formValues) return;
    // Key-order-independent compare so a parent rebuild with the same content
    // doesn't look "different" and pull us into a sync loop (React #185).
    if (stableStringify(data.formValues) === stableStringify(formValues)) return;

    const timer = setTimeout(() => {
      if (Object.entries(data.formValues || {}).length > 0) {
        setFormValues(data.formValues);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [data.formValues]);

  const lastSentRef = useRef(null);
  useEffect(() => {
    if (!data?.onDataChange || data?.selectedModel?.id === "video-passthrough") return;

    const localSig = stableStringify(formValues);
    const parentSig = stableStringify(data.formValues || {});
    const sameModel = (selectedModel?.id) === (data.selectedModel?.id);

    // Echo suppression: if the parent already holds exactly this state, sending
    // it back would just bounce through onDataChange <-> formValues forever
    // (React #185 — an array field like videos_list churns its reference).
    if (sameModel && localSig === parentSig) { lastSentRef.current = localSig; return; }
    if (sameModel && localSig === lastSentRef.current) return;

    lastSentRef.current = localSig;
    data.onDataChange(id, { selectedModel, formValues, loading });
  }, [selectedModel, formValues, loading, data.formValues, data.selectedModel]);

  const stopPoll = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const pollNodeStatus = (run_id) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 360; // 360 × 500ms = 3 minutes max
    const _check = () => {
      if (++attempts > MAX_ATTEMPTS) {
        stopPoll();
        data.onDataChange(id, { isLoading: false, errorMsg: "Generation timed out" });
        toast.error(`Video generation timed out`);
        return;
      }
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
          setCurrentVideoIndex(0);
          stopPoll();
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
          stopPoll();
        }
      })
      .catch((error) => {
        console.log(error);
        stopPoll();
        data.onDataChange(id, { isLoading: false });
        toast.error(`Failed to get workflow status Video ${id.replace(/^\D+/g, "")}`);
      });
    };
    _check();
    pollIntervalRef.current = setInterval(_check, 500);
  };

  const handleCancelGeneration = () => {
    stopPoll();
    arkCancelRef.current = true;   // break the ARK browser poll loop on its next tick
    inFlightRef.current = false;
    data.onDataChange(id, { isLoading: false });
    toast("Генерация остановлена", { icon: "🛑" });
  };

  // Seedance 2.0 — submit-and-poll FROM THE BROWSER via /api/ark/seedance,
  // EXACTLY like the Studio (packages/studio → generateSeedanceArk). The Studio
  // generates Seedance reliably through this same route — including the character
  // face reference (`face_asset`, e.g. an asset://… trusted asset) — so the
  // workflow node uses the identical path. The blocking workflow /run route holds
  // one HTTP connection up to ~290s (Vercel drops it → node stuck on
  // "GENERATING…"); the short submit + poll requests here never hang.
  const runArkSeedanceBrowser = async () => {
    const fast = /fast/.test(`${selectedModel?.id || ""} ${selectedModel?.name || ""}`.toLowerCase());
    const src = formValues || {};
    const body = {
      fast,
      prompt: src.prompt || "",
      image_url: src.image_url || undefined,
      image_urls: Array.isArray(src.images_list) ? src.images_list.filter(Boolean) : undefined,
      video_url: src.video_url || undefined,
      audio_url: src.audio_url || undefined,
      resolution: src.resolution || undefined,
      ratio: src.aspect_ratio || src.ratio || undefined,
      duration: src.duration || undefined,
      face_asset: src.face_asset || undefined,
    };

    // Step 1: submit — fast, just creates the Ark task and returns a taskId.
    toast("Отправляю в ARK…", { icon: "🚀" });
    let submit;
    try {
      submit = await axios.post("/api/ark/seedance", body);
    } catch (e) {
      throw new Error(e.response?.data?.error || `ARK submit ${e.response?.status || ""}: ${e.message}`);
    }
    const taskId = submit.data?.taskId;
    if (!taskId) throw new Error(submit.data?.error || "ARK: задача не создана (нет taskId).");
    toast.success(`Задача создана: ${String(taskId).slice(0, 12)}…`);

    // Step 2: poll from the browser — each request is < 1s, so no connection hangs.
    let finishedUrl = null;
    let pollErrors = 0;
    for (let attempt = 0; attempt < 300; attempt++) {
      if (arkCancelRef.current) { arkCancelRef.current = false; return; }
      await new Promise((r) => setTimeout(r, 5000));
      if (arkCancelRef.current) { arkCancelRef.current = false; return; }

      let pd;
      try {
        const poll = await axios.get(`/api/ark/seedance?taskId=${encodeURIComponent(taskId)}`);
        pd = poll.data;
        pollErrors = 0;
      } catch (e) {
        // Don't loop forever on a persistent failure — surface it after ~1 min.
        if (++pollErrors >= 12) {
          throw new Error(e.response?.data?.error || "ARK: опрос статуса не отвечает.");
        }
        continue;
      }
      const status = String(pd?.status || "").toLowerCase();
      if (status === "succeeded" || status === "success" || status === "completed") {
        if (!pd.url) throw new Error("ARK: видео готово, но URL не получен.");
        finishedUrl = pd.url;
        break;
      }
      if (["failed", "error", "expired", "cancelled"].includes(status)) {
        throw new Error(`ARK: генерация не удалась (${pd.error || status}).`);
      }
    }

    if (!finishedUrl) throw new Error("ARK: превышено время ожидания генерации.");

    // Показываем результат СРАЗУ с ARK-ссылкой — не ждём TOS-зеркалирования.
    const histId = taskId;
    const output = [{ type: "video_url", value: finishedUrl }];
    const newHistory = [
      ...(data.outputHistory || []),
      { status: "succeeded", result: { id: histId, outputs: output } },
    ];
    data.onDataChange(id, {
      outputs: output,
      resultUrl: finishedUrl,
      isLoading: false,
      errorMsg: null,
      outputHistory: newHistory,
    });
    setCurrentHistoryIndex(newHistory.length - 1);
    setCurrentVideoIndex(0);

    // Сохраняем в Галерею (как Студия) — /api/gallery сам зеркалирует в TOS и
    // добавляет запись в gallery/{userId}/entries.json. Браузерный ARK-путь
    // минует серверный /run, который обычно это делает, поэтому зовём явно.
    axios.post("/api/gallery", {
      url: finishedUrl,
      type: "video",
      model: selectedModel?.id || data.selectedModel?.id || "",
      prompt: src.prompt || "",
    }).catch(() => { /* галерея не критична для ноды */ });

    // В фоне зеркалируем в TOS для постоянного хранения.
    // Если получится — тихо заменяем CDN URL на постоянный TOS URL.
    axios.post("/api/upload-file", { url: finishedUrl })
      .then((mirror) => {
        const tosUrl = mirror.data?.url;
        if (!tosUrl) return;
        const tosOutput = [{ type: "video_url", value: tosUrl }];
        const tosHistory = newHistory.map((h) =>
          h.result?.id === histId
            ? { ...h, result: { ...h.result, outputs: tosOutput } }
            : h
        );
        data.onDataChange(id, { outputs: tosOutput, resultUrl: tosUrl, outputHistory: tosHistory });
      })
      .catch(() => { /* ARK URL остаётся */ });
  };

  const handleRunSingleNode = async () => {
    // Prevent duplicate billing: ignore re-entry while a generation is in flight.
    // Give visible feedback instead of silently doing nothing — a video request
    // stays pending for the whole generation (ARK polls up to ~290s), so a second
    // click would otherwise look like "Generate does nothing".
    if (inFlightRef.current) {
      // Self-heal a stale flag: if we think a run is in flight but the node is NOT
      // actually loading, the previous run was orphaned (await never settled / the
      // component re-rendered). Clear the flag and proceed instead of blocking the
      // user forever on "Генерация уже идёт".
      if (!data.isLoading) {
        inFlightRef.current = false;
      } else {
        toast("Генерация уже идёт — подождите завершения", { icon: "⏳" });
        return;
      }
    }
    inFlightRef.current = true;
    arkCancelRef.current = false;
    try {
      data.onDataChange(id, { isLoading: true });

      // Seedance 2.0 → browser submit-and-poll via /api/ark/seedance (same path
      // as the Studio). Bypasses the blocking workflow /run route that hangs the
      // node, and carries face_asset so the character reference works.
      // Robust detection: match the model id OR display name in any format
      // ("doubao-seedance-2-0-fast-260128", "Seedance 2.0 Fast", …).
      const modelHay = `${selectedModel?.id || ""} ${selectedModel?.name || ""} ${data.selectedModel?.id || ""} ${data.selectedModel?.name || ""}`.toLowerCase();
      const isSeedance = /seedance[\s-]*2/.test(modelHay);
      if (isSeedance) {
        try {
          await runArkSeedanceBrowser();
        } catch (e) {
          data.onDataChange(id, { isLoading: false, errorMsg: e.message?.slice(0, 120) || "Ошибка генерации" });
          toast.error(e.message?.slice(0, 80) || "Ошибка генерации");
        }
        return;
      }

      const workflow_id = await data.handleSaveWorkFlow();

      if (!workflow_id) {
        toast.error("Failed to save workflow before running node");
        data.onDataChange(id, { isLoading: false });
        return;
      }

      const modelSchema = nodeSchemas?.categories?.video?.models[selectedModel.id]?.input_schema?.schemas?.input_data;
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
      // face_asset isn't in the schema — carry it through when present.
      if (localSources.face_asset) params.face_asset = localSources.face_asset;

      const response = await axios.post(`/api/workflow/${workflow_id}/node/${id}/run`, {
        run_id: runId,
        model: selectedModel.id,
        params: params,
        cost: generationCost,
        node_id: "AI Video"
      });
      { var _r = response.data; var _nd = _r && _r.nodes && (_r.nodes[id] || Object.values(_r.nodes)[0]); var _lt = _nd && _nd[_nd.length - 1]; if (_lt && (_lt.status === "succeeded" || _lt.status === "completed") && _lt.result && _lt.result.outputs) { var _o = _lt.result.outputs; data && data.onDataChange && data.onDataChange(id, { outputs: _o, resultUrl: (_o[0] && _o[0].value) || "", isLoading: false, errorMsg: null, outputHistory: (data.outputHistory || []).concat([_lt]) }); } else if (_lt && _lt.status === "failed") { data && data.onDataChange && data.onDataChange(id, { isLoading: false, errorMsg: "Generation failed" }); } else { pollNodeStatus(_r.run_id); } }
    } catch(error) {
      data.onDataChange(id, { isLoading: false });
      toast.error(error.response?.data?.detail || "Error running node");
      console.error(error);
    } finally {
      inFlightRef.current = false;
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
  const hasImagesList = properties && "images_list" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasVideosList = properties && ("videos_list" in properties || "video_files" in properties) && !data.selectedModel?.id.includes("passthrough");
  const hasLastImage = properties && "last_image" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasImageUrl = properties && "image_url" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasVideoUrl = properties && "video_url" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasAudioUrl = properties && "audio_url" in properties && !data.selectedModel?.id.includes("passthrough");
  const hasAudiosList = properties && ("audios_list" in properties || "audio_files" in properties) && !data.selectedModel?.id.includes("passthrough");

  useEffect(() => {
    const timeout = setTimeout(() => {
      const validHandles = [
        hasPrompt && "videoInput",
        hasImageUrl && "videoInput2",
        hasLastImage && "videoInput3",
        hasVideoUrl && "videoInput4",
        hasAudioUrl && "videoInput5",
        hasImagesList && "videoInput6",
        hasVideosList && "videoInput7",
        hasAudiosList && "videoInput8",
      ].filter(Boolean);

      setEdges((prevEdges) =>
        prevEdges.filter((edge) => {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        })
      );
    }, 2000);
    return () => clearTimeout(timeout);
  }, [hasPrompt, hasImageUrl, hasLastImage, hasVideoUrl, hasAudioUrl, hasImagesList, id, setEdges]);

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
      setCurrentVideoIndex(0);
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
      setCurrentVideoIndex(0);
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
    ? currentOutputList[currentVideoIndex]?.value || currentOutputList[0]?.value || data.resultUrl
    : data.resultUrl;

  return (
    <div 
      style={{ minHeight: 220, '--loader-color': '#f97316' }} 
      className={`
        nowheel group flex flex-col w-80 
        rounded-2xl border-2 relative transition-all duration-300 ease-in-out 
        ${selected 
          ? "border-orange-600 shadow-[0_0_25px_rgba(249,115,22,0.3)] scale-[1.02] ring-1 ring-orange-500/20" 
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"} 
        bg-[#0c0d0f]/95 backdrop-blur-sm
      `}
    >
      {data.isLoading && (
        <div className="loader-border" />
      )}
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h4 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Video {id.replace(/^\D+/g, "")}
        </h4>
        {generationCost !== null && !selectedModel?.id.includes("passthrough") && (
          <span className="text-xs text-orange-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80">
            {isRefreshingCost ? (
              <span className="flex items-center gap-1 italic text-orange-200">
                <div className="w-2 h-2 border-[1.5px] border-orange-200/30 border-t-orange-400 rounded-full animate-spin"></div>
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
        <div className="flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 p-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${selected ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-400"} transition-colors`}>
              <IoVideocamOutline size={14} />
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
                  currentOutputIndex={currentVideoIndex}
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
      {data.selectedModel?.id === "video-passthrough" ? (
        <div className="w-full h-full flex-1">
          <UploadNode id={id} data={data} formValues={formValues} setFormValues={setFormValues} selectedModel={selectedModel} loading={loading} uploadType="upload" acceptType="video" />
        </div>
      ) : (
        <div className="flex items-center flex-grow justify-center w-full h-full rounded transition-all duration-500">
          {data.isLoading ? (
            <div className="flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1] bg-white/5 animate-pulse rounded-b-2xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-bold text-orange-500 tracking-wider uppercase">Generating...</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleCancelGeneration(); }}
                  className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors px-3 py-1 rounded-md border border-zinc-700 hover:border-red-500/50 bg-zinc-900/80"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : data.errorMsg ? (
            <div className="text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 m-3 w-full">
              {data.errorMsg || "Generation failed"}
            </div>
          ) : currentOutput && !data.isLoading ? (
            <div className="h-full w-full relative">
              <VideoPlayer 
                key={currentOutput}
                src={currentOutput}
                accentColor="#f97316"
              />
              {currentOutputList.length > 1 && (
                <>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentVideoIndex((prev) => (prev > 0 ? prev - 1 : currentOutputList.length - 1));
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <FaAngleLeft size={16} />
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning={true}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentVideoIndex((prev) => (prev < currentOutputList.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <FaAngleRight size={16} />
                  </button>
                </>
              )}
              {currentOutputList.length > 1 && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                  {currentOutputList.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        idx === currentVideoIndex ? "bg-white scale-125" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
              <IoVideocamOutline size={32} />
              <span className="text-[10px] italic">Result appeared here...</span>
            </div>
          )}
        </div>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="videoInput" 
        style={{ 
          top: 70,
          opacity: hasPrompt ? 1 : 0,
          pointerEvents: hasPrompt ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput 
            ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' 
            : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm'
          }
        `}
        data-type="blue"
      />
      {hasPrompt && (
        <p 
          className={`absolute -left-8 top-[70px] text-xs text-blue-500 transition-opacity duration-200 ${
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
        id="videoInput2" 
        style={{ 
          top: 100,
          opacity: hasImageUrl ? 1 : 0,
          pointerEvents: hasImageUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput2 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green" 
      />
      {hasImageUrl && (
        <p 
          className={`absolute -left-10 top-[100px] text-xs text-green-500 transition-opacity duration-200 ${
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
        id="videoInput6" 
        style={{ 
          top: 100,
          opacity: hasImagesList ? 1 : 0,
          pointerEvents: hasImagesList ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput6 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green" 
      />
      {hasImagesList && (
        <p 
          className={`absolute -left-10 top-[100px] text-xs text-green-500 transition-opacity duration-200 ${
            data.activeHandleColor === "green"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Images
        </p>
      )}
      
      <Handle 
        type="target" 
        position={Position.Left} 
        id="videoInput3"
        style={{ 
          top: 130,
          opacity: hasLastImage ? 1 : 0,
          pointerEvents: hasLastImage ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput3 
            ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' 
            : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm'
          }
        `}
        data-type="green"
      />
      {hasLastImage && (
        <p 
          className={`absolute -left-16 top-[130px] text-xs text-green-500 transition-opacity duration-200 ${
            data.activeHandleColor === "green"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Last Frame 
        </p>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="videoInput4"
        style={{ 
          top: 160,
          opacity: hasVideoUrl ? 1 : 0,
          pointerEvents: hasVideoUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput4 
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
        type="target" 
        position={Position.Left} 
        id="videoInput7"
        style={{ 
          top: 160,
          opacity: hasVideosList ? 1 : 0,
          pointerEvents: hasVideosList ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput7 
            ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' 
            : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm'
          }
        `}
        data-type="orange"
      />
      {hasVideosList && (
        <p 
          className={`absolute -left-10 top-[160px] text-xs text-orange-500 transition-opacity duration-200 ${
            data.activeHandleColor === "orange"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Videos
        </p>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="videoInput8"
        style={{ 
          top: 190,
          opacity: hasAudiosList ? 1 : 0,
          pointerEvents: hasAudiosList ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput8 
            ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' 
            : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm'
          }
        `}
        data-type="yellow"
      />
      {hasAudiosList && (
        <p 
          className={`absolute -left-10 top-[190px] text-xs text-yellow-500 transition-opacity duration-200 ${
            data.activeHandleColor === "yellow"
              ? "opacity-100" 
              : "opacity-0 group-hover:opacity-100"
          }`}
        > 
          Audios
        </p>
      )}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="videoInput5"
        style={{ 
          top: 190,
          opacity: hasAudioUrl ? 1 : 0,
          pointerEvents: hasAudioUrl ? 'auto' : 'none',
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !left-[-8px] transition-all
          ${connectedInputs.videoInput5 
            ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' 
            : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm'
          }
        `}
        data-type="yellow"
      />
      {hasAudioUrl && (
        <p
          className={`absolute -left-10 top-[190px] text-xs text-yellow-500 transition-opacity duration-200 ${
            data.activeHandleColor === "yellow"
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          Audio
        </p>
      )}
      <Handle
        type="source"
        position={Position.Right}
        id="videoOutput"
        style={{ 
          top: 100,
          width: 12,
          height: 12,
          transition: 'all 0.2s ease-in-out',
        }} 
        className={`!rounded-full !border-[3px] !right-[-8px] transition-all
          ${connectedOutputs.videoOutput 
            ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' 
            : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm'
          }
        `}
        data-type="orange"
      />
      <p 
        className={`absolute -right-10 top-[100px] text-xs text-orange-500 transition-opacity duration-200 ${
          data.activeHandleColor === "orange"
            ? "opacity-100" 
            : "opacity-0 group-hover:opacity-100"
        }`}
      > 
        Video 
      </p>
    </div>
  );
};

export default VideoGeneration;
