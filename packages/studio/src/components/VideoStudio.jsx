"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { generateVideo, generateI2V, processV2V, uploadFile } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import DrawModal from "./DrawModal.jsx";
import {
  t2vModels,
  i2vModels,
  v2vModels,
  getAspectRatiosForVideoModel,
  getDurationsForModel,
  getResolutionsForVideoModel,
  getAspectRatiosForI2VModel,
  getDurationsForI2VModel,
  getResolutionsForI2VModel,
  getEffectsForI2VModel,
  getDefaultEffectForI2VModel,
  getModesForModel,
  getMaxImagesForI2VModel,
} from "../models.js";
import {
  PROMPT_CONTROL_LABEL_CLASS,
  PROMPT_MEDIA_PREVIEW_CLASS,
  PromptAspectRatioIcon,
  PromptAction,
  PromptChevronIcon,
  PromptComposer,
  PromptControls,
  PromptFooter,
  PromptMenuItem,
  PromptMenuList,
  PromptPopover,
  PromptPopoverHeader,
  PromptDurationIcon,
  PromptQualityIcon,
  PromptTextarea,
  promptControlClassName,
  promptMediaButtonClassName,
} from "./prompt/PromptComposer.jsx";

// â”€â”€ tiny helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getQualitiesForModel(modelList, modelId) {
  const model = modelList.find((m) => m.id === modelId);
  return model?.inputs?.quality?.enum || [];
}

async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// â”€â”€ SVG icons (kept inline to avoid extra deps) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const CheckSvg = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#22d3ee"
    strokeWidth="4"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const VideoIconSvg = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={className}
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const VideoReadySvg = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-primary"
  >
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    <polyline points="7 10 10 13 15 8" stroke="#22d3ee" strokeWidth="2.5" />
  </svg>
);

// â”€â”€ Dropdown components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PROVIDER_LOGOS = {
  openai: "https://cdn.muapi.ai/models/openai.png",
  google: "https://cdn.muapi.ai/models/gemini.png",
  kling: "https://cdn.muapi.ai/models/kling.png",
  alibaba: "https://cdn.muapi.ai/models/alibaba.png",
  bytedance: "https://cdn.muapi.ai/models/bytedance.png",
  blackforest: "https://cdn.muapi.ai/models/bfl.png",
  minimax: "https://cdn.muapi.ai/models/minimax.png",
  suno: "https://cdn.muapi.ai/models/suno.png",
  anthropic: "https://cdn.muapi.ai/models/claude.png",
  meshy: "https://cdn.muapi.ai/models/meshy-3.png",
  tripo3d: "https://cdn.muapi.ai/models/tripo3d.png",
  grok: "https://cdn.muapi.ai/models/xai.png",
  muapi: "https://cdn.muapi.ai/models/muapi.png",
  midjourney: "https://cdn.muapi.ai/models/midjourney.png",
  vidu: "https://cdn.muapi.ai/models/vidu.png",
  runway: "https://cdn.muapi.ai/models/runway.png",
  luma: "https://cdn.muapi.ai/models/luma.png",
  ideogram: "https://cdn.muapi.ai/models/ideogram.png",
  leonardoai: "https://cdn.muapi.ai/models/leonardoai.png",
  hunyuan: "https://cdn.muapi.ai/models/hunyuan.png",
  hidream: "https://cdn.muapi.ai/models/hidream.png",
  lightricks: "https://cdn.muapi.ai/models/lightricks.png",
  pixverse: "https://cdn.muapi.ai/models/pixverse.png",
  reve: "https://cdn.muapi.ai/models/reve.png",
  stability: "https://cdn.muapi.ai/models/stability.png"
};

const invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];

