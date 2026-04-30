/**
 * Director Layout Implementation
 * Using the unified @higgsfield/layout system for Vue
 */

<template>
  <AppShell :config="appShellConfig">
    <Header :config="headerConfig">
      <template #logo>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            D
          </div>
          <span style="font-weight: bold; font-size: 18px; color: white;">Director</span>
        </div>
      </template>
      
      <template #actions>
        <button style="padding: 8px; color: var(--text-secondary); transition: color 150ms;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </button>
      </template>
    </Header>
    
    <div style="display: flex; flex: 1;">
      <Sidebar :config="sidebarConfig" />
      
      <ContentArea>
        <slot></slot>
      </ContentArea>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { 
  AppShell, 
  Header, 
  Sidebar, 
  ContentArea,
  defaultAppShellConfig,
  defaultHeaderConfig,
  defaultSidebarConfig,
  NavigationItem,
  SidebarItem
} from '@higgsfield/layout/vue';

// Director-specific navigation items
const navigationItems: NavigationItem[] = [
  { label: 'Chat', route: 'chat' },
  { label: 'Search', route: 'search' },
  { label: 'Edit', route: 'edit' },
  { label: 'Compile', route: 'compile' },
  { label: 'Generate', route: 'generate' },
];

// Director-specific sidebar items
const sidebarItems: SidebarItem[] = [
  { label: 'New Chat', route: 'new-chat', icon: '💬' },
  { label: 'Video Search', route: 'video-search', icon: '🔍' },
  { label: 'Video Edit', route: 'video-edit', icon: '✂️' },
  { label: 'Generate', route: 'generate', icon: '🎬' },
  { label: 'History', route: 'history', icon: '📜' },
];

const appShellConfig = defaultAppShellConfig;

const headerConfig = {
  ...defaultHeaderConfig,
  navigation: {
    enabled: true,
    items: navigationItems,
  },
};

const sidebarConfig = {
  ...defaultSidebarConfig,
  items: sidebarItems,
};
</script>
