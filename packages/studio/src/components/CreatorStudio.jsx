"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import {
  Bot,
  Check,
  CircleAlert,
  Download,
  ExternalLink,
  Film,
  Image as ImageIcon,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mic2,
  Play,
  Send,
  UserRound,
  WandSparkles,
} from "lucide-react";

const YOUTUBE_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
  "video/x-matroska",
]);

const TOOLS = [
  {
    id: "assistant",
    label: "Assistant",
    provider: "anthropic",
    eyebrow: "Think",
    description: "Turn a rough idea into a production plan, script, or optimized prompt.",
    icon: Bot,
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    id: "image",
    label: "Image",
    provider: "openai",
    eyebrow: "Create",
    description: "Generate an original campaign image or first frame with OpenAI.",
    icon: ImageIcon,
    accent: "from-emerald-400 to-cyan-400",
  },
  {
    id: "voice",
    label: "Voice",
    provider: "elevenlabs",
    eyebrow: "Speak",
    description: "Render narration with your configured ElevenLabs voice.",
    icon: Mic2,
    accent: "from-amber-400 to-orange-500",
  },
  {
    id: "avatar",
    label: "Avatar",
    provider: "heygen",
    eyebrow: "Present",
    description: "Create a presenter video with your configured HeyGen avatar and voice.",
    icon: UserRound,
    accent: "from-sky-400 to-blue-600",
  },
  {
    id: "video",
    label: "Video",
    provider: "runway",
    eyebrow: "Direct",
    description: "Generate a cinematic clip from text or an optional first-frame image.",
    icon: Film,
    accent: "from-pink-500 to-rose-500",
  },
  {
    id: "publish",
    label: "YouTube",
    provider: "youtube",
    eyebrow: "Publish",
    description: "Stage a finished video privately, review its metadata, and send it to YouTube.",
    icon: YoutubeMark,
    accent: "from-red-500 to-rose-400",
  },
];

const INITIAL_DRAFTS = {
  assistant: {
    prompt: "",
    mode: "strategy",
  },
  image: {
    prompt: "",
    size: "1024x1024",
    quality: "low",
  },
  voice: {
    text: "",
    stability: 0.5,
    similarityBoost: 0.75,
  },
  avatar: {
    script: "",
    title: "G.FURY Creator Studio",
    aspectRatio: "16:9",
  },
  video: {
    prompt: "",
    firstFrameUrl: "",
    ratio: "1280:720",
    duration: 5,
  },
  publish: {
    title: "",
    description: "",
    tags: "",
    madeForKids: null,
    containsSyntheticMedia: true,
    approved: false,
  },
};

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

async function responseError(response) {
  try {
    const data = await response.json();
    return data.detail || data.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function sleep(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function safeUploadFilename(value) {
  const fallback = "creator-video.mp4";
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .normalize("NFKC")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[^A-Za-z0-9]+/, "")
    .slice(0, 120);
  return cleaned || fallback;
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.ceil(bytes / 1024 ** 2)} MB`;
}

function ToolButton({ tool, active, provider, onClick }) {
  const Icon = tool.icon;
  const configured = provider?.configured === true && provider?.connected !== false;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${tool.label} — ${configured ? "configured" : "setup required"}`}
      aria-pressed={active}
      title={tool.label}
      className={cx(
        "group relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
        active
          ? "border-white/20 bg-white/[0.12] text-white shadow-[0_12px_35px_rgba(0,0,0,0.35)]"
          : "border-transparent bg-transparent text-white/40 hover:border-white/10 hover:bg-white/[0.06] hover:text-white",
      )}
    >
      {active && (
        <span className={cx("absolute -left-2 h-7 w-1 rounded-full bg-gradient-to-b", tool.accent)} />
      )}
      <Icon size={21} strokeWidth={1.8} />
      <span
        className={cx(
          "absolute right-2 top-2 h-1.5 w-1.5 rounded-full",
          configured ? "bg-emerald-400" : "bg-amber-400",
        )}
      />
    </button>
  );
}