function ModelDropdown({ imageMode, selectedModel, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const generationModels = imageMode ? i2vModels : t2vModels;
  
  // Find current model's provider to pre-select the provider tab ("slide")
  const allCurrentModels = [...generationModels, ...v2vModels];
  const currentModelObj = allCurrentModels.find((m) => m.id === selectedModel);
  const initialProvider = currentModelObj?.provider || "all";
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);

  const activeItemRef = useRef(null);

  useEffect(() => {
    // Automatically scroll the active model into view when opening
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, []);

  const getProviderStyle = (provider) => {
    switch (provider) {
      case "grok":
        return { text: "xI", bg: "bg-orange-500/10 text-orange-400 border-orange-500/25" };
      case "openai":
        return { text: "O", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" };
      case "google":
        return { text: "G", bg: "bg-blue-500/10 text-blue-400 border-blue-500/25" };
      case "blackforest":
        return { text: "BF", bg: "bg-amber-500/10 text-amber-400 border-amber-500/25" };
      case "bytedance":
        return { text: "BD", bg: "bg-purple-500/10 text-purple-400 border-purple-500/25" };
      case "midjourney":
        return { text: "MJ", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" };
      case "kling":
        return { text: "KL", bg: "bg-rose-500/10 text-rose-400 border-rose-500/25" };
      case "vidu":
        return { text: "VD", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/25" };
      case "minimax":
        return { text: "MX", bg: "bg-pink-500/10 text-pink-400 border-pink-500/25" };
      case "ideogram":
        return { text: "ID", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/25" };
      case "luma":
        return { text: "LM", bg: "bg-teal-500/10 text-teal-400 border-teal-500/25" };
      case "alibaba":
        return { text: "AL", bg: "bg-sky-500/10 text-sky-400 border-sky-500/25" };
      case "leonardoai":
        return { text: "LE", bg: "bg-violet-500/10 text-violet-400 border-violet-500/25" };
      case "stability":
        return { text: "SD", bg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/25" };
      default:
        const name = provider ? provider.toUpperCase() : "AI";
        return { text: name.substring(0, 2), bg: "bg-primary/10 text-primary border-primary/25" };
    }
  };

  // Dynamically compute list of providers from the input models lists
  const availableProviders = [];
  const seenProviders = new Set();
  
  allCurrentModels.forEach(m => {
    const pId = m.provider || 'muapi';
    const pName = m.provider_name || 'Muapi';
    if (!seenProviders.has(pId)) {
      seenProviders.add(pId);
      availableProviders.push({ id: pId, name: pName });
    }
  });

  const lf = search.toLowerCase();

  const filterFn = (m) => {
    // 1. Filter by provider tab
    if (selectedProvider !== "all") {
      const pId = m.provider || 'muapi';
      if (pId !== selectedProvider) return false;
    }
    // 2. Filter by search query
    return (
      m.name.toLowerCase().includes(lf) ||
      m.id.toLowerCase().includes(lf)
    );
  };

  const filteredMain = generationModels.filter(filterFn);
  const filteredV2V = v2vModels.filter(filterFn);

  const getIconColor = (m, isV2V) => {
    if (isV2V) return "bg-orange-500/10 text-orange-400 border-orange-500/10";
    if (m.id.includes("kling")) return "bg-blue-500/10 text-blue-400 border-blue-500/10";
    if (m.id.includes("veo")) return "bg-purple-500/10 text-purple-400 border-purple-500/10";
    if (m.id.includes("sora")) return "bg-rose-500/10 text-rose-400 border-rose-500/10";
    return "bg-primary/10 text-primary border-primary/10";
  };

  const renderItem = (m, isV2V = false) => (
    <div
      key={m.id}
      ref={selectedModel === m.id ? activeItemRef : null}
      className={`flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-white/5 ${selectedModel === m.id ? "bg-white/5 border-white/5" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(m, isV2V);
        onClose();
      }}
    >
      <div className="flex items-center gap-3.5">
        {PROVIDER_LOGOS[m.provider] ? (
          <div className="w-8 h-8 rounded-xl border border-white/5 overflow-hidden shrink-0 flex items-center justify-center bg-white/[0.02]">
            <img
              src={PROVIDER_LOGOS[m.provider]}
              alt={m.provider_name}
              className={`w-full h-full object-contain p-1 ${invertLogos.includes(m.provider) ? "invert" : ""}`}
            />
          </div>
        ) : (
          <div
            className={`w-9 h-9 ${getIconColor(m, isV2V)} border rounded-xl flex items-center justify-center font-black text-xs shadow-inner uppercase`}
          >
            {m.name.charAt(0)}
          </div>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-bold text-white tracking-tight truncate">
            {m.name}
          </span>
          {isV2V ? (
            <span className="text-[9px] text-orange-400/70">
              {m.imageField ? "Upload a video and image" : "Upload a video to use"}
            </span>
          ) : (
            selectedProvider === "all" && m.provider_name && (
              <span className="text-[9px] text-white/40">
                {m.provider_name}
              </span>
            )
          )}
        </div>
      </div>
      {selectedModel === m.id && <CheckSvg />}
    </div>
  );

  const invertLogos = ['openai', 'blackforest', 'runway', 'ideogram', 'lightricks', 'grok'];

  return (
    <div className="flex gap-4 h-full max-h-[70vh] min-h-[350px]">
      {/* Left Sidebar: Provider tabs */}
      <div className="flex flex-col gap-2.5 items-center pr-2 border-r border-white/5 shrink-0 select-none overflow-y-auto custom-scrollbar w-14 pt-0.5">
        <button
          type="button"
          onClick={() => setSelectedProvider("all")}
          className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ${
            selectedProvider === "all"
              ? "bg-white/10 text-yellow-400 border-yellow-500/30 shadow-md scale-105"
              : "bg-white/[0.02] text-white/50 border-white/[0.03] hover:bg-white/5 hover:text-white"
          }`}
          title="All Providers"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={selectedProvider === "all" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        
        {availableProviders.map(p => {
          const style = getProviderStyle(p.id);
          const isSelected = selectedProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProvider(p.id)}
              className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center font-black text-[10px] border transition-all flex-shrink-0 cursor-pointer overflow-hidden ${
                isSelected
                  ? `${style.bg} border-white/25 scale-105 shadow-md`
                  : "bg-white/[0.02] text-white/40 border-white/[0.02] hover:bg-white/5 hover:text-white/80"
              }`}
              title={p.name}
            >
              {PROVIDER_LOGOS[p.id] ? (
                <img
                  src={PROVIDER_LOGOS[p.id]}
                  alt={p.name}
                  className={`w-full h-full rounded-full object-contain ${invertLogos.includes(p.id) ? "invert" : ""}`}
                />
              ) : (
                style.text
              )}
            </button>
          );
        })}
      </div>

      {/* Right Pane: Search + Lists */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="px-1 pb-2 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-2 border border-white/5 focus-within:border-primary/50 transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent border-none text-xs text-white focus:ring-0 w-full p-0 outline-none"
            />
          </div>
        </div>
        
        <div className="text-xs font-bold text-secondary px-2 py-1 shrink-0 flex items-center justify-between">
          <span>Video models</span>
          {selectedProvider !== "all" && (
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/60">
              {availableProviders.find(p => p.id === selectedProvider)?.name || selectedProvider}
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar pr-1 pb-2 flex-1">
          {filteredMain.length === 0 && filteredV2V.length === 0 ? (
            <div className="text-xs text-white/30 text-center py-6">
              No models found
            </div>
          ) : (
            <>
              {filteredMain.map((m) => renderItem(m, false))}
              {filteredV2V.length > 0 && (
                <>
                  <div className="text-xs font-bold text-orange-400/70 px-3 py-2 mt-1 border-t border-white/5">
                    Video Tools
                  </div>
                  {filteredV2V.map((m) => renderItem(×Ý·âÚ$z{-®éÜj×7ƒÒ#b ¢7“Ò#b ¢#Ò#B ¢7G&ö¶SÒ&7W'&VçD6öÆ÷" ¢7G&ö¶Uv–GFƒÒ#" ¢f–ÆÃÒ'G&ç7&VçB ¢7G&ö¶TF6†'&“×³ƒ‡Ð¢7G&ö¶TF6†öfg6WC×³ƒ‚Òƒƒ‚¢f–FVõ&öw&W72’òÐ¢6Æ74æÖSÒ'FW‡BÕ²3#&C6VUÒG&ç6—F–öâÖÆÂGW&F–öâÓ3 ¢óà¢Â÷7fsà¢Ç7â6Æ74æÖSÒ&'6öÇWFRFW‡BÕ³—…ÒföçBÖ&Æ6²FW‡BÕ²3#&C6VUÒÆVF–ærÖæöæR#ç·f–FVõ&öw&W77ÒSÂ÷7ãà¢ÂöF—cà¢’¢€¢Ç7fp¢v–GFƒÒ#b ¢†V–v‡CÒ#b ¢f–Wt&÷ƒÒ##B#B ¢f–ÆÃÒ&æöæR ¢7G&ö¶SÒ&7W'&VçD6öÆ÷" ¢7G&ö¶Uv–GFƒÒ#"ãR ¢6Æ74æÖSÒ'FW‡B×v†—FRóCw&÷WÖ†÷fW#§FW‡BÕ²3#&C6VUÒG&ç6—F–öâÖ6öÆ÷'2 ¢à¢ÇöÇ–vöâö–çG3Ò##2rb"#2r#2r"f–ÆÃÒ&7W'&VçD6öÆ÷""óà¢Ç&V7BƒÒ#"“Ò#R"v–GFƒÒ#R"†V–v‡CÒ#B"'ƒÒ#""'“Ò#""f–ÆÃÒ&7W'&VçD6öÆ÷""óà¢Â÷7fsà¢—Ð¢Âö'WGFöãà¢ÂöF—cà¢—Ð¢ÂöF—cà ¢²ò¢&ö×BFW‡F&V¢÷Ð¢ÆF—b6Æ74æÖSÒ&fÆW‚ÓfÆW‚fÆW‚Ö6öÂvÓ#à¢Å&ö×EFW‡F&V¢&Vc×·FW‡F&V&VgÐ¢fÇVS×·&ö×GÐ¢öä6†ævS×¶†æFÆU&ö×D–çWGÐ¢Æ6V†öÆFW#×·&ö×EÆ6V†öÆFW'Ð¢F—6&ÆVC×·&ö×DF—6&ÆVGÐ¢óà¢ÂöF—cà¢ÂöF—cà ¢²ò¢W‡FVæB&ææW"¢÷Ð¢¶—4W‡FVæDÖöFRbb€¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"‚Ó2’ÓãR×‚Ó2&r×&–Ö'’óR&÷&FW"&÷&FW"×&–Ö'’ó&÷VæFVBÖÆrFW‡BÕ³…ÒFW‡B×&–Ö'’óƒföçBÖÖVF—VÒG&6¶–ær×F–v‡B#à¢Ç7fp¢v–GFƒÒ#2 ¢†V–v‡CÒ#2 ¢f–Wt&÷ƒÒ##B#B ¢f–ÆÃÒ&æöæR ¢7G&ö¶SÒ&7W'&VçD6öÆ÷" ¢7G&ö¶Uv–GFƒÒ#"ãR ¢à¢ÇF‚CÒ$ÓR&ƒDÓ"VÃrrÓrr"óà¢Â÷7fsà¢Ç7ãäW‡FVæF–ær&Wf–÷W26VVFæ6R"ãvVæW&F–öãÂ÷7ãà¢ÂöF—cà¢—Ð ¢²ò¢&÷GFöÒ&÷s¢6öçG&öÇ2²vVæW&FR¢÷Ð¢Å&ö×Dfö÷FW#à¢Å&ö×D6öçG&öÇ2&Vc×¶G&÷F÷vå&VgÓà¢²ò¢ÖöFVÂ'Fâ¢÷Ð¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×·FövvÆTG&÷F÷vâ‚&ÖöFVÂ"—Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢÷VäG&÷F÷vâÓÓÒ&ÖöFVÂ"À¢Ò—Ð¢à¢ÆF—b6Æ74æÖSÒ'rÓB‚ÓB&÷VæFVB÷fW&fÆ÷rÖ†–FFVâ6‡&–æ²ÓfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"&r×v†—FRóR#à¢²‚‚’Óâ°¢6öç7BÆÄ7W'&VçDÖöFVÇ2Ò²ââçC'dÖöFVÇ2Âââæ“'dÖöFVÇ2Âââçc'dÖöFVÇ5Ó°¢6öç7B6VÆV7FVDÖöFVÄö&¢ÒÆÄ7W'&VçDÖöFVÇ2æf–æB†ÒÓâÒæ–BÓÓÒ6VÆV7FVDÖöFVÂ“°¢6öç7B6VÆV7FVDÖöFVÅ&÷f–FW"Ò6VÆV7FVDÖöFVÄö&£òç&÷f–FW"ÇÂv×V’s°¢&WGW&â$õd”DU%ôÄôtõ5·6VÆV7FVDÖöFVÅ&÷f–FW%Òò€¢Æ–Ör ¢7&3×µ$õd”DU%ôÄôtõ5·6VÆV7FVDÖöFVÅ&÷f–FW%×Ò ¢ÇCÒ"" ¢6Æ74æÖS×¶rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6öçF–âG¶–çfW'DÆöv÷2æ–æ6ÇVFW2‡6VÆV7FVDÖöFVÅ&÷f–FW"’ò&–çfW'B"¢"'ÖÒ ¢óà¢’¢€¢Ç7â6Æ74æÖSÒ'FW‡BÕ³—…ÒföçBÖ&öÆBFW‡BÖ&Æ6²WW&66R#åcÂ÷7ãà¢“°¢Ò’‚—Ð¢ÂöF—cà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVDÖöFVÄæÖWÐ¢Â÷7ãà¢Å&ö×D6†Wg&öä–6öâóà¢Âö'WGFöãà¢¶÷VäG&÷F÷vâÓÓÒ&ÖöFVÂ"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢6Æ74æÖSÒ'rÕ¶6Æ2ƒgrÓ'&VÒ•ÒÖC§rÕ³Cƒ…ÒÖ‚×rÖÖBÖC¦Ö‚×rÖæöæRÖ‚Ö‚Õ³sf…Ò ¢à¢Å&ö×E÷÷fW$†VFW#äÖöFVÃÂõ&ö×E÷÷fW$†VFW#à¢ÄÖöFVÄG&÷F÷và¢–ÖvTÖöFS×¶–ÖvTÖöFWÐ¢6VÆV7FVDÖöFVÃ×·6VÆV7FVDÖöFVÇÐ¢öå6VÆV7C×¶†æFÆTÖöFVÅ6VÆV7GÐ¢öä6Æ÷6S×²‚’Óâ6WD÷VäG&÷F÷vâ†çVÆÂ—Ð¢óà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà ¢²ò¢7V7B&F–ò'Fâ¢÷Ð¢·6†÷t"bb€¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×·FövvÆTG&÷F÷vâ‚&""—Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢÷VäG&÷F÷vâÓÓÒ&""À¢Ò—Ð¢à¢Å&ö×D7V7E&F–ô–6öâóà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVD'Ð¢Â÷7ãà¢Âö'WGFöãà¢¶÷VäG&÷F÷vâÓÓÒ&""bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢à¢Å&ö×E÷÷fW$†VFW#à¢7V7B&F–ð¢Âõ&ö×E÷÷fW$†VFW#à¢Å&ö×DÖVçTÆ—7Cà¢¶vWD7W'&VçD7V7E&F–÷2‡6VÆV7FVDÖöFVÂ’æÖ‚‡"’Óâ€¢Å&ö×DÖVçT—FVÐ¢¶W“×·'Ð¢6VÆV7FVC×·6VÆV7FVD"ÓÓÒ'Ð¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WE6VÆV7FVD"‡"“°¢6WD÷VäG&÷F÷vâ†çVÆÂ“°¢×Ð¢à¢·'Ð¢Âõ&ö×DÖVçT—FVÓà¢’—Ð¢Âõ&ö×DÖVçTÆ—7Cà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà¢—Ð ¢²ò¢VffV7B'Fâ¢÷Ð¢·6†÷tVffV7Bbb€¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×·FövvÆTG&÷F÷vâ‚&VffV7B"—Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢÷VäG&÷F÷vâÓÓÒ&VffV7B"À¢Ò—Ð¢à¢Ç7fp¢v–GFƒÒ#b ¢†V–v‡CÒ#b ¢f–Wt&÷ƒÒ##B#B ¢f–ÆÃÒ&æöæR ¢7G&ö¶SÒ&7W'&VçD6öÆ÷" ¢7G&ö¶Uv–GFƒÒ#" ¢6Æ74æÖSÒ&÷6—G’ÓCFW‡B×v†—FR ¢à¢ÇF‚CÒ$ÓR6ÃB’ÓB•c7¢"óà¢Â÷7fsà¢Ç7â6Æ74æÖS×¶Gµ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57ÒÖ‚×rÕ³C…ÒG'Væ6FVÓà¢·6VÆV7FVDVffV7BÇÂ$VffV7B'Ð¢Â÷7ãà¢Âö'WGFöãà¢¶÷VäG&÷F÷vâÓÓÒ&VffV7B"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢6Æ74æÖSÒ&Ö–â×rÕ³#…Ò ¢à¢Å&ö×E÷÷fW$†VFW#à¢VffV7BG—P¢Âõ&ö×E÷÷fW$†VFW#à¢Å&ö×DÖVçTÆ—7Cà¢¶vWDVffV7G4f÷$“%dÖöFVÂ‡6VÆV7FVDÖöFVÂ’æÖ‚†Vfb’Óâ€¢Å&ö×DÖVçT—FVÐ¢¶W“×¶VfgÐ¢6VÆV7FVC×·6VÆV7FVDVffV7BÓÓÒVfgÐ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WE6VÆV7FVDVffV7B†Vfb“°¢6WD÷VäG&÷F÷vâ†çVÆÂ“°¢×Ð¢à¢¶VfgÐ¢Âõ&ö×DÖVçT—FVÓà¢’—Ð¢Âõ&ö×DÖVçTÆ—7Cà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà¢—Ð ¢²ò¢GW&F–öâ'Fâ¢÷Ð¢·6†÷tGW&F–öâbb€¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×·FövvÆTG&÷F÷vâ‚&GW&F–öâ"—Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢÷VäG&÷F÷vâÓÓÒ&GW&F–öâ"À¢Ò—Ð¢à¢Å&ö×DGW&F–öä–6öâóà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVDGW&F–öç×0¢Â÷7ãà¢Âö'WGFöãà¢¶÷VäG&÷F÷vâÓÓÒ&GW&F–öâ"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢à¢Å&ö×E÷÷fW$†VFW#à¢GW&F–öà¢Âõ&ö×E÷÷fW$†VFW#à¢Å&ö×DÖVçTÆ—7Cà¢¶vWD7W'&VçDGW&F–öç2‡6VÆV7FVDÖöFVÂ’æÖ‚†B’Óâ€¢Å&ö×DÖVçT—FVÐ¢¶W“×¶GÐ¢6VÆV7FVC×·6VÆV7FVDGW&F–öâÓÓÒGÐ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WE6VÆV7FVDGW&F–öâ†B“°¢6WD÷VäG&÷F÷vâ†çVÆÂ“°¢×Ð¢à¢¶G×0¢Âõ&ö×DÖVçT—FVÓà¢’—Ð¢Âõ&ö×DÖVçTÆ—7Cà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà¢—Ð ¢²ò¢&W6öÇWF–öâ'Fâ¢÷Ð¢·6†÷u&W6öÇWF–öâbb€¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×·FövvÆTG&÷F÷vâ‚'&W6öÇWF–öâ"—Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢÷VäG&÷F÷vâÓÓÒ'&W6öÇWF–öâ"À¢Ò—Ð¢à¢Å&ö×EVÆ—G”–6öâóà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVE&W6öÇWF–öâÇÂ#s#'Ð¢Â÷7ãà¢Âö'WGFöãà¢¶÷VäG&÷F÷vâÓÓÒ'&W6öÇWF–öâ"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢à¢Å&ö×E÷÷fW$†VFW#à¢&W6öÇWF–öà¢Âõ&ö×E÷÷fW$†VFW#à¢Å&ö×DÖVçTÆ—7Cà¢¶vWD7W'&VçE&W6öÇWF–öç2‡6VÆV7FVDÖöFVÂ’æÖ‚‡"’Óâ€¢Å&ö×DÖVçT—FVÐ¢¶W“×·'Ð¢6VÆV7FVC×·6VÆV7FVE&W6öÇWF–öâÓÓÒ'Ð¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WE6VÆV7FVE&W6öÇWF–öâ‡"“°¢6WD÷VäG&÷F÷vâ†çVÆÂ“°¢×Ð¢à¢·'Ð¢Âõ&ö×DÖVçT—FVÓà¢’—Ð¢Âõ&ö×DÖVçTÆ—7Cà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà¢—Ð ¢¶6åWÆöD–ÖvU&VfW&Væ6Rbb€¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‚—Ð¢öä6Æ–6³×²‚’Óâ6WD—4G&tÖöFÄ÷Vâ‡G'VR—Ð¢à¢Ç7fp¢v–GFƒÒ#b ¢†V–v‡CÒ#b ¢f–Wt&÷ƒÒ##B#B ¢f–ÆÃÒ&æöæR ¢7G&ö¶SÒ&7W'&VçD6öÆ÷" ¢7G&ö¶Uv–GFƒÒ#"ãR ¢6Æ74æÖSÒ&÷6—G’ÓCFW‡B×v†—FRw&÷WÖ†÷fW#§FW‡BÕ²3#&C6VUÒG&ç6—F–öâÖ6öÆ÷'2 ¢à¢ÇF‚CÒ$Ó"#ƒ’"óà¢ÇF‚CÒ$ÓbãR2ãV"ã#"ã#24Ãr–ÂÓBÓDÃbãR2ãW¢"óà¢Â÷7fsà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57ÓäG&sÂ÷7ãà¢Âö'WGFöãà¢—Ð¢Âõ&ö×D6öçG&öÇ3à ¢²ò¢vVæW&FR'WGFöâ¢÷Ð¢Å&ö×D7F–öà¢öä6Æ–6³×¶†æFÆTvVæW&FWÐ¢F—6&ÆVC×¶vVæW&F–æwÐ¢à¢¶vVæW&F–ærò€¢Ãà¢Ç7â6Æ74æÖSÒ&æ–ÖFR×7–â–æÆ–æRÖ&Æö6²FW‡BÖ&Æ6²#à¢)xÀ¢Â÷7ãç²"'Ð¢vVæW&F–ærââà¢Âóà¢’¢€¢Ãà¢Ç7ãävVæW&FSÂ÷7ãà¢Âóà¢—Ð¢Âõ&ö×D7F–öãà¢Âõ&ö×Dfö÷FW#à¢Âõ&ö×D6ö×÷6W#à ¢²ò¢)H)HeTÄÅ45$TTâd”DTòÔôDÂ)H)H¢÷Ð¢¶gVÆÇ67&VVåW&Âbb€¢ÆF—b ¢6Æ74æÖSÒ&f—†VB–ç6WBÓ¢Õ³ÒfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"&rÖ&Æ6²ó“R&6¶G&÷Ö&ÇW"×6Òæ–ÖFRÖfFRÖ–â ¢öä6Æ–6³×²‚’Óâ6WDgVÆÇ67&VVåW&Â†çVÆÂ—Ð¢à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢6Æ74æÖSÒ&'6öÇWFRF÷Ób&–v‡BÓbÓ2&r×v†—FRó†÷fW#¦&r×v†—FRó#&÷VæFVBÖgVÆÂFW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2&÷&FW"&÷&FW"×v†—FRó ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WDgVÆÇ67&VVåW&Â†çVÆÂ“°¢×Ð¢à¢Ç7frv–GFƒÒ##B"†V–v‡CÒ##B"f–Wt&÷ƒÒ##B#B"f–ÆÃÒ&æöæR"7G&ö¶SÒ&7W'&VçD6öÆ÷""7G&ö¶Uv–GFƒÒ#"ãR"7G&ö¶TÆ–æV6Ò'&÷VæB"7G&ö¶TÆ–æV¦ö–ãÒ'&÷VæB#à¢ÆÆ–æRƒÒ#‚"“Ò#b"ƒ#Ò#b"“#Ò#‚"óà¢ÆÆ–æRƒÒ#b"“Ò#b"ƒ#Ò#‚"“#Ò#‚"óà¢Â÷7fsà¢Âö'WGFöãà¢Çf–FVò ¢7&3×¶gVÆÇ67&VVåW&ÇÒ ¢6öçG&öÇ2 ¢WFõÆ’ ¢Æö÷ ¢6Æ74æÖSÒ&Ö‚×rÕ³“WguÒÖ‚Ö‚Õ³“Wf…Ò&÷VæFVBÓ'†Â6†F÷rÓ'†Âö&¦V7BÖ6öçF–âæ–ÖFR×66ÆR×W" ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢óà¢ÂöF—cà¢—Ð ¢ÄG&tÖöFÀ¢—4÷Vã×¶—4G&tÖöFÄ÷VçÐ¢öä6Æ÷6S×²‚’Óâ6WD—4G&tÖöFÄ÷Vâ†fÇ6R—Ð¢”¶W“×¶”¶W—Ð¢&F6…6—¦S×³Ð¢öäFD†—7F÷'”—FVÓ×¶†æFÆTG&u&VfW&Væ6WÐ¢óà¢ÅFö7FW"÷6—F–öãÒ'F÷×&–v‡B"6öçF–æW%7G–ÆS×·²¤–æFWƒ¢““““’×ÒFö7D÷F–öç3×·²GW&F–öã¢SÂ7G–ÆS¢²&6¶w&÷VæC¢r3ƒƒ"rÂ6öÆ÷#¢r6fffffbrÂ&÷&FW#¢s‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃãR’rÂföçE6—¦S¢s7‚rÂ&÷&FW%&F—W3¢s'‚rÂ&÷…6†F÷s¢s‚3‚&v&ƒÃÃÃãb’rÂÖ…v–GFƒ¢sCC‚rÂv÷&D'&V³¢v'&V²×v÷&BrÂv†—FU76S¢w&R×w&rÂFF–æs¢s'‚g‚rÒ×Òóà¢ÂöF—cà¢“°§Ð