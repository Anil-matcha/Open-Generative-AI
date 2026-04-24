# Complete CineGen Integration into Timeline Editor

## Overview
Finish the integration of CineGen (AI film production studio) into the timeline editor by adopting the unified layout system and establishing seamless workflow connections between the two applications.

## Current State Analysis

### CineGen Module Status
- **Location**: `modules/CineGen/` (git submodule from https://github.com/deangilmoreremix/CineGen.git)
- **Framework**: React 19 + Electron
- **Current Layout**: Custom header with TopTabs component (Elements, Spaces, Edit, LLM, Export tabs)
- **Features**: AI video generation, node-based workflows, professional editing tools

### Unified Layout System
- **Available**: `@higgsfield/layout` package with React/Vue/Vanilla implementations
- **Components**: AppShell, Header, Sidebar, ContentArea
- **Themes**: Support for cinematic theme (`theme-cinematic` with amber primary #d4a054)

### Integration Requirements
1. **Layout Unification**: Replace custom TopTabs header with unified full-width header
2. **Theme Application**: Apply cinematic theme for consistent branding
3. **Dependency Management**: Add layout packages to CineGen's package.json
4. **Workflow Integration**: Enable seamless data flow between CineGen and timeline editor

## Implementation Plan

### Phase 1: Layout System Integration (Today)

#### 1.1 Add Layout Dependencies to CineGen
**File**: `modules/CineGen/package.json`
**Action**: Add unified layout packages to dependencies

```json
{
  "dependencies": {
    "@higgsfield/layout": "file:../../../packages/layout",
    "@higgsfield/tokens": "file:../../../packages/tokens", 
    "@higgsfield/navigation": "file:../../../packages/navigation"
  }
}
```

#### 1.2 Create CineGenLayout Component
**File**: `modules/CineGen/src/layout/CineGenLayout.tsx` (NEW)
**Purpose**: Wrap CineGen workspace with unified layout system

```tsx
import React from 'react';
import { AppShell, Header, Sidebar, ContentArea } from '@higgsfield/layout/react';
import { WorkspaceShell } from '../components/workspace/workspace-shell';

interface CineGenLayoutProps {
  projectId: string;
  useSqlite?: boolean;
  onBackToHome: () => void;
}

export function CineGenLayout({ projectId, useSqlite, onBackToHome }: CineGenLayoutProps) {
  const sidebarItems = [
    { id: 'elements', label: 'Elements', icon: 'elements-icon' },
    { id: 'create', label: 'Spaces', icon: 'spaces-icon' },
    { id: 'edit', label: 'Edit', icon: 'edit-icon' },
    { id: 'llm', label: 'LLM', icon: 'llm-icon' },
    { id: 'export', label: 'Export', icon: 'export-icon' }
  ];

  const headerActions = [
    { id: 'settings', label: 'Settings', icon: 'settings-icon' }
  ];

  return (
    <AppShell className="theme-cinematic">
      <Header
        logo={<span className="cinegen-logo">CINEGEN</span>}
        navigation={sidebarItems}
        actions={headerActions}
        onBack={onBackToHome}
      />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar items={sidebarItems} />
        <ContentArea>
          <WorkspaceShell
            projectId={projectId}
            useSqlite={useSqlite}
            onBackToHome={onBackToHome}
          />
        </ContentArea>
      </div>
    </AppShell>
  );
}
```

#### 1.3 Update App.tsx to Use Unified Layout
**File**: `modules/CineGen/src/App.tsx`
**Action**: Replace custom layout with CineGenLayout component

**Current Structure**:
```tsx
return (
  <div className="app-root">
    {view === 'workspace' && projectId && (
      <WorkspaceShell ... />
    )}
  </div>
);
```

**New Structure**:
```tsx
import { CineGenLayout } from './layout/CineGenLayout';

return (
  <div className="app-root">
    {view === 'workspace' && projectId && (
      <CineGenLayout
        projectId={projectId}
        useSqlite={useSqlite}
        onBackToHome={handleBackToHome}
      />
    )}
  </div>
);
```

#### 1.4 Update WorkspaceShell to Remove TopTabs
**File**: `modules/CineGen/src/components/workspace/workspace-shell.tsx`
**Action**: Remove TopTabs component since navigation moves to unified header

**Current**:
```tsx
return (
  <div className="workspace-shell">
    <TopTabs ... />
    {/* content */}
  </div>
);
```

**New**:
```tsx
return (
  <div className="workspace-shell">
    {/* Unified header handles navigation, just render content */}
    {renderActiveTabContent()}
  </div>
);
```

### Phase 2: Theme and Styling Integration

#### 2.1 Apply Cinematic Theme
**File**: `modules/CineGen/src/layout/CineGenLayout.tsx`
**Action**: Add `theme-cinematic` class to AppShell

```tsx
<AppShell className="theme-cinematic">
```

#### 2.2 Update CSS Imports
**File**: `modules/CineGen/src/main.tsx`
**Action**: Import design tokens and layout styles

```tsx
import '@higgsfield/tokens/dist/index.css';
import '@higgsfield/layout/dist/layout.css';
```

### Phase 3: Workflow Integration with Timeline Editor

#### 3.1 Implement Export to Timeline
**File**: `modules/CineGen/src/components/export/export-tab.tsx`
**Action**: Add "Export to Timeline" functionality

```tsx
const handleExportToTimeline = async () => {
  const timelineData = await exportProjectAsTimeline();
  // Communicate with main timeline editor
  window.electronAPI.timeline.importFromCineGen(timelineData);
};
```

#### 3.2 Implement Import from Timeline
**File**: `modules/CineGen/src/components/workspace/workspace-shell.tsx`
**Action**: Add timeline import handling

```tsx
useEffect(() => {
  const unsub = window.electronAPI.cinegen.onImportTimeline((timelineData) => {
    // Process and import timeline data
    handleImportTimeline(timelineData);
  });
  return unsub;
}, []);
```

#### 3.3 Update API Communication
**File**: `modules/CineGen/electron/main.js`
**Action**: Add IPC handlers for timeline communication

```javascript
ipcMain.handle('timeline:import-from-cinegen', async (event, data) => {
  // Handle import from CineGen to timeline
});

ipcMain.handle('cinegen:import-timeline', async (event, data) => {
  // Handle import from timeline to CineGen
});
```

### Phase 4: Testing and Validation

#### 4.1 Update Test Suite
**File**: `tests/e2e/modules/cinegen-integration.spec.js`
**Action**: Update tests to work with unified layout

- Update selectors to match new header structure
- Test theme application
- Verify navigation works through unified header

#### 4.2 Add Layout Integration Tests
**File**: `tests/unit/layout/cinegen-layout.test.js` (NEW)
**Action**: Test CineGen layout integration

```javascript
describe('CineGen Layout Integration', () => {
  test('should render with unified layout system', () => {
    // Test unified header, sidebar, content area
  });
  
  test('should apply cinematic theme', () => {
    // Test theme classes and styling
  });
});
```

## Success Criteria

### Layout Integration ✅
- [ ] CineGen uses unified full-width header instead of TopTabs
- [ ] Cinematic theme applied consistently
- [ ] Responsive design works on all screen sizes
- [ ] Navigation integrated with unified header

### Workflow Integration ✅
- [ ] Can export CineGen projects to timeline editor
- [ ] Can import timeline projects into CineGen
- [ ] Seamless data flow between applications
- [ ] API communication established

### Testing & Quality ✅
- [ ] All existing CineGen tests pass
- [ ] New layout integration tests pass
- [ ] No breaking changes to existing functionality
- [ ] Performance meets requirements

## Dependencies

### Package Updates
- `@higgsfield/layout`: Unified layout components
- `@higgsfield/tokens`: Design tokens and themes
- `@higgsfield/navigation`: Navigation utilities

### File Changes
- `modules/CineGen/package.json`: Add layout dependencies
- `modules/CineGen/src/layout/CineGenLayout.tsx`: New unified layout wrapper
- `modules/CineGen/src/App.tsx`: Use CineGenLayout
- `modules/CineGen/src/components/workspace/workspace-shell.tsx`: Remove TopTabs
- `modules/CineGen/electron/main.js`: Add timeline communication APIs

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Layout Integration** | 2 hours | Unified header, theme application |
| **Phase 2: Theme & Styling** | 1 hour | Cinematic theme, CSS imports |
| **Phase 3: Workflow Integration** | 3 hours | Export/import between apps |
| **Phase 4: Testing** | 1 hour | Test updates, validation |

**Total Time**: 7 hours

## Risk Mitigation

### Layout Compatibility
- **Risk**: Custom CineGen styling conflicts with unified layout
- **Mitigation**: Test thoroughly, maintain existing functionality

### Theme Application  
- **Risk**: Cinematic theme doesn't match CineGen branding
- **Mitigation**: Review theme colors, adjust if needed

### Workflow Integration
- **Risk**: Data format incompatibilities between apps
- **Mitigation**: Define clear API contracts, add validation

### Testing Coverage
- **Risk**: Incomplete test updates break CI/CD
- **Mitigation**: Update all affected tests, run full test suite</content>
<parameter name="filePath">.kilo/plans/1777043828786-.md