function ProviderChip({ provider }) {
  const ready = provider?.configured === true && provider?.connected !== false;
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/[0.08] bg-black/30 px-3 py-1.5">
      <span className={cx("h-2 w-2 shrink-0 rounded-full", ready ? "bg-emerald-400" : "bg-amber-400")} />
      <span className="truncate text-[11px] font-semibold text-white/70">
        {provider?.label || "Provider"}
      </span>
      <span className="hidden truncate text-[10px] text-white/30 sm:inline">
        {provider?.model || "setup required"}
      </span>
    </div>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-current">
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.2c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.4-1.27.74-1.56-2.57-.29-5.27-1.29-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18A10.9 10.9 0 0 1 12 6.14c.98 0 1.95.13 2.86.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.4-2.71 5.38-5.29 5.67.42.36.79 1.07.79 2.16v3.21c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function YoutubeMark({ size = 24, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
    </svg>
  );
}

function SignInPanel({ error }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#050506] px-5 py-12">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0b0e] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-10">
        <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 -left-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-300">
            <LockKeyhole size={25} />
          </div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300/80">Private provider workspace</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">Sign in to Creator Studio</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
            Continue with the authorized GitHub account. Provider credentials remain on the server and are never shared with GitHub or the browser.
          </p>
          <div className="mt-8 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-xs leading-5 text-red-200">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <a
              href="/api/auth/github/start?returnTo=/studio/creator"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-black transition hover:bg-cyan-200"
            >
              <GithubMark />
              Continue with GitHub
            </a>
          </div>
          <p className="mt-5 text-[11px] leading-5 text-white/25">
            Access is restricted to the GitHub identity approved by the Studio owner. No repository permission is requested.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyCanvas({ tool, configured }) {
  const Icon = tool.icon;
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#08080a]">
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className={cx("absolute h-56 w-56 rounded-full bg-gradient-to-br opacity-10 blur-3xl", tool.accent)} />
      <div className="relative flex max-w-md flex-col items-center px-7 text-center">
        <div className={cx("mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-black", tool.accent)}>
          <Icon size={29} strokeWidth={1.8} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/35">{tool.eyebrow} with {tool.label}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Your result appears here</h3>
        <p className="mt-3 text-sm leading-6 text-white/38">{tool.description}</p>
        {!configured && (
          <div className="mt-5 flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-3 py-1.5 text-[11px] font-semibold text-amber-200">
            <CircleAlert size={13} /> Provider setup required in Vercel
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCanvas({ output, tool }) {
  if (!output) return null;

  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center overflow-hidden rounded-[26px] border border-white/[0.09] bg-[#08080a] p-5 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_45%)]" />

      {output.type === "text" && (
        <article className="relative max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/[0.08] bg-black/35 p-6 text-sm leading-7 text-white/75 custom-scrollbar sm:p-9">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">Anthropic response</p>
              <p className="mt-1 text-xs text-white/30">{output.model}</p>
            </div>
            <Check size={18} className="text-emerald-400" />
          </div>
          <div className="whitespace-pre-wrap">{output.text}</div>
        </article>
      )}

      {output.type === "image" && (
        <div className="relative flex h-full w-full items-center justify-center">
          <img src={output.url} alt="Generated creative" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" />
          <a
            href={output.url}
            download="creator-studio-image.png"
            className="absolute bottom-3 right-3 flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-black/70 px-3 text-xs font-bold text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
          >
            <Download size={15} /> Download
          </a>
        </div>
      )}

      {output.type === "audio" && (
        <div className="relative w-full max-w-xl rounded-[26px] border border-white/[0.08] bg-black/35 p-7 sm:p-10">
          <div className={cx("mb-8 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br text-black", tool.accent)}>
            <Mic2 size={34} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">ElevenLabs voice</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Narration ready</h3>
          <audio src={output.url} controls className="mt-7 w-full" />
          <a href={output.url} download="creator-studio-voice.mp3" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-white/55 hover:text-white">
            <Download size={14} /> Download MP3
          </a>
        </div>
      )}

      {output.type === "video" && output.url && (
        <div className="relative flex h-full w-full items-center justify-center">
          <video src={output.url} poster={output.thumbnailUrl || undefined} controls className="max-h-full max-w-full rounded-2xl bg-black object-contain shadow-2xl" />
          <a
            href={output.url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-black/70 px-3 text-xs font-bold text-white backdrop-blur-xl transition hover:bg-white hover:text-black"
          >
            <ExternalLink size={14} /> Open
          </a>
        </div>
      )}

      {output.type === "pending" && (
        <div className="relative flex max-w-md flex-col items-center text-center">
          <div className={cx("flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br text-black", tool.accent)}>
            <LoaderCircle size={34} className="animate-spin" />
          </div>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{output.provider} is rendering</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{output.status || "Generation queued"}</h3>
          <p className="mt-3 text-sm leading-6 text-white/35">You can keep this workspace open while the provider completes the job.</p>
          {output.id && <p className="mt-4 max-w-full truncate font-mono text-[10px] text-white/20" title={output.id}>Task {output.id}</p>}
        </div>
      )}

      {output.type === "youtube" && (
        <div className="relative w-full max-w-2xl rounded-[26px] border border-white/[0.08] bg-black/35 p-7 sm:p-10">
          <div className="flex items-start justify-between gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-red-500 text-white">
              <YoutubeMark size={31} />
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
              Private
            </span>
          </div>
          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">YouTube upload complete</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{output.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/40">
            The video is private. Review it in YouTube Studio before changing visibility.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={output.studioUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-black transition hover:bg-red-200">
              <ExternalLink size={14} /> Review in YouTube Studio
            </a>
            <a href={output.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-bold text-white/60 transition hover:bg-white/[0.08] hover:text-white">
              <Play size={14} /> Open private video
            </a>
          </div>
          {(!output.historyRecorded || output.cleanupPending) && (
            <p className="mt-5 text-xs leading-5 text-amber-200/70">
              Upload succeeded, but Creator Studio could not finish all local record cleanup. The video itself is safe in YouTube.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="text-[10px] font-black uppercase tracking-[0.17em] text-white/38">{children}</label>
      {hint && <span className="text-[10px] text-white/22">{hint}</span>}
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/[0.08] bg-black/25 px-3.5 py-3 text-xs text-white outline-none transition placeholder:text-white/20 focus:border-white/20 focus:bg-black/40";
const selectClass = `${inputClass} appearance-none`;

function PromptTextarea({ value, onChange, placeholder, maxLength = 4000 }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={8}
      className="min-h-44 w-full resize-none rounded-2xl border border-white/[0.08] bg-black/25 px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-white/20 focus:bg-black/40"
    />
  );
}

function YoutubeControls({
  draft,
  updateDraft,
  status,
  file,
  fileInputKey,
  stagedPath,
  progress,
  onConnect,
  onDisconnect,
  onFileChange,
}) {
  const connected = status?.connected === true;
  return (
    <>
      <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-white">YouTube account</p>
            <p className="mt-1 text-[10px] leading-4 text-white/35">
              {connected ? "Connected with upload-only permission" : "Not connected"}
            </p>
          </div>
          {connected ? (
            <button type="button" onClick={onDisconnect} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-bold text-white/45 transition hover:border-red-400/30 hover:text-red-200">
              Disconnect
            </button>
          ) : (
            <button type="button" onClick={onConnect} disabled={!status?.configured} className="rounded-lg bg-white px-3 py-2 text-[10px] font-black text-black transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-30">
              Connect YouTube
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider">
          <span className="rounded-full bg-emerald-400/[0.08] px-2 py-1 text-emerald-300">Private only</span>
          <span className="rounded-full bg-white/[0.05] px-2 py-1 text-white/35">No auto-publish</span>
          <span className="rounded-full bg-white/[0.05] px-2 py-1 text-white/35">Upload scope only</span>
        </div>
      </div>

      <div>
        <FieldLabel hint={`Up to ${formatBytes(status?.maxUploadBytes)}`}>Finished video</FieldLabel>
        <input
          key={fileInputKey}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/x-matroska"
          onChange={onFileChange}
          disabled={!connected || Boolean(stagedPath)}
          className="block w-full rounded-xl border border-dashed border-white/[0.12] bg-black/25 px-3 py-4 text-xs text-white/55 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-[10px] file:font-black file:text-black disabled:cursor-not-allowed disabled:opacity-40"
        />
        {file && (
          <p className="mt-2 truncate text-[10px] text-white/35" title={file.name}>
            {file.name} · {formatBytes(file.size)}
          </p>
        )}
        {stagedPath && (
          <p className="mt-2 text-[10px] leading-4 text-emerald-300/70">
            Private staging complete. If YouTube rejects the request, retrying will reuse this staged file.
          </p>
        )}
        {progress > 0 && progress < 100 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <div>
        <FieldLabel hint={`${draft.title.length}/100`}>Video title</FieldLabel>
        <input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} maxLength={100} placeholder="A clear title for your video" className={inputClass} />
      </div>
      <div>
        <FieldLabel hint={`${draft.description.length}/5000`}>Description</FieldLabel>
        <textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} maxLength={5000} rows={5} placeholder="Add context, credits, and links…" className={`${inputClass} resize-none leading-5`} />
      </div>
      <div>
        <FieldLabel hint="Comma separated">Tags</FieldLabel>
        <input value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} maxLength={500} placeholder="creator, AI, video" className={inputClass} />
      </div>
      <div>
        <FieldLabel>Audience</FieldLabel>
        <select
          value={draft.madeForKids === null ? "" : String(draft.madeForKids)}
          onChange={(event) => updateDraft("madeForKids", event.target.value === "" ? null : event.target.value === "true")}
          className={selectClass}
        >
          <option value="">Choose an audience</option>
          <option value="false">No, it is not made for children</option>
          <option value="true">Yes, it is made for children</option>
        </select>
      </div>
      <label className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4 text-xs leading-5 text-white/55">
        <input type="checkbox" checked={draft.containsSyntheticMedia} onChange={(event) => updateDraft("containsSyntheticMedia", event.target.checked)} className="mt-1 accent-red-400" />
        <span>This video contains realistic altered or synthetic media.</span>
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-xs leading-5 text-red-100/80">
        <input type="checkbox" checked={draft.approved} onChange={(event) => updateDraft("approved", event.target.checked)} className="mt-1 accent-red-400" />
        <span>I reviewed this file and metadata and approve uploading it to YouTube as <strong>private</strong>.</span>
      </label>

      {Array.isArray(status?.history) && status.history.length > 0 && (
        <div>
          <FieldLabel>Recent private uploads</FieldLabel>
          <div className="space-y-2">
            {status.history.slice(0, 5).map((item) => (
              <a key={item.videoId} href={item.studioUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-[10px] text-white/45 transition hover:bg-white/[0.05] hover:text-white">
                <span className="truncate">{item.title}</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function InspectorFields({ activeTool, draft, updateDraft, youtube }) {
  if (activeTool.id === "publish") {
    return <YoutubeControls draft={draft} updateDraft={updateDraft} {...youtube} />;
  }

  if (activeTool.id === "assistant") {
    return (
      <>
        <div>
          <FieldLabel>Assistant mode</FieldLabel>
          <select value={draft.mode} onChange={(event) => updateDraft("mode", event.target.value)} className={selectClass}>
            <option value="strategy">Creative strategy</option>
            <option value="plan">Production plan</option>
            <option value="script">Script + shot plan</option>
            <option value="prompt">Provider prompts</option>
          </select>
        </div>
        <div>
          <FieldLabel hint={`${draft.prompt.length}/20000`}>Brief</FieldLabel>
          <PromptTextarea value={draft.prompt} onChange={(value) => updateDraft("prompt", value)} placeholder="Describe the content, audience, platform, tone, and desired outcome…" maxLength={20000} />
        </div>
      </>
    );
  }

  if (activeTool.id === "image") {
    return (
      <>
        <div>
          <FieldLabel hint={`${draft.prompt.length}/4000`}>Image prompt</FieldLabel>
          <PromptTextarea value={draft.prompt} onChange={(value) => updateDraft("prompt", value)} placeholder="Describe the subject, setting, camera, light, color, and composition…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Canvas</FieldLabel>
            <select value={draft.size} onChange={(event) => updateDraft("size", event.target.value)} className={selectClass}>
              <option value="1024x1024">Square</option>
              <option value="1536x1024">Landscape</option>
              <option value="1024x1536">Portrait</option>
            </select>
          </div>
          <div>
            <FieldLabel>Quality</FieldLabel>
            <select value={draft.quality} onChange={(event) => updateDraft("quality", event.target.value)} className={selectClass}>
              <option value="low">Low — test</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </>
    );
  }

  if (activeTool.id === "voice") {
    return (
      <>
        <div>
          <FieldLabel hint={`${draft.text.length}/5000`}>Voice script</FieldLabel>
          <PromptTextarea value={draft.text} onChange={(value) => updateDraft("text", value)} placeholder="Paste narration for your configured voice…" maxLength={5000} />
        </div>
        <div className="space-y-4 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          <label className="block">
            <span className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/35"><span>Stability</span><span>{draft.stability}</span></span>
            <input type="range" min="0" max="1" step="0.05" value={draft.stability} onChange={(event) => updateDraft("stability", Number(event.target.value))} className="w-full accent-amber-400" />
          </label>
          <label className="block">
            <span className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/35"><span>Similarity</span><span>{draft.similarityBoost}</span></span>
            <input type="range" min="0" max="1" step="0.05" value={draft.similarityBoost} onChange={(event) => updateDraft("similarityBoost", Number(event.target.value))} className="w-full accent-amber-400" />
          </label>
        </div>
      </>
    );
  }

  if (activeTool.id === "avatar") {
    return (
      <>
        <div>
          <FieldLabel hint={`${draft.script.length}/5000`}>Avatar script</FieldLabel>
          <PromptTextarea value={draft.script} onChange={(value) => updateDraft("script", value)} placeholder="Write exactly what your HeyGen avatar should say…" maxLength={5000} />
        </div>
        <div>
          <FieldLabel>Project title</FieldLabel>
          <input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} maxLength={100} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Aspect ratio</FieldLabel>
          <select value={draft.aspectRatio} onChange={(event) => updateDraft("aspectRatio", event.target.value)} className={selectClass}>
            <option value="16:9">Landscape 16:9</option>
            <option value="9:16">Vertical 9:16</option>
            <option value="1:1">Square 1:1</option>
          </select>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <FieldLabel hint={`${draft.prompt.length}/4000`}>Direction</FieldLabel>
        <PromptTextarea value={draft.prompt} onChange={(value) => updateDraft("prompt", value)} placeholder="Describe the shot, subject motion, camera movement, lighting, and mood…" />
      </div>
      <div>
        <FieldLabel>First-frame image URL <span className="normal-case tracking-normal text-white/20">optional</span></FieldLabel>
        <input type="url" value={draft.firstFrameUrl} onChange={(event) => updateDraft("firstFrameUrl", event.target.value)} placeholder="https://…" className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Frame</FieldLabel>
          <select value={draft.ratio} onChange={(event) => updateDraft("ratio", event.target.value)} className={selectClass}>
            <option value="1280:720">Landscape</option>
            <option value="720:1280">Vertical</option>
            <option value="1280:768">Cinema wide</option>
            <option value="768:1280">Portrait</option>
          </select>
        </div>
        <div>
          <FieldLabel>Duration</FieldLabel>
          <select value={draft.duration} onChange={(event) => updateDraft("duration", Number(event.target.value))} className={selectClass}>
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((seconds) => <option key={seconds} value={seconds}>{seconds} sec</option>)}
          </select>
        </div>
      </div>
    </>
  );
}

function hasRequiredInput(toolId, draft) {
  if (toolId === "publish") {
    return Boolean(draft.title.trim()) && typeof draft.madeForKids === "boolean" && draft.approved === true;
  }
  if (toolId === "voice") return Boolean(draft.text.trim());
  if (toolId === "avatar") return Boolean(draft.script.trim());
  return Boolean(draft.prompt.trim());
}

export default function CreatorStudio({ onGenerationStart, onGenerationEnd, onGenerationComplete, onGenerationError }) {
  const [session, setSession] = useState(null);
  const [authState, setAuthState] = useState("checking");
  const [providers, setProviders] = useState([]);
  const [activeToolId, setActiveToolId] = useState("assistant");
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS);
  const [outputs, setOutputs] = useState({});
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [youtubeStatus, setYoutubeStatus] = useState(null);
  const [youtubeFile, setYoutubeFile] = useState(null);
  const [youtubeFileInputKey, setYoutubeFileInputKey] = useState(0);
  const [youtubeStagedPath, setYoutubeStagedPath] = useState("");
  const [youtubeUploadProgress, setYoutubeUploadProgress] = useState(0);
  const objectUrlsRef = useRef(new Set());
  const generationTokenRef = useRef(0);

  const activeTool = TOOLS.find((tool) => tool.id === activeToolId) || TOOLS[0];
  const activeDraft = drafts[activeTool.id];
  const activeOutput = outputs[activeTool.id] || null;
  const youtubeProvider = useMemo(() => ({
    id: "youtube",
    label: "YouTube",
    configured: youtubeStatus?.configured === true,
    connected: youtubeStatus?.connected === true,
    model: youtubeStatus?.connected ? "Connected · private" : "Connection required",
  }), [youtubeStatus]);

  const providerMap = useMemo(
    () => ({
      ...Object.fromEntries(providers.map((provider) => [provider.id, provider])),
      youtube: youtubeProvider,
    }),
    [providers, youtubeProvider],
  );
  const activeProvider = providerMap[activeTool.provider];

  const request = useCallback(async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    if (options.body && typeof options.body !== "string") {
      headers.set("content-type", "application/json");
    }
    const response = await fetch(`/api/creator/${path}`, {
      ...options,
      headers,
      credentials: "same-origin",
      cache: "no-store",
      body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
    });
    if (response.status === 401) {
      setSession(null);
      setProviders([]);
      setAuthState("signed-out");
    }
    return response;
  }, []);

  const loadProviders = useCallback(async () => {
    const response = await request("providers");
    if (!response.ok) throw new Error(await responseError(response));
    const data = await response.json();
    setProviders(Array.isArray(data.providers) ? data.providers : []);
    return data;
  }, [request]);

  const loadYoutubeStatus = useCallback(async () => {
    const response = await fetch("/api/social/youtube/status", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to load the YouTube connection.");
    setYoutubeStatus(data);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const query = new URLSearchParams(window.location.search);
      const queryError = query.get("authError");
      const youtubeQueryError = query.get("youtubeAuthError");
      const authErrors = {
        github_denied: "GitHub sign-in was cancelled.",
        invalid_oauth_state: "The GitHub sign-in request expired or could not be verified. Please try again.",
        github_token_exchange_failed: "GitHub could not complete sign-in. Please try again.",
        github_scope_rejected: "GitHub returned permissions that Creator Studio does not accept. Review the OAuth app and try again.",
        github_identity_failed: "GitHub identity verification failed. Please try again.",
        github_account_not_allowed: "That GitHub account is not authorized for this Creator Studio.",
        session_creation_failed: "Creator Studio could not create a secure session.",
      };
      if (queryError && active) setError(authErrors[queryError] || "GitHub sign-in failed.");
      const youtubeErrors = {
        creator_session_required: "Sign in to Creator Studio before connecting YouTube.",
        youtube_not_configured: "YouTube publishing still needs its Vercel environment variables.",
        youtube_denied: "The YouTube connection was cancelled.",
        invalid_youtube_oauth_state: "The YouTube connection expired or could not be verified. Try again.",
        youtube_scope_rejected: "Google returned permissions outside the upload-only scope, so Creator Studio rejected the connection.",
        youtube_token_exchange_failed: "Google could not complete the YouTube connection. Try again.",
        youtube_token_storage_failed: "Creator Studio could not securely store the YouTube connection.",
      };
      if (youtubeQueryError && active) {
        setError(youtubeErrors[youtubeQueryError] || "YouTube connection failed.");
      }

      try {
        const response = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { accept: "application/json" },
        });
        const data = await response.json().catch(() => ({}));
        if (!active) return;
        if (!response.ok || !data.authenticated) {
          setAuthState("signed-out");
          if (response.status === 503 && data.error) setError(data.error);
          return;
        }
        setSession(data);
        setAuthState("signed-in");
        await Promise.all([
          loadProviders(),
          loadYoutubeStatus().catch((statusError) => {
            if (active) setError(statusError.message || "Unable to load the YouTube connection.");
          }),
        ]);
      } catch (sessionError) {
        if (!active) return;
        setAuthState("signed-out");
        setError(sessionError.message || "Unable to verify the Creator Studio session.");
      }
    };
    checkSession();
    return () => { active = false; };
  }, [loadProviders, loadYoutubeStatus]);

  useEffect(() => () => {
    generationTokenRef.current += 1;
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  const signOut = async () => {
    generationTokenRef.current += 1;
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "x-creator-action": "logout" },
      });
      if (!response.ok) throw new Error("Unable to sign out securely.");
      setSession(null);
      setProviders([]);
      setYoutubeStatus(null);
      setYoutubeFile(null);
      setYoutubeStagedPath("");
      setAuthState("signed-out");
      setError("");
    } catch (logoutError) {
      setError(logoutError.message || "Unable to sign out securely.");
    }
  };

  const updateDraft = (field, value) => {
    setDrafts((previous) => ({
      ...previous,
      [activeTool.id]: { ...previous[activeTool.id], [field]: value },
    }));
  };

  const connectYoutube = () => {
    setError("");
    window.location.assign("/api/social/youtube/connect?returnTo=/studio/creator");
  };

  const disconnectYoutube = async () => {
    if (working || !youtubeStatus?.connected) return;
    if (!window.confirm("Disconnect YouTube and revoke Creator Studio's upload permission?")) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/social/youtube/disconnect", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error(await responseError(response));
      setYoutubeFile(null);
      setYoutubeStagedPath("");
      setYoutubeUploadProgress(0);
      setYoutubeFileInputKey((value) => value + 1);
      await loadYoutubeStatus();
    } catch (disconnectError) {
      setError(disconnectError.message || "Unable to disconnect YouTube.");
    } finally {
      setWorking(false);
    }
  };

  const chooseYoutubeFile = (event) => {
    const file = event.target.files?.[0] || null;
    setError("");
    setYoutubeStagedPath("");
    setYoutubeUploadProgress(0);
    setDrafts((previous) => ({
      ...previous,
      publish: { ...previous.publish, approved: false },
    }));
    if (!file) {
      setYoutubeFile(null);
      return;
    }
    if (!YOUTUBE_VIDEO_TYPES.has(file.type)) {
      event.target.value = "";
      setYoutubeFile(null);
      setError("Choose an MP4, MOV, M4V, WebM, or Matroska video.");
      return;
    }
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > Number(youtubeStatus?.maxUploadBytes || 0)) {
      event.target.value = "";
      setYoutubeFile(null);
      setError(`Choose a non-empty video no larger than ${formatBytes(youtubeStatus?.maxUploadBytes)}.`);
      return;
    }
    setYoutubeFile(file);
  };

  const rememberObjectUrl = (blob) => {
    const url = URL.createObjectURL(blob);
    objectUrlsRef.current.add(url);
    return url;
  };

  const pollTask = async (provider, id, token, toolId) => {
    const terminalSuccess = provider === "runway" ? ["SUCCEEDED"] : ["completed"];
    const terminalFailure = provider === "runway" ? ["FAILED", "CANCELED"] : ["failed", "error"];

    for (let attempt = 0; attempt < 120; attempt += 1) {
      await sleep(5000 + Math.floor(Math.random() * 700));
      if (generationTokenRef.current !== token) throw new Error("Generation was stopped.");
      const response = await request(`${provider}/status?id=${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      const status = String(data.status || "unknown");
      const terminalStatus = provider === "runway" ? status.toUpperCase() : status.toLowerCase();
      setOutputs((previous) => ({
        ...previous,
        [toolId]: { type: "pending", provider, id, status },
      }));
      if (terminalSuccess.includes(terminalStatus)) {
        const url = provider === "runway" ? data.output?.[0] : data.videoUrl;
        if (!url) throw new Error(`${provider} completed without a video URL.`);
        return { type: "video", provider, id, url, thumbnailUrl: data.thumbnailUrl || null };
      }
      if (terminalFailure.includes(terminalStatus)) {
        throw new Error(data.failure || `${provider} generation failed.`);
      }
    }
    throw new Error(`${provider} generation is still running. Reopen the provider dashboard with the task ID to check it.`);
  };

  const generate = async () => {
    const publishMissingFile = activeTool.id === "publish" && !youtubeFile && !youtubeStagedPath;
    const publishDisconnected = activeTool.id === "publish" && !youtubeStatus?.connected;
    if (
      working ||
      !activeProvider?.configured ||
      !hasRequiredInput(activeTool.id, activeDraft) ||
      publishMissingFile ||
      publishDisconnected
    ) return;
    const toolId = activeTool.id;
    const providerId = activeTool.provider;
    const draft = activeDraft;
    const token = generationTokenRef.current + 1;
    generationTokenRef.current = token;
    setWorking(true);
    setError("");
    onGenerationStart?.();

    try {
      let output;
      if (toolId === "assistant") {
        const response = await request("assistant", { method: "POST", body: draft });
        if (!response.ok) throw new Error(await responseError(response));
        const data = await response.json();
        output = { type: "text", text: data.text, model: data.model };
      } else if (toolId === "image") {
        const response = await request("image", { method: "POST", body: draft });
        if (!response.ok) throw new Error(await responseError(response));
        output = { type: "image", url: rememberObjectUrl(await response.blob()) };
      } else if (toolId === "voice") {
        const response = await request("speech", { method: "POST", body: draft });
        if (!response.ok) throw new Error(await responseError(response));
        output = { type: "audio", url: rememberObjectUrl(await response.blob()) };
      } else if (toolId === "avatar") {
        const response = await request("heygen", { method: "POST", body: draft });
        if (!response.ok) throw new Error(await responseError(response));
        const data = await response.json();
        setOutputs((previous) => ({ ...previous, avatar: { type: "pending", provider: "heygen", id: data.id, status: data.status } }));
        output = await pollTask("heygen", data.id, token, toolId);
      } else if (toolId === "video") {
        const response = await request("runway", { method: "POST", body: draft });
        if (!response.ok) throw new Error(await responseError(response));
        const data = await response.json();
        setOutputs((previous) => ({ ...previous, video: { type: "pending", provider: "runway", id: data.id, status: data.status } }));
        output = await pollTask("runway", data.id, token, toolId);
      } else {
        let pathname = youtubeStagedPath;
        if (!pathname) {
          if (!youtubeFile) throw new Error("Choose a finished video first.");
          if (!YOUTUBE_VIDEO_TYPES.has(youtubeFile.type)) throw new Error("That video type is not supported.");
          if (youtubeFile.size > Number(youtubeStatus?.maxUploadBytes || 0)) {
            throw new Error(`The video exceeds the ${formatBytes(youtubeStatus?.maxUploadBytes)} upload limit.`);
          }
          setOutputs((previous) => ({
            ...previous,
            publish: { type: "pending", provider: "YouTube", status: "Staging the private video" },
          }));
          const requestedPath = `creator-youtube-staging/${session.user.id}/${window.crypto.randomUUID()}-${safeUploadFilename(youtubeFile.name)}`;
          const staged = await uploadBlob(requestedPath, youtubeFile, {
            access: "private",
            contentType: youtubeFile.type,
            handleUploadUrl: "/api/social/youtube/blob-upload",
            multipart: youtubeFile.size > 5 * 1024 * 1024,
            onUploadProgress: ({ percentage }) => {
              setYoutubeUploadProgress(Math.max(0, Math.min(100, Math.round(percentage))));
            },
          });
          pathname = staged.pathname;
          if (typeof pathname !== "string" || !pathname.startsWith(`creator-youtube-staging/${session.user.id}/`)) {
            throw new Error("Private video staging returned an invalid path.");
          }
          setYoutubeStagedPath(pathname);
        }

        setOutputs((previous) => ({
          ...previous,
          publish: { type: "pending", provider: "YouTube", status: "Uploading privately to YouTube" },
        }));
        const response = await fetch("/api/social/youtube/publish", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify({ ...draft, pathname }),
        });
        if (!response.ok) {
          const message = await responseError(response);
          if ([404, 410, 413, 415].includes(response.status)) {
            setYoutubeStagedPath("");
            setYoutubeUploadProgress(0);
          }
          if ([413, 415].includes(response.status)) {
            setYoutubeFile(null);
            setYoutubeFileInputKey((value) => value + 1);
            setDrafts((previous) => ({
              ...previous,
              publish: { ...previous.publish, approved: false },
            }));
          }
          throw new Error(message);
        }
        const data = await response.json();
        output = { type: "youtube", ...data };
        setYoutubeFile(null);
        setYoutubeStagedPath("");
        setYoutubeUploadProgress(0);
        setYoutubeFileInputKey((value) => value + 1);
        setDrafts((previous) => ({
          ...previous,
          publish: { ...previous.publish, approved: false },
        }));
        await loadYoutubeStatus().catch(() => {});
      }

      if (generationTokenRef.current !== token) return;
      setOutputs((previous) => ({ ...previous, [toolId]: output }));
      onGenerationComplete?.({ url: output.url || null, provider: providerId });
    } catch (generationError) {
      if (generationTokenRef.current !== token) return;
      const message = generationError.message || "Generation failed.";
      setError(message);
      onGenerationError?.(message);
    } finally {
      if (generationTokenRef.current === token) {
        setWorking(false);
      }
      onGenerationEnd?.();
    }
  };

  const activeReady = activeProvider?.configured === true && (
    activeTool.id !== "publish" || (
      youtubeStatus?.connected === true &&
      Boolean(youtubeFile || youtubeStagedPath)
    )
  );

  if (authState === "checking") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#050506] text-cyan-300">
        <LoaderCircle size={28} className="animate-spin" aria-label="Checking Creator Studio session" />
      </div>
    );
  }
  if (authState !== "signed-in" || !session) {
    return <SignInPanel error={error} />;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#050506] text-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#09090b]/95 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black">
            <WandSparkles size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-bold tracking-tight">Creator Studio</h1>
              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-200">Private</span>
            </div>
            <p className="truncate text-[10px] text-white/30">One canvas · six specialist providers</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            {providers.map((provider) => <ProviderChip key={provider.id} provider={provider} />)}
            <ProviderChip provider={youtubeProvider} />
          </div>
          <span className="hidden text-[10px] font-semibold text-white/35 sm:inline">@{session.user?.login}</span>
          <button type="button" onClick={signOut} title="Sign out of Creator Studio" className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/45 transition hover:bg-white/[0.09] hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.06] bg-[#09090b] px-3 py-2 md:w-[76px] md:flex-col md:border-b-0 md:border-r md:px-2 md:py-4">
          {TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              active={activeTool.id === tool.id}
              provider={providerMap[tool.provider]}
              onClick={() => { setActiveToolId(tool.id); setError(""); }}
            />
          ))}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-white/[0.05] px-5 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cx("h-2 w-2 rounded-full bg-gradient-to-br", activeTool.accent)} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{activeTool.eyebrow}</p>
              </div>
              <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">{activeTool.label}</h2>
            </div>
            <ProviderChip provider={activeProvider} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-6">
            <div className="mx-auto h-full min-h-[360px] w-full max-w-6xl">
              {activeOutput ? <ResultCanvas output={activeOutput} tool={activeTool} /> : <EmptyCanvas tool={activeTool} configured={activeProvider?.configured} />}
            </div>
          </div>
        </main>

        <aside className="max-h-[48vh] shrink-0 overflow-y-auto border-t border-white/[0.06] bg-[#0a0a0d] custom-scrollbar md:max-h-none md:w-[370px] md:border-l md:border-t-0 xl:w-[410px]">
          <div className="p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Generation controls</p>
              <h3 className="mt-1 text-xl font-semibold tracking-tight">{activeTool.description}</h3>
            </div>

            {activeTool.id !== "publish" && !activeProvider?.configured && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-xs leading-5 text-amber-100/80">
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <span>Add the required {activeProvider?.label || activeTool.provider} environment variables in Vercel, then redeploy.</span>
              </div>
            )}

            {activeTool.id === "publish" && youtubeStatus && !youtubeStatus.configured && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-xs leading-5 text-amber-100/80">
                <CircleAlert size={16} className="mt-0.5 shrink-0 text-amber-300" />
                <span>Add the listed YouTube and private Blob environment variables in Vercel, then redeploy.</span>
              </div>
            )}

            <div className="space-y-5">
              <InspectorFields
                activeTool={activeTool}
                draft={activeDraft}
                updateDraft={updateDraft}
                youtube={{
                  status: youtubeStatus,
                  file: youtubeFile,
                  fileInputKey: youtubeFileInputKey,
                  stagedPath: youtubeStagedPath,
                  progress: youtubeUploadProgress,
                  onConnect: connectYoutube,
                  onDisconnect: disconnectYoutube,
                  onFileChange: chooseYoutubeFile,
                }}
              />
            </div>

            {error && (
              <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.08] px-3 py-2.5 text-xs leading-5 text-red-200">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={generate}
              disabled={working || !activeReady || !hasRequiredInput(activeTool.id, activeDraft)}
              className={cx(
                "mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-5 text-sm font-black text-black shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-30",
                activeTool.accent,
              )}
            >
              {working ? <LoaderCircle size={17} className="animate-spin" /> : activeTool.id === "assistant" ? <Send size={16} /> : activeTool.id === "publish" ? <YoutubeMark size={17} /> : <Play size={16} fill="currentColor" />}
              {working ? "Working…" : activeTool.id === "assistant" ? "Ask Anthropic" : activeTool.id === "publish" ? "Upload privately to YouTube" : `Generate ${activeTool.label}`}
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-white/22">
              <LockKeyhole size={11} /> Provider keys never enter the browser
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
