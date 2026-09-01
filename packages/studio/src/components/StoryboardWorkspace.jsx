"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Layers3,
  LoaderCircle,
  Music2,
  PanelTop,
  Play,
  Plus,
  Shapes,
  Trash2,
  Upload,
  WandSparkles,
} from "lucide-react";
import {
  ASPECT_RATIOS,
  TRANSITIONS,
  addScene,
  continueFromPreviousScene,
  createScene,
  deleteScene,
  duplicateScene,
} from "./storyboardWorkspaceModel";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

const inputClass = "w-full rounded-xl border border-white/[0.09] bg-black/30 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-cyan-300/35 focus:bg-black/45";
const selectClass = `${inputClass} appearance-none`;

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-[9px] font-black uppercase tracking-[0.17em] text-white/38">{children}</label>
      {hint && <span className="text-[9px] text-white/25">{hint}</span>}
    </div>
  );
}

function previewRatioClass(aspectRatio) {
  if (aspectRatio === "9:16") return "aspect-[9/16] max-h-[66vh]";
  if (aspectRatio === "1:1") return "aspect-square max-h-[66vh]";
  return "aspect-video max-h-[66vh]";
}

function AssetCard({ asset, onSelect }) {
  const isVideo = asset.type === "video";
  return (
    <button
      type="button"
      onClick={() => onSelect(asset.sceneId)}
      className="group overflow-hidden rounded-xl border border-white/[0.07] bg-black/30 text-left transition hover:border-white/20 hover:bg-white/[0.04]"
      title={`Open ${asset.title}`}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {isVideo ? (
          <video src={asset.url} muted preload="metadata" className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />
        ) : (
          <img src={asset.url} alt={asset.title} className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100" />
        )}
        <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/75 text-white">
          {isVideo ? <Film size={12} /> : <ImageIcon size={12} />}
        </span>
      </div>
      <p className="truncate px-2.5 py-2 text-[10px] font-semibold text-white/55">{asset.title}</p>
    </button>
  );
}

