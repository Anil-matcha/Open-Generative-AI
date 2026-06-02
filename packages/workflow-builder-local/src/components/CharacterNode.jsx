import React, { useState, useEffect, useRef } from "react";
import { Handle, Position, useReactFlow } from "reactflow";
import { toast } from "react-hot-toast";
import axios from "axios";
import { FiUpload, FiLink } from "react-icons/fi";
import { IoPersonCircleOutline, IoTrashOutline } from "react-icons/io5";
import { stableStringify } from "./utility";

// Shared with Video Studio's FaceAssetDialog — the same saved-faces library.
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

// "Персонаж" — an input node that carries a face/character reference (a public
// image URL or an asset://… URI). Its output feeds the Seedance video node's
// face_asset, so the generated video keeps the same face.
const CharacterNode = ({ id, data, selected }) => {
  const { setNodes, setEdges } = useReactFlow();
  const fv = data.formValues || {};

  const [name, setName] = useState(fv.character_name || "");
  const [tab, setTab] = useState("photo"); // "photo" | "uri"
  const [assetUri, setAssetUri] = useState(fv.face_asset || "");
  const [photoUrl, setPhotoUrl] = useState(fv.character_photo || "");
  const [library, setLibrary] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevSig = useRef("");

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  // The reference that actually goes downstream: an asset:// URI takes priority,
  // otherwise the uploaded photo's public URL.
  const faceValue = (assetUri.trim() || photoUrl || "").trim();
  const isAsset = faceValue.startsWith("asset://");

  // Propagate the value to the parent (echo-suppressed to avoid the React #185
  // render loop that has bitten this builder before).
  useEffect(() => {
    // Output the face reference. Typed as image_url so it rides the existing
    // image-passthrough plumbing on the backend; the value is the asset://… URI
    // or the uploaded photo's public URL.
    const outputs = [{ type: "image_url", value: faceValue || null }];
    const payload = {
      formValues: { character_name: name, face_asset: faceValue, character_photo: photoUrl, image_url: faceValue || null },
      outputs,
      resultUrl: faceValue || null,
    };
    const sig = stableStringify(payload);
    if (sig === prevSig.current) return;
    prevSig.current = sig;
    data?.onDataChange?.(id, payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceValue, name, photoUrl, id]);

  const handleDeleteNode = () => {
    if (window.confirm("Удалить ноду «Персонаж»?")) {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Загрузите изображение");
      return;
    }
    setUploading(true);
    setProgress(0);
    axios
      .get("/api/upload-file", { params: { filename: file.name, type: file.type } })
      .then(({ data: { putUrl, publicUrl } }) =>
        axios
          .put(putUrl, file, {
            headers: { "Content-Type": file.type },
            onUploadProgress: (ev) => setProgress(Math.round((ev.loaded * 100) / ev.total)),
          })
          .then(() => {
            setPhotoUrl(publicUrl);
            setAssetUri("");
            setTab("photo");
          })
      )
      .catch((err) => {
        console.error("Upload failed", err);
        toast.error("Не удалось загрузить фото");
      })
      .finally(() => {
        setUploading(false);
        setProgress(0);
      });
  };

  const pickFromLibrary = (face) => {
    if (String(face.assetUri || "").startsWith("asset://")) {
      setAssetUri(face.assetUri);
      setPhotoUrl(face.thumbnail || "");
      setTab("uri");
    } else {
      setPhotoUrl(face.assetUri || face.thumbnail || "");
      setAssetUri("");
      setTab("photo");
    }
    if (face.name && !name) setName(face.name);
  };

  const saveToLibrary = () => {
    if (!faceValue) {
      toast.error("Сначала выберите фото или Asset URI");
      return;
    }
    const item = {
      id: Date.now().toString(),
      name: name || faceValue.replace(/^asset:\/\//, "").slice(0, 16),
      assetUri: faceValue,
      thumbnail: photoUrl || null,
      addedAt: Date.now(),
    };
    const next = [item, ...library.filter((f) => f.assetUri !== faceValue)];
    saveLibrary(next);
    setLibrary(next);
    toast.success("Сохранено в библиотеку");
  };

  const deleteFromLibrary = (libId) => {
    const next = library.filter((f) => f.id !== libId);
    saveLibrary(next);
    setLibrary(next);
  };

  return (
    <div
      style={{ minHeight: 220, "--loader-color": "#a855f7" }}
      className={`nowheel group flex flex-col flex-1 w-80 rounded-2xl border-2 relative transition-all duration-300 ease-in-out
        ${selected
          ? "border-purple-600 shadow-[0_0_25px_rgba(168,85,247,0.3)] scale-[1.02] ring-1 ring-purple-500/20"
          : "border-zinc-800 hover:border-zinc-700 shadow-lg"}
        bg-[#0c0d0f]/95 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 absolute -top-5 left-0">
        <h3 className="text-zinc-400 text-[10px] font-medium tracking-wider uppercase">
          Персонаж {id.replace(/^\D+/g, "")}
        </h3>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#1a1320] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 p-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${selected ? "bg-purple-600 text-white" : "bg-zinc-800 text-purple-300"} transition-colors`}>
            <IoPersonCircleOutline size={16} />
          </div>
          <h3 className="text-xs font-bold text-zinc-100">Персонаж</h3>
        </div>
        <button
          type="button"
          onClick={handleDeleteNode}
          className="text-zinc-500 hover:text-red-400 transition-colors"
          title="Удалить"
        >
          <IoTrashOutline size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-2.5 p-3">
        {/* Name */}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя персонажа…"
          className="h-9 px-3 rounded-lg bg-white/5 border border-zinc-800 text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500/50"
        />

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTab("photo")}
            className={`h-8 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
              tab === "photo" ? "bg-purple-600/30 border-purple-500/50 text-purple-100" : "bg-white/5 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <FiUpload size={12} /> Фото
          </button>
          <button
            type="button"
            onClick={() => setTab("uri")}
            className={`h-8 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
              tab === "uri" ? "bg-purple-600/30 border-purple-500/50 text-purple-100" : "bg-white/5 border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <FiLink size={12} /> Asset URI
          </button>
        </div>

        {/* Tab content */}
        {tab === "photo" ? (
          uploading ? (
            <div className="flex flex-col gap-1.5 py-2">
              <span className="text-[11px] text-zinc-400">Загрузка… {progress}%</span>
              <div className="w-full bg-zinc-800 rounded h-1 overflow-hidden">
                <div className="bg-purple-500 h-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : photoUrl && !isAsset ? (
            <div className="relative group/photo rounded-lg overflow-hidden border border-zinc-800">
              <img src={photoUrl} alt="face" className="w-full h-32 object-cover" />
              <button
                type="button"
                onClick={() => setPhotoUrl("")}
                className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white rounded px-1.5 opacity-0 group-hover/photo:opacity-100 transition-opacity"
              >
                &#10005;
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-zinc-500 border border-dashed border-zinc-700 rounded-lg p-4 hover:bg-zinc-800/40">
              <FiUpload size={18} />
              <span className="text-[11px]">Загрузить фото лица</span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )
        ) : (
          <input
            value={assetUri}
            onChange={(e) => { setAssetUri(e.target.value); setPhotoUrl(""); }}
            placeholder="asset://asset-…"
            className="h-9 px-3 rounded-lg bg-white/5 border border-zinc-800 text-xs text-white placeholder-zinc-600 outline-none focus:border-purple-500/50 font-mono"
          />
        )}

        {/* Current value / status */}
        {faceValue && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-mono text-zinc-500 truncate bg-black/30 rounded px-2 py-1 border border-zinc-800">
              {faceValue}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              ✓ {isAsset ? "Trusted asset подключён. Доступен в Seedance 2.0." : "Фото подключено как референс лица."}
            </span>
          </div>
        )}

        {/* Save to library */}
        <button
          type="button"
          onClick={saveToLibrary}
          disabled={!faceValue}
          className="h-9 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-200 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Сохранить в библиотеку
        </button>

        {/* Library */}
        {library.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-zinc-800 pt-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Библиотека ({library.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {library.map((face) => (
                <div key={face.id} className="relative group/lib flex flex-col items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => pickFromLibrary(face)}
                    title={face.name}
                    className={`w-12 h-12 rounded-lg overflow-hidden border transition-all flex items-center justify-center bg-white/5 ${
                      faceValue && faceValue === face.assetUri ? "border-purple-500" : "border-zinc-800 hover:border-purple-500/50"
                    }`}
                  >
                    {face.thumbnail ? (
                      <img src={face.thumbnail} alt={face.name} className="w-full h-full object-cover" />
                    ) : (
                      <IoPersonCircleOutline size={22} className="text-purple-300" />
                    )}
                  </button>
                  <span className="text-[8px] text-zinc-500 truncate w-12 text-center">{face.name}</span>
                  <button
                    type="button"
                    onClick={() => deleteFromLibrary(face.id)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 text-white text-[8px] hidden group-hover/lib:flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Output handle (purple = character/face reference) */}
      <Handle
        type="source"
        position={Position.Right}
        id="characterOutput"
        style={{ top: 100, width: 12, height: 12, transition: "all 0.2s ease-in-out" }}
        className={`!rounded-full !border-[3px] !right-[-8px] transition-all
          ${data.connectedOutputs?.characterOutput
            ? "!bg-purple-600 !border-zinc-900 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
            : "!bg-zinc-900 !border-purple-600/50 hover:!border-purple-600 shadow-sm"}`}
        data-type="purple"
      />
      <p
        className={`absolute -right-12 top-[100px] text-xs text-purple-400 transition-opacity duration-200 ${
          data.activeHandleColor === "purple" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        Лицо
      </p>
    </div>
  );
};

export default CharacterNode;
