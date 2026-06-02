"use client";

import { useState, useEffect, useCallback } from "react";

// Pick an existing ARK face/character asset (or paste one by id), instead of
// always registering a new face. Calls onSelect(assetUri, name).
export default function FaceAssetDialog({ open, onClose, onSelect, onRegisterNew }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");

  const toUri = (id) => (String(id).startsWith("asset://") ? String(id) : `asset://${String(id).trim()}`);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/face/list-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      setAssets(Array.isArray(j.assets) ? j.assets : []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadAssets();
  }, [open, loadAssets]);

  if (!open) return null;

  const selectManual = () => {
    const id = manualId.trim();
    if (!id) return;
    onSelect?.(toUri(id), manualName.trim() || id.replace(/^asset:\/\//, "").slice(0, 12));
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[92vw] max-w-md bg-[#0c0d0f] border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col gap-4 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Выбрать лицо</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            title="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Existing assets */}
        <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: "30vh" }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Мои ассеты</span>
            <button
              type="button"
              onClick={loadAssets}
              className="text-[11px] text-[#22d3ee] hover:underline"
            >
              Обновить
            </button>
          </div>
          {loading ? (
            <div className="text-xs text-white/40 py-3 text-center">Загрузка…</div>
          ) : assets.length === 0 ? (
            <div className="text-xs text-white/40 py-3 text-center">
              Список пуст или недоступен — добавьте ассет по ID ниже.
            </div>
          ) : (
            assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => { onSelect?.(toUri(a.id), a.name || a.id); onClose?.(); }}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-purple-500/40 text-left transition-all"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300 shrink-0">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-xs text-white truncate">{a.name || a.id}</span>
                </span>
                {a.status && (
                  <span className={`text-[10px] shrink-0 ${a.status === "Active" ? "text-emerald-400" : "text-white/40"}`}>
                    {a.status}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Manual add by id */}
        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Добавить по ID</span>
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="asset://… или ID ассета"
            className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
          />
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Название (необязательно)"
            className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
          />
          <button
            type="button"
            onClick={selectManual}
            disabled={!manualId.trim()}
            className="h-10 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-100 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Добавить и выбрать
          </button>
        </div>

        {/* Register a brand-new face */}
        {onRegisterNew && (
          <button
            type="button"
            onClick={() => { onClose?.(); onRegisterNew(); }}
            className="h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium transition-all"
          >
            + Зарегистрировать новое лицо
          </button>
        )}
      </div>
    </div>
  );
}
