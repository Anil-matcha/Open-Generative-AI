"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateImage, uploadFile } from "../muapi.js";

// ─── Constants (inlined from promptUtils) ───────────────────────────────────

const CAMERA_MAP = {
  "Modular 8K Digital": "modular 8K digital cinema camera",
  "Full-Frame Cine Digital": "full-frame digital cinema camera",
  "Grand Format 70mm Film": "grand format 70mm film camera",
  "Studio Digital S35": "Super 35 studio digital camera",
  "Classic 16mm Film": "classic 16mm film camera",
  "Premium Large Format Digital": "premium large-format digital cinema camera",
};

const LENS_MAP = {
  "Creative Tilt Lens": "creative tilt lens effect",
  "Compact Anamorphic": "compact anamorphic lens",
  "Extreme Macro": "extreme macro lens",
  "70s Cinema Prime": "1970s cinema prime lens",
  "Classic Anamorphic": "classic anamorphic lens",
  "Premium Modern Prime": "premium modern prime lens",
  "Warm Cinema Prime": "warm-toned cinema prime lens",
  "Swirl Bokeh Portrait": "swirl bokeh portrait lens",
  "Vintage Prime": "vintage prime lens",
  "Halation Diffusion": "halation diffusion filter",
  "Clinical Sharp Prime": "ultra-sharp clinical prime lens",
};

const FOCAL_PERSPECTIVE = {
  8: "ultra-wide perspective",
  14: "wide-angle perspective",
  24: "wide-angle dynamic perspective",
  35: "natural cinematic perspective",
  50: "standard portrait perspective",
  85: "classic portrait perspective",
};

const APERTURE_EFFECT = {
  "f/1.4": "shallow depth of field, creamy bokeh",
  "f/4": "balanced depth of field",
  "f/11": "deep focus clarity, sharp foreground to background",
};

const ASSET_URLS = {
  "Modular 8K Digital": "/assets/cinema/modular_8k_digital.webp",
  "Full-Frame Cine Digital": "/assets/cinema/full_frame_cine_digital.webp",
  "Grand Format 70mm Film": "/assets/cinema/grand_format_70mm_film.webp",
  "Studio Digital S35": "/assets/cinema/studio_digital_s35.webp",
  "Classic 16mm Film": "/assets/cinema/classic_16mm_film.webp",
  "Premium Large Format Digital":
    "/assets/cinema/premium_large_format_digital.webp",
  "Creative Tilt Lens": "/assets/cinema/creative_tilt_lens.webp",
  "Compact Anamorphic": "/assets/cinema/compact_anamorphic.webp",
  "Extreme Macro": "/assets/cinema/extreme_macro.webp",
  "70s Cinema Prime": "/assets/cinema/70s_cinema_prime.webp",
  "Classic Anamorphic": "/assets/cinema/classic_anamorphic.webp",
  "Premium Modern Prime": "/assets/cinema/premium_modern_prime.webp",
  "Warm Cinema Prime": "/assets/cinema/warm_cinema_prime.webp",
  "Swirl Bokeh Portrait": "/assets/cinema/swirl_bokeh_portrait.webp",
  "Vintage Prime": "/assets/cinema/vintage_prime.webp",
  "Halation Diffusion": "/assets/cinema/halation_diffusion.webp",
  "Clinical Sharp Prime": "/assets/cinema/clinical_sharp_prime.webp",
  "f/1.4": "/assets/cinema/f_1_4.webp",
  "f/4": "/assets/cinema/f_4.webp",
  "f/11": "/assets/cinema/f_11.webp",
};

const ASPECT_RATIOS = ["16:9", "21:9", "9:16", "1:1", "4:5"];
const RESOLUTIONS = ["1K", "2K", "4K"];
const CAMERAS = Object.keys(CAMERA_MAP);
const LENSES = Object.keys(LENS_MAP);
const FOCAL_LENGTHS = Object.keys(FOCAL_PERSPECTIVE).map((k) => parseInt(k));
const APERTURES = Object.keys(APERTURE_EFFECT);

