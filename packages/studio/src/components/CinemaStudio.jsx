"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { generateImage, uploadFile } from "../muapi.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
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

// â”€â”€â”€ Constants (inlined from promptUtils) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Dropdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            titlã½÷¶‰žËkºwµçQ½¸(€€€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€Ñ¥Ñ±”ô‰•±•Ñ”ˆ(€€€€€€€€€€€€€€€€€€€½¹±¥¬õì¡”¤€ôøì(€€€€€€€€€€€€€€€€€€€€€”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ì(€€€€€€€€€€€€€€€€€€€€€¥˜€¡½¹™¥É´ ‰É”å½ÔÍÕÉ”å½ÔÝ…¹ÐÑ¼‘•±•Ñ”Ñ¡¥Ì•¹•É…Ñ•¥Ñ•´üˆ¤¤ì(€€€€€€€€€€€€€€€€€€€€€€€Í•Ñ%¹Ñ•É¹…±!¥ÍÑ½Éä¡ÁÉ•Ø€ôøÁÉ•Ø¹™¥±Ñ•È ¡|°¤¤€ôø¤€„ôô¥‘à¤¤ì(€€€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰À´È‰œµ‰±…¬¼ØÀ‰…­‘É½Àµ‰±ÕÈµµÉ½Õ¹‘•µ™Õ±°Ñ•áÐµÉ•´ÐÀÀ¡½Ù•Èé‰œµÉ•´ÔÀÀ¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µ…±°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀˆ(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€€ñÍÙœÝ¥‘Ñ ôˆÄÐˆ¡•¥¡ÐôˆÄÐˆÙ¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÈ¸Ôˆø(€€€€€€€€€€€€€€€€€€€€€€ñÁ½±å±¥¹”Á½¥¹ÑÌôˆÌ€Ø€Ô€Ø€ÈÄ€Øˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4Ää€ÙØÄÑ„È€È€À€ÀÄ´È€É Ý„È€È€À€ÀÄ´È´ÉXÙ´Ì€ÁXÑ„È€È€À€ÀÄÈ´É Ñ„È€È€À€ÀÄÈ€ÉØÈˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÄÀˆäÄôˆÄÄˆàÈôˆÄÀˆäÈôˆÄÜˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÄÐˆäÄôˆÄÄˆàÈôˆÄÐˆäÈôˆÄÜˆ€¼ø(€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€€€€ì¼¨•Ñ…¥±Ì€¨½ô(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰À´Ì‰œµ‰±…¬¼àÀ‰…­‘É½Àµ‰±ÕÈµÍ´‰½É‘•ÈµÐ‰½É‘•ÈµÝ¡¥Ñ”¼Ô™±•à´Ä™±•à™±•àµ½°©ÕÍÑ¥™äµ‰•ÑÝ••¸…À´Èˆø(€€€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€€€€€€€€€½¹±¥¬õì¡”¤€ôøì(€€€€€€€€€€€€€€€€€€€€€”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ì(€€€€€€€€€€€€€€€€€€€€€¡…¹‘±•½ÁåAÉ½µÁÐ¡•¹ÑÉä¹Í•ÑÑ¥¹Ìü¹ÁÉ½µÁÐ°¥‘à¤ì(€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÜµ™Õ±°Ñ•áÐµ±•™ÐÑ•áÐµáÌ±¥¹”µ±…µÀ´Ì±•…‘¥¹œµÉ•±…á•ÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌÕÉÍ½Èµ½Áä€‘ì(€€€€€€€€€€€€€€€€€€€€€½Á¥•‘AÉ½µÁÑ%¹‘•à€ôôô¥‘à(€€€€€€€€€€€€€€€€€€€€€€€€ü€‰Ñ•áÐµlŒÈÉÍ••tˆ(€€€€€€€€€€€€€€€€€€€€€€€€è€‰Ñ•áÐµÝ¡¥Ñ”¼ÜÀ¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ˆ(€€€€€€€€€€€€€€€€€€€õô(€€€€€€€€€€€€€€€€€€€Ñ¥Ñ±”õì(€€€€€€€€€€€€€€€€€€€€€½Á¥•‘AÉ½µÁÑ%¹‘•à€ôôô¥‘à(€€€€€€€€€€€€€€€€€€€€€€€€ü€‰AÉ½µÁÐ½Á¥•ˆ(€€€€€€€€€€€€€€€€€€€€€€€€è€‰½Áä™Õ±°ÁÉ½µÁÐˆ(€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€…É¥„µ±…‰•°õì(€€€€€€€€€€€€€€€€€€€€€½Á¥•‘AÉ½µÁÑ%¹‘•à€ôôô¥‘à(€€€€€€€€€€€€€€€€€€€€€€€€ü€‰AÉ½µÁÐ½Á¥•ˆ(€€€€€€€€€€€€€€€€€€€€€€€€è€‰½Áä™Õ±°ÁÉ½µÁÐˆ(€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€€í•¹ÑÉä¹Í•ÑÑ¥¹Ìü¹ÁÉ½µÁÐñð€‰9¼ÁÉ½µÁÐ‰ô(€€€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰ÍÈµ½¹±äˆ…É¥„µ±¥Ù”ô‰Á½±¥Ñ”ˆø(€€€€€€€€€€€€€€€€€€€í½Á¥•‘AÉ½µÁÑ%¹‘•à€ôôô¥‘à€ü€‰AÉ½µÁÐ½Á¥•ˆ€è€ˆ‰ô(€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•ÈµÐ´Ä™±•àµÝÉ…À…À´Äˆø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È…À´Èˆø(€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁát™½¹Ðµ‰½±Ñ•áÐµlŒÈÉÍ••tÁà´ÈÁä´À¸Ô‰œµlŒÈÉÍ••t¼ÄÀÉ½Õ¹‘•‰½É‘•È‰½É‘•ÈµlŒÈÉÍ••t¼ÈÀˆø(€€€€€€€€€€€€€€€€€€€€€€€¥¹•µ„MÑÕ‘¥¼(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€í•¹ÑÉä¹Í•ÑÑ¥¹Ìü¹…µ•É„€˜˜€ (€€€€€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlÄÁÁátÑ•áÐµÝ¡¥Ñ”¼ÐÀˆùí•¹ÑÉä¹Í•ÑÑ¥¹Ì¹…µ•É…ôð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€¤¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¤€è€ (€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È µ™Õ±°Ñ•áÐµ•¹Ñ•ÈÁà´Ð…¹¥µ…Ñ”µ™…‘”µ¥¸µÕÀÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÜÀÀµ¥¸µ µlÔÁÙ¡tˆø(€€€€€€€€€€€ì¼¨=Ù•É±…ÁÁ¥¹œ™±½…Ñ¥¹œ…É‘Ì€¨½ô(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È…À´Ä¸Ôµé…À´Ìµˆ´ÄÀÍ•±•Ðµ¹½¹”Í…±”´äÀÍ´éÍ…±”´ÄÀÀˆø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´Äà ´ÈÈÍ´éÜ´ÈÐÍ´é ´ÈàÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÍ¡…‘½Ü´Éá°€µÉ½Ñ…Ñ”µlÄÉ‘•tÑÉ…¹Í™½É´¡½Ù•ÈéÉ½Ñ…Ñ”´À¡½Ù•ÈéÍ…±”´ÄÄÀ¡½Ù•Èéè´ÈÀÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÌÀÀ½Ù•É™±½Üµ¡¥‘‘•¸‰œµÝ¡¥Ñ”½lÀ¸ÀÅt™±•àµÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€ÍÉŒô‰¡ÑÑÁÌè¼½Í…‘Ý­‰å¡áåÉÑÄ¹±½Õ‘™É½¹Ð¹¹•Ð½Ý•‰…ÍÍ•ÑÌ½Ù¥‘•½µ½‘•±Ì½Í‘á°µ¥µ…”¹…Ù¥˜ˆ(€€€€€€€€€€€€€€€€€…±Ðô‰É•…Ñ¥Ù”…ÍÍ•Ð€Äˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ðµ½Ù•Èˆ(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´Äà ´ÈÈÍ´éÜ´ÈÐÍ´é ´ÈàÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÍ¡…‘½Ü´Éá°€µÉ½Ñ…Ñ”µlÑ‘•tÑÉ…¹Í™½É´¡½Ù•ÈéÉ½Ñ…Ñ”´À¡½Ù•ÈéÍ…±”´ÄÄÀ¡½Ù•Èéè´ÈÀÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÌÀÀ½Ù•É™±½Üµ¡¥‘‘•¸‰œµÝ¡¥Ñ”½lÀ¸ÀÅt€µµ°´ÌÍ´èµµ°´Ð™±•àµÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€ÍÉŒô‰¡ÑÑÁÌè¼½Í…‘Ý­‰å¡áåÉÑÄ¹±½Õ‘™É½¹Ð¹¹•Ð½Ý•‰…ÍÍ•ÑÌ½Ù¥‘•½µ½‘•±Ì½¡É½µ„µ¥µ…”¹…Ù¥˜ˆ(€€€€€€€€€€€€€€€€€…±Ðô‰É•…Ñ¥Ù”…ÍÍ•Ð€Èˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ðµ½Ù•Èˆ(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´Äà ´ÄàÍ´éÜ´ÈÐÍ´é ´ÈÐÉ½Õ¹‘•µ™Õ±°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÍ¡…‘½Ü´Éá°É½Ñ…Ñ”µlÙ‘•tÑÉ…¹Í™½É´¡½Ù•ÈéÉ½Ñ…Ñ”´À¡½Ù•ÈéÍ…±”´ÄÄÀ¡½Ù•Èéè´ÈÀÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÌÀÀ½Ù•É™±½Üµ¡¥‘‘•¸‰œµÝ¡¥Ñ”½lÀ¸ÀÅt€µµ°´ÌÍ´èµµ°´Ð™±•àµÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€ÍÉŒô‰¡ÑÑÁÌè¼½Í…‘Ý­‰å¡áåÉÑÄ¹±½Õ‘™É½¹Ð¹¹•Ð½Ý•‰…ÍÍ•ÑÌ½Ù¥‘•½µ½‘•±Ì½¹•Ñ„µ±Õµ¥¹„¹…Ù¥˜ˆ(€€€€€€€€€€€€€€€€€…±Ðô‰É•…Ñ¥Ù”…ÍÍ•Ð€Ìˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ðµ½Ù•Èˆ(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´Äà ´ÈÈÍ´éÜ´ÈÐÍ´é ´ÈàÉ½Õ¹‘•´Éá°‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÍ¡…‘½Ü´Éá°É½Ñ…Ñ”µlÄÉ‘•tÑÉ…¹Í™½É´¡½Ù•ÈéÉ½Ñ…Ñ”´À¡½Ù•ÈéÍ…±”´ÄÄÀ¡½Ù•Èéè´ÈÀÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÌÀÀ½Ù•É™±½Üµ¡¥‘‘•¸‰œµÝ¡¥Ñ”½lÀ¸ÀÅt€µµ°´ÌÍ´èµµ°´Ð™±•àµÍ¡É¥¹¬´Àˆø(€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€ÍÉŒô‰¡ÑÑÁÌè¼½Í…‘Ý­‰å¡áåÉÑÄ¹±½Õ‘™É½¹Ð¹¹•Ð½Ý•‰…ÍÍ•ÑÌ½Ù¥‘•½µ½‘•±Ì½Á•É™•ÐµÁ½¹äµá°¹…Ù¥˜ˆ(€€€€€€€€€€€€€€€€€…±Ðô‰É•…Ñ¥Ù”…ÍÍ•Ð€Ðˆ(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ðµ½Ù•Èˆ(€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€ñ Ä±…ÍÍ9…µ”ô‰Ñ•áÐ´Éá°Í´éÑ•áÐ´Ñá°µéÑ•áÐ´Õá°™½¹Ðµ•áÑÉ…‰½±ÑÉ…­¥¹œµÑ¥¡Ðµˆ´ÐÑ•áÐµ•¹Ñ•ÈÁà´Ð™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•Èˆø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”™½¹Ðµ‰±…¬ÕÁÁ•É…Í”Ñ•áÐµá°Í´éÑ•áÐ´Íá°ÑÉ…­¥¹œµÝ¥‘”µˆ´Ä½Á…¥Ñä´äÀˆùMQIPIQ%9]%Q ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµlŒÈÉÍ••t™½¹Ðµ‰±…¬ÕÁÁ•É…Í”Ñ•áÐ´Éá°Í´éÑ•áÐ´Ñá°Í´éµÐ´ÄÑÉ…­¥¹œµÑ¥¡Ðˆø(€€€€€€€€€€€€€€€%95MQU%<(€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€ð½ Äø(€€€€€€€€€€€€ñÀ±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ÐÀÑ•áÐµáÌÍ´éÑ•áÐµÍ´™½¹Ðµµ•‘¥Õ´ÑÉ…­¥¹œµÝ¥‘”Ñ•áÐµ•¹Ñ•Èµ…àµÜµ±œ±•…‘¥¹œµÉ•±…á•Áà´Ðˆø(€€€€€€€€€€€€€]¡…ÐÝ½Õ±å½ÔÍ¡½½ÐÝ¥Ñ ¥¹™¥¹¥Ñ”‰Õ‘•Ðü½¹ÑÉ½°…µ•É…Ì°±¥¡Ñ¥¹œ°±•¹Í•Ì°…¹ÁÉ½µÁÐ¡¥ µ•¹¥¹•µ…Ñ¥ŒÍ•¹•Ì¸(€€€€€€€€€€€€ð½Àø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€¥ô(€€€€€€ð½‘¥Øø((€€€€€ì¼¨ƒŠRŠR 	=QQ=4AI=5AP	HƒŠRŠR €¨½ô(€€€€€€ñAÉ½µÁÑ½µÁ½Í•È(€€€€€€€Á½Í¥Ñ¥½¹±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”‰½ÑÑ½´´Ð±•™Ð´ÐÉ¥¡Ð´Ðµé±•™Ð´ÀµéÉ¥¡Ð´Àµéµàµ…ÕÑ¼µéµ…àµÜµläÔ•t±œéµ…àµÜ´Ñá°è´ÌÀÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÜÀÀ…¹¥µ…Ñ”µ™…‘”µ¥¸µÕÀˆ(€€€€€€€ÍÑå±”õí¹Õ±±ô(€€€€€€ø(€€€€€€€€€ì¼¨UÁÁ•ÈI½Üè%µ…”UÁ±½…€˜Q•áÑ…É•„€¨½ô(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à¥Ñ•µÌµÍÑ…ÉÐ…À´ÐÜµ™Õ±°Áà´Äˆø(€€€€€€€€€€€ì¼¨%µ…”UÁ±½…	ÕÑÑ½¸€¨½ô(€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”ÁÐ´À¸Ôˆø(€€€€€€€€€€€€€€ñ¥¹ÁÕÐ(€€€€€€€€€€€€€€€ÑåÁ”ô‰™¥±”ˆ(€€€€€€€€€€€€€€€É•˜õí¥µ…•%¹ÁÕÑI•™ô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰¡¥‘‘•¸ˆ(€€€€€€€€€€€€€€€…•ÁÐô‰¥µ…”¼¨ˆ(€€€€€€€€€€€€€€€½¹¡…¹”õí¡…¹‘±•%µ…•UÁ±½…‘ô(€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€€€€€€€ÕÁ±½…‘•‘%µ…”(€€€€€€€€€€€€€€€€€€€€üÉ•µ½Ù•%µ…” ¤(€€€€€€€€€€€€€€€€€€€€è¥µ…•%¹ÁÕÑI•˜¹ÕÉÉ•¹Ðü¹±¥¬ ¤(€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€‘¥Í…‰±•õí¥ÍUÁ±½…‘¥¹%µ…•ô(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁÉ½µÁÑ5•‘¥…	ÕÑÑ½¹±…ÍÍ9…µ”¡ì(€€€€€€€€€€€€€€€€€…Ñ¥Ù”è	½½±•…¸¡ÕÁ±½…‘•‘%µ…”¤°(€€€€€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€í¥ÍUÁ±½…‘¥¹%µ…”€ü€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•à™±•àµ½°¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•ÈÜµ™Õ±° µ™Õ±°…‰Í½±ÕÑ”¥¹Í•Ð´À‰œµ‰±…¬¼àÀè´ÈÀ‰…­‘É½Àµ‰±ÕÈµlÉÁátˆø(€€€€€€€€€€€€€€€€€€€€ñÍÙœ±…ÍÍ9…µ”ô‰Ü´à ´à€µÉ½Ñ…Ñ”´äÀˆø(€€€€€€€€€€€€€€€€€€€€€€ñ¥É±”(€€€€€€€€€€€€€€€€€€€€€€€àôˆÄØˆ(€€€€€€€€€€€€€€€€€€€€€€€äôˆÄØˆ(€€€€€€€€€€€€€€€€€€€€€€€ÈôˆÄÐˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÈˆ(€€€€€€€€€€€€€€€€€€€€€€€™¥±°ô‰ÑÉ…¹ÍÁ…É•¹Ðˆ(€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ÄÀˆ(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€€€ñ¥É±”(€€€€€€€€€€€€€€€€€€€€€€€àôˆÄØˆ(€€€€€€€€€€€€€€€€€€€€€€€äôˆÄØˆ(€€€€€€€€€€€€€€€€€€€€€€€ÈôˆÄÐˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½Èˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•]¥‘Ñ ôˆÈˆ(€€€€€€€€€€€€€€€€€€€€€€€™¥±°ô‰ÑÉ…¹ÍÁ…É•¹Ðˆ(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•…Í¡…ÉÉ…äõìàáô(€€€€€€€€€€€€€€€€€€€€€€€ÍÑÉ½­•…Í¡½™™Í•Ðõìàà€´€ àà€¨¥µ…•UÁ±½…‘AÉ½É•ÍÌ¤€¼€ÄÀÁô(€€€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Ñ•áÐµÁÉ¥µ…ÉäÑÉ…¹Í¥Ñ¥½¸µ…±°‘ÕÉ…Ñ¥½¸´ÌÀÀˆ(€€€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”Ñ•áÐµláÁát™½¹Ðµ‰½±Ñ•áÐµÝ¡¥Ñ”ˆø(€€€€€€€€€€€€€€€€€€€€€í¥µ…•UÁ±½…‘AÉ½É•ÍÍô”(€€€€€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¤€èÕÁ±½…‘•‘%µ…”€ü€ (€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”Üµ™Õ±° µ™Õ±°É½ÕÀˆø(€€€€€€€€€€€€€€€€€€€€ñ¥µœ(€€€€€€€€€€€€€€€€€€€€€ÍÉŒõíÕÁ±½…‘•‘%µ…•ô(€€€€€€€€€€€€€€€€€€€€€…±Ðô‰I•™•É•¹”ˆ(€€€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”ô‰Üµ™Õ±° µ™Õ±°½‰©•Ðµ½Ù•È½Á…¥Ñä´àÀÉ½ÕÀµ¡½Ù•Èé½Á…¥Ñä´ÐÀÑÉ…¹Í¥Ñ¥½¸µ½Á…¥Ñäˆ(€€€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”¥¹Í•Ð´À™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È½Á…¥Ñä´ÀÉ½ÕÀµ¡½Ù•Èé½Á…¥Ñä´ÄÀÀÑÉ…¹Í¥Ñ¥½¸µ½Á…¥Ñäˆø(€€€€€€€€€€€€€€€€€€€€€€ñÍÙœÝ¥‘Ñ ôˆÄÐˆ¡•¥¡ÐôˆÄÐˆÙ¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÌˆ±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”ˆø(€€€€€€€€€€€€€€€€€€€€€€€€ñÁ…Ñ ô‰4Äà€Ù0Ø€Äá4Ø€Ù°ÄÈ€ÄÈˆ€¼ø(€€€€€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€€€ñÍÙœÝ¥‘Ñ ôˆÄØˆ¡•¥¡ÐôˆÄØˆÙ¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÈ¸Ôˆ±…ÍÍ9…µ”ô‰Ñ•áÐµÝ¡¥Ñ”¼ÐÀÉ½ÕÀµ¡½Ù•ÈéÑ•áÐµlŒÈÉÍ••tÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌˆø(€€€€€€€€€€€€€€€€€€€€ñÉ•ÐàôˆÌˆäôˆÌˆÝ¥‘Ñ ôˆÄàˆ¡•¥¡ÐôˆÄàˆÉàôˆÈˆÉäôˆÈˆ€¼ø(€€€€€€€€€€€€€€€€€€€€ñ¥É±”àôˆà¸Ôˆäôˆà¸ÔˆÈôˆÄ¸Ôˆ€¼ø(€€€€€€€€€€€€€€€€€€€€ñÁ½±å±¥¹”Á½¥¹ÑÌôˆÈÄ€ÄÔ€ÄØ€ÄÀ€Ô€ÈÄˆ€¼ø(€€€€€€€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€ñAÉ½µÁÑQ•áÑ…É•„(€€€€€€€€€€€€€É•˜õíÑ•áÑ…É•…I•™ô(€€€€€€€€€€€€€Ù…±Õ”õíÍ•ÑÑ¥¹Ì¹ÁÉ½µÁÑô(€€€€€€€€€€€€€½¹¡…¹”õì¡”¤€ôø(€€€€€€€€€€€€€€€Í•ÑM•ÑÑ¥¹Ì ¡ÁÉ•Ø¤€ôø€¡ì€¸¸¹ÁÉ•Ø°ÁÉ½µÁÐè”¹Ñ…É•Ð¹Ù…±Õ”ô¤¤(€€€€€€€€€€€€€ô(€€€€€€€€€€€€€Á±…•¡½±‘•Èô‰•ÍÉ¥‰”å½ÕÈ¥¹•µ„Í•¹”¸¸¸ˆ(€€€€€€€€€€€€¼ø(€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€ì¼¨	½ÑÑ½´I½Üè½¹ÑÉ½±Ì€˜•¹•É…Ñ”€¨½ô(€€€€€€€€€€ñAÉ½µÁÑ½½Ñ•Èø(€€€€€€€€€€€€ñAÉ½µÁÑ½¹ÑÉ½±Ìø(€€€€€€€€€€€€€ì¼¨ÍÁ•ÐI…Ñ¥¼	ÕÑÑ½¸€¨½ô(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”ˆø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€É•˜õí…É	Ñ¹I•™ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁÉ½µÁÑ½¹ÑÉ½±±…ÍÍ9…µ”¡ì(€€€€€€€€€€€€€€€€€€€…Ñ¥Ù”è½Á•¹É½Á‘½Ý¸€ôôô€‰…Èˆ°(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”è€‰Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±ˆ°(€€€€€€€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€€€€€€€€€Í•Ñ=Á•¹É½Á‘½Ý¸ ¡¤€ôø€¡€ôôô€‰…Èˆ€ü¹Õ±°€è€‰…Èˆ¤¤(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñAÉ½µÁÑÍÁ•ÑI…Ñ¥½%½¸€¼ø(€€€€€€€€€€€€€€€€€íÍ•ÑÑ¥¹Ì¹…ÍÁ•Ñ}É…Ñ¥½ô(€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€í½Á•¹É½Á‘½Ý¸€ôôô€‰…Èˆ€˜˜€ (€€€€€€€€€€€€€€€€€€ñÉ½Á‘½Ý¸(€€€€€€€€€€€€€€€€€€€Ñ¥Ñ±”ô‰ÍÁ•ÐI…Ñ¥¼ˆ(€€€€€€€€€€€€€€€€€€€¥Ñ•µÌõíMAQ}IQ%=Mô(€€€€€€€€€€€€€€€€€€€Í•±•Ñ•õíÍ•ÑÑ¥¹Ì¹…ÍÁ•Ñ}É…Ñ¥½ô(€€€€€€€€€€€€€€€€€€€½¹M•±•Ðõì¡Ù…°¤€ôø(€€€€€€€€€€€€€€€€€€€€€Í•ÑM•ÑÑ¥¹Ì ¡ÁÉ•Ø¤€ôø€¡ì€¸¸¹ÁÉ•Ø°…ÍÁ•Ñ}É…Ñ¥¼èÙ…°ô¤¤(€€€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€€€€ÑÉ¥•ÉI•˜õí…É	Ñ¹I•™ô(€€€€€€€€€€€€€€€€€€€½¹±½Í”õì ¤€ôøÍ•Ñ=Á•¹É½Á‘½Ý¸¡¹Õ±°¥ô(€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€€ì¼¨I•Í½±ÕÑ¥½¸	ÕÑÑ½¸€¨½ô(€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰É•±…Ñ¥Ù”ˆø(€€€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€€€É•˜õíÉ•Í	Ñ¹I•™ô(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁÉ½µÁÑ½¹ÑÉ½±±…ÍÍ9…µ”¡ì(€€€€€€€€€€€€€€€€€€€…Ñ¥Ù”è½Á•¹É½Á‘½Ý¸€ôôô€‰É•Ìˆ°(€€€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”è€‰Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±ˆ°(€€€€€€€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôø(€€€€€€€€€€€€€€€€€€€Í•Ñ=Á•¹É½Á‘½Ý¸ ¡¤€ôø€¡€ôôô€‰É•Ìˆ€ü¹Õ±°€è€‰É•Ìˆ¤¤(€€€€€€€€€€€€€€€€€ô(€€€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€€€ñAÉ½µÁÑEÕ…±¥Ñå%½¸€¼ø(€€€€€€€€€€€€€€€€€íÉ•Í½±ÕÑ¥½¹ô(€€€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€€€€í½Á•¹É½Á‘½Ý¸€ôôô€‰É•Ìˆ€˜˜€ (€€€€€€€€€€€€€€€€€€ñÉ½Á‘½Ý¸(€€€€€€€€€€€€€€€€€€€Ñ¥Ñ±”ô‰I•Í½±ÕÑ¥½¸ˆ(€€€€€€€€€€€€€€€€€€€¥Ñ•µÌõíIM=1UQ%=9Mô(€€€€€€€€€€€€€€€€€€€Í•±•Ñ•õíÉ•Í½±ÕÑ¥½¹ô(€€€€€€€€€€€€€€€€€€€½¹M•±•ÐõíÍ•ÑI•Í½±ÕÑ¥½¹ô(€€€€€€€€€€€€€€€€€€€ÑÉ¥•ÉI•˜õíÉ•Í	Ñ¹I•™ô(€€€€€€€€€€€€€€€€€€€½¹±½Í”õì ¤€ôøÍ•Ñ=Á•¹É½Á‘½Ý¸¡¹Õ±°¥ô(€€€€€€€€€€€€€€€€€€¼ø(€€€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€€€ð½‘¥Øø((€€€€€€€€€€€€€ì¼¨MÕµµ…Éä…É€¡ÑÉ¥•ÉÌ½Ù•É±…ä¤€¨½ô(€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€€€€€±…ÍÍ9…µ”õíÁÉ½µÁÑ½¹ÑÉ½±±…ÍÍ9…µ”¡ì(€€€€€€€€€€€€€€€€€±…ÍÍ9…µ”è€‰Ñ•áÐµ±•™Ð½Ù•É™±½Üµ¡¥‘‘•¸Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÝ¡¥Ñ”¼ÜÀ¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ˆ°(€€€€€€€€€€€€€€€ô¥ô(€€€€€€€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•Ñ%Í=Ù•É±…å=Á•¸¡ÑÉÕ”¥ô(€€€€€€€€€€€€€€ø(€€€€€€€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Ü´Ä¸Ô ´Ä¸Ô‰œµlŒÈÉÍ••tÉ½Õ¹‘•µ™Õ±°Í¡…‘½Üµ±œÍ¡…‘½ÜµlŒÈÉÍ••t¼ÈÀÍ¡É¥¹¬´Àˆ€¼ø(€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µ…àµÜµlÄÈÁÁátÑÉÕ¹…Ñ”Ñ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÝ¡¥Ñ”¼ÜÀÉ½ÕÀµ¡½Ù•ÈéÑ•áÐµlŒÈÉÍ••tÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌˆø(€€€€€€€€€€€€€€€€€íÍ•ÑÑ¥¹Ì¹…µ•É…ôƒ
Üí™½Éµ…ÑMÕµµ…ÉåY…±Õ” ¥ô(€€€€€€€€€€€€€€€€ð½ÍÁ…¸ø(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ð½AÉ½µÁÑ½¹ÑÉ½±Ìø((€€€€€€€€€€€ì¼¨•¹•É…Ñ”	ÕÑÑ½¸€¨½ô(€€€€€€€€€€€€ñAÉ½µÁÑÑ¥½¸(€€€€€€€€€€€€€‘¥Í…‰±•õí¥Í•¹•É…Ñ¥¹œñð€…Í•ÑÑ¥¹Ì¹ÁÉ½µÁÐ¹ÑÉ¥´ ¥ô(€€€€€€€€€€€€€½¹±¥¬õí¡…¹‘±••¹•É…Ñ•ô(€€€€€€€€€€€€ø(€€€€€€€€€€€€€í¥Í•¹•É…Ñ¥¹œ€ü€ (€€€€€€€€€€€€€€€€ðø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰…¹¥µ…Ñ”µÍÁ¥¸¥¹±¥¹”µ‰±½¬Ñ•áÐµ‰±…¬ˆûŠ^0ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ù•¹•É…Ñ¥¹œ¸¸¸ð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð¼ø(€€€€€€€€€€€€€€¤€è€ (€€€€€€€€€€€€€€€€ðø(€€€€€€€€€€€€€€€€€€ñÍÁ…¸ùM¡½½ÐƒŠr˜€ÄÀð½ÍÁ…¸ø(€€€€€€€€€€€€€€€€ð¼ø(€€€€€€€€€€€€€€¥ô(€€€€€€€€€€€€ð½AÉ½µÁÑÑ¥½¸ø(€€€€€€€€€€ð½AÉ½µÁÑ½½Ñ•Èø(€€€€€€ð½AÉ½µÁÑ½µÁ½Í•Èø(€€€€€í™Õ±±ÍÉ••¹UÉ°€˜˜€ (€€€€€€€€ñ‘¥Ø€(€€€€€€€€€±…ÍÍ9…µ”ô‰™¥á•¥¹Í•Ð´ÀèµlÄÀÁt™±•à¥Ñ•µÌµ•¹Ñ•È©ÕÍÑ¥™äµ•¹Ñ•È‰œµ‰±…¬¼äÔ‰…­‘É½Àµ‰±ÕÈµÍ´…¹¥µ…Ñ”µ™…‘”µ¥¸ˆ(€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÕ±±ÍÉ••¹UÉ°¡¹Õ±°¥ô(€€€€€€€€ø(€€€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€€€ÑåÁ”ô‰‰ÕÑÑ½¸ˆ(€€€€€€€€€€€±…ÍÍ9…µ”ô‰…‰Í½±ÕÑ”Ñ½À´ØÉ¥¡Ð´ØÀ´Ì‰œµÝ¡¥Ñ”¼ÄÀ¡½Ù•Èé‰œµÝ¡¥Ñ”¼ÈÀÉ½Õ¹‘•µ™Õ±°Ñ•áÐµÝ¡¥Ñ”ÑÉ…¹Í¥Ñ¥½¸µ½±½ÉÌ‰½É‘•È‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀˆ(€€€€€€€€€€€½¹±¥¬õì¡”¤€ôøì(€€€€€€€€€€€€€”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¤ì(€€€€€€€€€€€€€Í•ÑÕ±±ÍÉ••¹UÉ°¡¹Õ±°¤ì(€€€€€€€€€€€õô(€€€€€€€€€€ø(€€€€€€€€€€€€ñÍÙœÝ¥‘Ñ ôˆÈÐˆ¡•¥¡ÐôˆÈÐˆÙ¥•Ý	½àôˆÀ€À€ÈÐ€ÈÐˆ™¥±°ô‰¹½¹”ˆÍÑÉ½­”ô‰ÕÉÉ•¹Ñ½±½ÈˆÍÑÉ½­•]¥‘Ñ ôˆÈ¸ÔˆÍÑÉ½­•1¥¹•…Àô‰É½Õ¹ˆÍÑÉ½­•1¥¹•©½¥¸ô‰É½Õ¹ˆø(€€€€€€€€€€€€€€ñ±¥¹”àÄôˆÄàˆäÄôˆØˆàÈôˆØˆäÈôˆÄàˆ€¼ø(€€€€€€€€€€€€€€ñ±¥¹”àÄôˆØˆäÄôˆØˆàÈôˆÄàˆäÈôˆÄàˆ€¼ø(€€€€€€€€€€€€ð½ÍÙœø(€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ñ¥µœ€(€€€€€€€€€€€ÍÉŒõí™Õ±±ÍÉ••¹UÉ±ô€(€€€€€€€€€€€…±Ðô‰Õ±±ÍÉ••¸AÉ•Ù¥•Üˆ€(€€€€€€€€€€€±…ÍÍ9…µ”ô‰µ…àµÜµläÕÙÝtµ…àµ µläÕÙ¡tÉ½Õ¹‘•´Éá°Í¡…‘½Ü´Éá°½‰©•Ðµ½¹Ñ…¥¸…¹¥µ…Ñ”µÍ…±”µÕÀˆ€(€€€€€€€€€€€½¹±¥¬õì¡”¤€ôø”¹ÍÑ½ÁAÉ½Á……Ñ¥½¸ ¥ô(€€€€€€€€€€¼ø(€€€€€€€€ð½‘¥Øø(€€€€€€¥ô€€(€€€€€ì¼¨ƒŠRŠR …µ•É„½¹ÑÉ½±Ì=Ù•É±…äƒŠRŠR €¨½ô(€€€€€€ñ…µ•É…½¹ÑÉ½±Í=Ù•É±…ä(€€€€€€€¥Í=Á•¸õí¥Í=Ù•É±…å=Á•¹ô(€€€€€€€½¹±½Í”õì ¤€ôøÍ•Ñ%Í=Ù•É±…å=Á•¸¡™…±Í”¥ô(€€€€€€€Í•ÑÑ¥¹ÌõíÍ•ÑÑ¥¹Íô(€€€€€€€½¹M•ÑÑ¥¹Í¡…¹”õíÍ•ÑM•ÑÑ¥¹Íô(€€€€€€¼ø(€€€€ð½‘¥Øø(€€¤ì)ô(