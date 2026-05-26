import React, { Suspense, useCallback, useState } from 'react';
import StudioShell from '@studio/components/StudioShell.jsx';
import TaskCenter from '@studio/components/TaskCenter.jsx';
import { isProviderReady } from '@studio/apiProviders.js';
import { useApiProviderState } from '@studio/useApiProviderState.js';

const h = React.createElement;

const ImageStudio = React.lazy(() => import('@studio/components/ImageStudio.jsx'));
const VideoStudio = React.lazy(() => import('@studio/components/VideoStudio.jsx'));
const MarketingStudio = React.lazy(() => import('@studio/components/MarketingStudio.jsx'));
const WorkflowStudio = React.lazy(() => import('@studio/components/WorkflowStudio.jsx'));
const AgentStudio = React.lazy(() => import('@studio/components/AgentStudio.jsx'));
const AppsStudio = React.lazy(() => import('@studio/components/AppsStudio.jsx'));
const ApiProviderStudio = React.lazy(() => import('@studio/components/ApiProviderStudio.jsx'));
const ApiHealthStudio = React.lazy(() => import('@studio/components/ApiHealthStudio.jsx'));
const LocalModelManager = React.lazy(() => import('@studio/components/LocalModelManager.jsx'));

const navItems = [
  { id: 'image', label: 'Image', stage: 'Shared Studio' },
  { id: 'video', label: 'Video', stage: 'Shared Studio' },
  { id: 'marketing', label: 'Marketing', stage: 'Shared Studio' },
  { id: 'workflows', label: 'Workflows', stage: 'Shared Studio' },
  { id: 'agents', label: 'Agents', stage: 'Shared Studio' },
  { id: 'apps', label: 'Apps', stage: 'Shared Studio' },
  { id: 'local-models', label: 'Local Models', stage: 'Desktop runtime' },
  { id: 'providers', label: 'API Providers', stage: 'Shared config' },
  { id: 'health', label: 'API Health', stage: 'Proxy check' },
];

function StatusPill({ active, children }) {
  return h(
    'span',
    {
      className: [
        'inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-semibold',
        active
          ? 'border-primary/60 bg-primary/15 text-primary'
          : 'border-white/10 bg-white/[0.03] text-zinc-400',
      ].join(' '),
    },
    children,
  );
}

function RuntimePanel({ runtime, activeProvider }) {
  const checks = [
    { label: 'Electron bridge', done: runtime.isElectron },
    { label: 'Desktop API proxy', done: Boolean(runtime.apiBase) },
    { label: 'sd.cpp local runtime', done: runtime.hasSdCpp },
    { label: 'Wan2GP runtime', done: runtime.hasWan2gp },
    { label: `${activeProvider.name} ready`, done: isProviderReady(activeProvider) },
  ];

  return h(
    'div',
    { className: 'hidden min-w-0 items-center gap-2 lg:flex' },
    checks.map((item) =>
      h(StatusPill, { key: item.label, active: item.done }, item.label),
    ),
  );
}

function StudioSurface({ activeTab, apiConfig, activeProvider, localRuntime, onSaveApiConfig, onMissingApiKey }) {
  const commonProps = {
    apiKey: activeProvider.apiKey || '',
    apiConfig,
    localRuntime,
    onMissingApiKey,
  };

  if (activeTab === 'image') {
    return h(ImageStudio, {
      ...commonProps,
      onGenerationComplete: () => window.dispatchEvent(new Event('hg-task-center-refresh')),
    });
  }

  if (activeTab === 'video') {
    return h(VideoStudio, {
      ...commonProps,
      onGenerationComplete: () => window.dispatchEvent(new Event('hg-task-center-refresh')),
    });
  }

  if (activeTab === 'marketing') {
    return h(MarketingStudio, {
      ...commonProps,
      onGenerationComplete: () => window.dispatchEvent(new Event('hg-task-center-refresh')),
    });
  }

  if (activeTab === 'workflows') {
    return h(WorkflowStudio, {
      ...commonProps,
      isHeaderVisible: true,
      onToggleHeader: () => {},
    });
  }

  if (activeTab === 'agents') {
    return h(AgentStudio, {
      ...commonProps,
      isHeaderVisible: true,
      onToggleHeader: () => {},
    });
  }

  if (activeTab === 'apps') {
    return h(AppsStudio, commonProps);
  }

  if (activeTab === 'providers') {
    return h(ApiProviderStudio, {
      apiConfig,
      onSave: onSaveApiConfig,
    });
  }

  if (activeTab === 'local-models') {
    return h(LocalModelManager, {
      localRuntime,
    });
  }

  return h(ApiHealthStudio, {
    ...commonProps,
    onSave: onSaveApiConfig,
  });
}

function StudioFallback() {
  return h(
    'div',
    { className: 'flex h-full items-center justify-center bg-app-bg text-sm font-semibold text-zinc-500' },
    'Loading Studio...',
  );
}

export function DesktopApp({ desktopAdapter }) {
  const runtime = desktopAdapter?.runtime || {};
  const localRuntime = runtime.localRuntime;
  const [activeTab, setActiveTab] = useState(() => desktopAdapter?.routing?.getActiveTab?.('image') || 'image');
  const [showTaskCenter, setShowTaskCenter] = useState(false);
  const {
    apiConfig,
    activeProvider,
    saveApiConfig,
  } = useApiProviderState(desktopAdapter);

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab(nextTab);
    desktopAdapter?.routing?.setActiveTab?.(nextTab);
  }, [desktopAdapter]);

  const handleSaveApiConfig = useCallback((nextConfig) => {
    saveApiConfig(nextConfig);
  }, [saveApiConfig]);

  const handleMissingApiKey = useCallback(() => {
    handleTabChange('providers');
  }, [handleTabChange]);

  return h(
    StudioShell,
    {
      variant: 'desktop',
      title: 'MozenAIGC Desktop',
      subtitle: 'Shared Studio renderer',
      tabs: navItems,
      activeTab,
      onTabChange: handleTabChange,
      runtimePanel: h(RuntimePanel, { runtime, activeProvider }),
      rightActions: h(
        'div',
        { className: 'flex shrink-0 items-center gap-2' },
        h(
          'button',
          {
            type: 'button',
            className:
              'h-9 shrink-0 rounded-md border border-white/10 px-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/5',
            onClick: () => setShowTaskCenter(true),
          },
          'Tasks',
        ),
      ),
      activeProvider,
      onOpenProviders: handleMissingApiKey,
      showMissingApiKeyNotice: !isProviderReady(activeProvider),
    },
    h(
      React.Fragment,
      null,
      h(
        'main',
        { className: 'min-h-0 flex-1 overflow-hidden bg-app-bg' },
        h(
          Suspense,
          { fallback: h(StudioFallback) },
          h(StudioSurface, {
            activeTab,
            apiConfig,
            activeProvider,
            localRuntime,
            onSaveApiConfig: handleSaveApiConfig,
            onMissingApiKey: handleMissingApiKey,
          }),
        ),
      ),
      h(TaskCenter, {
        open: showTaskCenter,
        onClose: () => setShowTaskCenter(false),
        storage: desktopAdapter?.storage,
      }),
    ),
  );
}
