"use client";

import { useState } from "react";

async function getClipboardPngBlob(url) {
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

async function copyPrompt(prompt) {
  if (!prompt) return;
  await navigator.clipboard.writeText(prompt);
}

async function copyImage(url) {
  if (!url) return;
  if (
    !window.isSecureContext ||
    !navigator.clipboard?.write ||
    typeof window.ClipboardItem === "undefined"
  ) {
    throw new Error("Image clipboard access requires HTTPS or localhost.");
  }

  await navigator.clipboard.write([
    new window.ClipboardItem({
      "image/png": getClipboardPngBlob(url),
    }),
  ]);
}

export function CopyContentIcon({ kind, size = 19 }) {
  const isText = kind === "text";

  if (!isText) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 5V4.5A2.5 2.5 0 018.5 2H19a3 3 0 013 3v10.5a2.5 2.5 0 01-2.5 2.5H19" opacity="0.65" />
        <rect x="2" y="6" width="17" height="16" rx="2.5" strokeWidth="2.2" />
        <circle cx="6.5" cy="10.5" r="1.25" />
        <path d="M3.5 19l4.2-4.4 3.1 3.1 2.4-2.5 4.3 4.2" strokeWidth="2.2" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 3.5h13" strokeWidth="2.7" />
      <path d="M9 3.5v14" strokeWidth="2.7" />
      <path
        d="M19 15.25V14.2A1.2 1.2 0 0017.8 13h-3.6a1.2 1.2 0 00-1.2 1.2v3.6a1.2 1.2 0 001.2 1.2h1.05"
        strokeWidth="1.6"
      />
      <rect x="15.25" y="15.25" width="6.25" height="6.25" rx="1.15" strokeWidth="1.6" />
    </svg>
  );
}

function CopiedIcon({ size = 15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

export function GenerationCopyButtons({
  prompt,
  imageUrl,
  onCopyError,
}) {
  const [copiedKind, setCopiedKind] = useState(null);

  const runCopy = async (event, kind) => {
    event.stopPropagation();

    try {
      if (kind === "text") {
        await copyPrompt(prompt);
      } else {
        await copyImage(imageUrl);
      }

      setCopiedKind(kind);
      window.setTimeout(() => {
        setCopiedKind((current) => (current === kind ? null : current));
      }, 1600);
    } catch (error) {
      const contentLabel = kind === "text" ? "the prompt" : "the image";
      console.error(`Failed to copy ${contentLabel}:`, error);
      onCopyError?.(
        kind === "text"
          ? "Could not copy the prompt to the clipboard."
          : "Could not copy the image. Image copy requires HTTPS or localhost.",
      );
    }
  };

  return (
    <>
      {prompt && (
        <button
          type="button"
          title={copiedKind === "text" ? "Prompt copied" : "Copy prompt"}
          aria-label={copiedKind === "text" ? "Prompt copied" : "Copy prompt"}
          onClick={(event) => runCopy(event, "text")}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ${
            copiedKind === "text" ? "text-[#22d3ee]" : "text-white"
          }`}
        >
          {copiedKind === "text" ? (
            <CopiedIcon />
          ) : (
            <CopyContentIcon kind="text" size={17} />
          )}
        </button>
      )}
      {imageUrl && (
        <button
          type="button"
          title={copiedKind === "image" ? "Image copied" : "Copy image"}
          aria-label={copiedKind === "image" ? "Image copied" : "Copy image"}
          onClick={(event) => runCopy(event, "image")}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-md transition-all hover:bg-[#22d3ee] hover:text-black ${
            copiedKind === "image" ? "text-[#22d3ee]" : "text-white"
          }`}
        >
          {copiedKind === "image" ? (
            <CopiedIcon />
          ) : (
            <CopyContentIcon kind="image" size={17} />
          )}
        </button>
      )}
    </>
  );
}

function ActionIcon({ kind }) {
  if (kind === "text") {
    return <CopyContentIcon kind="text" />;
  }

  if (kind === "image") {
    return <CopyContentIcon kind="image" />;
  }

  if (kind === "download") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <path d="M7 10l5 5 5-5M12 15V3" />
      </svg>
    );
  }

  if (kind === "delete") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    );
  }

  if (kind === "extend") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    );
  }

  if (kind === "remix") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4" />
        <path d="M21 13v2a3 3 0 01-3 3H3" />
      </svg>
    );
  }

  if (kind === "copy") {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3" />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

export default function MobileGenerationActions({
  actions = [],
  prompt,
  imageUrl,
  onCopyError,
}) {
  const [open, setOpen] = useState(false);
  const copyActions = [
    prompt
      ? {
          kind: "text",
          label: "Copy prompt",
          onSelect: async () => {
            try {
              await copyPrompt(prompt);
            } catch (error) {
              console.error("Failed to copy the prompt:", error);
              onCopyError?.("Could not copy the prompt to the clipboard.");
            }
          },
        }
      : null,
    imageUrl
      ? {
          kind: "image",
          label: "Copy image",
          onSelect: async () => {
            try {
              await copyImage(imageUrl);
            } catch (error) {
              console.error("Failed to copy the image:", error);
              onCopyError?.(
                "Could not copy the image. Image copy requires HTTPS or localhost.",
              );
            }
          },
        }
      : null,
  ];
  const availableActions = [...copyActions, ...actions].filter(Boolean);

  if (availableActions.length === 0) return null;

  const stopCardClick = (event) => {
    event.stopPropagation();
  };

  const runAction = (event, action) => {
    event.stopPropagation();
    setOpen(false);
    action.onSelect?.();
  };

  return (
    <div className="absolute right-2 top-2 z-40 md:hidden" onClick={stopCardClick}>
      {open && (
        <button
          type="button"
          aria-label="Close actions"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
          }}
        />
      )}

      <button
        type="button"
        aria-label="Generation actions"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="relative z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur-md active:scale-95"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 min-w-[178px] overflow-hidden rounded-xl border border-white/15 bg-[#151515]/95 p-1.5 shadow-2xl backdrop-blur-xl">
          {availableActions.map((action) => (
            <button
              key={`${action.kind}-${action.label}`}
              type="button"
              onClick={(event) => runAction(event, action)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition-colors ${
                action.danger
                  ? "text-red-400 hover:bg-red-500/15 active:bg-red-500/20"
                  : "text-white hover:bg-white/10 active:bg-white/15"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center">
                <ActionIcon kind={action.kind} />
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
