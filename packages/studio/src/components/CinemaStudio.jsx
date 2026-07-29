"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateImage, uploadFile } from "../muapi.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import MobileGenerationActions, {
  CopyContentIcon,
} from "./MobileGenerationActions.jsx";
import {
  PromptAspectRatioIcon,
  PromptAction,
  PromptComposer,
  PromptControls,
  PromptFooter,
  PromptMenuItem,
  PromptMenuList,
  PromptPopover,
  PromptPopoverHeader,
  PromptQualityIcon,
  PromptTextarea,
  promptControlClassName,
  promptMediaButtonClassName,
} from "./prompt/PromptComposer.jsx";

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

async function fetchImageAsPngBlob(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}.`);
  }

  const sourceBlob = await response.blob();
  if (sourceBlob.type === "image/png") return sourceBlob;

  const objectUrl = URL.createObjectURL(sourceBlob);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode the image."));
      element.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not create an image clipboard canvas.");
    }

    context.drawImage(image, 0, 0);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Could not convert the image to PNG.")),
        "image/png",
      );
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

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

function Dropdown({ title, items, selected, onSelect, triggerRef, onClose }) {
  const menuRef = useRef(null);

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
    <PromptPopover
      ref={menuRef}
    >
      <PromptPopoverHeader>{title}</PromptPopoverHeader>
      <PromptMenuList>
      {items.map((item) => (
        <PromptMenuItem
          key={item}
          selected={item === selected}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
            onClose();
          }}
        >
          {item}
        </PromptMenuItem>
      ))}
      </PromptMenuList>
    </PromptPopover>
  );
}

// Camera configuration controls

function ScrollColumn({ title, items, columnKey, value, onChange }) {
  const listRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTopStart = useRef(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    const timer = setTimeout(() => {
      const target = Array.from(list.children).find(
        (child) => child.dataset.value === String(value),
      );
      if (target) target.scrollIntoView({ block: "center" });
    }, 100);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const centerY = list.scrollTop + list.clientHeight / 2;
    const children = Array.from(list.children).filter(
      (child) => child.dataset.value,
    );
    let closest = null;
    let minimumDistance = Infinity;

    children.forEach((child) => {
      const childCenter = child.offsetTop + child.offsetHeight / 2;
      const distance = Math.abs(centerY - childCenter);
      if (distance < minimumDistance) {
        minimumDistance = distance;
        closest = child;
      }
    });

    children.forEach((child) => {
      const selected = child === closest;
      child.dataset.selected = String(selected);
      child.setAttribute("aria-selected", String(selected));
    });

    if (closest) {
      const nextValue =
        columnKey === "focal"
          ? parseInt(closest.dataset.value, 10)
          : closest.dataset.value;
      if (String(nextValue) !== String(value)) onChange(nextValue);
    }
  }, [columnKey, onChange, value]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;

    list.addEventListener("scroll", handleScroll);
    const timer = setTimeout(handleScroll, 150);

    return () => {
      list.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [handleScroll]);

  const handleMouseDown = (event) => {
    const list = listRef.current;
    if (!list) return;

    isDragging.current = true;
    list.classList.add("cursor-grabbing");
    list.classList.remove("snap-y");
    startY.current = event.pageY - list.offsetTop;
    scrollTopStart.current = list.scrollTop;
    event.preventDefault();
  };

  const stopDragging = () => {
    const list = listRef.current;
    isDragging.current = false;
    if (!list) return;
    list.classList.remove("cursor-grabbing");
    list.classList.add("snap-y");
  };

  const handleMouseMove = (event) => {
    const list = listRef.current;
    if (!isDragging.current || !list) return;

    event.preventDefault();
    const y = event.pageY - list.offsetTop;
    list.scrollTop = scrollTopStart.current - (y - startY.current) * 1.5;
  };

  const handleItemClick = (item) => {
    const list = listRef.current;
    if (!list) return;

    const target = Array.from(list.children).find(
      (child) => child.dataset.value === String(item),
    );
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="flex w-[170px] shrink-0 snap-center flex-col md:w-[190px]">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-white/75">{title}</h3>
        <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-b from-[#22d3ee] to-[#a855f7] shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
      </div>

      <div className="relative h-[320px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#030303] shadow-inner">
        <div className="pointer-events-none absolute inset-x-2 top-1/2 z-0 h-[82px] -translate-y-1/2 rounded-xl border border-[#22d3ee]/20 bg-gradient-to-r from-[#22d3ee]/15 to-purple-500/10 shadow-[0_0_15px_rgba(34,211,238,0.1)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 bg-gradient-to-b from-[#030303] via-[#030303]/85 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-[#030303] via-[#030303]/85 to-transparent" />

        <div
          ref={listRef}
          role="listbox"
          aria-label={title}
          className="relative z-10 h-full cursor-grab snap-y snap-mandatory overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onMouseDown={handleMouseDown}
          onMouseLeave={stopDragging}
          onMouseUp={stopDragging}
          onMouseMove={handleMouseMove}
        >
          <div aria-hidden="true" style={{ height: "calc(50% - 41px)" }} />
          {items.map((item) => {
            const imageUrl = ASSET_URLS[item];
            const selected = String(item) === String(value);

            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={selected}
                data-value={item}
                data-selected={selected}
                onClick={() => handleItemClick(item)}
                className="group flex h-[82px] w-full snap-center select-none items-center justify-center gap-2.5 px-4 text-left opacity-30 transition-all duration-200 data-[selected=true]:opacity-100"
              >
                <span
                  className={`flex shrink-0 items-center justify-center font-semibold transition-colors ${
                    imageUrl
                      ? "h-10 w-10"
                      : "text-base text-white/55 group-data-[selected=true]:text-[#22d3ee]"
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <>
                      {item}
                      {columnKey === "focal" ? "mm" : ""}
                    </>
                  )}
                </span>
                {columnKey !== "focal" && (
                  <span className="line-clamp-2 min-w-0 text-[10px] font-medium leading-snug text-white/60 transition-colors group-data-[selected=true]:text-white">
                    {item}
                  </span>
                )}
              </button>
            );
          })}
          <div aria-hidden="true" style={{ height: "calc(50% - 41px)" }} />
        </div>
      </div>

    </section>
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

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-config-title"
        aria-describedby="camera-config-description"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0a0a0b]/95 shadow-[0_24px_100px_rgba(0,0,0,0.75)] backdrop-blur-2xl animate-scale-up"
      >
        <div className="flex items-start justify-between border-b border-white/[0.05] px-5 py-5 md:px-7 md:py-6">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#22d3ee]">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14.5 4H9.5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3Z" />
                <circle cx="12" cy="12.5" r="3.5" />
              </svg>
              Cinema Studio
            </div>
            <h2
              id="camera-config-title"
              className="text-xl font-semibold tracking-tight text-white md:text-2xl"
            >
              Camera settings
            </h2>
            <p
              id="camera-config-description"
              className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/45 md:text-sm"
            >
              Build a consistent cinematic look by choosing the camera, lens,
              focal length, and depth of field.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close camera settings"
            title="Close"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-white/40 transition-all hover:border-white/15 hover:bg-white/[0.07] hover:text-white"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto px-5 py-6 no-scrollbar md:px-7 md:py-7">
          <div className="mx-auto flex w-max min-w-full justify-start gap-3 sm:justify-center md:gap-5">
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
              title="Focal length"
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
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CinemaStudio({
  apiKey,
  onGenerationStart,
  onGenerationEnd,
  onGenerationComplete,
  onGenerationError,
  historyItems,
}) {
  const LEGACY_PERSIST_KEY = "hg_cinema_studio_persistent";
  const PERSIST_KEY = scopedPersistKey(LEGACY_PERSIST_KEY, apiKey);
  useEffect(() => {
    migrateLegacyPersistKey(LEGACY_PERSIST_KEY, PERSIST_KEY);
  }, [PERSIST_KEY]);

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
  const [copiedPromptIndex, setCopiedPromptIndex] = useState(null);
  const [copiedImageIndex, setCopiedImageIndex] = useState(null);

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
  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    const basePrompt = settings.prompt.trim();
    if (!basePrompt || isGenerating) return;

    onGenerationStart?.();
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
      onGenerationError?.(e.message?.slice(0, 120) || "Cinema generation failed");
    } finally {
      setIsGenerating(false);
      onGenerationEnd?.();
    }
  }, [
    settings,
    resolution,
    apiKey,
    isGenerating,
    onGenerationComplete,
    onGenerationEnd,
    onGenerationError,
    onGenerationStart,
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

  const handleCopyPrompt = useCallback(
    async (prompt, index) => {
      if (!prompt) return;

      try {
        await navigator.clipboard.writeText(prompt);
        setCopiedPromptIndex(index);
        window.setTimeout(() => {
          setCopiedPromptIndex((current) => (current === index ? null : current));
        }, 1600);
      } catch (error) {
        console.error("Failed to copy the prompt:", error);
        onGenerationError?.("Could not copy the prompt to the clipboard.");
      }
    },
    [onGenerationError],
  );

  const handleCopyImage = useCallback(
    async (url, index) => {
      if (!url) return;

      try {
        if (
          !window.isSecureContext ||
          !navigator.clipboard?.write ||
          typeof window.ClipboardItem === "undefined"
        ) {
          throw new Error("Image clipboard access requires HTTPS or localhost.");
        }

        await navigator.clipboard.write([
          new window.ClipboardItem({
            "image/png": fetchImageAsPngBlob(url),
          }),
        ]);
        setCopiedImageIndex(index);
        window.setTimeout(() => {
          setCopiedImageIndex((current) => (current === index ? null : current));
        }, 1600);
      } catch (error) {
        console.error("Failed to copy the image:", error);
        onGenerationError?.(
          "Could not copy the image. Image copy requires HTTPS or localhost.",
        );
      }
    },
    [onGenerationError],
  );

  const resetToPrompt = () => {
    setCanvasUrl(null);
    setSettings((prev) => ({ ...prev, prompt: "" }));
    if (textareaRef.current) {
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
                className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-[#22d3ee]/50 transition-all duration-300 flex flex-col cursor-pointer"
                onClick={() => setFullscreenUrl(entry.url)}
              >
                <img
                  src={entry.url}
                  alt={`History item ${idx + 1}`}
                  className="w-full aspect-[4/3] object-cover bg-black/40"
                />
                
                {/* Overlay actions */}
                <div className="absolute top-2 right-2 hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title={copiedPromptIndex === idx ? "Prompt copied" : "Copy prompt"}
                    aria-label={copiedPromptIndex === idx ? "Prompt copied" : "Copy prompt"}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopyPrompt(entry.settings?.prompt, idx);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 font-black backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ${
                      copiedPromptIndex === idx ? "text-[#22d3ee]" : "text-white"
                    }`}
                  >
                    {copiedPromptIndex === idx ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12l4 4L19 6" />
                      </svg>
                    ) : (
                      <CopyContentIcon kind="text" size={17} />
                    )}
                  </button>
                  <button
                    type="button"
                    title={copiedImageIndex === idx ? "Image copied" : "Copy image"}
                    aria-label={copiedImageIndex === idx ? "Image copied" : "Copy image"}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCopyImage(entry.url, idx);
                    }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ${
                      copiedImageIndex === idx ? "text-[#22d3ee]" : "text-white"
                    }`}
                  >
                    {copiedImageIndex === idx ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12l4 4L19 6" />
                      </svg>
                    ) : (
                      <CopyContentIcon kind="image" size={17} />
                    )}
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
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-[#22d3ee] hover:text-black transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this generated item?")) {
                        setInternalHistory(prev => prev.filter((_, i) => i !== idx));
                      }
                    }}
                    className="p-2 bg-black/60 backdrop-blur-md rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all border border-white/10"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
                <MobileGenerationActions
                  actions={[
                    {
                      kind: "text",
                      label: "Copy prompt",
                      onSelect: () =>
                        handleCopyPrompt(entry.settings?.prompt, idx),
                    },
                    {
                      kind: "image",
                      label: "Copy image",
                      onSelect: () => handleCopyImage(entry.url, idx),
                    },
                    {
                      kind: "download",
                      label: "Download",
                      onSelect: async () => {
                        try {
                          const response = await fetch(entry.url);
                          const blob = await response.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const anchor = document.createElement("a");
                          anchor.href = blobUrl;
                          anchor.download = `cinema-shot-${entry.id || idx}.jpg`;
                          document.body.appendChild(anchor);
                          anchor.click();
                          document.body.removeChild(anchor);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(entry.url, "_blank");
                        }
                      },
                    },
                    {
                      kind: "delete",
                      label: "Delete",
                      danger: true,
                      onSelect: () => {
                        if (confirm("Are you sure you want to delete this generated item?")) {
                          setInternalHistory((prev) => prev.filter((_, i) => i !== idx));
                        }
                      },
                    },
                  ]}
                />

                {/* Details */}
                <div className="p-3 bg-black/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between gap-2">
                  <p
                    className="w-full text-left text-xs line-clamp-3 leading-relaxed text-white/70"
                    title={entry.settings?.prompt || "No prompt"}
                  >
                    {entry.settings?.prompt || "No prompt"}
                  </p>
                  <span className="sr-only" aria-live="polite">
                    {copiedPromptIndex === idx
                      ? "Prompt copied"
                      : copiedImageIndex === idx
                        ? "Image copied"
                        : ""}
                  </span>
                  <div className="flex items-center mt-1 flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#22d3ee] px-2 py-0.5 bg-[#22d3ee]/10 rounded border border-[#22d3ee]/20">
                        Cinema Studio
                      </span>
                      {entry.settings?.camera && (
                        <span className="text-[10px] text-white/40">{entry.settings.camera}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in-up transition-all duration-700 min-h-[50vh]">
            {/* Overlapping floating cards */}
            <div className="flex items-center justify-center gap-1.5 md:gap-3 mb-10 select-none scale-90 sm:scale-100">
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/sdxl-image.avif"
                  alt="Creative asset 1"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl -rotate-[4deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/chroma-image.avif"
                  alt="Creative asset 2"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-full border border-white/10 shadow-2xl rotate-[6deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/neta-lumina.avif"
                  alt="Creative asset 3"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-18 h-22 sm:w-24 sm:h-28 rounded-2xl border border-white/10 shadow-2xl rotate-[12deg] transform hover:rotate-0 hover:scale-110 hover:z-20 transition-all duration-300 overflow-hidden bg-white/[0.01] -ml-3 sm:-ml-4 flex-shrink-0">
                <img
                  src="https://d3adwkbyhxyrtq.cloudfront.net/webassets/videomodels/perfect-pony-xl.avif"
                  alt="Creative asset 4"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-center px-4 flex flex-col items-center">
              <span className="text-white font-black uppercase text-xl sm:text-3xl tracking-wide mb-1 opacity-90">START CREATING WITH</span>
              <span className="text-[#22d3ee] font-black uppercase text-2xl sm:text-4xl sm:mt-1 tracking-tight">
                CINEMA STUDIO
              </span>
            </h1>
            <p className="text-white/40 text-xs sm:text-sm font-medium tracking-wide text-center max-w-lg leading-relaxed px-4">
              What would you shoot with infinite budget? Control cameras, lighting, lenses, and prompt high-end cinematic scenes.
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM PROMPT BAR ── */}
      <PromptComposer
        positionClassName="absolute bottom-4 left-4 right-4 md:left-0 md:right-0 md:mx-auto md:max-w-[95%] lg:max-w-4xl z-30 transition-all duration-700 animate-fade-in-up"
        style={null}
      >
          {/* Upper Row: Image Upload & Textarea */}
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
                className={promptMediaButtonClassName({
                  active: Boolean(uploadedImage),
                })}
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/40 group-hover:text-[#22d3ee] transition-colors">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </button>
            </div>

            <PromptTextarea
              ref={textareaRef}
              value={settings.prompt}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, prompt: e.target.value }))
              }
              placeholder="Describe your cinema scene..."
            />
          </div>

          {/* Bottom Row: Controls & Generate */}
          <PromptFooter>
            <PromptControls>
              {/* Aspect Ratio Button */}
              <div className="relative">
                <button
                  ref={arBtnRef}
                  className={promptControlClassName({
                    active: openDropdown === "ar",
                    className: "text-xs font-semibold",
                  })}
                  onClick={() =>
                    setOpenDropdown((d) => (d === "ar" ? null : "ar"))
                  }
                >
                  <PromptAspectRatioIcon />
                  {settings.aspect_ratio}
                </button>
                {openDropdown === "ar" && (
                  <Dropdown
                    title="Aspect Ratio"
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
                  className={promptControlClassName({
                    active: openDropdown === "res",
                    className: "text-xs font-semibold",
                  })}
                  onClick={() =>
                    setOpenDropdown((d) => (d === "res" ? null : "res"))
                  }
                >
                  <PromptQualityIcon />
                  {resolution}
                </button>
                {openDropdown === "res" && (
                  <Dropdown
                    title="Resolution"
                    items={RESOLUTIONS}
                    selected={resolution}
                    onSelect={setResolution}
                    triggerRef={resBtnRef}
                    onClose={() => setOpenDropdown(null)}
                  />
                )}
              </div>

              {/* Summary Card (triggers overlay) */}
              <button
                className={promptControlClassName({
                  className: "text-left overflow-hidden text-xs font-semibold text-white/70 hover:text-white",
                })}
                onClick={() => setIsOverlayOpen(true)}
              >
                <div className="w-1.5 h-1.5 bg-[#22d3ee] rounded-full shadow-lg shadow-[#22d3ee]/20 shrink-0" />
                <span className="max-w-[120px] truncate text-xs font-semibold text-white/70 group-hover:text-[#22d3ee] transition-colors">
                  {settings.camera} · {formatSummaryValue()}
                </span>
              </button>
            </PromptControls>

            {/* Generate Button */}
            <PromptAction
              disabled={isGenerating || !settings.prompt.trim()}
              onClick={handleGenerate}
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block text-black">◌</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Shoot ✦ 10</span>
                </>
              )}
            </PromptAction>
          </PromptFooter>
      </PromptComposer>
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
