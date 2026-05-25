"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  PlugZap,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";
import { normalizeLocalRuntime } from "../localRuntime.js";

function formatSize(sizeGB) {
  const size = Number(sizeGB);
  if (!Number.isFinite(size) || size <= 0) return "按模型下载";
  return size >= 1 ? `${size.toFixed(1)} GB` : `${Math.round(size * 1024)} MB`;
}

function getProgressLabel(progress) {
  if (!progress) return "";
  const pct = typeof progress.progress === "number" ? Math.round(progress.progress * 100) : null;
  const phase = progress.phase === "extracting" ? "解压中" : progress.phase === "done" ? "完成" : "下载中";
  return pct === null ? phase : `${phase} ${pct}%`;
}

function ProgressBar({ progress }) {
  if (!progress) return null;
  const pct = typeof progress.progress === "number" ? Math.max(0, Math.min(100, Math.round(progress.progress * 100))) : 0;
  return (
    <div className="mt-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-[#d9ff00] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[11px] text-white/45">{getProgressLabel(progress)}</div>
    </div>
  );
}

function StatusBadge({ ready, children }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-bold ${
        ready
          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
          : "border-yellow-300/20 bg-yellow-400/10 text-yellow-100"
      }`}
    >
      {children}
    </span>
  );
}

function Tag({ children }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-white/10 bg-black/20 px-2 text-[11px] font-bold text-white/45">
      {children}
    </span>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#d9ff00]/70">{eyebrow}</div>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-white">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-5 text-center">
      <AlertTriangle size={24} className="text-yellow-200/70" />
      <div className="text-sm font-bold text-white">{title}</div>
      <p className="max-w-xl text-[13px] leading-6 text-white/45">{body}</p>
    </div>
  );
}

function AuxiliaryRows({ model, progressById, busyKey, onDownloadAuxiliary }) {
  if (!model.requiresAuxiliary) return null;
  const auxiliaryStatus = model.auxiliaryStatus || {};
  const rows = [
    { key: "llm", id: "__llm__", label: "Qwen3-4B Text Encoder" },
    { key: "vae", id: "__vae__", label: "FLUX VAE" },
  ];

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">必需组件</div>
      <div className="grid gap-2">
        {rows.map((row) => {
          const ready = auxiliaryStatus[row.key] === "downloaded";
          const rowBusyKey = `${model.id}:${row.key}`;
          return (
            <div key={row.key} className="flex flex-col gap-2 rounded-md border border-white/[0.06] bg-black/20 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {ready ? <Check size={14} className="text-emerald-300" /> : <AlertTriangle size={14} className="text-yellow-200" />}
                  <span className="truncate text-[12px] font-bold text-white/65">{row.label}</span>
                </div>
                {ready ? (
                  <span className="text-[11px] font-bold text-emerald-200">就绪</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onDownloadAuxiliary(model.id, row.key)}
                    disabled={busyKey === rowBusyKey}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#d9ff00]/20 bg-[#d9ff00]/10 px-2.5 text-[11px] font-bold text-[#d9ff00] transition hover:bg-[#d9ff00]/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download size={13} />
                    获取
                  </button>
                )}
              </div>
              <ProgressBar progress={progressById[row.id]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModelCard({
  model,
  progress,
  progressById,
  busyKey,
  onDownloadModel,
  onDownloadAuxiliary,
  onDeleteModel,
}) {
  const isWan2gp = model.provider === "wan2gp";
  const downloaded = model.state === "downloaded";
  const auxStates = Object.values(model.auxiliaryStatus || {});
  const auxReady = !model.requiresAuxiliary || (auxStates.length > 0 && auxStates.every((state) => state === "downloaded"));
  const ready = isWan2gp ? model.ready !== false : downloaded && auxReady;
  const unavailableReason = isWan2gp
    ? model.unavailableReason || "Wan2GP 服务器未就绪"
    : downloaded
      ? "辅助组件未就绪"
      : "模型尚未下载";

  return (
    <article className="rounded-lg border border-white/[0.07] bg-white/[0.035] p-4 transition-colors hover:border-white/15">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-bold text-white">{model.name || model.id}</h3>
            <StatusBadge ready={ready}>{ready ? "可用" : isWan2gp ? "离线" : "待安装"}</StatusBadge>
          </div>
          <p className="mt-2 text-[12px] leading-5 text-white/43">{model.description || unavailableReason}</p>
          {!ready && <p className="mt-1 text-[12px] leading-5 text-yellow-100/65">{unavailableReason}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag>{isWan2gp ? "Wan2GP" : "sd.cpp"}</Tag>
            <Tag>{String(model.type || "image").toUpperCase()}</Tag>
            {!isWan2gp && <Tag>{formatSize(model.sizeGB)}</Tag>}
            {(model.tags || [])
              .filter((tag) => tag !== "featured" && tag !== "remote")
              .slice(0, 4)
              .map((tag) => <Tag key={tag}>{tag}</Tag>)}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {isWan2gp ? (
            <StatusBadge ready={ready}>{ready ? "已连接" : "检查配置"}</StatusBadge>
          ) : downloaded ? (
            <button
              type="button"
              onClick={() => onDeleteModel(model)}
              disabled={busyKey === model.id}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-red-300/15 bg-red-400/10 px-3 text-[12px] font-bold text-red-200 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={14} />
              删除
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDownloadModel(model.id)}
              disabled={busyKey === model.id}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#d9ff00] px-3 text-[12px] font-bold text-black transition hover:bg-[#e5ff33] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              下载
            </button>
          )}
        </div>
      </div>

      <ProgressBar progress={progress} />
      {!isWan2gp && (
        <AuxiliaryRows
          model={model}
          progressById={progressById}
          busyKey={busyKey}
          onDownloadAuxiliary={onDownloadAuxiliary}
        />
      )}
    </article>
  );
}

export default function LocalModelManager({ localRuntime }) {
  const runtime = useMemo(() => normalizeLocalRuntime(localRuntime), [localRuntime]);
  const sdCpp = useMemo(() => runtime.sdCpp || {}, [runtime.sdCpp]);
  const wan2gp = useMemo(() => runtime.wan2gp || {}, [runtime.wan2gp]);
  const [binaryStatus, setBinaryStatus] = useState(null);
  const [wanUrl, setWanUrl] = useState("");
  const [wanStatus, setWanStatus] = useState({ kind: "idle", text: "未检测" });
  const [models, setModels] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [progressById, setProgressById] = useState({});

  const refresh = useCallback(async () => {
    const nextWarnings = [];
    const nextModels = [];
    setLoading(true);
    try {
      if (typeof sdCpp.getBinaryStatus === "function") {
        try {
          setBinaryStatus(await sdCpp.getBinaryStatus());
        } catch (error) {
          nextWarnings.push(`sd.cpp 引擎状态读取失败：${error?.message || "未知错误"}`);
          setBinaryStatus({ exists: false });
        }
      }

      if (typeof wan2gp.getConfig === "function") {
        try {
          const config = await wan2gp.getConfig();
          const url = config?.url || "";
          setWanUrl(url);
          setWanStatus(url ? { kind: "idle", text: "已保存，等待检测" } : { kind: "idle", text: "未配置" });
        } catch (error) {
          nextWarnings.push(`Wan2GP 配置读取失败：${error?.message || "未知错误"}`);
        }
      }

      if (typeof sdCpp.listModels === "function") {
        try {
          const sdModels = await sdCpp.listModels();
          nextModels.push(...(Array.isArray(sdModels) ? sdModels.map((model) => ({ ...model, provider: model.provider || "sdcpp" })) : []));
        } catch (error) {
          nextWarnings.push(`sd.cpp 模型读取失败：${error?.message || "未知错误"}`);
        }
      }

      if (typeof wan2gp.listModels === "function") {
        try {
          const wanModels = await wan2gp.listModels();
          nextModels.push(...(Array.isArray(wanModels) ? wanModels.map((model) => ({ ...model, provider: "wan2gp" })) : []));
        } catch (error) {
          nextWarnings.push(`Wan2GP 模型读取失败：${error?.message || "未知错误"}`);
        }
      }
    } finally {
      setModels(nextModels);
      setWarnings(nextWarnings);
      setLoading(false);
    }
  }, [sdCpp, wan2gp]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const subscribe = sdCpp.onDownloadProgress || runtime.bridge?.onDownloadProgress;
    if (typeof subscribe !== "function") return undefined;
    return subscribe((payload = {}) => {
      if (!payload.id) return;
      setProgressById((prev) => ({
        ...prev,
        [payload.id]: {
          phase: payload.phase || "downloading",
          progress: typeof payload.progress === "number" ? payload.progress : null,
        },
      }));
    });
  }, [runtime.bridge, sdCpp]);

  const probeWan2gp = useCallback(async () => {
    if (typeof wan2gp.probe !== "function") return;
    const url = wanUrl.trim();
    if (!url) {
      setWanStatus({ kind: "warn", text: "请先输入 Wan2GP URL" });
      return;
    }
    setBusyKey("wan2gp:probe");
    setWanStatus({ kind: "checking", text: "检测中" });
    try {
      const result = await wan2gp.probe(url);
      setWanStatus(
        result?.ok
          ? { kind: "ok", text: `可访问，Gradio ${result.version || "unknown"}，匹配 ${result.matchedModels ?? 0}/${result.totalModels ?? "?"} 个模型` }
          : { kind: "error", text: result?.error || "无法访问 Wan2GP" },
      );
    } catch (error) {
      setWanStatus({ kind: "error", text: error?.message || "Wan2GP 检测失败" });
    } finally {
      setBusyKey("");
    }
  }, [wan2gp, wanUrl]);

  const saveWan2gpUrl = useCallback(async () => {
    if (typeof wan2gp.setUrl !== "function") return;
    setBusyKey("wan2gp:save");
    try {
      await wan2gp.setUrl(wanUrl.trim());
      setWanStatus(wanUrl.trim() ? { kind: "idle", text: "已保存，正在刷新模型" } : { kind: "idle", text: "已清空" });
      await refresh();
    } catch (error) {
      setWanStatus({ kind: "error", text: error?.message || "Wan2GP URL 保存失败" });
    } finally {
      setBusyKey("");
    }
  }, [refresh, wan2gp, wanUrl]);

  const downloadBinary = useCallback(async () => {
    if (typeof sdCpp.downloadBinary !== "function") return;
    setBusyKey("__binary__");
    try {
      await sdCpp.downloadBinary();
      await refresh();
    } finally {
      setBusyKey("");
    }
  }, [refresh, sdCpp]);

  const downloadModel = useCallback(async (modelId) => {
    if (typeof sdCpp.downloadModel !== "function") return;
    setBusyKey(modelId);
    try {
      await sdCpp.downloadModel(modelId);
      await refresh();
    } finally {
      setBusyKey("");
    }
  }, [refresh, sdCpp]);

  const downloadAuxiliary = useCallback(async (modelId, auxKey) => {
    if (typeof sdCpp.downloadAuxiliary !== "function") return;
    setBusyKey(`${modelId}:${auxKey}`);
    try {
      await sdCpp.downloadAuxiliary(auxKey);
      await refresh();
    } finally {
      setBusyKey("");
    }
  }, [refresh, sdCpp]);

  const deleteModel = useCallback(async (model) => {
    if (typeof sdCpp.deleteModel !== "function") return;
    if (!window.confirm(`确定删除“${model.name || model.id}”吗？之后需要重新下载才能使用。`)) return;
    setBusyKey(model.id);
    try {
      await sdCpp.deleteModel(model.id);
      await refresh();
    } finally {
      setBusyKey("");
    }
  }, [refresh, sdCpp]);

  const sdModels = models.filter((model) => model.provider !== "wan2gp");
  const wanModels = models.filter((model) => model.provider === "wan2gp");
  const binaryReady = Boolean(binaryStatus?.exists);
  const wanStatusClass =
    wanStatus.kind === "ok"
      ? "text-emerald-200"
      : wanStatus.kind === "error"
        ? "text-red-200"
        : wanStatus.kind === "warn"
          ? "text-yellow-100"
          : "text-white/45";

  if (!runtime.available) {
    return (
      <div className="h-full overflow-auto bg-[#030303] text-white">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
          <SectionTitle eyebrow="Local Runtime" title="本地模型" />
          <EmptyState
            title="本地模型仅在桌面端可用"
            body="当前 renderer 没有检测到 Electron localAI 桥接。Web 端会继续使用共享 API Provider，本地下载、Wan2GP 配置和本地推理需要桌面应用。"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#030303] text-white">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Local Runtime"
          title="本地模型"
          action={(
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/75 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              刷新
            </button>
          )}
        />

        {warnings.length > 0 && (
          <div className="rounded-lg border border-yellow-300/15 bg-yellow-400/10 p-4 text-[12px] leading-6 text-yellow-100/80">
            {warnings.map((warning) => <div key={warning}>{warning}</div>)}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-white/[0.07] bg-white/[0.035] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <PlugZap size={17} className="text-[#d9ff00]" />
                  sd.cpp 推理引擎
                </div>
                <p className="mt-2 text-[12px] leading-5 text-white/45">
                  桌面端内置 sd.cpp，用于本地图片模型下载与推理。
                </p>
              </div>
              <StatusBadge ready={binaryReady}>{binaryReady ? "已安装" : "未安装"}</StatusBadge>
            </div>
            <ProgressBar progress={progressById.__binary__} />
            {!binaryReady && typeof sdCpp.downloadBinary === "function" && (
              <button
                type="button"
                onClick={downloadBinary}
                disabled={busyKey === "__binary__"}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-[#d9ff00] px-4 text-[12px] font-bold text-black transition hover:bg-[#e5ff33] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={15} />
                安装引擎
              </button>
            )}
          </div>

          <div className="rounded-lg border border-white/[0.07] bg-white/[0.035] p-5">
            <div className="flex items-start gap-3">
              <Server size={18} className="mt-0.5 text-[#d9ff00]" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">Wan2GP 服务器</div>
                <p className="mt-2 text-[12px] leading-5 text-white/45">
                  连接你自己运行的 Wan2GP Gradio 服务，用于本地视频和部分图片模型。
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={wanUrl}
                onChange={(event) => setWanUrl(event.target.value)}
                placeholder="http://127.0.0.1:7860"
                className="h-10 flex-1 rounded-md border border-white/[0.08] bg-black/25 px-3 text-[13px] text-white outline-none transition placeholder:text-white/20 focus:border-[#d9ff00]/45"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={probeWan2gp}
                disabled={busyKey === "wan2gp:probe"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-[12px] font-bold text-white/75 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                测试
              </button>
              <button
                type="button"
                onClick={saveWan2gpUrl}
                disabled={busyKey === "wan2gp:save"}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#d9ff00] px-3 text-[12px] font-bold text-black transition hover:bg-[#e5ff33] disabled:cursor-not-allowed disabled:opacity-50"
              >
                保存
              </button>
            </div>
            <div className={`mt-3 text-[12px] ${wanStatusClass}`}>{wanStatus.text}</div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/35">sd.cpp 模型</h3>
              <span className="text-[12px] text-white/30">{sdModels.length} 个</span>
            </div>
            <div className="grid gap-3">
              {sdModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  progress={progressById[model.id]}
                  progressById={progressById}
                  busyKey={busyKey}
                  onDownloadModel={downloadModel}
                  onDownloadAuxiliary={downloadAuxiliary}
                  onDeleteModel={deleteModel}
                />
              ))}
              {!sdModels.length && (
                <EmptyState title="没有 sd.cpp 模型" body="模型目录暂时为空，刷新后仍为空时请检查桌面本地模型目录配置。" />
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/35">Wan2GP 模型</h3>
              <span className="text-[12px] text-white/30">{wanModels.length} 个</span>
            </div>
            <div className="grid gap-3">
              {wanModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  progress={progressById[model.id]}
                  progressById={progressById}
                  busyKey={busyKey}
                  onDownloadModel={downloadModel}
                  onDownloadAuxiliary={downloadAuxiliary}
                  onDeleteModel={deleteModel}
                />
              ))}
              {!wanModels.length && (
                <EmptyState title="没有 Wan2GP 模型" body="填写并保存 Wan2GP URL 后刷新。服务离线时也会列出目录，但模型会标记为不可用。" />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
