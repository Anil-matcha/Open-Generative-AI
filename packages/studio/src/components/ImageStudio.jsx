"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { generateImage, generateI2I, uploadFile } from "../muapi.js";
import { formatErrorMessage } from "../utils/formatError.js";
import { scopedPersistKey, migrateLegacyPersistKey } from "../persistKey.js";
import DrawModal from "./DrawModal.jsx";
import {
  t2iModels,
  i2iModels,
  getAspectRatiosForModel,
  getResolutionsForModel,
  getQualityFieldForModel,
  getAspectRatiosForI2IModel,
  getResolutionsForI2IModel,
  getQualityFieldForI2IModel,
  getMaxImagesForI2IModel,
  getEffectsForI2IModel,
  getDefaultEffectForI2IModel,
  getI2IModelById,
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
  PromptQualityIcon,
  PromptTextarea,
  promptControlClassName,
  promptMediaButtonClassName,
} from "./prompt/PromptComposer.jsx";

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function downloadImage(url, filename) {
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

// â”€â”€â”€ UploadButton (inline picker) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function UploadButton({ apiKey, maxImages, onSelect, onClear, initialUrls = [], label = null, persistedHistory = null, onHistoryChange = null }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState([]); // [{url, thumbnail}]
  const [uploadHistory, setUploadHistory] = useState(persistedHistory || []); // [{id, name, url, thumbnail}]

  // Notify parent whenever uploadHistory changes (for localStorage persistence)
  const onHistoryChangeRef = useRef(onHistoryChange);
  onHistoryChangeRef.current = onHistoryChange;
  useEffect(() => {
    onHistoryChangeRef.current?.(uploadHistory);
  }, [uploadHistory]);

  // Sync if parent provides a new persistedHistory (e.g. on first mount from localStorage)
  useEffect(() => {
    if (persistedHistory && persistedHistory.length > 0) {
      setUploadHistory((prev) => {
        // Merge: add any entries from persistedHistory that aren't already present
        const existingUrls = new Set(prev.map(h => h.url));
        const missing = persistedHistory.filter(h => h.url && !existingUrls.has(h.url));
        return missing.length > 0 ? [...prev, ...missing] : prev;
      });
    }
  }, [persistedHistory]);
  
  const [lastUploadProgress, setLastUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [panelOpen]);

  // Sync initialUrls from parent (e.g. restored from localStorage)
  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      // Avoid infinite loops by only updating if URLs actually changed
      const currentUrls = selectedEntries.map(e => e.url);
      const isSame = initialUrls.length === currentUrls.length && initialUrls.every(u => currentUrls.includes(u));
      if (isSame) return;

      const newEntries = initialUrls.map(url => ({ url }));
      setSelectedEntries(newEntries);
      
      // Also ensure they are in the history panel
      setUploadHistory(prev => {
        const existingUrls = prev.map(h => h.url);
        const missing = initialUrls
          .filter(u => !existingUrls.includes(u))
          .map(u => ({ id: `restored-${u}`, name: "Restored Image", url: u, progress: 100 }));
        return [...missing, ...prev];
      });
    }
  }, [initialUrls]); // eslint-disable-line react-hooks/exhaustive-deps

  // When maxImages changes, trim excess selections
  useEffect(() => {
    if (selectedEntries.length > maxImages) {
      const trimmed = selectedEntries.slice(0, maxImages);
      setSelectedEntries(trimmed);
      if (trimmed.length === 0) onClear?.();
    }
    if (fileInputRef.current) {
      fileInputRef.current.multiple = maxImages > 1;
    }
  }, [maxImages]); // eslint-disable-line react-hooks/exhaustive-deps

  const fireOnSelect = useCallback(
    (entries) => {
      if (!entries.length) return;
      const urls = entries.map((e) => e.url);
      onSelect({ url: urls[0], urls, thumbnail: entries[0].url });
    },
    [onSelect],
  );

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const tooLarge = files.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (tooLarge.length > 0) {
      alert(
        `The following images are too large (max 10MB): ${tooLarge.map((f) => f.name).join(", ")}`,
      );
      return;
    }

    setUploading(true);
    try {
      const toUpload =
        maxImages === 1
          ? files.slice(0, 1)
          : files.slice(0, maxImages - selectedEntries.length || 1);

      await Promise.all(
        toUpload.map(async (file) => {
          const id = Date.now().toString() + Math.random();

          // Add a placeholder to history immediately without local preview
          const placeholder = { id, name: file.name, url: null, progress: 0 };
          setUploadHistory((prev) => [placeholder, ...prev]);

          try {
            const uploadedUrl = await uploadFile(apiKey, file, (pct) => {
              setLastUploadProgress(pct);
              setUploadHistory((prev) =>
                prev.map((h) => (h.id === id ? { ...h, progress: pct } : h)),
              );
            });

            // Update history with real URL and Mark as 100%
            setUploadHistory((prev) =>
              prev.map((h) => {
                if (h.id === id) {
                  return { ...h, url: uploadedUrl, progress: 100 };
                }
                return h;
              }),
            );

            // Auto-select if there's room
            if (selectedEntries.length < maxImages) {
              const newEntry = { url: uploadedUrl };
              setSelectedEntries((prev) => [...prev, newEntry]);

              if (maxImages === 1) {
                fireOnSelect([newEntry]);
                setPanelOpen(false);
              }
            }
          } catch (err) {
            console.error("[UploadButton] Upload failed for", file.name, err);
            setUploadHistory((prev) => prev.filter((h) => h.id !== id));
            throw err;
          }
        }),
      );
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setLastUploadProgress(0);
    }
  };

  const handleCellClick = (entry) => {
    const selIdx = selectedEntries.findIndex((e) => e.url === entry.url);
    const isSelected = selIdx !== -1;
    const atMax =
      maxImages > 1 && !isSelected && selectedEntries.length >= maxImages;
    if (atMax) return;

    if (maxImages === 1) {
      const newSelected = [{ url: entry.url, localUrl: entry.localUrl }];
      setSelectedEntries(newSelected);
      fireOnSelect(newSelected);
      setPanelOpen(false);
    } else {
      let next;
      if (isSelected) {
        next = selectedEntries.filter((_, i) => i !== selIdx);
        if (next.length === 0) onClear?.();
      } else {
        next = [
          ...selectedEntries,
          { url: entry.url, localUrl: entry.localUrl },
        ];
      }
      setSelectedEntries(next);
    }
  };

  const handleRemoveFromHistory = (e, entry) => {
    e.stopPropagation();
    if (entry.localUrl) URL.revokeObjectURL(entry.localUrl);
    setUploadHistory((prev) => prev.filter((h) => h.id !== entry.id));

    const next = selectedEntries.filter((s) => s.url !== entry.url);
    if (next.length !== selectedEntries.length) {
      setSelectedEntries(next);
      if (next.length === 0) onClear?.();
    }
  };

  const handleDone = (e) => {
    e.stopPropagation();
    fireOnSelect(selectedEntries);
    setPanelOpen(false);
  };

  const reset = () => {
    setSelectedEntries([]);
    setPanelOpen(false);
  };

  // expose reset via ref pattern â€” parent calls reset() directly
  // (handled by parent through uploadedImageUrls state reset)

  const isMulti = maxImages > 1;
  const count = selectedEntries.length;
  const hasSelection = count > 0;

  // Trigger icon content
  const triggerContent = uploading ? (
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
          strokeDashoffset={88 - (88 * lastUploadProgress) / 100}
          className="text-[#22d3ee] transition-all duration-300"
        />
      </svg>
      <span className="absolute text-[9px] font-black text-[#22d3ee] leading-none">
        {lastUploadProgress}%
      </span>
    </div>
  ) : label === "Swap Face" ? (
    hasSelection ? (
      <img src={selectedEntries[0].url} alt="" className="w-full h-full object-cover" />
    ) : (
      <span className="text-[10px] font-bold text-white/50">Face</span>
    )
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="text-white/40 group-hover:text-[#22d3ee] transition-colors"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  const defaultLabel = isMulti ? `Add up to ${maxImages} images` : "Reference image";
  const triggerTitle = hasSelection
    ? count > 1
      ? `${count} of ${maxImages} images selected â€” click to manage`
      : isMulti
        ? `1 image selected â€” click to add more (up to ${maxImages})`
        : label || "Reference image"
    : label || defaultLabel;

  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isMulti}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        title={triggerTitle}
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((o) => !o);
        }}
        className={promptMediaButtonClassName({
          active: hasSelection,
        })}
      >
        {triggerContent}
      </button>

      {/* Panel */}
      {panelOpen && (
        <PromptPopover
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="w-96 max-w-[calc(100vw-2rem)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1 pb-3 mb-2 border-b border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-secondary">
                Reference Images
              </span>
              {isMulti && (
                <span className="text-[9px] text-muted">
                  Select up to {maxImages} images
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isMulti && hasSelection && (
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-black rounded-xl text-xs font-black transition-all hover:scale-105"
                >
                  âœ“ Done ({count})
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition-all border border-primary/20"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {isMulti ? "Upload files" : "Upload new"}
              </button>
            </div>
          </div>

          {/* Grid or empty state */}
          {uploadHistory.length === 0 ? (
            <div className="py-6 flex flex-col items-center gap-2 opacity-40">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-secondary"
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-secondary">No uploads yet</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-0.5">
              {uploadHistory.map((entry) => {
                const selIdx = selectedEntries.findIndex(
                ×Ž9âÚ$z{-®éÜj×vRæf–b ¢ÇCÒ$7&VF—fR76WB" ¢6Æ74æÖSÒ'rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6÷fW" ¢óà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ'rÓ‚‚Ó‚6Ó§rÓ#B6Ó¦‚Ó#B&÷VæFVBÖgVÆÂ&÷&FW"&÷&FW"×v†—FRó6†F÷rÓ'†Â&÷FFRÕ³fFVuÒG&ç6f÷&Ò†÷fW#§&÷FFRÓ†÷fW#§66ÆRÓ†÷fW#§¢Ó#G&ç6—F–öâÖÆÂGW&F–öâÓ3÷fW&fÆ÷rÖ†–FFVâ&r×v†—FRõ³ãÒÖÖÂÓ26Ó¢ÖÖÂÓBfÆW‚×6‡&–æ²Ó#à¢Æ–Öp¢7&3Ò&‡GG3¢òöC6Gv¶'–‡‡—'Gæ6Æ÷VFg&öçBææWB÷vV&76WG2÷f–FVöÖöFVÇ2öæWFÖÇVÖ–ææf–b ¢ÇCÒ$7&VF—fR76WB2 ¢6Æ74æÖSÒ'rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6÷fW" ¢óà¢ÂöF—cà¢ÆF—b6Æ74æÖSÒ'rÓ‚‚Ó#"6Ó§rÓ#B6Ó¦‚Ó#‚&÷VæFVBÓ'†Â&÷&FW"&÷&FW"×v†—FRó6†F÷rÓ'†Â&÷FFRÕ³&FVuÒG&ç6f÷&Ò†÷fW#§&÷FFRÓ†÷fW#§66ÆRÓ†÷fW#§¢Ó#G&ç6—F–öâÖÆÂGW&F–öâÓ3÷fW&fÆ÷rÖ†–FFVâ&r×v†—FRõ³ãÒÖÖÂÓ26Ó¢ÖÖÂÓBfÆW‚×6‡&–æ²Ó#à¢Æ–Öp¢7&3Ò&‡GG3¢òöC6Gv¶'–‡‡—'Gæ6Æ÷VFg&öçBææWB÷vV&76WG2÷f–FVöÖöFVÇ2÷W&fV7B×öç’×†Âæf–b ¢ÇCÒ$7&VF—fR76WBB ¢6Æ74æÖSÒ'rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6÷fW" ¢óà¢ÂöF—cà¢ÂöF—cà ¢Æƒ6Æ74æÖSÒ'FW‡BÓ'†Â6Ó§FW‡BÓG†ÂÖC§FW‡BÓW†ÂföçBÖW‡G&&öÆBG&6¶–ær×F–v‡BÖ"ÓBFW‡BÖ6VçFW"‚ÓBfÆW‚fÆW‚Ö6öÂ—FV×2Ö6VçFW"#à¢Ç7â6Æ74æÖSÒ'FW‡B×v†—FRföçBÖ&Æ6²WW&66RFW‡B×†Â6Ó§FW‡BÓ7†ÂG&6¶–ær×v–FRÖ"Ó÷6—G’Ó“#å5D%B5$TD”ärt•DƒÂ÷7ãà¢Ç7â6Æ74æÖSÒ'FW‡BÕ²3#&C6VUÒföçBÖ&Æ6²WW&66RFW‡BÓ'†Â6Ó§FW‡BÓG†Â6Ó¦×BÓG&6¶–ær×F–v‡B#à¢·6VÆV7FVDÖöFVÄæÖWÐ¢Â÷7ãà¢Âöƒà¢Ç6Æ74æÖSÒ'FW‡B×v†—FRóCFW‡B×‡26Ó§FW‡B×6ÒföçBÖÖVF—VÒG&6¶–ær×v–FRFW‡BÖ6VçFW"Ö‚×rÖÆrÆVF–ær×&VÆ†VB‚ÓB#à¢FW67&–&R66VæRÂ6†&7FW"ÂÖööBÂ÷"7G–ÆR(	BæBvF6‚—B6öÖRFòÆ–fP¢Â÷à¢ÂöF—cà¢—Ð¢ÂöF—cà ¢²ò¢)H)H$õEDôÒ$ôÕB$")H)H¢÷Ð¢Å&ö×D6ö×÷6W#à¢²ò¢F÷&÷s¢WÆöB–6¶W"²FW‡F&V¢÷Ð¢ÆF—b6Æ74æÖSÒ&fÆW‚fÆW‚Ö6öÂvÓ2#à¢²ò¢–æÆ–æRÆ—7BöbWÆöFVBf–ÆW2¢÷Ð¢ÆF—b6Æ74æÖSÒ&fÆW‚—FV×2Ö6VçFW"vÓ"ãRfÆW‚×w&#à¢·WÆöFVD–ÖvUW&Ç2bbWÆöFVD–ÖvUW&Ç2æÆVæwF‚âbbWÆöFVD–ÖvUW&Ç2æÖ‚‡W&ÂÂ–G‚’Óâ€¢ÆF—b¶W“×·W&ÇÒ6Æ74æÖS×µ$ôÕEôÔTD”õ$Ud”Uuô4Ä57Óà¢Æ–Ör7&3×·W&ÇÒÇCÒ""6Æ74æÖSÒ'rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6÷fW""óà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ°¢6öç7BæW‡BÒWÆöFVD–ÖvUW&Ç2æf–ÇFW"‚…òÂ’’Óâ’ÓÒ–G‚“°¢6WEWÆöFVD–ÖvUW&Ç2†æW‡B“°¢–b†æW‡BæÆVæwF‚ÓÓÒ’†æFÆUWÆöD6ÆV"‚“°¢×Ð¢6Æ74æÖSÒ&'6öÇWFRF÷ÓãR&–v‡BÓãRrÓB‚ÓB&rÖ&Æ6²óc†÷fW#¦&rÖ&Æ6²&÷VæFVBÖgVÆÂfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"FW‡B×v†—FRóƒR†÷fW#§FW‡B×v†—FRFW‡BÕ³‡…Ò&÷&FW"&÷&FW"×v†—FRóR ¢à¢9p¢Âö'WGFöãà¢ÂöF—cà¢’—Ð¢ ¢²ò¢Ö–âWÆöBG&–vvW"¢÷Ð¢·WÆöFVD–ÖvUW&Ç2æÆVæwF‚ÂÖ„–ÖvW2bb€¢ÅWÆöD'WGFöà¢”¶W“×¶”¶W—Ð¢Ö„–ÖvW3×¶Ö„–ÖvW7Ð¢öå6VÆV7C×¶†æFÆUWÆöE6VÆV7GÐ¢öä6ÆV#×¶†æFÆUWÆöD6ÆV'Ð¢–æ—F–ÅW&Ç3×·WÆöFVD–ÖvUW&Ç7Ð¢W'6—7FVD†—7F÷'“×·WÆöD†—7F÷'—Ð¢öä†—7F÷'”6†ævS×·6WEWÆöD†—7F÷'—Ð¢óà¢—Ð ¢²ò¢7v–ÖvRWÆöBG&–vvW"¢÷Ð¢¶–ÖvTÖöFRbbvWD“$”ÖöFVÄ'”–B‡6VÆV7FVDÖöFVÄ–B“òç7vf–VÆBbb€¢ÅWÆöD'WGFöà¢”¶W“×¶”¶W—Ð¢Ö„–ÖvW3×³Ð¢öå6VÆV7C×²‡²W&Ç2Ò’Óâ6WE7v–ÖvUW&Â‡W&Ç5³ÒÇÂçVÆÂ—Ð¢öä6ÆV#×²‚’Óâ6WE7v–ÖvUW&Â†çVÆÂ—Ð¢–æ—F–ÅW&Ç3×·7v–ÖvUW&Âò·7v–ÖvUW&ÅÒ¢µ×Ð¢Æ&VÃÒ%7vf6R ¢óà¢—Ð¢ÂöF—cà ¢²ò¢–çWB&ö×BFW‡B&V¢÷Ð¢Å&ö×EFW‡F&V¢&Vc×·FW‡F&V&VgÐ¢fÇVS×·&ö×GÐ¢öä6†ævS×²†R’Óâ6WE&ö×B†RçF&vWBçfÇVR—Ð¢Æ6V†öÆFW#×·Æ6V†öÆFW%FW‡GÐ¢óà¢ÂöF—cà ¢²ò¢&÷GFöÒ&÷s¢6öçG&öÇ2²vVæW&FR¢÷Ð¢Å&ö×Dfö÷FW#à¢²ò¢ÆVgB6öçG&öÇ2¢÷Ð¢Å&ö×D6öçG&öÇ2&Vc×¶G&÷F÷vå&VgÓà¢²ò¢ÖöFVÂ'WGFöâ¢÷Ð¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WDG&÷F÷vä÷Vâ‚†ò’Óâ†òÓÓÒ&ÖöFVÂ"òçVÆÂ¢&ÖöFVÂ"’“°¢×Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢G&÷F÷vä÷VâÓÓÒ&ÖöFVÂ"À¢Ò—Ð¢à¢ÆF—b6Æ74æÖSÒ'rÓB‚ÓB&÷VæFVB÷fW&fÆ÷rÖ†–FFVâ6‡&–æ²ÓfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"&r×v†—FRóR#à¢²‚‚’Óâ°¢6öç7B6VÆV7FVDÖöFVÄö&¢Ò7W'&VçDÖöFVÇ2æf–æB†ÒÓâÒæ–BÓÓÒ6VÆV7FVDÖöFVÄ–B“°¢6öç7B6VÆV7FVDÖöFVÅ&÷f–FW"Ò6VÆV7FVDÖöFVÄö&£òç&÷f–FW"ÇÂv×V’s°¢&WGW&â$õd”DU%ôÄôtõ5·6VÆV7FVDÖöFVÅ&÷f–FW%Òò€¢Æ–Ör ¢7&3×µ$õd”DU%ôÄôtõ5·6VÆV7FVDÖöFVÅ&÷f–FW%×Ò ¢ÇCÒ"" ¢6Æ74æÖS×¶rÖgVÆÂ‚ÖgVÆÂö&¦V7BÖ6öçF–âG¶–çfW'DÆöv÷2æ–æ6ÇVFW2‡6VÆV7FVDÖöFVÅ&÷f–FW"’ò&–çfW'B"¢"'ÖÒ ¢óà¢’¢€¢Ç7â6Æ74æÖSÒ'FW‡BÕ³—…ÒföçBÖ&öÆBFW‡BÖ&Æ6²WW&66R#äsÂ÷7ãà¢“°¢Ò’‚—Ð¢ÂöF—cà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVDÖöFVÄæÖWÐ¢Â÷7ãà¢Å&ö×D6†Wg&öä–6öâóà¢Âö'WGFöãà ¢¶G&÷F÷vä÷VâÓÓÒ&ÖöFVÂ"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢6Æ74æÖSÒ'rÕ¶6Æ2ƒgrÓ'&VÒ•ÒÖC§rÕ³Cƒ…ÒÖ‚×rÖÖBÖC¦Ö‚×rÖæöæRÖ‚Ö‚Õ³sf…Ò ¢à¢Å&ö×E÷÷fW$†VFW#äÖöFVÃÂõ&ö×E÷÷fW$†VFW#à¢ÄÖöFVÄG&÷F÷và¢ÖöFVÇ3×¶7W'&VçDÖöFVÇ7Ð¢6VÆV7FVDÖöFVÃ×·6VÆV7FVDÖöFVÄ–GÐ¢öå6VÆV7C×¶†æFÆTÖöFVÅ6VÆV7GÐ¢öä6Æ÷6S×²‚’Óâ6WDG&÷F÷vä÷Vâ†çVÆÂ—Ð¢óà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà ¢²ò¢7V7B&F–ò'WGFöâ¢÷Ð¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WDG&÷F÷vä÷Vâ‚†ò’Óâ†òÓÓÒ&""òçVÆÂ¢&""’“°¢×Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢G&÷F÷vä÷VâÓÓÒ&""À¢Ò—Ð¢à¢Å&ö×D7V7E&F–ô–6öâóà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVD'Ð¢Â÷7ãà¢Âö'WGFöãà ¢¶G&÷F÷vä÷VâÓÓÒ&""bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢à¢Å6–×ÆTG&÷F÷và¢F—FÆSÒ$7V7B&F–ò ¢÷F–öç3×¶7W'&VçD7V7E&F–÷7Ð¢6VÆV7FVC×·6VÆV7FVD'Ð¢öå6VÆV7C×²‡fÂ’Óâ6WE6VÆV7FVD"‡fÂ—Ð¢öä6Æ÷6S×²‚’Óâ6WDG&÷F÷vä÷Vâ†çVÆÂ—Ð¢óà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà ¢²ò¢VÆ—G’÷&W6öÇWF–öâ'WGFöâ‡&W&W6VçFVB2F–ÖöæB–6öâ’¢÷Ð¢·6†÷uVÆ—G”'Fâbb€¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WDG&÷F÷vä÷Vâ‚†ò’Óâ†òÓÓÒ'VÆ—G’"òçVÆÂ¢'VÆ—G’"’“°¢×Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢G&÷F÷vä÷VâÓÓÒ'VÆ—G’"À¢Ò—Ð¢à¢Å&ö×EVÆ—G”–6öâóà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢·6VÆV7FVEVÆ—G’ÇÂ7W'&VçE&W6öÇWF–öç5³×Ð¢Â÷7ãà¢Âö'WGFöãà ¢¶G&÷F÷vä÷VâÓÓÒ'VÆ—G’"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢à¢Å6–×ÆTG&÷F÷và¢F—FÆSÒ%&W6öÇWF–öâ ¢÷F–öç3×¶7W'&VçE&W6öÇWF–öç7Ð¢6VÆV7FVC×·6VÆV7FVEVÆ—G—Ð¢öå6VÆV7C×²‡fÂ’Óâ6WE6VÆV7FVEVÆ—G’‡fÂ—Ð¢öä6Æ÷6S×²‚’Óâ6WDG&÷F÷vä÷Vâ†çVÆÂ—Ð¢óà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà¢—Ð ¢²ò¢VffV7BG—R'WGFöâ¢÷Ð¢·6†÷tVffV7D'Fâbb€¢ÆF—b6Æ74æÖSÒ'&VÆF—fR#à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WDG&÷F÷vä÷Vâ‚†ò’Óâ†òÓÓÒ&VffV7B"òçVÆÂ¢&VffV7B"’“°¢×Ð¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡°¢7F—fS¢G&÷F÷vä÷VâÓÓÒ&VffV7B"À¢Ò—Ð¢à¢Ç7frv–GFƒÒ#b"†V–v‡CÒ#b"f–Wt&÷ƒÒ##B#B"f–ÆÃÒ&æöæR"7G&ö¶SÒ&7W'&VçD6öÆ÷""7G&ö¶Uv–GFƒÒ#""6Æ74æÖSÒ&÷6—G’ÓCFW‡B×v†—FR#à¢ÇF‚CÒ$ÓR6ÃB’ÓB•c7¢"óà¢Â÷7fsà¢Ç7â6Æ74æÖS×¶Gµ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57ÒÖ‚×rÕ³C…ÒG'Væ6FVÓà¢·6VÆV7FVDVffV7BÇÂ$VffV7B'Ð¢Â÷7ãà¢Âö'WGFöãà ¢¶G&÷F÷vä÷VâÓÓÒ&VffV7B"bb€¢Å&ö×E÷÷fW ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢6Æ74æÖSÒ&Ö–â×rÕ³#…Ò ¢à¢Å6–×ÆTG&÷F÷và¢F—FÆSÒ$VffV7BG—R ¢÷F–öç3×¶7W'&VçDVffV7G7Ð¢6VÆV7FVC×·6VÆV7FVDVffV7GÐ¢öå6VÆV7C×²‡fÂ’Óâ6WE6VÆV7FVDVffV7B‡fÂ—Ð¢öä6Æ÷6S×²‚’Óâ6WDG&÷F÷vä÷Vâ†çVÆÂ—Ð¢óà¢Âõ&ö×E÷÷fW#à¢—Ð¢ÂöF—cà¢—Ð ¢²ò¢&F6‚6—¦R7FWW"¢÷Ð¢ÆF—b6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‡²6ö×7C¢G'VRÂ6Æ74æÖS¢'6VÆV7BÖæöæR"Ò—Óà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ6WD&F6…6—¦R‡&WbÓâÖF‚æÖ‚ƒÂ&WbÒ’—Ð¢6Æ74æÖSÒ'FW‡B×v†—FRóC†÷fW#§FW‡B×v†—FRóƒföçBÖW‡G&&öÆBFW‡B×‡2G&ç6—F–öâÖ6öÆ÷'2‚Ó ¢à¢Ð¢Âö'WGFöãà¢Ç7â6Æ74æÖSÒ'FW‡B×‡2föçB×6VÖ–&öÆBFW‡B×v†—FRósÖ–â×rÕ³#G…ÒFW‡BÖ6VçFW"#à¢¶&F6…6—¦WÒó@¢Â÷7ãà¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢öä6Æ–6³×²‚’Óâ6WD&F6…6—¦R‡&WbÓâÖF‚æÖ–âƒBÂ&Wb²’—Ð¢6Æ74æÖSÒ'FW‡B×v†—FRóC†÷fW#§FW‡B×v†—FRóƒföçBÖW‡G&&öÆBFW‡B×‡2G&ç6—F–öâÖ6öÆ÷'2‚Ó ¢à¢°¢Âö'WGFöãà¢ÂöF—cà ¢²ò¢G&r'WGFöâ¢÷Ð¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢6Æ74æÖS×·&ö×D6öçG&öÄ6Æ74æÖR‚—Ð¢öä6Æ–6³×²‚’Óâ6WD—4G&tÖöFÄ÷Vâ‡G'VR—Ð¢à¢Ç7frv–GFƒÒ#b"†V–v‡CÒ#b"f–Wt&÷ƒÒ##B#B"f–ÆÃÒ&æöæR"7G&ö¶SÒ&7W'&VçD6öÆ÷""7G&ö¶Uv–GFƒÒ#"ãR"6Æ74æÖSÒ&÷6—G’ÓCFW‡B×v†—FRw&÷WÖ†÷fW#§FW‡BÕ²3#&C6VUÒG&ç6—F–öâÖ6öÆ÷'2#à¢ÇF‚CÒ$Ó"#ƒ’"óà¢ÇF‚CÒ$ÓbãR2ãV"ã#"ã#24Ãr–ÂÓBÓDÃbãR2ãW¢"óà¢Â÷7fsà¢Ç7â6Æ74æÖS×µ$ôÕEô4ôåE$ôÅôÄ$TÅô4Ä57Óà¢G&p¢Â÷7ãà¢Âö'WGFöãà¢Âõ&ö×D6öçG&öÇ3à ¢²ò¢vVæW&FR'WGFöâ¢÷Ð¢Å&ö×D7F–öà¢öä6Æ–6³×¶†æFÆTvVæW&FWÐ¢F—6&ÆVC×¶vVæW&F–æwÐ¢à¢¶vVæW&F–ærò€¢Ãà¢Ç7â6Æ74æÖSÒ&æ–ÖFR×7–â–æÆ–æRÖ&Æö6²FW‡BÖ&Æ6²#î)xÃÂ÷7ãà¢vVæW&F–ærââà¢Âóà¢’¢€¢Ãà¢Ç7ãävVæW&FR)ÊcÂ÷7ãà¢Âóà¢—Ð¢Âõ&ö×D7F–öãà¢Âõ&ö×Dfö÷FW#à¢Âõ&ö×D6ö×÷6W#à ¢²ò¢)H)HeTÄÅ45$TTâ”ÔtRÔôDÂ)H)H¢÷Ð¢¶gVÆÇ67&VVåW&Âbb€¢ÆF—b ¢6Æ74æÖSÒ&f—†VB–ç6WBÓ¢Õ³ÒfÆW‚—FV×2Ö6VçFW"§W7F–g’Ö6VçFW"&rÖ&Æ6²ó“R&6¶G&÷Ö&ÇW"×6Òæ–ÖFRÖfFRÖ–â ¢öä6Æ–6³×²‚’Óâ6WDgVÆÇ67&VVåW&Â†çVÆÂ—Ð¢à¢Æ'WGFöà¢G—SÒ&'WGFöâ ¢6Æ74æÖSÒ&'6öÇWFRF÷Ób&–v‡BÓbÓ2&r×v†—FRó†÷fW#¦&r×v†—FRó#&÷VæFVBÖgVÆÂFW‡B×v†—FRG&ç6—F–öâÖ6öÆ÷'2&÷&FW"&÷&FW"×v†—FRó ¢öä6Æ–6³×²†R’Óâ°¢Rç7F÷&÷vF–öâ‚“°¢6WDgVÆÇ67&VVåW&Â†çVÆÂ“°¢×Ð¢à¢Ç7frv–GFƒÒ##B"†V–v‡CÒ##B"f–Wt&÷ƒÒ##B#B"f–ÆÃÒ&æöæR"7G&ö¶SÒ&7W'&VçD6öÆ÷""7G&ö¶Uv–GFƒÒ#"ãR"7G&ö¶TÆ–æV6Ò'&÷VæB"7G&ö¶TÆ–æV¦ö–ãÒ'&÷VæB#à¢ÆÆ–æRƒÒ#‚"“Ò#b"ƒ#Ò#b"“#Ò#‚"óà¢ÆÆ–æRƒÒ#b"“Ò#b"ƒ#Ò#‚"“#Ò#‚"óà¢Â÷7fsà¢Âö'WGFöãà¢Æ–Ör ¢7&3×¶gVÆÇ67&VVåW&ÇÒ ¢ÇCÒ$gVÆÇ67&VVâ&Wf–Wr" ¢6Æ74æÖSÒ&Ö‚×rÕ³“WguÒÖ‚Ö‚Õ³“Wf…Ò&÷VæFVBÓ'†Â6†F÷rÓ'†Âö&¦V7BÖ6öçF–âæ–ÖFR×66ÆR×W" ¢öä6Æ–6³×²†R’ÓâRç7F÷&÷vF–öâ‚—Ð¢óà¢ÂöF—cà¢—Ð ¢²ò¢)H)HE$r4åd2ÔôDÂ)H)H¢÷Ð¢ÄG&tÖöFÀ¢—4÷Vã×¶—4G&tÖöFÄ÷VçÐ¢öä6Æ÷6S×²‚’Óâ6WD—4G&tÖöFÄ÷Vâ†fÇ6R—Ð¢”¶W“×¶”¶W—Ð¢&F6…6—¦S×³Ð¢öäFD†—7F÷'”—FVÓ×¶FEFô†—7F÷'—Ð¢óà¢ÅFö7FW"÷6—F–öãÒ'F÷×&–v‡B"6öçF–æW%7G–ÆS×·²¤–æFWƒ¢““““’×ÒFö7D÷F–öç3×·²GW&F–öã¢SÂ7G–ÆS¢²&6¶w&÷VæC¢r3ƒƒ"rÂ6öÆ÷#¢r6fffffbrÂ&÷&FW#¢s‚6öÆ–B&v&ƒ#SRÃ#SRÃ#SRÃãR’rÂföçE6—¦S¢s7‚rÂ&÷&FW%&F—W3¢s'‚rÂ&÷…6†F÷s¢s‚3‚&v&ƒÃÃÃãb’rÂÖ…v–GFƒ¢sCC‚rÂv÷&D'&V³¢v'&V²×v÷&BrÂv†—FU76S¢w&R×w&rÂFF–æs¢s'‚g‚rÒ×Òóà¢ÂöF—cà¢“°§Ð