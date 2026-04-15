/**
 * Unified Layout System for Open Higgsfield AI
 * React implementation exports
 */

export { AppShell, useAppShell } from './AppShell';
export { Header } from './Header';
export { Sidebar } from './Sidebar';
export { ContentArea } from './ContentArea';

// Configuration defaults (JavaScript compatible)
export { defaultAppShellConfig } from '../core/app-shell';
export { defaultHeaderConfig } from '../core/header';
export { defaultSidebarConfig } from '../core/sidebar';
export { defaultContentAreaConfig as defaultContentAreaConfig } from '../core/content-area';

// Type exports are available separately for TypeScript projects
export type { AppShellConfig } from '../core/app-shell';
export type { HeaderConfig, NavigationItem } from '../core/header';
export type { SidebarConfig, SidebarItem } from '../core/sidebar';
export type { ContentAreaConfig } from '../core/content-area';