function buildNanoBananaPrompt(
  basePrompt,
  camera,
  lens,
  focalLength,
  aperture,
) {
  const cameraDesc = CAMERA_MAP[camera] || camera;
  const lensDesc = LENS_MAP[lens] || lens;
  const perspective = FOCAL_PERSPECTIVE[focalLength] || "";
  const depthEffect = APERTURE_EFFECT[aperture] || "";
  const qualityTags = [
    "professional photography",
    "ultra-detailed",
    "8K resolution",
  ];
  const parts = [
    basePrompt,
    `shot on a ${cameraDesc}`,
    `using a ${lensDesc} at ${focalLength}mm ${perspective ? `(${perspective})` : ""}`,
    `aperture ${aperture}`,
    depthEffect,
    "cinematic lighting",
    "natural color science",
    "high dynamic range",
    qualityTags.join(", "),
  ];
  return parts.filter((p) => p && p.trim() !== "").join(", ");
}

// ─── Dropdown ────────────────────────────────────────────────────────────────

function Dropdown({ items, selected, onSelect, triggerRef, onClose }) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    const handler = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, triggerRef]);

  return (
    <div
      ref={menuRef}
      className="custom-dropdown absolute bottom-[calc(100%+8px)] left-0 bg-[#1a1a1a] border border-white/10 rounded py-1 shadow-2xl z-50 flex flex-col min-w-[120px] animate-fade-in"
    >
      {items.map((item) => (
        <button
          key={item}
          className={`px-3 py-2 text-xs font-bold text-left hover:bg-white/10 transition-colors ${item === selected ? "text-primary" : "text-white"}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
            onClose();
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

// ─── Scroll Column (Camera Controls) ─────────────────────────────────────────

function ScrollColumn({ title, items, columnKey, value, onChange }) {
  const listRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTopStart = useRef(0);
  const isSnapEnabled = useRef(true);

  // Scroll to initial value on mount
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const timer = setTimeout(() => {
      const target = Array.from(list.children).find(
        (c) => c.dataset.value == String(value),
      );
      if (target) target.scrollIntoView({ block: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const centerY = list.scrollTop + list.clientHeight / 2;
    let closest = null;
    let minDist = Infinity;

    const children = Array.from(list.children).filter((c) => c.dataset.value);
    children.forEach((child) => {
      const childCenter = child.offsetTop + child.offsetHeight / 2;
      const dist = Math.abs(centerY - childCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = child;
      }
    });

    children.forEach((child) => {
      const imgBox = child.querySelector("[data-imgbox]");
      const label = child.querySelector("[data-label]");
      const isClosest = child === closest;

      if (isClosest) {
        child.classList.remove("opacity-20", "scale-90");
        child.classList.add("opacity-100", "scale-100", "z-30");
        if (imgBox) {
          imgBox.classList.add("border-primary/40", "bg-primary/5", "scale-110");
          imgBox.classList.remove("border-transparent", "bg-transparent");
        }
        if (label) label.classList.add("text-primary");
      } else {
        child.classList.add("opacity-20", "scale-90");
        child.classList.remove("opacity-100", "scale-100", "z-30");
        if (imgBox) {
          imgBox.classList.remove("border-primary/40", "bg-primary/5", "scale-110");
          imgBox.classList.add("border-transparent", "bg-transparent");
        }
        if (label) label.classList.remove("text-primary");
      }
    });

    if (closest) {
      const newVal =
        columnKey === "focal"
          ? parseInt(closest.dataset.value)
          : closest.dataset.value;
      if (String(newVal) !== String(value)) {
        onChange(newVal);
      }
    }
  }, [columnKey, value, onChange]);

  // Attach scroll handler with initial check
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.addEventListener("scroll", handleScroll);
    const timer = setTimeout(handleScroll, 150);
    return () => {
      list.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [handleScroll]);

  // Mouse drag handlers
  const onMouseDown = (e) => {
    isDragging.current = true;
    isSnapEnabled.current = false;
    listRef.current.classList.add("cursor-grabbing");
    listRef.current.classList.remove("snap-y");
    startY.current = e.pageY - listRef.current.offsetTop;
    scrollTopStart.current = listRef.current.scrollTop;
    e.preventDefault();
  };

  const onMouseLeave = () => {
    isDragging.current = false;
    listRef.current.classList.remove("cursor-grabbing");
    listRef.current.classList.add("snap-y");
  };

  const onMouseUp = () => {
    isDragging.current = false;
    listRef.current.classList.remove("cursor-grabbing");
    listRef.current.classList.add("snap-y");
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.pageY - listRef.current.offsetTop;
    const walk = (y - startY.current) * 1.5;
    listRef.current.scrollTop = scrollTopStart.current - walk;
  };

  const onItemClick = (item) => {
    const list = listRef.current;
    if (!list) return;
    const target = Array.from(list.children).find(
      (c) => c.dataset.value == String(item),
    );
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const getSelectedDescription = () => {
    if (columnKey === 'camera') return CAMERA_MAP[value] || '';
    if (columnKey === 'lens') return LENS_MAP[value] || '';
    if (columnKey === 'focal') return FOCAL_PERSPECTIVE[value] || '';
    if (columnKey === 'aperture') return APERTURE_EFFECT[value] || '';
    return '';
  };

  return (
    <div className="flex flex-col items-center relative w-[130px] md:w-[150px] shrink-0 snap-center">
      <div className="mb-4 text-[10px] font-black text-white/20 uppercase tracking-[0.25em] text-center">
        {title}
      </div>
      <div className="relative overflow-hidden w-full h-[280px] md:h-[300px] bg-gradient-to-b from-white/[0.02] to-transparent rounded-2xl border border-white/[0.03] shadow-2xl backdrop-blur-3xl group">
        {/* Masks */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent z-20 pointer-events-none" />
        
        {/* Active Selection Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[70px] bg-white/[0.02] border border-white/[0.05] rounded-xl pointer-events-none z-0" />

        <div
          ref={listRef}
          className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory relative z-10"
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          <div style={{ height: "calc(50% - 35px)" }} />

          {items.map((item) => {
            const imageUrl = ASSET_URLS[item];
            return (
              <div
                key={item}
                data-value={item}
                className="h-[70px] flex flex-col items-center justify-center gap-2 snap-center cursor-pointer transition-all duration-300 ease-out text-white p-2 select-none opacity-20 scale-90"
                onClick={() => onItemClick(item)}
              >
                <div
                  data-imgbox="true"
                  className="w-10 h-10 rounded-lg border border-transparent flex items-center justify-center transition-all duration-300 overflow-hidden relative"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={String(item)}
                      className="w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <span className="text-sm font-bold text-white/40">
                      {item}
                    </span>
                  )}
                </div>
                <span
                  data-label="true"
                  className="text-[8px] md:text-[9px] font-black uppercase text-center leading-tight max-w-full truncate px-1 tracking-widest text-white/60"
                >
                  {item}
                </span>
              </div>
            );
          })}

          <div style={{ height: "calc(50% - 35px)" }} />
        </div>
      </div>
      
      {/* Selection Helper Text */}
      <div className="mt-4 h-8 px-2 text-center">
        <span className="text-[9px] font-medium text-primary/60 uppercase tracking-widest animate-fade-in inline-block leading-tight">
          {getSelectedDescription()}
        </span>
      </div>
    </div>
  );
}

function CameraControlsOverlay({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) {
  const backdropRef = useRef(null);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const updateSetting = (key) => (val) => {
    onSettingsChange((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-2xl z-[100] flex items-center justify-center transition-all duration-500 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full max-w-5xl bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] transform transition-all duration-500 flex flex-col max-h-[90vh] ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-10"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              Camera Config
            </h2>
            <div className="h-[1px] w-12 bg-primary/40" />
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scroll columns */}
        <div className="w-full flex justify-start md:justify-center gap-3 md:gap-6 py-4 md:py-8 overflow-x-auto no-scrollbar snap-x px-4 md:px-0">
          <ScrollColumn
            title="Camera"
            items={CAMERAS}
            columnKey="camera"
            value={settings.camera}
            onChange={updateSetting("camera")}
          />
          <ScrollColumn
            title="Lens"
            items={LENSES}
            columnKey="lens"
            value={settings.lens}
            onChange={updateSetting("lens")}
          />
          <ScrollColumn
            title="Focal Length"
            items={FOCAL_LENGTHS}
            columnKey="focal"
            value={settings.focal}
            onChange={updateSetting("focal")}
          />
          <ScrollColumn
            title="Aperture"
            items={APERTURES}
            columnKey="aperture"
            value={settings.aperture}
            onChange={updateSetting("aperture")}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CinemaStudio({
  apiKey,
  onGenerationComplete,
  historyItems,
}) {
  const PERSIST_KEY = "hg_cinema_studio_persistent";

  // ── Settings state ──
  const [settings, setSettings] = useState({
    prompt: "",
    aspect_ratio: "16:9",
    camera: CAMERAS[0],
    lens: LENSES[0],
    focal: 35,
    aperture: "f/1.4",
  });
  const [resolution, setResolution] = useState("2K");

  // ── UI state ──
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState(null); // null = prompt view
  const [fullscreenUrl, setFullscreenUrl] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const imageInputRef = useRef(null);
  const [activeHistoryIndex, setactiveHistoryIndex] = useState(null);

  // ── Internal history state (used when historyItems prop is not provided) ──
  const [internalHistory, setInternalHistory] = useState([]);

  // ── Dropdown state ──
  const [openDropdown, setOpenDropdown] = useState(null); // 'ar' | 'res' | null
  const arBtnRef = useRef(null);
  const resBtnRef = useRef(null);

  // ── Textarea auto-grow ──
  const textareaRef = useRef(null);
  const resultImgRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setImageUploadProgress(0);

    try {
      const url = await uploadFile(apiKey, file, (progress) => {
        setImageUploadProgress(progress);
      });
      if (url) setUploadedImage(url);
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setIsUploadingImage(false);
      setImageUploadProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  // ── Persistence: Load ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERSIST_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.settings) setSettings(data.settings);
        if (data.resolution) setResolution(data.resolution);
        if (data.internalHistory) setInternalHistory(data.internalHistory);
        if (data.uploadedImage) setUploadedImage(data.uploadedImage);
      }
    } catch (err) {
      console.warn("Failed to load CinemaStudio persistence:", err);
    }
  }, []);

  // ── Adjust height on load ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        const el = textareaRef.current;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // ── Persistence: Save ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const state = {
          settings,
          resolution,
          internalHistory,
          uploadedImage,
        };
        localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("Failed to save CinemaStudio persistence:", err);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [settings, resolution, internalHistory, uploadedImage]);

  // Derive effective history (prop wins over internal)
  const history = historyItems != null ? historyItems : internalHistory;

  useEffect(() => {
    setCanvasUrl(history[0]?.url || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyItems]);

  const formatSummaryValue = () =>
    `${settings.lens}, ${settings.focal}mm, ${settings.aperture}`;

  // ── Textarea auto-height ──
  const handleTextareaInput = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    setSettings((prev) => ({ ...prev, prompt: el.value }));
  };

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    const basePrompt = settings.prompt.trim();
    if (!basePrompt || isGenerating) return;

    setIsGenerating(true);

    const finalPrompt = buildNanoBananaPrompt(
      basePrompt,
      settings.camera,
      settings.lens,
      settings.focal,
      settings.aperture,
    );

    try {
      const res = await generateImage(apiKey, {
        model: uploadedImage ? "nano-banana-pro-edit" : "nano-banana-pro",
        prompt: finalPrompt,
        aspect_ratio: settings.aspect_ratio,
        resolution: resolution.toLowerCase(),
        negative_prompt: "blurry, low quality, distortion, bad composition",
        images_list: uploadedImage ? [uploadedImage] : [],
      });

      if (res && res.url) {
        const entry = {
          url: res.url,
          timestamp: Date.now(),
          settings: {
            prompt: basePrompt,
            camera: settings.camera,
            lens: settings.lens,
            focal: settings.focal,
            aperture: settings.aperture,
            aspect_ratio: settings.aspect_ratio,
            resolution,
          },
        };

        // Only update internal history if not using prop-driven history
        if (historyItems == null) {
          setInternalHistory((prev) => [entry, ...prev].slice(0, 50));
        }

        setCanvasUrl(res.url);

        if (onGenerationComplete) {
          onGenerationComplete({
            url: res.url,
            model: "nano-banana-pro",
            prompt: basePrompt,
            type: "cinema",
          });
        }
      } else {
        throw new Error("No data returned");
      }
    } catch (e) {
      console.error(e);
      alert("Generation Failed: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  }, [
    settings,
    resolution,
    apiKey,
    isGenerating,
    onGenerationComplete,
    historyItems,
  ]);

  // ── Regenerate ──
  const handleRegenerate = useCallback(() => {
    setCanvasUrl(null);
    // Small delay then generate
    setTimeout(() => handleGenerate(), 300);
  }, [handleGenerate]);

  // ── Download ──
  const handleDownload = useCallback(async () => {
    if (!canvasUrl) return;
    try {
      const response = await fetch(canvasUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `cinema-shot-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(canvasUrl, "_blank");
    }
  }, [canvasUrl]);

  // ── Load history item ──
  const loadHistoryItem = (entry, idx) => {
    if (entry.settings) {
      setSettings((prev) => ({
        ...prev,
        camera: entry.settings.camera ?? prev.camera,
        lens: entry.settings.lens ?? prev.lens,
        focal: entry.settings.focal ?? prev.focal,
        aperture: entry.settings.aperture ?? prev.aperture,
        aspect_ratio: entry.settings.aspect_ratio ?? prev.aspect_ratio,
        prompt: entry.settings.prompt ?? prev.prompt,
      }));
      if (entry.settings.resolution) setResolution(entry.settings.resolution);

      // Sync textarea height
      if (textareaRef.current) {
        textareaRef.current.value = entry.settings.prompt || "";
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }
    }
    setCanvasUrl(entry.url);
  };

  const resetToPrompt = () => {
    setCanvasUrl(null);
    setSettings((prev) => ({ ...prev, prompt: "" }));
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
      
      {/* ── CENTRAL GALLERY AREA ── */}
      <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar pb-40 lg:pb-32 px-2">
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full pt-4 animate-fade-in-up">
            {history.map((entry, idx) => (
              <div
                key={entry.timestamp ?? idx}
                className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-[#d9ff00]/50 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => loadHistoryItem(entry, idx)}
              >
                <img
                  src={entry.url}
                  alt={`History item ${idx + 1}`}
                  className="w-full aspect-[4/3] object-cover bg-black/40"
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Fullscreen"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenUrl(entry.url);
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#d9ff00] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Download"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const response = await fetch(entry.url);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = blobUrl;
                        a.download = `cinema-shot-${entry.id || idx}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(blobUrl);
                      } catch {
                        window.open(entry.url, "_blank");
                      }
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#d9ff00] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                </div>

                {/* Details */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  <p className="text-white/70 text-xs line-clamp-3 leading-relaxed">
                    {entry.settings?.prompt || "No prompt"}
                  </p>
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
                    <span className="text-[10px] font-bold text-[#d9ff00] px-2 py-0.5 bg-[#d9ff00]/10 rounded border border-[#d9ff00]/20">
                      {entry.settings?.camera || "Standard"}
                    </span>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-white/40">{entry.settings?.lens || "35mm"}</span>
                      {entry.settings?.aspect_ratio && (
                        <span className="text-[10px] text-white/40">{entry.settings.aspect_ratio}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            <div className="mb-12 relative group">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
              <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.05] overflow-hidden backdrop-blur-sm">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 relative z-10 transition-transform duration-500 group-hover:scale-110">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary opacity-80">
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="absolute top-4 right-4 text-[10px] text-primary/40 animate-pulse">REC</div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 text-center px-4">
              <span className="text-white/40 font-medium">START CREATING WITH</span><br />
              <span className="text-white uppercase tracking-wider">Cinema Studio</span>
            </h1>
            <p className="text-white/40 text-sm md:text-base font-medium tracking-wide text-center max-w-lg leading-relaxed">
              What would you shoot with infinite budget?
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <div className="absolute bottom-4 left-4 right-4 md:left-0 md:right-0 md:mx-auto md:max-w-[95%] lg:max-w-4xl z-30 transition-all duration-700 animate-fade-in-up">
        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-md p-4 flex justify-between shadow-2xl items-end relative gap-2">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-3 min-h-[80px] justify-between py-1">
            {/* Input Row */}
            <div className="flex items-start gap-4 w-full px-1">
              {/* Image Upload Button */}
              <div className="relative pt-0.5">
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                
                <button
                  onClick={() =>
                    uploadedImage
                      ? removeImage()
                      : imageInputRef.current?.click()
                  }
                  disabled={isUploadingImage}
                  className={`w-10 h-10 shrink-0 rounded-full border transition-all flex items-center justify-center relative overflow-hidden ${uploadedImage ? "border-primary/60 bg-white/5" : "bg-white/[0.03] border-white/[0.03] hover:bg-white/10 hover:border-primary/40"} group`}
                >
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center w-full h-full absolute inset-0 bg-black/80 z-20 backdrop-blur-[2px]">
                      <svg className="w-8 h-8 -rotate-90">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="transparent"
                          className="text-white/10"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="transparent"
                          strokeDasharray={88}
                          strokeDashoffset={88 - (88 * imageUploadProgress) / 100}
                          className="text-primary transition-all duration-300"
                        />
                      </svg>
                      <span className="absolute text-[8px] font-bold text-white">
                        {imageUploadProgress}%
                      </span>
                    </div>
                  ) : uploadedImage ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={uploadedImage}
                        alt="Reference"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-white">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40 group-hover:text-white transition-colors">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </button>
              </div>

              <textarea
                ref={textareaRef}
                placeholder="Describe your cinema scene..."
                className="w-full bg-transparent border-none text-white text-sm placeholder:text-white/10 focus:outline-none resize-none pt-1 leading-relaxed min-h-[40px] max-h-[150px] md:max-h-[250px] overflow-y-auto custom-scrollbar disabled:opacity-40"
                rows={1}
                onInput={handleTextareaInput}
              />
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                {/* Aspect Ratio Button */}
                <div className="relative">
                  <button
                    ref={arBtnRef}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] hover:bg-white/10 text-xs font-bold text-white/40 hover:text-white transition-colors rounded-md border border-white/[0.03]"
                    onClick={() =>
                      setOpenDropdown((d) => (d === "ar" ? null : "ar"))
                    }
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                      <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
                    </svg>
                    {settings.aspect_ratio}
                  </button>
                  {openDropdown === "ar" && (
                    <Dropdown
                      items={ASPECT_RATIOS}
                      selected={settings.aspect_ratio}
                      onSelect={(val) =>
                        setSettings((prev) => ({ ...prev, aspect_ratio: val }))
                      }
                      triggerRef={arBtnRef}
                      onClose={() => setOpenDropdown(null)}
                    />
                  )}
                </div>

                {/* Resolution Button */}
                <div className="relative">
                  <button
                    ref={resBtnRef}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] hover:bg-white/10 text-xs font-bold text-white/40 hover:text-white transition-colors rounded-md border border-white/[0.03]"
                    onClick={() =>
                      setOpenDropdown((d) => (d === "res" ? null : "res"))
                    }
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                    {resolution}
                  </button>
                  {openDropdown === "res" && (
                    <Dropdown
                      items={RESOLUTIONS}
                      selected={resolution}
                      onSelect={setResolution}
                      triggerRef={resBtnRef}
                      onClose={() => setOpenDropdown(null)}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 h-full self-end mb-1">
                {/* Summary Card (triggers overlay) */}
                <button
                  className="flex flex-col items-start justify-center px-4 py-1.5 bg-white/[0.03] rounded-md border border-white/[0.03] hover:border-white/20 transition-all text-left flex-1 min-w-[100px] md:min-w-[160px] max-w-[240px] h-[50px] relative group overflow-hidden"
                  onClick={() => setIsOverlayOpen(true)}
                >
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-[#d9ff00] rounded-full shadow-lg shadow-[#d9ff00]/20" />
                  <span className="text-[9px] font-bold text-white/30 uppercase truncate w-full tracking-wider group-hover:text-white transition-colors">
                    {settings.camera}
                  </span>
                  <span className="text-xs font-semibold text-white/70 truncate w-full group-hover:text-[#d9ff00] transition-colors">
                    {formatSummaryValue()}
                  </span>
                </button>

                {/* Generate Button */}
                <button
                  className="h-[50px] px-8 bg-[#d9ff00] text-black rounded-md font-medium text-sm hover:bg-[#e5ff33] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#d9ff00]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isGenerating || !settings.prompt.trim()}
                  onClick={handleGenerate}
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin inline-block text-black">◌</span> SHOOTING...
                    </>
                  ) : (
                    <>
                      <span>SHOOT</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>  
        </div>
      </div>
      {fullscreenUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
          onClick={() => setFullscreenUrl(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors border border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenUrl(null);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img 
            src={fullscreenUrl} 
            alt="Fullscreen Preview" 
            className="max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl object-contain animate-scale-up" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}  
      {/* ── Camera Controls Overlay ── */}
      <CameraControlsOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />
    </div>
  );
}
