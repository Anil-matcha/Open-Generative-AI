import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extendClipContextMenu } from '../../../src/lib/uiIntegration';

// Mock the OpenAI config to avoid API key validation issues in tests
vi.mock('../../../src/lib/config/openaiConfig.js', () => ({
  openaiConfig: {
    validateApiKey: vi.fn(() => true),
    getApiKey: vi.fn(() => 'sk-test-key'),
    getImageModel: vi.fn(() => 'gpt-image-2'),
    maskApiKey: vi.fn(() => 'sk-****'),
    isValidImageModel: vi.fn(() => true),
    getConfig: vi.fn(() => ({
      apiKey: 'sk-test-key',
      imageModel: 'gpt-image-2',
      baseURL: 'https://api.openai.com/v1',
      timeout: 120000,
      maxRetries: 3
    }))
  }
}));

// Mock the modal component
vi.mock('../../../src/components/modals/OpenAIImageEditorModal.jsx', () => ({
  OpenAIImageEditorModal: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    close: vi.fn()
  }))
}));

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

      // Mock the dynamic import
      const mockModal = {
        show: vi.fn()
      };
      const { OpenAIImageEditorModal } = await import('../../../src/components/modals/OpenAIImageEditorModal.jsx');
      OpenAIImageEditorModal.mockReturnValue(mockModal);

      // Execute the action
      await imageEditorItem.action();

      expect(OpenAIImageEditorModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'AI Image Editor (OpenAI)',
          size: 'full',
          image: mockClip.src,
          mode: 'edit'
        })
      );
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
      const { OpenAIImageEditorModal } = await import('../../../src/components/modals/OpenAIImageEditorModal.jsx');
      OpenAIImageEditorModal.mockReturnValue(mockModal);

      await imageEditorItem.action();

      const modalOptions = OpenAIImageEditorModal.mock.calls[0][0];
      expect(modalOptions.onConfirm).toBeInstanceOf(Function);
      expect(modalOptions.onCancel).toBeInstanceOf(Function);
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
      const { OpenAIImageEditorModal } = await import('../../../src/components/modals/OpenAIImageEditorModal.jsx');
      OpenAIImageEditorModal.mockReturnValue(mockModal);

      await imageEditorItem.action();

      const modalOptions = OpenAIImageEditorModal.mock.calls[0][0];

      // Mock the updateClipInTimeline function
      const mockUpdateClipInTimeline = vi.fn();
      vi.doMock('../../../src/lib/uiIntegration.js', () => ({
        ...vi.importActual('../../../src/lib/uiIntegration.js'),
        updateClipInTimeline: mockUpdateClipInTimeline
      }));

      // Simulate modal confirm
      const result = { editedImage: 'new-base64-data' };
      modalOptions.onConfirm(result);

      // Check that the clip was updated and toast was shown
      expect(mockShowToast).toHaveBeenCalledWith('Image edited with AI successfully', 'success');
    });

    it('should handle modal errors gracefully', async () => {
      // Mock the dynamic import to throw an error
      vi.doMock('../../../src/components/modals/OpenAIImageEditorModal.jsx', () => {
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

      await imageEditorItem.action();

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