"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const LIBRARY_KEY = "face_library_v1";

function loadLibrary() {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLibrary(items) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
  } catch {}
}

function FaceThumb({ face, onSelect, onDelete }) {
  return (
    <div className="relative group flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onSelect(face)}
        className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-500/60 transition-all flex items-center justify-center"
        title={face.name}
      >
        {face.thumbnail ? (
          <img src={face.thumbnail} alt={face.name} className="w-full h-full object-cover" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-300">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>
      <span className="text-[9px] text-white/50 truncate w-14 text-center">{face.name}</span>
      <button
        type="button"
        onClick={() => onDelete(face.id)}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white text-[9px] hidden group-hover:flex items-center justify-center"
        title="Удалить"
      >
        ×
      </button>
    </div>
  );
}

export default function FaceAssetDialog({ open, onClose, onSelect, onRegisterNew }) {
  const [library, setLibrary] = useState([]);
  const [arkAssets, setArkAssets] = useState([]);
  const [arkLoading, setArkLoading] = useState(false);
  const [arkOpen, setArkOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [saveToLib, setSaveToLib] = useState(false);
  const [thumbTab, setThumbTab] = useState("url"); // "url" | "upload"
  const [thumbUrl, setThumbUrl] = useState("");
  const thumbFileRef = useRef(null);

  const toUri = (id) => (String(id).startsWith("asset://") ? String(id) : `asset://${String(id).trim()}`);

  // load library from localStorage when dialog opens
  useEffect(() => {
    if (open) setLibrary(loadLibrary());
  }, [open]);

  const loadArkAssets = useCallback(async () => {
    setArkLoading(true);
    try {
      const r = await fetch("/api/face/list-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = await r.json().catch(() => ({}));
      setArkAssets(Array.isArray(j.assets) ? j.assets : []);
    } catch {
      setArkAssets([]);
    } finally {
      setArkLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && arkOpen) loadArkAssets();
  }, [open, arkOpen, loadArkAssets]);

  if (!open) return null;

  const pickFace = (assetUri, name) => {
    onSelect?.(assetUri, name);
    onClose?.();
  };

  const deleteFace = (id) => {
    const next = library.filter((f) => f.id !== id);
    saveLibrary(next);
    setLibrary(next);
  };

  const addToLibrary = (assetUri, name, thumbnail) => {
    const item = { id: Date.now().toString(), name: name || assetUri.replace(/^asset:\/\//, "").slice(0, 16), assetUri, thumbnail: thumbnail || null, addedAt: Date.now() };
    const next = [item, ...library.filter((f) => f.assetUri !== assetUri)];
    saveLibrary(next);
    setLibrary(next);
    return item;
  };

  const handleThumbFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setThumbUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const selectManual = () => {
    const id = manualId.trim();
    if (!id) return;
    const uri = toUri(id);
    const name = manualName.trim() || id.replace(/^asset:\/\//, "").slice(0, 16);
    const thumb = thumbTab === "url" ? (thumbUrl.trim() || null) : (thumbUrl || null);
    if (saveToLib) addToLibrary(uri, name, thumb);
    pickFace(uri, name);
    setManualId("");
    setManualName("");
    setThumbUrl("");
    setSaveToLib(false);
  };

  const saveArkToLib = (a) => {
    addToLibrary(toUri(a.id), a.name || a.id, null);
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[92vw] max-w-[480px] bg-[#0c0d0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-0 max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="text-sm font-bold text-white">Библиотека лиц</h3>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors" title="Закрыть">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-4 px-5 pb-5">
          {/* LOCAL LIBRARY */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white/40 font-semibold">Мои лица</span>
            {library.length === 0 ? (
              <div className="text-xs text-white/30 py-2">Библиотека пуста — добавьте лицо ниже.</div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {library.map((face) => (
                  <FaceThumb
                    key={face.id}
                    face={face}
                    onSelect={(f) => pickFace(f.assetUri, f.name)}
                    onDelete={deleteFace}
                  />
                ))}
              </div>
            )}
          </div>

          {/* MANUAL ADD SECTION */}
          <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
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
              placeholder="Имя (необязательно)"
              className="h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
            />

            {/* thumbnail */}
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <button type="button" onClick={() => setThumbTab("url")} className={`text-[10px] px-2 py-1 rounded ${thumbTab === "url" ? "bg-purple-600/40 text-purple-200" : "text-white/40 hover:text-white"}`}>URL фото</button>
                <button type="button" onClick={() => setThumbTab("upload")} className={`text-[10px] px-2 py-1 rounded ${thumbTab === "upload" ? "bg-purple-600/40 text-purple-200" : "text-white/40 hover:text-white"}`}>Загрузить фото</button>
              </div>
              {thumbTab === "url" ? (
                <input
                  value={thumbUrl}
                  onChange={(e) => setThumbUrl(e.target.value)}
                  placeholder="https://… (необязательно)"
                  className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-purple-500/50"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input ref={thumbFileRef} type="file" accept="image/*" className="hidden" onChange={handleThumbFile} />
                  <button type="button" onClick={() => thumbFileRef.current?.click()} className="h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white transition-colors">
                    {thumbUrl ? "Фото выбрано ✓" : "Выбрать файл…"}
                  </button>
                  {thumbUrl && (
                    <img src={thumbUrl} alt="preview" className="w-9 h-9 rounded-lg object-cover border border-white/10" />
                  )}
                </div>
              )}
            </div>

            {/* save to library toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setSaveToLib(!saveToLib)}
                className={`w-8 h-4 rounded-full transition-colors ${saveToLib ? "bg-purple-600" : "bg-white/10"} relative`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${saveToLib ? "left-[18px]" : "left-0.5"}`} />
              </div>
              <span className="text-xs text-white/60">Сохранить в библиотеку</span>
            </label>

            <button
              type="button"
              onClick={selectManual}
              disabled={!manualId.trim()}
              className="h-10 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-100 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveToLib ? "Сохранить и выбрать" : "Выбрать"}
            </button>
          </div>

          {/* ARK ASSETS (collapsible) */}
          <div className="border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => { setArkOpen((v) => !v); if (!arkOpen) loadArkAssets(); }}
              className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/40 font-semibold hover:text-white/70 transition-colors w-full"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${arkOpen ? "rotate-90" : ""}`}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Ассеты ARK
            </button>
            {arkOpen && (
              <div className="mt-2 flex flex-col gap-1.5 max-h-[25vh] overflow-y-auto">
                {arkLoading ? (
                  <div className="text-xs text-white/40 py-3 text-center">Загрузка…</div>
                ) : arkAssets.length === 0 ? (
                  <div className="text-xs text-white/40 py-3 text-center">Список пуст.</div>
                ) : (
                  arkAssets.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white/5 border border-transparent hover:border-purple-500/40"
                    >
                      <button
                        type="button"
                        onClick={() => pickFace(toUri(a.id), a.name || a.id)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300 shrink-0">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span className="text-xs text-white truncate">{a.name || a.id}</span>
                        {a.status && (
                          <span className={`text-[10px] shrink-0 ${a.status === "Active" ? "text-emerald-400" : "text-white/40"}`}>{a.status}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveArkToLib(a)}
                        className="shrink-0 text-[10px] text-purple-400 hover:text-purple-300 transition-colors px-1.5 py-0.5 rounded bg-purple-600/20 border border-purple-500/20"
                        title="Сохранить в библиотеку"
                      >
                        +Lib
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* register new */}
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
    </div>
  );
}