function PreviewCanvas({ scene, isGenerating }) {
  const hasVideo = Boolean(scene.videoUrl);
  const hasImage = Boolean(scene.imageUrl);
  return (
    <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#050507] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7">
      <div className={cx("relative flex w-full max-w-5xl items-center justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-black", previewRatioClass(scene.aspectRatio))}>
        {hasVideo ? (
          <video key={scene.videoUrl} src={scene.videoUrl} controls className="h-full w-full object-contain" />
        ) : hasImage ? (
          <img src={scene.imageUrl} alt={`Preview for ${scene.title}`} className="h-full w-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:38px_38px]" />
            <div className="relative max-w-sm px-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                <WandSparkles size={24} />
              </div>
              <p className="mt-5 text-sm font-semibold text-white/70">Build the first frame of {scene.title}</p>
              <p className="mt-2 text-xs leading-5 text-white/30">Write a direction, generate a still, then animate it—or generate video directly from text.</p>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <LoaderCircle size={30} className="mx-auto animate-spin text-cyan-200" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                {scene.status === "generating-image" ? "Generating still" : "Rendering video"}
              </p>
            </div>
          </div>
        )}

        {(hasVideo || hasImage) && !isGenerating && (
          <a
            href={hasVideo ? scene.videoUrl : scene.imageUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-black/75 px-3 text-[10px] font-bold text-white/70 backdrop-blur transition hover:bg-white hover:text-black"
          >
            <Download size={13} /> Open asset
          </a>
        )}
      </div>
    </div>
  );
}

function SceneCard({ scene, selected, onSelect, canDelete, onDuplicate, onDelete }) {
  return (
    <article
      className={cx(
        "group relative w-44 shrink-0 overflow-hidden rounded-2xl border bg-black/30 transition",
        selected ? "border-cyan-300/45 shadow-[0_0_0_1px_rgba(103,232,249,0.15)]" : "border-white/[0.07] hover:border-white/20",
      )}
    >
      <button type="button" onClick={onSelect} className="block w-full text-left" aria-pressed={selected}>
        <div className="relative aspect-video overflow-hidden bg-[#07070a]">
          {scene.videoUrl ? (
            <video src={scene.videoUrl} muted preload="metadata" className="h-full w-full object-cover" />
          ) : scene.imageUrl ? (
            <img src={scene.imageUrl} alt={`Scene still for ${scene.title}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/15"><PanelTop size={23} /></div>
          )}
          <span className="absolute left-2 top-2 rounded-lg bg-black/75 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white/65">{scene.duration}s</span>
          {scene.status.startsWith("generating") && <LoaderCircle size={15} className="absolute right-2 top-2 animate-spin text-cyan-200" role="status" aria-label="Generating" />}
        </div>
        <div className="px-3 pb-3 pt-2.5">
          <p className="truncate text-[11px] font-bold text-white/75">{scene.title}</p>
          <p className="mt-1 truncate text-[9px] text-white/28">{scene.prompt || "No direction yet"}</p>
        </div>
      </button>
      <div className="absolute bottom-2.5 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <button type="button" onClick={onDuplicate} aria-label={`Duplicate ${scene.title}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/85 text-white/55 hover:text-white"><Copy size={12} /></button>
        <button type="button" onClick={onDelete} disabled={!canDelete} aria-label={`Delete ${scene.title}`} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/85 text-white/55 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-25"><Trash2 size={12} /></button>
      </div>
    </article>
  );
}

export default function StoryboardWorkspace({
  provider,
  busy = false,
  error = "",
  onGenerateMedia,
  initialAsset = null,
  initialAction = null,
  project = null,
  onStoryboardChange,
  onProjectNameChange,
}) {
  const [projectName, setProjectName] = useState(project?.name || "Untitled Project");
  const [scenes, setScenes] = useState(() => [createScene(0, { id: "scene-1" })]);
  const [selectedSceneId, setSelectedSceneId] = useState("scene-1");
  const consumedAssetIdRef = useRef(null);
  const consumedActionIdRef = useRef(null);
  const loadedProjectIdRef = useRef(null);
  const lastSavedStoryboardRef = useRef('');
  const saveTimerRef = useRef(null);
  const hydratingProjectRef = useRef(false);

  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) || scenes[0];
  const selectedIndex = scenes.findIndex((scene) => scene.id === selectedScene.id);
  const previousScene = selectedIndex > 0 ? scenes[selectedIndex - 1] : null;
  const isGenerating = selectedScene.status.startsWith("generating");
  const providerReady = provider?.configured === true && provider?.connected !== false;
  const canGenerate = providerReady && !busy && !isGenerating && Boolean(selectedScene.prompt.trim());
  const assets = useMemo(() => scenes.flatMap((scene) => [
    ...(scene.imageUrl ? [{ id: `${scene.id}-image`, type: "image", url: scene.imageUrl, title: `${scene.title} still`, sceneId: scene.id }] : []),
    ...(scene.videoUrl ? [{ id: `${scene.id}-video`, type: "video", url: scene.videoUrl, title: `${scene.title} video`, sceneId: scene.id }] : []),
  ]), [scenes]);

  useEffect(() => {
    if (!project?.id || loadedProjectIdRef.current === project.id) return;
    loadedProjectIdRef.current = project.id;
    const storedScenes = Array.isArray(project.storyboard?.scenes) && project.storyboard.scenes.length
      ? project.storyboard.scenes.map((scene) => ({ ...scene, status: scene.status === 'ready' ? 'ready' : scene.status === 'error' ? 'error' : 'draft' }))
      : [createScene(0)];
    const selected = storedScenes.some((scene) => scene.id === project.storyboard?.selectedSceneId)
      ? project.storyboard.selectedSceneId
      : storedScenes[0].id;
    const manifest = { version: 1, selectedSceneId: selected, scenes: storedScenes };
    hydratingProjectRef.current = true;
    lastSavedStoryboardRef.current = JSON.stringify(manifest);
    setProjectName(project.name || 'Untitled Project');
    setScenes(storedScenes);
    setSelectedSceneId(selected);
  }, [project?.id, project?.name, project?.storyboard]);

  useEffect(() => {
    if (!project?.id || typeof onStoryboardChange !== 'function') return undefined;
    const manifest = {
      version: 1,
      selectedSceneId,
      scenes: scenes.map((scene) => ({
        ...scene,
        status: scene.status.startsWith('generating') ? (scene.imageUrl || scene.videoUrl ? 'ready' : 'draft') : scene.status,
      })),
    };
    const serialized = JSON.stringify(manifest);
    if (hydratingProjectRef.current) {
      if (serialized === lastSavedStoryboardRef.current) hydratingProjectRef.current = false;
      return undefined;
    }
    if (serialized === lastSavedStoryboardRef.current) return undefined;
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      const saved = await onStoryboardChange(manifest);
      if (saved) lastSavedStoryboardRef.current = serialized;
    }, 700);
    return () => window.clearTimeout(saveTimerRef.current);
  }, [onStoryboardChange, project?.id, scenes, selectedSceneId]);

  useEffect(() => () => window.clearTimeout(saveTimerRef.current), []);

  useEffect(() => {
    if (!initialAsset?.id || consumedAssetIdRef.current === initialAsset.id) return;
    if (!['image', 'video'].includes(initialAsset.type) || typeof initialAsset.url !== 'string') return;
    consumedAssetIdRef.current = initialAsset.id;
    setScenes((previous) => previous.map((scene) => (
      scene.id === selectedSceneId
        ? {
            ...scene,
            imageUrl: initialAsset.type === 'image' ? initialAsset.url : scene.imageUrl,
            videoUrl: initialAsset.type === 'video' ? initialAsset.url : scene.videoUrl,
            status: 'ready',
          }
        : scene
    )));
  }, [initialAsset, selectedSceneId]);

  useEffect(() => {
    const actionId = initialAction?.id || '';
    if (!actionId || consumedActionIdRef.current === actionId || !['storyboard.create', 'storyboard.addScene'].includes(initialAction.action)) return;
    consumedActionIdRef.current = actionId;
    const parameters = initialAction.parameters || {};
    setScenes((previous) => previous.map((scene) => scene.id === selectedSceneId ? {
      ...scene,
      prompt: parameters.prompt || scene.prompt,
      aspectRatio: parameters.aspectRatio || scene.aspectRatio,
      duration: parameters.duration || scene.duration,
      imageUrl: initialAsset?.type === 'image' ? initialAsset.url : scene.imageUrl,
    } : scene));
  }, [initialAction, initialAsset, selectedSceneId]);

  const updateSelectedScene = (patch) => {
    setScenes((previous) => previous.map((scene) => (
      scene.id === selectedScene.id ? { ...scene, ...patch } : scene
    )));
  };

  const handleAddScene = () => {
    const result = addScene(scenes);
    setScenes(result.scenes);
    setSelectedSceneId(result.selectedSceneId);
  };

  const handleDuplicateScene = (sceneId) => {
    const result = duplicateScene(scenes, sceneId);
    setScenes(result.scenes);
    setSelectedSceneId(result.selectedSceneId);
  };

  const handleDeleteScene = (sceneId) => {
    const result = deleteScene(scenes, sceneId);
    setScenes(result.scenes);
    setSelectedSceneId(result.selectedSceneId);
  };

  const handleContinueScene = () => {
    const result = continueFromPreviousScene(scenes, selectedScene.id);
    if (result.continued) setScenes(result.scenes);
  };

  const handleGenerate = async (kind) => {
    if (!canGenerate || typeof onGenerateMedia !== "function") return;
    const sceneId = selectedScene.id;
    const firstFrameUrl = kind === "video" ? selectedScene.imageUrl : "";
    setScenes((previous) => previous.map((scene) => (
      scene.id === sceneId
        ? { ...scene, status: kind === "image" ? "generating-image" : "generating-video", error: "" }
        : scene
    )));

    try {
      const result = await onGenerateMedia({
        kind,
        prompt: selectedScene.prompt,
        aspectRatio: selectedScene.aspectRatio,
        duration: selectedScene.duration,
        firstFrameUrl,
      });
      setScenes((previous) => previous.map((scene) => {
        if (scene.id !== sceneId) return scene;
        return {
          ...scene,
          ...(kind === "image" ? { imageUrl: result.url, videoUrl: "" } : { videoUrl: result.url }),
          status: "ready",
          model: result.model || null,
          error: "",
        };
      }));
    } catch (generationError) {
      setScenes((previous) => previous.map((scene) => (
        scene.id === sceneId
          ? { ...scene, status: "error", error: generationError.message || "Generation failed." }
          : scene
      )));
    }
  };

  const enginePath = selectedScene.imageUrl ? "Image → Video" : "Text → Video";
  const engineModel = selectedScene.videoUrl && selectedScene.model
    ? selectedScene.model
    : selectedScene.imageUrl
      ? "server-selected I2V model"
      : "server-selected T2V model";
  const visibleError = selectedScene.error || error;

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#070709]" aria-label="Storyboard project workspace">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0a0d] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 text-black"><Layers3 size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200/55">G.FURY Create</p>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} onBlur={() => { const name = projectName.trim(); if (name && name !== project?.name) onProjectNameChange?.(name); }} maxLength={80} aria-label="Project name" className="mt-0.5 w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-white/[0.08] bg-black/25 p-1 text-[10px] font-bold">
            <button type="button" className="rounded-lg bg-white px-3 py-1.5 text-black">Storyboard</button>
            <button type="button" disabled title="Design mode is planned for a later phase" className="cursor-not-allowed rounded-lg px-3 py-1.5 text-white/25">Design · planned</button>
          </div>
          <span className="rounded-xl border border-white/[0.08] bg-black/25 px-3 py-2 text-[10px] font-bold text-white/55">{selectedScene.aspectRatio}</span>
          <button type="button" disabled title="Final export requires the future compositor" className="cursor-not-allowed rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-[10px] font-black text-white/25">Export · planned</button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[220px_minmax(0,1fr)_320px] lg:overflow-hidden">
        <aside className="border-b border-white/[0.06] bg-[#09090c] p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r custom-scrollbar">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Assets</p>
            <span className="text-[9px] text-white/20">{assets.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button type="button" onClick={() => handleGenerate("image")} disabled={!canGenerate} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-[10px] font-black text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-25"><ImageIcon size={14} /> Generate image</button>
            <button type="button" onClick={() => handleGenerate("video")} disabled={!canGenerate} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.04] text-[10px] font-black text-white/65 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><Film size={14} /> Generate video</button>
            <button type="button" disabled title="No secure Creator Studio upload path exists yet" className="col-span-2 flex h-9 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.09] text-[10px] font-bold text-white/20 lg:col-span-1"><Upload size={13} /> Upload · planned</button>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1 lg:grid-cols-2">
            {[
              [ImageIcon, "Images"],
              [Film, "Videos"],
              [Music2, "Audio"],
              [Shapes, "Graphics"],
            ].map(([Icon, label]) => <div key={label} className="flex items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[8px] font-bold text-white/30"><Icon size={11} /> {label}</div>)}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {assets.map((asset) => <AssetCard key={asset.id} asset={asset} onSelect={setSelectedSceneId} />)}
          </div>
          {assets.length === 0 && <p className="mt-5 rounded-xl border border-dashed border-white/[0.07] px-3 py-5 text-center text-[10px] leading-4 text-white/22">Generated scene images and videos will collect here.</p>}
        </aside>

        <main className="flex min-h-[480px] min-w-0 flex-col bg-[radial-gradient(circle_at_50%_10%,rgba(103,232,249,0.055),transparent_40%)] p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto custom-scrollbar">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white/65">{selectedScene.title}</p>
              <p className="mt-1 truncate text-[9px] text-white/25">{selectedScene.videoUrl ? "Video preview" : selectedScene.imageUrl ? "Still preview" : "Empty scene"}</p>
            </div>
            <span className="rounded-full border border-white/[0.07] bg-black/25 px-2.5 py-1 text-[9px] font-bold text-white/35">{selectedScene.status}</span>
          </div>
          <PreviewCanvas scene={selectedScene} isGenerating={isGenerating} />
        </main>

        <aside className="border-t border-white/[0.06] bg-[#0a0a0d] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0 custom-scrollbar sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Scene settings</p>
            <span className="text-[9px] text-white/20">{selectedIndex + 1} / {scenes.length}</span>
          </div>
          <div className="mt-4 space-y-4">
            <div>
              <FieldLabel>Scene title</FieldLabel>
              <input value={selectedScene.title} onChange={(event) => updateSelectedScene({ title: event.target.value })} maxLength={80} className={inputClass} />
            </div>
            <div>
              <FieldLabel hint={`${selectedScene.prompt.length}/4000`}>Prompt / direction</FieldLabel>
              <textarea value={selectedScene.prompt} onChange={(event) => updateSelectedScene({ prompt: event.target.value, error: "" })} maxLength={4000} rows={6} placeholder="Describe the subject, action, camera movement, light, and mood…" className={`${inputClass} resize-none leading-5`} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Aspect ratio</FieldLabel>
                <select value={selectedScene.aspectRatio} onChange={(event) => updateSelectedScene({ aspectRatio: event.target.value })} className={selectClass}>
                  {ASPECT_RATIOS.map((ratio) => <option key={ratio} value={ratio}>{ratio}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Duration</FieldLabel>
                <select value={selectedScene.duration} onChange={(event) => updateSelectedScene({ duration: Number(event.target.value) })} className={selectClass}>
                  {Array.from({ length: 10 }, (_, index) => index + 3).map((seconds) => <option key={seconds} value={seconds}>{seconds} sec</option>)}
                </select>
              </div>
            </div>
            <div>
              <FieldLabel hint="Metadata only">Transition</FieldLabel>
              <select value={selectedScene.transition} onChange={(event) => updateSelectedScene({ transition: event.target.value })} className={selectClass}>
                {TRANSITIONS.map((transition) => <option key={transition.id} value={transition.id}>{transition.label}</option>)}
              </select>
              <p className="mt-2 text-[9px] leading-4 text-white/22">Saved with the scene; not rendered until a compositor is built.</p>
            </div>

            <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.17em] text-cyan-200/55">AI Engine</p>
                  <p className="mt-1.5 text-xs font-semibold text-white/70">Auto · {enginePath}</p>
                  <p className="mt-1 truncate text-[9px] text-white/28" title={engineModel}>{engineModel}</p>
                </div>
                <span aria-hidden="true" className={cx("h-2 w-2 rounded-full", providerReady ? "bg-emerald-400" : "bg-amber-400")} />
              </div>
              <p className="mt-3 text-[9px] leading-4 text-white/25">{provider?.status || "MuAPI setup required"}. Model selection stays server-side.</p>
            </div>

            <button type="button" onClick={handleContinueScene} disabled={!previousScene?.imageUrl || busy || isGenerating} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 text-[10px] font-bold text-white/45 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><ChevronRight size={14} /> Continue from previous scene</button>

            {visibleError && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2.5 text-[10px] leading-4 text-red-200">{visibleError}</div>}
            {!providerReady && <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2.5 text-[10px] leading-4 text-amber-100/70">MuAPI setup is required before scene generation. No request will be sent.</div>}

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => handleGenerate("image")} disabled={!canGenerate} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[10px] font-black text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-25">{isGenerating && selectedScene.status === "generating-image" ? <LoaderCircle size={14} className="animate-spin" /> : <ImageIcon size={14} />} Generate Still</button>
              <button type="button" onClick={() => handleGenerate("video")} disabled={!canGenerate} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-violet-400 text-[10px] font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-25">{isGenerating && selectedScene.status === "generating-video" ? <LoaderCircle size={14} className="animate-spin" /> : selectedScene.imageUrl ? <Play size={14} fill="currentColor" /> : <Film size={14} />} {selectedScene.imageUrl ? "Animate Image" : "Generate Video"}</button>
            </div>
          </div>
        </aside>
      </div>

      <section className="shrink-0 border-t border-white/[0.06] bg-[#08080b] px-4 py-3 sm:px-5" aria-label="Storyboard timeline">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/35">Storyboard / timeline</p>
            <p className="mt-1 text-[8px] text-white/18">Scene order and transition metadata</p>
          </div>
          <button type="button" onClick={handleAddScene} disabled={busy} className="flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 text-[9px] font-black text-white/55 transition hover:bg-white/[0.09] hover:text-white disabled:opacity-25"><Plus size={13} /> Add scene</button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {scenes.map((scene, index) => (
            <React.Fragment key={scene.id}>
              {index > 0 && (
                <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 text-center">
                  <span className="h-px w-full bg-white/[0.08]" />
                  <span className="text-[8px] font-bold uppercase tracking-wide text-white/22">{TRANSITIONS.find((item) => item.id === scenes[index - 1].transition)?.label || "Cut"}</span>
                </div>
              )}
              <SceneCard
                scene={scene}
                selected={scene.id === selectedScene.id}
                onSelect={() => setSelectedSceneId(scene.id)}
                canDelete={scenes.length > 1 && !busy}
                onDuplicate={() => handleDuplicateScene(scene.id)}
                onDelete={() => handleDeleteScene(scene.id)}
              />
            </React.Fragment>
          ))}
          <button type="button" onClick={handleAddScene} disabled={busy} className="flex min-h-32 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] text-[9px] font-bold text-white/22 transition hover:border-white/20 hover:text-white/50 disabled:opacity-25"><Plus size={18} className="mb-2" /> New scene</button>
        </div>
      </section>
    </section>
  );
}
