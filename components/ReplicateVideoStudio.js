"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { replicateVideoModels } from "@/src/lib/replicateVideoModels";

const TOKEN_KEY = "replicate_api_token";
const HISTORY_KEY = "replicate_video_history_v2";
const TERMINAL_STATUSES = new Set(["succeeded", "failed", "canceled"]);

const emptyMedia = {
  firstFrame: null,
  lastFrame: null,
  firstClip: null,
  audio: null,
  referenceImages: [],
  referenceVideos: [],
  referenceAudios: [],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createMediaItem(url, file = null) {
  return {
    url,
    name: file?.name || "URL media",
    size: file?.size || 0,
    kind: file?.type || "remote",
  };
}

function getDefaultOptions(model) {
  return Object.fromEntries((model.controls || []).map((control) => [control.key, model.defaults?.[control.key] ?? ""]));
}

function getOutputUrl(output) {
  if (!output) return "";
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.find((item) => typeof item === "string") || "";
  if (typeof output === "object") return output.url || output.video || output.output || "";
  return "";
}

function ratioToCss(value) {
  if (!value || value === "adaptive") return "16 / 9";
  const [w, h] = String(value).split(":").map(Number);
  if (!w || !h) return "16 / 9";
  return `${w} / ${h}`;
}

function formatBytes(size) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function CapabilityPill({ active, children }) {
  return (
    <span className={`rounded px-2 py-1 text-[11px] font-semibold ${active ? "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20" : "bg-white/[0.04] text-white/35 ring-1 ring-white/5"}`}>
      {children}
    </span>
  );
}

function SingleMediaSlot({ title, value, accept, onFile, onUrl, onClear }) {
  const [url, setUrl] = useState("");

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-white/75">{title}</span>
        {value && (
          <button type="button" onClick={onClear} className="text-[11px] font-semibold text-white/45 hover:text-white">
            Clear
          </button>
        )}
      </div>
      {value ? (
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded border border-white/10 bg-black">
            {value.kind?.startsWith("image") || value.url?.startsWith("data:image") || /\.(png|jpe?g|webp|bmp)$/i.test(value.url) ? (
              <img src={value.url} alt="" className="h-full w-full object-contain" />
            ) : value.kind?.startsWith("video") || value.url?.startsWith("data:video") || /\.(mp4|mov|webm)$/i.test(value.url) ? (
              <video src={value.url} muted className="h-full w-full object-contain" />
            ) : (
              <span className="text-[10px] text-white/45">Media</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold text-white/80">{value.name}</div>
            <div className="text-[11px] text-white/35">{formatBytes(value.size) || "Remote URL"}</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <label className="flex h-10 cursor-pointer items-center justify-center rounded border border-dashed border-white/15 bg-black/20 text-xs font-semibold text-white/55 hover:border-cyan-300/40 hover:text-cyan-100">
            Upload
            <input type="file" accept={accept} className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
          </label>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste URL"
              className="min-w-0 flex-1 rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45"
            />
            <button
              type="button"
              onClick={() => {
                if (!url.trim()) return;
                onUrl(url.trim());
                setUrl("");
              }}
              className="rounded bg-white/10 px-3 text-xs font-semibold text-white/70 hover:bg-white/15"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MultiMediaSlot({ title, items, limit, accept, onFiles, onUrl, onRemove }) {
  const [url, setUrl] = useState("");
  const remaining = Math.max(0, limit - items.length);

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-white/75">{title}</span>
        <span className="text-[11px] text-white/35">{items.length}/{limit}</span>
      </div>
      {items.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {items.map((item, index) => (
            <button key={`${item.url}-${index}`} type="button" onClick={() => onRemove(index)} className="group relative aspect-video overflow-hidden rounded border border-white/10 bg-black">
              {item.kind?.startsWith("image") || item.url?.startsWith("data:image") || /\.(png|jpe?g|webp|bmp)$/i.test(item.url) ? (
                <img src={item.url} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="grid h-full place-items-center text-[10px] text-white/40">Media</span>
              )}
              <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">{index + 1}</span>
              <span className="absolute inset-0 grid place-items-center bg-black/75 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Remove</span>
            </button>
          ))}
        </div>
      )}
      {remaining > 0 && (
        <div className="grid gap-2">
          <label className="flex h-10 cursor-pointer items-center justify-center rounded border border-dashed border-white/15 bg-black/20 text-xs font-semibold text-white/55 hover:border-cyan-300/40 hover:text-cyan-100">
            Upload {remaining > 1 ? "files" : "file"}
            <input type="file" accept={accept} multiple className="hidden" onChange={(event) => onFiles(Array.from(event.target.files || []), remaining)} />
          </label>
          <div className="flex gap-2">
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste URL"
              className="min-w-0 flex-1 rounded border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45"
            />
            <button
              type="button"
              onClick={() => {
                if (!url.trim()) return;
                onUrl(url.trim());
                setUrl("");
              }}
              className="rounded bg-white/10 px-3 text-xs font-semibold text-white/70 hover:bg-white/15"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlField({ control, value, onChange }) {
  if (control.type === "boolean") {
    return (
      <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] px-3 py-3">
        <span className="text-xs font-semibold text-white/75">{control.label}</span>
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-cyan-300" />
      </label>
    );
  }

  if (control.type === "select") {
    const hasNumericOptions = control.options.some((option) => typeof option === "number");
    return (
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-white/55">{control.label}</span>
        <select
          value={value ?? ""}
          onChange={(event) => onChange(hasNumericOptions ? Number(event.target.value) : event.target.value)}
          className="h-10 rounded-md border border-white/10 bg-[#07090d] px-3 text-xs font-semibold text-white outline-none focus:border-cyan-300/45"
        >
          {control.options.map((option) => (
            <option key={String(option)} value={option}>
              {String(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (control.type === "textarea") {
    return (
      <label className="grid gap-1.5">
        <span className="text-xs font-semibold text-white/55">{control.label}</span>
        <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={3} className="resize-none rounded-md border border-white/10 bg-[#07090d] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45" />
      </label>
    );
  }

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold text-white/55">{control.label}</span>
      <input
        type="number"
        value={value ?? ""}
        min={control.min}
        max={control.max}
        step={control.step || 1}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
        className="h-10 rounded-md border border-white/10 bg-[#07090d] px-3 text-xs font-semibold text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45"
      />
    </label>
  );
}

export default function ReplicateVideoStudio() {
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("seedance-2-fast");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Chinese");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState({});
  const [media, setMedia] = useState(emptyMedia);
  const [prediction, setPrediction] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const selectedModel = useMemo(
    () => replicateVideoModels.find((model) => model.id === selectedModelId) || replicateVideoModels[0],
    [selectedModelId],
  );

  const outputUrl = getOutputUrl(prediction?.output);
  const previewAspect = options.aspect_ratio && options.aspect_ratio !== "adaptive" ? options.aspect_ratio : "16:9";
  const needsFirstFrame = selectedModel.mode === "image-to-video";

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY) || "";
    const storedHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    setToken(storedToken);
    setTokenDraft(storedToken);
    setHistory(Array.isArray(storedHistory) ? storedHistory : []);
  }, []);

  useEffect(() => {
    setPrompt(selectedModel.defaults?.prompt || "");
    setOptions(getDefaultOptions(selectedModel));
    setMedia((previous) => ({
      ...emptyMedia,
      firstFrame: previous.firstFrame,
      lastFrame: selectedModel.inputMap?.lastFrame ? previous.lastFrame : null,
    }));
    setPrediction(null);
    setError("");
    setStatusText("");
  }, [selectedModel]);

  const filteredModels = useMemo(() => {
    const text = query.trim().toLowerCase();
    return replicateVideoModels.filter((model) => {
      const matchesText = !text || [model.label, model.maker, model.description, model.owner, model.name, ...model.tags].join(" ").toLowerCase().includes(text);
      const matchesFilter =
        filter === "All" ||
        (filter === "Chinese" && model.origin === "China") ||
        (filter === "FLF" && Boolean(model.inputMap?.lastFrame)) ||
        (filter === "Reference" && Boolean(model.inputMap?.referenceImages)) ||
        (filter === "Fast" && /fast|draft|preview/i.test(`${model.priority} ${model.label} ${model.description}`));
      return matchesText && matchesFilter;
    });
  }, [filter, query]);

  const saveToken = () => {
    const trimmed = tokenDraft.trim();
    setToken(trimmed);
    if (trimmed) localStorage.setItem(TOKEN_KEY, trimmed);
    else localStorage.removeItem(TOKEN_KEY);
  };

  const setSingleMediaFromFile = useCallback(async (slot, file) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setMedia((current) => ({ ...current, [slot]: createMediaItem(url, file) }));
  }, []);

  const setSingleMediaFromUrl = useCallback((slot, url) => {
    setMedia((current) => ({ ...current, [slot]: createMediaItem(url) }));
  }, []);

  const addMediaFiles = useCallback(async (slot, files, remaining) => {
    const selected = files.slice(0, remaining);
    const items = await Promise.all(selected.map(async (file) => createMediaItem(await fileToDataUrl(file), file)));
    setMedia((current) => ({ ...current, [slot]: [...current[slot], ...items] }));
  }, []);

  const addMediaUrl = useCallback((slot, url) => {
    setMedia((current) => ({ ...current, [slot]: [...current[slot], createMediaItem(url)] }));
  }, []);

  const removeArrayMedia = useCallback((slot, index) => {
    setMedia((current) => ({ ...current, [slot]: current[slot].filter((_, itemIndex) => itemIndex !== index) }));
  }, []);

  const buildInput = () => {
    const input = { prompt: prompt.trim() };
    for (const control of selectedModel.controls || []) {
      const value = options[control.key];
      if (value !== "" && value !== undefined && value !== null) input[control.key] = value;
    }

    const map = selectedModel.inputMap || {};
    if (map.firstFrame && media.firstFrame?.url) input[map.firstFrame] = media.firstFrame.url;
    if (map.lastFrame && media.lastFrame?.url) input[map.lastFrame] = media.lastFrame.url;
    if (map.firstClip && media.firstClip?.url) input[map.firstClip] = media.firstClip.url;
    if (map.audio && media.audio?.url) input[map.audio] = media.audio.url;
    if (map.referenceImages && media.referenceImages.length) input[map.referenceImages] = media.referenceImages.map((item) => item.url);
    if (map.referenceVideos && media.referenceVideos.length) input[map.referenceVideos] = media.referenceVideos.map((item) => item.url);
    if (map.referenceAudios && media.referenceAudios.length) input[map.referenceAudios] = media.referenceAudios.map((item) => item.url);

    return input;
  };

  const rememberHistory = (finalPrediction, input) => {
    const next = [
      {
        id: finalPrediction.id,
        modelId: selectedModel.id,
        modelLabel: selectedModel.label,
        prompt: input.prompt,
        output: finalPrediction.output,
        createdAt: new Date().toISOString(),
        aspect: previewAspect,
      },
      ...history,
    ].slice(0, 12);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const pollPrediction = async (initialPrediction, input) => {
    let current = initialPrediction;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (TERMINAL_STATUSES.has(current.status)) break;
      await delay(3000);
      const response = await fetch(`/api/replicate/predictions/${current.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail?.error || data?.error || "Polling failed.");
      current = data;
      setPrediction(current);
      setStatusText(current.status || "processing");
    }

    if (current.status === "succeeded") rememberHistory(current, input);
    if (current.status === "failed") throw new Error(current.error || "Prediction failed.");
    return current;
  };

  const submit = async () => {
    setError("");
    setStatusText("");

    if (!token) {
      setError("Add your Replicate token.");
      return;
    }
    if (!prompt.trim()) {
      setError("Add a prompt.");
      return;
    }
    if (media.lastFrame?.url && !media.firstFrame?.url) {
      setError("Last-frame generation also needs a first frame.");
      return;
    }
    if (
      selectedModel.inputMap?.referenceImages &&
      (media.referenceImages.length > 0 || media.referenceVideos.length > 0 || media.referenceAudios.length > 0) &&
      (media.firstFrame?.url || media.lastFrame?.url)
    ) {
      setError(`${selectedModel.label} uses either first/last frames or reference media, not both.`);
      return;
    }
    if (needsFirstFrame && !media.firstFrame?.url) {
      setError(`${selectedModel.label} needs a first frame.`);
      return;
    }

    const input = buildInput();
    setBusy(true);
    setStatusText("submitting");

    try {
      const response = await fetch("/api/replicate/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, modelId: selectedModel.id, input }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail?.error || data?.error || "Replicate request failed.");
      setPrediction(data);
      setStatusText(data.status || "starting");
      if (TERMINAL_STATUSES.has(data.status)) {
        if (data.status === "succeeded") rememberHistory(data, input);
        if (data.status === "failed") throw new Error(data.error || "Prediction failed.");
      } else {
        await pollPrediction(data, input);
      }
    } catch (submitError) {
      setError(submitError.message || "Generation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070a] text-white">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#05070a]/90 px-4 backdrop-blur-xl lg:px-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-white">Replicate Video Studio</div>
            <div className="hidden text-xs text-white/35 sm:block">Dark image-to-video workspace</div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <input
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              type="password"
              placeholder="r8_ token"
              className="h-9 w-36 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45 sm:w-72"
            />
            <button type="button" onClick={saveToken} className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-lime-200">
              Save
            </button>
          </div>
        </header>

        <section className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[318px_minmax(0,1fr)_380px]">
          <aside className="border-b border-white/10 bg-[#080b10] p-4 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-lg font-semibold tracking-tight">Models</h1>
              <span className="rounded bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">{replicateVideoModels.length}</span>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search model or capability"
              className="mb-3 h-10 w-full rounded-md border border-white/10 bg-black/30 px-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45"
            />
            <div className="mb-4 flex flex-wrap gap-2">
              {["Chinese", "FLF", "Reference", "Fast", "All"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded px-2.5 py-1.5 text-[11px] font-semibold ring-1 ${filter === item ? "bg-white text-black ring-white" : "bg-white/[0.04] text-white/45 ring-white/10 hover:text-white"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredModels.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setSelectedModelId(model.id)}
                  className={`w-full rounded-md border p-3 text-left transition ${selectedModel.id === model.id ? "border-cyan-300/45 bg-cyan-300/10" : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]"}`}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{model.label}</div>
                      <div className="truncate text-[11px] text-white/35">{model.maker} / {model.owner}</div>
                    </div>
                    <span className="shrink-0 rounded bg-black/40 px-2 py-1 text-[10px] font-semibold text-white/45">{model.priority}</span>
                  </div>
                  <div className="mb-2 line-clamp-2 text-xs leading-5 text-white/50">{model.description}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {model.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="rounded bg-white/[0.06] px-1.5 py-1 text-[10px] font-semibold text-white/45">{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="relative min-h-[680px] bg-[#05070a] p-4 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:p-6">
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/70">{selectedModel.origin} / {selectedModel.mode}</div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">{selectedModel.label}</h2>
              </div>
              <a href={selectedModel.docUrl} target="_blank" rel="noreferrer" className="w-fit rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/55 hover:text-white">
                Replicate docs
              </a>
            </div>

            <div className="rounded-md border border-white/10 bg-[#090c12] p-3 shadow-2xl shadow-black/30">
              <div className="relative grid min-h-[300px] place-items-center overflow-hidden rounded bg-black" style={{ aspectRatio: ratioToCss(previewAspect) }}>
                {!outputUrl && !media.firstFrame?.url && (
                  <img src="/assets/cinema/premium_large_format_digital.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                )}
                {outputUrl ? (
                  <video src={outputUrl} controls autoPlay loop className="h-full w-full object-contain" />
                ) : media.firstFrame?.url ? (
                  <img src={media.firstFrame.url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="relative z-10 text-center">
                    <div className="text-sm font-semibold text-white/80">Ready for a source frame</div>
                    <div className="mt-2 text-xs text-white/35">Generated video renders here without crop.</div>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
                    <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-center">
                      <div className="text-sm font-semibold text-cyan-100">{statusText || "processing"}</div>
                      <div className="mt-1 text-xs text-cyan-100/50">Polling Replicate</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="mt-5 grid gap-3 xl:grid-cols-3">
              {selectedModel.strengths.map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-white/[0.025] p-3">
                  <div className="text-xs font-semibold text-white/80">{item}</div>
                </div>
              ))}
            </div>

            {history.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Recent generations</div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {history.map((item) => {
                    const url = getOutputUrl(item.output);
                    return (
                      <button key={item.id} type="button" onClick={() => setPrediction({ id: item.id, output: item.output, status: "succeeded" })} className="overflow-hidden rounded-md border border-white/10 bg-black text-left hover:border-cyan-300/40">
                        <div className="aspect-video bg-black">
                          {url ? <video src={url} muted className="h-full w-full object-contain" /> : null}
                        </div>
                        <div className="p-2">
                          <div className="truncate text-xs font-semibold text-white/70">{item.modelLabel}</div>
                          <div className="truncate text-[11px] text-white/35">{item.prompt}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <aside className="border-t border-white/10 bg-[#080b10] p-4 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-l lg:border-t-0">
            <div className="mb-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Prompt</div>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-md border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/45"
              />
            </div>

            <div className="mb-4 grid gap-3">
              {selectedModel.inputMap?.firstFrame && (
                <SingleMediaSlot
                  title={needsFirstFrame ? "First frame" : "First frame optional"}
                  accept="image/*"
                  value={media.firstFrame}
                  onFile={(file) => setSingleMediaFromFile("firstFrame", file)}
                  onUrl={(url) => setSingleMediaFromUrl("firstFrame", url)}
                  onClear={() => setMedia((current) => ({ ...current, firstFrame: null }))}
                />
              )}
              {selectedModel.inputMap?.lastFrame && (
                <SingleMediaSlot
                  title="Last frame"
                  accept="image/*"
                  value={media.lastFrame}
                  onFile={(file) => setSingleMediaFromFile("lastFrame", file)}
                  onUrl={(url) => setSingleMediaFromUrl("lastFrame", url)}
                  onClear={() => setMedia((current) => ({ ...current, lastFrame: null }))}
                />
              )}
              {selectedModel.inputMap?.firstClip && (
                <SingleMediaSlot
                  title="Clip continuation"
                  accept="video/*"
                  value={media.firstClip}
                  onFile={(file) => setSingleMediaFromFile("firstClip", file)}
                  onUrl={(url) => setSingleMediaFromUrl("firstClip", url)}
                  onClear={() => setMedia((current) => ({ ...current, firstClip: null }))}
                />
              )}
              {selectedModel.inputMap?.audio && (
                <SingleMediaSlot
                  title="Audio"
                  accept="audio/*"
                  value={media.audio}
                  onFile={(file) => setSingleMediaFromFile("audio", file)}
                  onUrl={(url) => setSingleMediaFromUrl("audio", url)}
                  onClear={() => setMedia((current) => ({ ...current, audio: null }))}
                />
              )}
              {selectedModel.inputMap?.referenceImages && (
                <MultiMediaSlot
                  title="Reference images"
                  accept="image/*"
                  items={media.referenceImages}
                  limit={selectedModel.mediaLimits?.referenceImages || 9}
                  onFiles={(files, remaining) => addMediaFiles("referenceImages", files, remaining)}
                  onUrl={(url) => addMediaUrl("referenceImages", url)}
                  onRemove={(index) => removeArrayMedia("referenceImages", index)}
                />
              )}
              {selectedModel.inputMap?.referenceVideos && (
                <MultiMediaSlot
                  title="Reference videos"
                  accept="video/*"
                  items={media.referenceVideos}
                  limit={selectedModel.mediaLimits?.referenceVideos || 3}
                  onFiles={(files, remaining) => addMediaFiles("referenceVideos", files, remaining)}
                  onUrl={(url) => addMediaUrl("referenceVideos", url)}
                  onRemove={(index) => removeArrayMedia("referenceVideos", index)}
                />
              )}
              {selectedModel.inputMap?.referenceAudios && (
                <MultiMediaSlot
                  title="Reference audio"
                  accept="audio/*"
                  items={media.referenceAudios}
                  limit={selectedModel.mediaLimits?.referenceAudios || 3}
                  onFiles={(files, remaining) => addMediaFiles("referenceAudios", files, remaining)}
                  onUrl={(url) => addMediaUrl("referenceAudios", url)}
                  onRemove={(index) => removeArrayMedia("referenceAudios", index)}
                />
              )}
            </div>

            <div className="mb-4 grid gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Parameters</div>
              {(selectedModel.controls || []).map((control) => (
                <ControlField key={control.key} control={control} value={options[control.key]} onChange={(value) => setOptions((current) => ({ ...current, [control.key]: value }))} />
              ))}
            </div>

            <div className="mb-4 rounded-md border border-white/10 bg-white/[0.025] p-3">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Model support</div>
              <div className="flex flex-wrap gap-2">
                <CapabilityPill active={Boolean(selectedModel.inputMap?.firstFrame)}>First frame</CapabilityPill>
                <CapabilityPill active={Boolean(selectedModel.inputMap?.lastFrame)}>Last frame</CapabilityPill>
                <CapabilityPill active={Boolean(selectedModel.inputMap?.referenceImages)}>References</CapabilityPill>
                <CapabilityPill active={Boolean(selectedModel.inputMap?.audio || selectedModel.inputMap?.referenceAudios)}>Audio</CapabilityPill>
                <CapabilityPill active={selectedModel.mode !== "image-to-video"}>Text only</CapabilityPill>
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="h-12 w-full rounded-md bg-cyan-300 text-sm font-bold text-black shadow-lg shadow-cyan-500/10 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Generating" : "Generate video"}
            </button>
          </aside>
        </section>
      </div>
    </main>
  );
}
