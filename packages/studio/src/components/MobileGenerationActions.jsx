"use client";

import { useState } from "react";

function ActionIcon({ kind }) {
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

export default function MobileGenerationActions({ actions = [] }) {
  const [open, setOpen] = useState(false);
  const availableActions = actions.filter(Boolean);

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
