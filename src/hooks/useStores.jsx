import { useTimelineStore } from './useTimelineStore.jsx';
import { useProjectStore } from './useProjectStore.jsx';
import { useMediaStore } from './useMediaStore.jsx';
import { useModalStore } from './useModalStore.jsx';
import { useUIStore } from './useUIStore.jsx';
import { useUserStore } from './useUserStore.jsx';
import { useBaseStore } from './useBaseStore.jsx';
import { useCommonStore } from './useCommonStore.jsx';
import { useMakeStore } from './useMakeStore.jsx';
import { useMultiSelectStore } from './useMultiSelectStore.jsx';
import { useMultiselectTemplateStore } from './useMultiselectTemplateStore.jsx';
import { usePopcornStore } from './usePopcornStore.jsx';
import { usePresetStore } from './usePresetStore.jsx';
import { useSearchStore } from './useSearchStore.jsx';
import { useSocketStore } from './useSocketStore.jsx';

/**
 * Master store aggregator that combines all stores
 * Provides a single interface to access all state management hooks
 *
 * @param {Object} options - Configuration options
 * @param {string} options.userId - Current user ID (for socket store)
 * @param {string} options.userName - Current user name (for socket store)
 * @returns {Object} Aggregated stores object
 */
export const useStores = (options = {}) => {
  const { userId, userName } = options;

  // Core stores
  const timeline = useTimelineStore();
  const project = useProjectStore();
  const media = useMediaStore();
  const modal = useModalStore();
  const ui = useUIStore();
  const user = useUserStore();

  // Utility stores
  const base = useBaseStore({ storageKey: 'base-state' });
  const common = useCommonStore();

  // Feature stores
  const make = useMakeStore();
  const multiSelect = useMultiSelectStore();
  const templateSelect = useMultiselectTemplateStore();
  const popcorn = usePopcornStore();
  const preset = usePresetStore();
  const search = useSearchStore();

  // Collaboration store (only if user credentials provided)
  const socket = userId ? useSocketStore(userId, userName) : null;

  // Cross-store actions and utilities
  const resetAllStores = () => {
    // Reset user data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('timeline-state');
      localStorage.removeItem('project-state');
      localStorage.removeItem('media-state');
      localStorage.removeItem('ui-state');
      localStorage.removeItem('make-state');
      localStorage.removeItem('popcorn-state');
      localStorage.removeItem('preset-state');
      localStorage.removeItem('search-state');
    }

    // Trigger page reload to reset all state
    window.location.reload();
  };

  const exportAllData = () => {
    const exportData = {
      timeline: timeline,
      project: project,
      media: media,
      ui: ui,
      user: user,
      make: make,
      popcorn: popcorn,
      preset: preset,
      exportedAt: new Date(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-editor-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStoreStats = () => {
    return {
      timeline: {
        clips: timeline.clips.length,
        tracks: timeline.tracks.length,
        duration: timeline.duration
      },
      project: {
        total: project.projects.length,
        current: project.currentProject?.title || null
      },
      media: {
        assets: media.assets.length,
        uploads: media.uploads.length
      },
      user: {
        authenticated: user.isAuthenticated,
        name: user.currentUser?.name || null
      },
      collaboration: socket ? {
        connected: socket.isConnected,
        collaborators: socket.collaborators.length,
        isHost: socket.isHost
      } : null
    };
  };

  // Store synchronization helpers
  const syncTimelineWithProject = () => {
    if (project.currentProject && timeline.clips.length === 0) {
      // Could load project-specific timeline data here
      console.log('Syncing timeline with project:', project.currentProject.title);
    }
  };

  const syncMediaWithTimeline = () => {
    // Ensure media assets referenced in timeline exist
    const timelineAssetIds = new Set();
    timeline.clips.forEach(clip => {
      if (clip.assetId) timelineAssetIds.add(clip.assetId);
    });

    const missingAssets = Array.from(timelineAssetIds).filter(
      assetId => !media.assets.find(asset => asset.id === assetId)
    );

    if (missingAssets.length > 0) {
      console.warn('Timeline references missing media assets:', missingAssets);
    }
  };

  // Initialize cross-store synchronization
  // Note: In a React environment, this would be wrapped in useEffect
  // For now, synchronization happens on store access

  return {
    // Individual stores
    timeline,
    project,
    media,
    modal,
    ui,
    user,
    base,
    common,
    make,
    multiSelect,
    templateSelect,
    popcorn,
    preset,
    search,
    socket,

    // Cross-store utilities
    resetAllStores,
    exportAllData,
    getStoreStats,
    syncTimelineWithProject,
    syncMediaWithTimeline,

    // Computed state across stores
    isReady: user.isAuthenticated && !user.isLoading,
    hasUnsavedChanges: () => {
      return project.hasUnsavedChanges?.() ||
             timeline.clips.some(clip => clip.isDirty) ||
             media.uploads.some(upload => upload.status === 'uploading');
    },

    // Global actions
    saveAll: async () => {
      try {
        if (project.saveProject) await project.saveProject();
        // Add other save operations as needed
        common.notifySuccess('All changes saved successfully');
      } catch (error) {
        common.notifyError('Failed to save changes', error.message);
      }
    }
  };
};

// Default export for convenience
export default useStores;