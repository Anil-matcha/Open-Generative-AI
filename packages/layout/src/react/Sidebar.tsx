import React, { useState, useCallback, ReactNode } from 'react';
import { SidebarConfig, defaultSidebarConfig, createSidebarStructure, SidebarItem } from '../core/sidebar';
import { useAppShell } from './AppShell';

interface SidebarProps {
  config?: SidebarConfig;
  className?: string;
  itemRenderer?: (item: SidebarItem, isActive: boolean) => ReactNode;
}

export function Sidebar({
  config = defaultSidebarConfig,
  className = '',
  itemRenderer,
}: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppShell();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const sidebarStructure = createSidebarStructure(config);

  const handleItemClick = useCallback((item: SidebarItem) => {
    setActiveItem(item.route);
    item.onClick?.();
  }, []);

  const currentWidth = sidebarCollapsed ? '64px' : config.width;

  return (
    <aside
      className={`sidebar ${className}`}
      style={{
        ...sidebarStructure.container,
        width: currentWidth,
      }}
    >
      <div style={sidebarStructure.content}>
        {config.items.map((item, index) => (
          <SidebarItemComponent
            key={index}
            item={item}
            isActive={activeItem === item.route}
            collapsed={sidebarCollapsed}
            onClick={() => handleItemClick(item)}
            renderer={itemRenderer}
            structure={sidebarStructure}
          />
        ))}
      </div>

      {config.collapsible && (
        <button
          className="p-2 m-2 text-secondary hover:text-white transition-colors"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      )}
    </aside>
  );
}

interface SidebarItemComponentProps {
  item: SidebarItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
  renderer?: (item: SidebarItem, isActive: boolean) => ReactNode;
  structure: ReturnType<typeof createSidebarStructure>;
}

function SidebarItemComponent({
  item,
  isActive,
  collapsed,
  onClick,
  renderer,
  structure,
}: SidebarItemComponentProps) {
  if (renderer) {
    return <>{renderer(item, isActive)}</>;
  }

  const itemStyle = {
    ...structure.item,
    ...(isActive ? structure.itemActive : {}),
  };

  return (
    <div
      className="sidebar-item group"
      style={itemStyle}
      onClick={onClick}
      data-sidebar-item
      data-active={isActive}
      onMouseEnter={(e) => {
        if (!isActive) {
          Object.assign(itemEl.style, (structure.item as any).itemHover);
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          Object.assign(itemEl.style, (structure.item as any).item);
        }
      }}
    >
      {item.icon && (
        <span className="sidebar-item-icon mr-3">
          {item.icon}
        </span>
      )}

      {!collapsed && (
        <span className="sidebar-item-label">{item.label}</span>
      )}

      {item.children && !collapsed && (
        <svg
          className="ml-auto"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </div>
  );
}
