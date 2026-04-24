/**
 * AI Agent Integration Test Suite
 * Tests the ViMax AI agents integrated into the timeline editor
 */

import { muapi } from '../src/lib/muapi.js';
import { generationService } from '../src/lib/editor/generationService.js';
import { directorAgent } from '../src/lib/agents/directorAgent.js';
import { screenwriterAgent } from '../src/lib/agents/screenwriterAgent.js';
import { characterExtractorAgent } from '../src/lib/agents/characterExtractorAgent.js';
import { cameraOperatorAgent } from '../src/lib/agents/cameraOperatorAgent.js';
import { editorAgent } from '../src/lib/agents/editorAgent.js';
import { multiTakeSystem } from '../src/lib/clipVersioning.js';
import { initTimelineAgentIntegration } from '../src/timelineAgentIntegration.js';

// Mock timeline state for testing
const mockTimelineState = {
  tracks: [
    {
      id: 'video-track-1',
      name: 'Video',
      type: 'video',
      items: [
        {
          id: 'clip-1',
          name: 'Opening Scene',
          type: 'video',
          startTime: 0,
          endTime: 5,
          duration: 5,
          prompt: 'A person walking in a park during sunset',
          src: '/videos/clip1.mp4'
        },
        {
          id: 'clip-2',
          name: 'Dialog Scene',
          type: 'video',
          startTime: 5,
          endTime: 10,
          duration: 5,
          prompt: 'Two people talking at a coffee shop',
          src: '/videos/clip2.mp4'
        },
        {
          id: 'clip-3',
          name: 'Action Scene',
          type: 'video',
          startTime: 10,
          endTime: 15,
          duration: 5,
          prompt: 'A car chase through city streets',
          src: '/videos/clip3.mp4'
        }
      ]
    },
    {
      id: 'audio-track-1',
      name: 'Audio',
      type: 'audio',
      items: [
        {
          id: 'audio-1',
          name: 'Background Music',
          type: 'audio',
          startTime: 0,
          endTime: 15,
          duration: 15,
          src: '/audio/bg-music.mp3'
        }
      ]
    }
  ]
};

