import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { extendClipContextMenu } from '../../src/lib/uiIntegration';

// Unit tests for OpenAI Image Editor Integration with Timeline Editor
// These are pure unit tests for the extendClipContextMenu function

describe('Timeline Editor - OpenAI Image Editor Integration', () => {
  let mockClipElement;
  let mockClip;
  let mockTrack;
  let mockState;
  let mockShowToast;

  beforeEach(() => {
    mockClipElement = document.createElement('div');
    mockClip = {
      id: 'clip-1',
      type: 'image',
      src: 'data:image/png;base64,test-image-data'
    };
    mockTrack = { id: 'track-1' };
    mockState = {
      tracks: [{
        id: 'track-1',
        clips: [mockClip]
      }],
      selectedClipIds: ['clip-1']
    };
    mockShowToast = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Image Clip Context Menu', () => {
    it('should add OpenAI image editor option for image clips', () => {
      const menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      expect(menuItems).toContainEqual(
        expect.objectContaining({
          label: 'AI Image Editor (OpenAI)',
          icon: '🤖'
        })
      );
    });

    it('should not add image editor option for non-image clips', () => {
      mockClip.type = 'video';
      const menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      const imageEditorItem = menuItems.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );
      expect(imageEditorItem).toBeUndefined();
    });

    it('should open OpenAI image editor modal when menu item is clicked', async () => {
      const menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      const imageEditorItem = menuItems.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );
      expect(imageEditorItem).toBeDefined();

      //mock the dynamic import
      const mockModal = {
        show: vi.fn()
      };
      const modalModule = await import('../../src/components/modals/OpenAIImageEditorModal.jsx');
      // Replace the export with a mock
      vi.mock('../../src/components/modals/OpenAIImageEditorModal.jsx', () => ({
        OpenAIImageEditorModal: vi.fn().mockImplementation(() => mockModal)
      }));

      // Re-get menu items after mock setup
      const menuItemsAfterMock = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );
      const imageEditorItemAfterMock = menuItemsAfterMock.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );

      // Execute the action
      await imageEditorItemAfterMock.action();

      expect(mockModal.show).toHaveBeenCalled();
    });

    it('should pass correct callbacks to modal', async () => {
      const menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      const imageEditorItem = menuItems.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );

      // Mock the dynamic import
      const mockModal = {
        show: vi.fn()
      };
      vi.mock('../../src/components/modals/OpenAIImageEditorModal.jsx', () => ({
        OpenAIImageEditorModal: vi.fn().mockImplementation(() => mockModal)
      }));

      // Re-get menu items after mock
      const menuItemsAfterMock = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );
      const imageEditorItemAfterMock = menuItemsAfterMock.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );

      await imageEditorItemAfterMock.action();

      // Check that callbacks were passed
      expect(mockModal.show).toHaveBeenCalledWith(expect.objectContaining({
        onConfirm: expect.any(Function),
        onCancel: expect.any(Function)
      }));
    });

    it('should handle modal confirm callback correctly', async () => {
      const menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      const imageEditorItem = menuItems.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );

      // Mock the dynamic import and modal
      const mockModal = {
        show: vi.fn()
      };
      vi.mock('../../src/components/modals/OpenAIImageEditorModal.jsx', () => ({
        OpenAIImageEditorModal: vi.fn().mockImplementation(() => mockModal)
      }));

      // Mock updateClipInTimeline
      const mockUpdateClipInTimeline = vi.fn();
      vi.mock('../../src/lib/uiIntegration.js', () => ({
        ...vi.importActual('../../src/lib/uiIntegration.js'),
        updateClipInTimeline: mockUpdateClipInTimeline
      }));

      // Re-get menu items after mock
      const menuItemsAfterMock = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );
      const imageEditorItemAfterMock = menuItemsAfterMock.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );

      await imageEditorItemAfterMock.action();

      // Get the onConfirm callback from the modal show call
      const showCallArgs = mockModal.show.mock.calls[0][0];
      const onConfirm = showCallArgs.onConfirm;

      // Simulate modal confirm
      const result = { editedImage: 'new-base64-data' };
      await onConfirm(result);

      // Check that the clip was updated and toast was shown
      expect(mockShowToast).toHaveBeenCalledWith('Image edited with AI successfully', 'success');
    });

    it('should handle modal errors gracefully', async () => {
      // Mock the dynamic import to throw an error
      vi.mock('../../src/components/modals/OpenAIImageEditorModal.jsx', () => {
        throw new Error('Import failed');
      });

      const menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      const imageEditorItem = menuItems.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );

      await expect(imageEditorItem.action()).rejects.toThrow();

      expect(mockShowToast).toHaveBeenCalledWith('Failed to open AI Image Editor', 'error');
    });
  });

  describe('Context Menu Generation', () => {
    it('should only include relevant menu items for clip type', () => {
      // Test image clip
      let menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      expect(menuItems.length).toBe(1); // Only AI image editor for image clips
      expect(menuItems[0].label).toBe('AI Image Editor (OpenAI)');

      // Test video clip
      mockClip.type = 'video';
      menuItems = extendClipContextMenu(
        mockClipElement,
        mockClip,
        mockTrack,
        mockState,
        mockShowToast
      );

      // Should have video-related items, not image editor
      const imageEditorItem = menuItems.find(item =>
        item.label === 'AI Image Editor (OpenAI)'
      );
      expect(imageEditorItem).toBeUndefined();
    });
  });
});
