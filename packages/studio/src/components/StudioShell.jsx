"use client";

import React from "react";

function AppMark({ title = "MozenAIGC" }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="hidden text-sm font-bold tracking-tight sm:block">{title}</span>
    </div>
  );
}

function TabStatus({ status, active }) {
  if (!status) return null;

  return (
    <span className={`rounded px-1 py-0.5 text-[9px] font-black leading-none ${
      active ? "bg-black/10 text-black/55" : "bg-white/10 text-white/35"
    }`}>
      {status}
    </span>
  );
}

function WebHeader({
  title,
  activeTab,
  primaryTabs = [],
  secondaryTabs = [],
  onTabChange,
  onOpenTaskCenter,
  apiStatusAction,
  rightActions,
  otherAppsRef,
  otherAppsOpen,
  onToggleOtherApps,
  onCloseOtherApps,
}) {
  const isOtherActive = secondaryTabs.some((tab) => tab.id === activeTab);

  return (
    <header className="z-40 flex h-14 flex-shrink-0 items-center justify-between gap-2 border-b border-white/[0.03] bg-black/20 px-3 backdrop-blur-md md:px-6">
      <AppMark title={title} />

      <nav className="custom-scrollbar-thin static flex min-w-0 flex-1 items-center gap-4 overflow-x-auto md:absolute md:left-1/2 md:min-w-max md:-translate-x-1/2 md:overflow-visible md:gap-5">
        {primaryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={`relative whitespace-nowrap px-1 py-4 text-[13px] font-medium transition-all ${
              activeTab === tab.id ? "text-[#d9ff00]" : "text-white/50 hover:text-white"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              <span>{tab.label}</span>
              <TabStatus status={tab.status} active={false} />
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#d9ff00]" />
            )}
          </button>
        ))}

        {onOpenTaskCenter && (
          <button
            type="button"
            onClick={onOpenTaskCenter}
            className="relative whitespace-nowrap px-1 py-4 text-[13px] font-medium text-white/50 transition-all hover:text-[#d9ff00]"
          >
            任务中心
          </button>
        )}

        {secondaryTabs.length > 0 && (
          <div ref={otherAppsRef} className="relative">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleOtherApps?.();
              }}
              className={`relative flex items-center gap-1 whitespace-nowrap px-1 py-4 text-[13px] font-medium transition-all ${
                isOtherActive ? "text-[#d9ff00]" : "text-white/50 hover:text-white"
              }`}
            >
              其他应用
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                <path d="M6 9l6 6 6-6" />
              </svg>
              {isOtherActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#d9ff00]" />
              )}
            </button>

            {otherAppsOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-2 w-44 -translate-x-1/2 rounded-md border border-white/[0.08] bg-[#080808]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                {secondaryTabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        onTabChange?.(tab.id);
                        onCloseOtherApps?.();
                      }}
                      className={`flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-[12px] font-bold transition-colors ${
                        active
                          ? "bg-[#d9ff00] text-black"
                          : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>{tab.label}</span>
                        <TabStatus status={tab.status} active={active} />
                      </span>
                      {active && <span className="text-[10px]">当前</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        {apiStatusAction}
        {rightActions}
      </div>
    </header>
  );
}

function DesktopApiKeyNotice({ activeProvider, onOpenProviders, visible }) {
  if (!visible || !activeProvider) return null;

  return (
    <div className="border-b border-white/10 bg-yellow-300/10 px-4 py-2 text-sm text-yellow-100">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span>
          {activeProvider.name} 还没有可用的 {activeProvider.apiKeyLabel || "API Key"}。
        </span>
        <button
          type="button"
          className="h-8 rounded-md border border-yellow-200/20 px-3 text-xs font-semibold hover:bg-yellow-200/10"
          onClick={onOpenProviders}
        >
          Open API Providers
        </button>
      </div>
    </div>
  );
}

function DesktopShell({
  title = "MozenAIGC Desktop",
  subtitle = "Shared Studio renderer",
  tabs = [],
  activeTab,
  onTabChange,
  runtimePanel,
  rightActions,
  activeProvider,
  onOpenProviders,
  showMissingApiKeyNotice,
  children,
}) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-app-bg text-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-normal">{title}</h1>
          <p className="truncate text-xs text-zinc-500">{subtitle}</p>
        </div>
        {runtimePanel}
        {rightActions}
      </header>

      <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 bg-black/40 px-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition",
              activeTab === item.id ? "bg-primary text-black" : "text-zinc-300 hover:bg-white/5",
            ].join(" ")}
            aria-current={activeTab === item.id ? "page" : undefined}
            onClick={() => onTabChange?.(item.id)}
          >
            <span>{item.label}</span>
            {item.stage && (
              <span className={activeTab === item.id ? "text-xs text-black/60" : "text-xs text-zinc-500"}>
                {item.stage}
              </span>
            )}
          </button>
        ))}
      </div>

      <DesktopApiKeyNotice
        activeProvider={activeProvider}
        onOpenProviders={onOpenProviders}
        visible={showMissingApiKeyNotice}
      />

      {children}
    </div>
  );
}

export default function StudioShell({ variant = "web", children, headerVisible = true, ...props }) {
  if (variant === "desktop") {
    return <DesktopShell {...props}>{children}</DesktopShell>;
  }

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-[#030303] text-white"
      onDragOver={props.onDragOver}
      onDragEnter={props.onDragEnter}
      onDragLeave={props.onDragLeave}
      onDrop={props.onDrop}
    >
      {headerVisible && <WebHeader {...props} />}
      {children}
    </div>
  );
}

export { StudioShell };