// Test suite
describe('AI Agent Integration Tests', () => {
  beforeAll(() => {
    // Mock environment variables
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

    // Mock localStorage for MuAPI key
    global.localStorage = {
      getItem: jest.fn(() => 'test-muapi-key'),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };

    // Mock fetch for API calls
    global.fetch = jest.fn();
  });

  describe('MuAPI Integration', () => {
    test('should have LTX models available', () => {
      const { LTX_T2V_MODELS, LTX_I2V_MODELS } = generationService;
      expect(LTX_T2V_MODELS).toBeDefined();
      expect(LTX_I2V_MODELS).toBeDefined();
      expect(LTX_T2V_MODELS['ltx-2-fast']).toBeDefined();
      expect(LTX_I2V_MODELS['ltx-2-fast']).toBeDefined();
    });

    test('should generate video with LTX model', async () => {
      const mockResponse = {
        request_id: 'test-request-123',
        status: 'queued'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generationService.submit({
        mode: 'text-to-video',
        prompt: 'A beautiful sunset over mountains',
        model: 'ltx-2-fast',
        duration: 6,
        aspectRatio: '16:9'
      }, 'muapi');

      expect(result.generationId).toBeDefined();
      expect(result.status).toBe('queued');
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/muapi-proxy',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('ltx-2-fast-text-to-video')
        })
      );
    });

    test('should generate image-to-video with LTX model', async () => {
      const mockResponse = {
        request_id: 'test-request-456',
        status: 'queued'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generationService.submit({
        mode: 'image-to-video',
        prompt: 'Make this image come to life',
        model: 'ltx-2-pro',
        references: ['/images/test.jpg'],
        duration: 8
      }, 'muapi');

      expect(result.generationId).toBeDefined();
      expect(fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/muapi-proxy',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('ltx-2-pro-image-to-video')
        })
      );
    });
  });

  describe('Director Agent', () => {
    test('should analyze timeline structure', async () => {
      await directorAgent.execute({
        timelineState: mockTimelineState,
        options: { includeNarrativeSuggestions: true }
      });

      expect(directorAgent.result).toBeDefined();
      expect(directorAgent.result.structureAnalysis).toBeDefined();
      expect(directorAgent.result.gapAnalysis).toBeDefined();
      expect(directorAgent.result.pacingAnalysis).toBeDefined();
    });

    test('should detect gaps in timeline', async () => {
      await directorAgent.execute({ timelineState: mockTimelineState });

      const gapAnalysis = directorAgent.result.gapAnalysis;
      expect(gapAnalysis).toBeDefined();
      expect(gapAnalysis.gapCount).toBeGreaterThanOrEqual(0);
      expect(gapAnalysis.totalGapTime).toBeDefined();
    });

    test('should evaluate pacing', async () => {
      await directorAgent.execute({ timelineState: mockTimelineState });

      const pacingAnalysis = directorAgent.result.pacingAnalysis;
      expect(pacingAnalysis).toBeDefined();
      expect(pacingAnalysis.score).toBeDefined();
      expect(pacingAnalysis.optimalClips).toBeDefined();
      expect(pacingAnalysis.problematicClips).toBeDefined();
    });
  });

  describe('Screenwriter Agent', () => {
    test('should generate scene descriptions', async () => {
      await screenwriterAgent.execute({
        timelineState: mockTimelineState,
        mode: 'scene'
      });

      expect(screenwriterAgent.result).toBeDefined();
      expect(screenwriterAgent.result.type).toBe('scene_description');
      expect(screenwriterAgent.result.prompt).toBeDefined();
    });

    test('should generate narrative suggestions', async () => {
      await screenwriterAgent.execute({
        timelineState: mockTimelineState,
        mode: 'narrative'
      });

      expect(screenwriterAgent.result).toBeDefined();
      expect(screenwriterAgent.result.type).toBe('narrative_suggestions');
      expect(screenwriterAgent.result.suggestions).toBeDefined();
    });
  });

  describe('Character Extractor Agent', () => {
    test('should extract characters from clips', async () => {
      await characterExtractorAgent.execute({
        timelineState: mockTimelineState
      });

      expect(characterExtractorAgent.result).toBeDefined();
      expect(characterExtractorAgent.result.characters).toBeDefined();
      expect(Array.isArray(characterExtractorAgent.result.characters)).toBe(true);
    });
  });

  describe('Camera Operator Agent', () => {
    test('should suggest camera angles', async () => {
      const testClip = mockTimelineState.tracks[0].items[0];

      await cameraOperatorAgent.execute({
        clipId: testClip.id,
        clipData: testClip,
        timelineState: mockTimelineState
      });

      expect(cameraOperatorAgent.result).toBeDefined();
      expect(cameraOperatorAgent.result.clipId).toBe(testClip.id);
      expect(cameraOperatorAgent.result.recommendedAngles).toBeDefined();
    });
  });

  describe('Editor Agent', () => {
    test('should optimize timeline assembly', async () => {
      await editorAgent.execute({
        timelineState: mockTimelineState,
        options: { includeOptimization: true }
      });

      expect(editorAgent.result).toBeDefined();
      expect(editorAgent.result.timelineAnalysis).toBeDefined();
      expect(editorAgent.result.issues).toBeDefined();
      expect(editorAgent.result.optimizations).toBeDefined();
    });
  });

  describe('Multi-Take System', () => {
    test('should enable versioning for clips', () => {
      const clipId = 'test-clip-123';
      multiTakeSystem.enableVersioning(clipId);

      expect(multiTakeSystem.isVersioningEnabled(clipId)).toBe(true);
    });

    test('should add and retrieve takes', () => {
      const clipId = 'test-clip-456';
      const takeData = {
        generatedBy: 'agent',
        agentUsed: 'Screenwriter',
        prompt: 'A cinematic scene',
        model: 'ltx-2-fast',
        quality: 0.85
      };

      multiTakeSystem.enableVersioning(clipId);
      const take = multiTakeSystem.addTake(clipId, takeData);

      expect(take).toBeDefined();
      expect(take.id).toBeDefined();
      expect(multiTakeSystem.getTakes(clipId)).toHaveLength(1);
    });
  });

  describe('Timeline Agent Integration', () => {
    test('should initialize timeline agent integration', async () => {
      const mockTimelineEditor = {
        getState: () => mockTimelineState,
        getSelectedClips: () => [],
        showNotification: jest.fn()
      };

      const integration = await initTimelineAgentIntegration(mockTimelineEditor, {
        theme: 'electric',
        autoEnableAgents: false
      });

      expect(integration).toBeDefined();
      expect(integration.agentPanel).toBeDefined();
      expect(integration.takeSelector).toBeDefined();
    });

    test('should handle agent actions', async () => {
      const mockTimelineEditor = {
        getState: () => mockTimelineState,
        getSelectedClips: () => [],
        showNotification: jest.fn()
      };

      const integration = await initTimelineAgentIntegration(mockTimelineEditor, {
        theme: 'electric',
        autoEnableAgents: false
      });

      // Mock the agent execution
      const mockEmit = jest.fn();
      integration.agentPanel.emit = mockEmit;

      // Trigger an action
      integration.agentPanel.emit('action', { action: 'analyze_timeline' });

      // Should have emitted the action
      expect(mockEmit).toHaveBeenCalledWith('action', { action: 'analyze_timeline' });
    });
  });

  describe('UI Integration', () => {
    test('should extend generation panel with AI buttons', () => {
      // Import the function to test
      const { extendGenerationPanel } = require('../src/lib/uiIntegration.js');

      // Create mock container
      const mockContainer = document.createElement('div');

      // Mock feature flags
      global.isFeatureEnabled = jest.fn(() => true);

      // Call the function
      extendGenerationPanel(mockContainer, mockTimelineState, jest.fn());

      // Should have added buttons
      expect(mockContainer.children.length).toBeGreaterThan(0);

      // Check for AI buttons
      const buttons = Array.from(mockContainer.querySelectorAll('.generate-type'));
      const aiButtons = buttons.filter(btn => btn.textContent.includes('AI') || btn.textContent.includes('Multi-Take'));
      expect(aiButtons.length).toBeGreaterThan(0);
    });

    test('should extend top actions with agent buttons', () => {
      const { extendTopActions } = require('../src/lib/uiIntegration.js');

      // Create mock container
      const mockContainer = document.createElement('div');

      // Mock feature flags
      global.isFeatureEnabled = jest.fn(() => true);

      // Call the function
      extendTopActions(mockContainer, mockTimelineState, jest.fn());

      // Should have added buttons
      const buttons = Array.from(mockContainer.querySelectorAll('.top-icon'));
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('API Error Handling', () => {
    test('should handle MuAPI errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await generationService.submit({
          mode: 'text-to-video',
          prompt: 'Test prompt',
          model: 'ltx-2-fast'
        }, 'muapi');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Network error');
      }
    });

    test('should handle missing API key', async () => {
      global.localStorage.getItem.mockReturnValueOnce(null);

      try {
        await muapi.generateVideo({
          model: 'ltx-2-fast-text-to-video',
          prompt: 'Test'
        });
      } catch (error) {
        expect(error.message).toContain('API key not configured');
      }
    });
  });
});