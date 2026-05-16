import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DirectorAgentRuntime, directorRuntime } from '../../../src/lib/directorAgentRuntime.js';
import { MuAPIAdvancedEffects, getAdvancedEffects } from '../../../src/lib/muapi/MuAPIAdvancedEffects.js';

// Mock MuAPI dependencies
vi.mock('../../../src/lib/muapi.js', () => ({
  MuapiClient: vi.fn().mockImplementation(() => ({
    generateImage: vi.fn(),
    generateVideo: vi.fn(),
    generateI2V: vi.fn(),
    uploadFile: vi.fn()
  }))
}));

vi.mock('../../../src/lib/supabase.js', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock MuAPIConnection for effects tests
vi.mock('../../../src/lib/muapi/MuAPIConnection.js', () => ({
  getMuAPIInstance: vi.fn(() => ({
    _makeRequest: vi.fn(),
    uploadFile: vi.fn()
  }))
}));

describe('Advanced Video Features', () => {
  describe('Director Agent Runtime', () => {
    let runtime: DirectorAgentRuntime;

    beforeEach(() => {
      runtime = new DirectorAgentRuntime();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('Initialization and Setup', () => {
      it('should initialize with default state', () => {
        expect(runtime.getFrames()).toHaveLength(3);
        expect(runtime.getCurrentPreset()).toBeDefined();
        expect(runtime.getSelectedFrameId()).toBe(1);
        expect(runtime.getChatContext()).toBe('');
      });

      it('should initialize project knowledge', async () => {
        await runtime.initialize();
        const knowledge = (runtime as any).projectKnowledge;
        expect(knowledge).toBeDefined();
        expect(knowledge.projectType).toBe('cinematic storyboard');
      });

      it('should set state change callback', () => {
        const callback = vi.fn();
        runtime.setStateChangeCallback(callback);
        expect((runtime as any).onStateChange).toBe(callback);
      });
    });

    describe('Storyboard Frame Management', () => {
      it('should get frames array', () => {
        const frames = runtime.getFrames();
        expect(Array.isArray(frames)).toBe(true);
        expect(frames.length).toBe(3);
        expect(frames[0]).toHaveProperty('id');
        expect(frames[0]).toHaveProperty('shot');
        expect(frames[0]).toHaveProperty('prompt');
      });

      it('should get frame by ID', () => {
        const frame = runtime.getFrameById(1);
        expect(frame).toBeDefined();
        expect(frame?.id).toBe(1);
        expect(frame?.shot).toBe('Wide Shot');
      });

      it('should return null for non-existent frame', () => {
        const frame = runtime.getFrameById(999);
        expect(frame).toBeNull();
      });

      it('should add new frame', () => {
        const initialCount = runtime.getFrameCount();
        const newFrame = runtime.addFrame();

        expect(runtime.getFrameCount()).toBe(initialCount + 1);
        expect(newFrame.id).toBe(initialCount + 1);
        expect(newFrame.shot).toBe('Medium Shot'); // Second shot type
      });

      it('should remove frame', () => {
        const initialCount = runtime.getFrameCount();
        const removed = runtime.removeFrame(1);

        expect(removed).toBe(true);
        expect(runtime.getFrameCount()).toBe(initialCount - 1);
        expect(runtime.getFrameById(1)).toBeNull();
      });

      it('should not remove frame if only one exists', () => {
        // Remove all but one frame
        runtime.removeFrame(2);
        runtime.removeFrame(3);

        const removed = runtime.removeFrame(1);
        expect(removed).toBe(false);
        expect(runtime.getFrameCount()).toBe(1);
      });

      it('should update frame properties', () => {
        runtime.updateFrame(1, { prompt: 'Updated prompt', generated: true });
        const updatedFrame = runtime.getFrameById(1);

        expect(updatedFrame?.prompt).toBe('Updated prompt');
        expect(updatedFrame?.generated).toBe(true);
      });

      it('should set selected frame', () => {
        runtime.setSelectedFrameId(2);
        expect(runtime.getSelectedFrame()?.id).toBe(2);
      });

      it('should not set invalid selected frame', () => {
        runtime.setSelectedFrameId(999);
        expect(runtime.getSelectedFrameId()).toBe(1); // Should remain unchanged
      });
    });

    describe('Frame Navigation', () => {
      it('should navigate to next frame', () => {
        runtime.setSelectedFrameId(1);
        const moved = runtime.selectNextFrame();

        expect(moved).toBe(true);
        expect(runtime.getSelectedFrameId()).toBe(2);
      });

      it('should not navigate beyond last frame', () => {
        const lastFrameId = runtime.getFrames()[runtime.getFrames().length - 1].id;
        runtime.setSelectedFrameId(lastFrameId);
        const moved = runtime.selectNextFrame();

        expect(moved).toBe(false);
        expect(runtime.getSelectedFrameId()).toBe(lastFrameId);
      });

      it('should navigate to previous frame', () => {
        runtime.setSelectedFrameId(2);
        const moved = runtime.selectPreviousFrame();

        expect(moved).toBe(true);
        expect(runtime.getSelectedFrameId()).toBe(1);
      });

      it('should not navigate before first frame', () => {
        runtime.setSelectedFrameId(1);
        const moved = runtime.selectPreviousFrame();

        expect(moved).toBe(false);
        expect(runtime.getSelectedFrameId()).toBe(1);
      });

      it('should check navigation availability', () => {
        runtime.setSelectedFrameId(1);
        expect(runtime.canSelectPreviousFrame()).toBe(false);
        expect(runtime.canSelectNextFrame()).toBe(true);

        const lastFrameId = runtime.getFrames()[runtime.getFrames().length - 1].id;
        runtime.setSelectedFrameId(lastFrameId);
        expect(runtime.canSelectPreviousFrame()).toBe(true);
        expect(runtime.canSelectNextFrame()).toBe(false);
      });
    });

    describe('Preset Management', () => {
      it('should set storyboard preset', () => {
        runtime.setPreset('commercial-ad');
        expect(runtime.getCurrentPreset().id).toBe('commercial-ad');
        expect(runtime.getCurrentPreset().aspectRatio).toBe('16:9');
      });

      it('should default to cinematic-story preset for invalid preset', () => {
        runtime.setPreset('invalid-preset');
        expect(runtime.getCurrentPreset().id).toBe('cinematic-story');
      });
    });

    describe('Frame Generation', () => {
      it('should generate frame with mocked API', async () => {
        const mockMuapiClient = {
          generateImage: vi.fn().mockResolvedValue({
            url: 'https://example.com/generated-image.jpg'
          })
        };

        // Mock the MuapiClient import
        const { MuapiClient } = await import('../../../src/lib/muapi.js');
        (MuapiClient as any).mockImplementation(() => mockMuapiClient);

        const result = await runtime.generateFrame(1);

        expect(result.generated).toBe(true);
        expect(result.palette).toBeDefined();
        expect(mockMuapiClient.generateImage).toHaveBeenCalled();
      });

      it('should handle generation failure gracefully', async () => {
        const mockMuapiClient = {
          generateImage: vi.fn().mockRejectedValue(new Error('API Error'))
        };

        const { MuapiClient } = await import('../../../src/lib/muapi.js');
        (MuapiClient as any).mockImplementation(() => mockMuapiClient);

        const result = await runtime.generateFrame(1);

        expect(result.generated).toBe(true); // Still marked as generated with fallback
        expect(result.palette).toBeDefined();
      });

      it('should prevent concurrent generation', async () => {
        const mockMuapiClient = {
          generateImage: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
        };

        const { MuapiClient } = await import('../../../src/lib/muapi.js');
        (MuapiClient as any).mockImplementation(() => mockMuapiClient);

        const promise1 = runtime.generateFrame(1);
        const promise2 = runtime.generateFrame(2);

        await expect(promise2).rejects.toThrow('Already generating frames');
        await promise1;
      });

      it('should generate all frames', async () => {
        const mockMuapiClient = {
          generateImage: vi.fn().mockResolvedValue({
            url: 'https://example.com/generated-image.jpg'
          })
        };

        const { MuapiClient } = await import('../../../src/lib/muapi.js');
        (MuapiClient as any).mockImplementation(() => mockMuapiClient);

        const results = await runtime.generateAllFrames();

        expect(results.length).toBe(runtime.getFrameCount());
        results.forEach(frame => {
          expect(frame.generated).toBe(true);
        });
      });
    });

    describe('AI Agent Commands', () => {
      it('should execute summarizer agent', async () => {
        const { supabase } = await import('../../../src/lib/supabase.js');
        const mockInvoke = vi.fn().mockResolvedValue({
          data: { message: 'Summary generated' },
          error: null
        });
        supabase.functions.invoke = mockInvoke;

        const result = await runtime.executeAgentCommand('summarizer', {
          videoId: 'test-video',
          videoUrl: 'https://example.com/video.mp4'
        });

        expect(result.success).toBe(true);
        expect(result.agentId).toBe('summarizer');
        expect(result.action).toBe('summarize-video');
        expect(mockInvoke).toHaveBeenCalledWith('videoagent', expect.objectContaining({
          body: expect.objectContaining({
            action: 'summarize-video',
            tool: 'video-analysis'
          })
        }));
      });

      it('should handle agent execution failure', async () => {
        const { supabase } = await import('../../../src/lib/supabase.js');
        supabase.functions.invoke = vi.fn().mockRejectedValue(new Error('Network error'));

        const result = await runtime.executeAgentCommand('summarizer');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
      });

      it('should return success message for known agents', () => {
        const message = (runtime as any).getAgentSuccessMessage('summarizer');
        expect(message).toBe('Video summary generated successfully');
      });

      it('should return default message for unknown agents', () => {
        const message = (runtime as any).getAgentSuccessMessage('unknown-agent');
        expect(message).toBe('Operation completed successfully');
      });
    });

    describe('Video Processing', () => {
      it('should process uploaded video', async () => {
        const { supabase } = await import('../../../src/lib/supabase.js');
        const mockInvoke = vi.fn().mockResolvedValue({
          data: { processed: true },
          error: null
        });
        supabase.functions.invoke = mockInvoke;

        const result = await runtime.processVideo('https://example.com/video.mp4');

        expect(result.success).toBe(true);
        expect(result.processed).toBe(true);
        expect(mockInvoke).toHaveBeenCalledWith('process-upload', expect.objectContaining({
          body: expect.objectContaining({
            videoUrl: 'https://example.com/video.mp4'
          })
        }));
      });

      it('should set video URL and metadata', () => {
        runtime.setVideoUrl('https://example.com/video.mp4');
        runtime.setVideoMetadata({
          duration: 120,
          width: 1920,
          height: 1080,
          size: 50000000
        });

        expect(runtime.getVideoUrl()).toBe('https://example.com/video.mp4');
        expect(runtime.getVideoMetadata().duration).toBe(120);
      });
    });

    describe('Storyboard Persistence', () => {
      it('should save storyboard to database', async () => {
        const { supabase } = await import('../../../src/lib/supabase.js');
        const mockUpsert = vi.fn().mockResolvedValue({
          data: { id: 'test-project' },
          error: null
        });

        const mockFrom = vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: mockUpsert
            }))
          }))
        }));

        supabase.from = mockFrom;

        const result = await runtime.saveStoryboard('test-project');

        expect(result.success).toBe(true);
        expect(result.data.id).toBe('test-project');
      });

      it('should load storyboard from database', async () => {
        const { supabase } = await import('../../../src/lib/supabase.js');
        const savedFrames = [
          { id: 1, shot: 'Wide Shot', prompt: 'Test prompt', generated: true }
        ];

        const mockSelect = vi.fn().mockResolvedValue({
          data: {
            frames: savedFrames,
            preset: { id: 'commercial-ad' }
          },
          error: null
        });

        const mockFrom = vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockSelect
            }))
          }))
        }));

        supabase.from = mockFrom;

        const result = await runtime.loadStoryboard('test-project');

        expect(result.success).toBe(true);
        expect(runtime.getFrames()).toEqual(savedFrames);
        expect(runtime.getCurrentPreset().id).toBe('commercial-ad');
      });
    });

    describe('Video Compilation', () => {
      it('should compile storyboard to video with generated frames', async () => {
        // Set up frames with image URLs
        runtime.updateFrame(1, { generated: true, imageUrl: 'https://example.com/frame1.jpg' });
        runtime.updateFrame(2, { generated: true, imageUrl: 'https://example.com/frame2.jpg' });

        const { supabase } = await import('../../../src/lib/supabase.js');
        const mockInvoke = vi.fn().mockResolvedValue({
          data: { url: 'https://example.com/compiled-video.mp4' },
          error: null
        });
        supabase.functions.invoke = mockInvoke;

        const result = await runtime.compileToVideo();

        expect(result.success).toBe(true);
        expect(result.url).toBe('https://example.com/compiled-video.mp4');
      });

      it('should compile with palette fallback when no images', async () => {
        const mockMuapiClient = {
          generateVideo: vi.fn().mockResolvedValue({
            url: 'https://example.com/fallback-video.mp4'
          })
        };

        const { MuapiClient } = await import('../../../src/lib/muapi.js');
        (MuapiClient as any).mockImplementation(() => mockMuapiClient);

        const result = await runtime.compileToVideo();

        expect(result.success).toBe(true);
        expect(mockMuapiClient.generateVideo).toHaveBeenCalled();
      });
    });

    describe('Chat Command Processing', () => {
      it('should process highlight command', async () => {
        const result = await runtime.processChatCommand('extract highlights from this video');

        expect(result.command).toBe('extract highlights from this video');
        expect(result.activatedAgents).toContain('highlighter');
        expect(result.activatedAgents).toContain('clipper');
      });

      it('should process subtitle command', async () => {
        const result = await runtime.processChatCommand('add subtitles to video');

        expect(result.activatedAgents).toContain('subtitler');
        expect(result.activatedAgents).toContain('enhancer');
      });

      it('should process scene detection command', async () => {
        const result = await runtime.processChatCommand('detect scenes');

        expect(result.activatedAgents).toEqual(['scenes']);
      });

      it('should process default editor command', async () => {
        const result = await runtime.processChatCommand('edit this video');

        expect(result.activatedAgents).toEqual(['editor']);
      });
    });

    describe('Export/Import', () => {
      it('should export storyboard as JSON', () => {
        const jsonString = runtime.exportStoryboard();

        expect(typeof jsonString).toBe('string');

        const parsed = JSON.parse(jsonString);
        expect(parsed).toHaveProperty('preset');
        expect(parsed).toHaveProperty('frames');
        expect(Array.isArray(parsed.frames)).toBe(true);
      });

      it('should import storyboard from JSON', () => {
        const exportData = {
          preset: { id: 'social-shorts' },
          frames: [
            { id: 1, shot: 'Close-Up', prompt: 'Imported frame', narration: 'Test narration' }
          ]
        };

        const jsonString = JSON.stringify(exportData);
        const success = runtime.importStoryboard(jsonString);

        expect(success).toBe(true);
        expect(runtime.getCurrentPreset().id).toBe('social-shorts');
        expect(runtime.getFrames()[0].shot).toBe('Close-Up');
      });

      it('should return false for invalid JSON', () => {
        const success = runtime.importStoryboard('invalid json');
        expect(success).toBe(false);
      });
    });

    describe('Utility Methods', () => {
      it('should get storyboard summary', () => {
        runtime.updateFrame(1, { generated: true });
        runtime.updateFrame(2, { generated: true });

        const summary = runtime.getStoryboardSummary();

        expect(summary.frameCount).toBe(3);
        expect(summary.generatedCount).toBe(2);
        expect(summary.selectedFrame).toBe(1);
        expect(summary.preset).toBe('Cinematic Story');
      });

      it('should clear generated frames', () => {
        runtime.updateFrame(1, { generated: true });
        runtime.updateFrame(2, { generated: true });

        runtime.clearGeneratedFrames();

        const frames = runtime.getFrames();
        frames.forEach(frame => {
          expect(frame.generated).toBe(false);
        });
      });

      it('should clear video data', () => {
        runtime.setVideoUrl('test-url');
        runtime.setVideoMetadata({ duration: 100 });

        runtime.clearVideoData();

        expect(runtime.getVideoUrl()).toBeNull();
        expect(runtime.getVideoMetadata().duration).toBe(0);
      });
    });
  });

  describe('Effects Studio (MuAPIAdvancedEffects)', () => {
    let effects: MuAPIAdvancedEffects;
    let mockMuapi: any;

    beforeEach(() => {
      effects = new MuAPIAdvancedEffects();
      mockMuapi = (effects as any).muapi;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    describe('Filter Application', () => {
      const mockMediaData = {
        url: 'https://example.com/image.jpg',
        type: 'image'
      };

      it('should apply single filter', async () => {
        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/filtered.jpg' }
        });

        const result = await effects.applyFilter(mockMediaData, 'blur', { radius: 5 });

        expect(result.url).toBe('https://example.com/filtered.jpg');
        expect(result.appliedFilters).toContainEqual({
          name: 'blur',
          options: { radius: 5 },
          timestamp: expect.any(Date)
        });
      });

      it('should apply multiple filters in sequence', async () => {
        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { url: 'https://example.com/blurred.jpg' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: { url: 'https://example.com/blurred-sharpened.jpg' }
          });

        const result = await effects.applyFilters(mockMediaData, [
          'blur',
          { name: 'sharpen', options: { intensity: 1.0 } }
        ]);

        expect(result.url).toBe('https://example.com/blurred-sharpened.jpg');
        expect(result.appliedFilters).toHaveLength(2);
      });

      it('should handle filter application failure gracefully', async () => {
        mockMuapi._makeRequest = vi.fn().mockRejectedValue(new Error('API Error'));

        const result = await effects.applyFilter(mockMediaData, 'blur');

        expect(result).toBe(mockMediaData); // Should return original data
      });
    });

    describe('Color Grading', () => {
      const mockMediaData = {
        url: 'https://example.com/image.jpg',
        type: 'image'
      };

      it('should apply color grading', async () => {
        const gradingOptions = {
          brightness: 0.2,
          contrast: 0.1,
          saturation: -0.1
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/graded.jpg' }
        });

        const result = await effects.applyColorGrading(mockMediaData, gradingOptions);

        expect(result.url).toBe('https://example.com/graded.jpg');
        expect(result.colorGrading).toEqual(gradingOptions);
      });

      it('should handle color grading failure', async () => {
        mockMuapi._makeRequest = vi.fn().mockRejectedValue(new Error('API Error'));

        const result = await effects.applyColorGrading(mockMediaData, { brightness: 0.1 });

        expect(result).toBe(mockMediaData);
      });
    });

    describe('LUT Application', () => {
      const mockMediaData = {
        url: 'https://example.com/image.jpg',
        type: 'image'
      };

      const mockLUT = {
        name: 'cinematic',
        size: 1024,
        url: 'https://example.com/lut.cube'
      };

      it('should apply LUT transformation', async () => {
        // Mock LUT upload
        mockMuapi.uploadFile = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/uploaded-lut.cube' }
        });

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/lut-applied.jpg' }
        });

        const result = await effects.applyLUT(mockMediaData, mockLUT, { intensity: 0.8 });

        expect(result.url).toBe('https://example.com/lut-applied.jpg');
        expect(result.appliedLUT).toBe('cinematic');
        expect(result.lutIntensity).toBe(0.8);
      });

      it('should cache uploaded LUTs', async () => {
        mockMuapi.uploadFile = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/cached-lut.cube' }
        });

        // First call should upload
        await effects.applyLUT(mockMediaData, mockLUT);
        expect(mockMuapi.uploadFile).toHaveBeenCalledTimes(1);

        // Second call should use cache
        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/lut-applied-2.jpg' }
        });

        await effects.applyLUT(mockMediaData, mockLUT);
        expect(mockMuapi.uploadFile).toHaveBeenCalledTimes(1); // Still 1, used cache
      });
    });

    describe('Watermarking', () => {
      const mockMediaData = {
        url: 'https://example.com/video.mp4',
        type: 'video'
      };

      it('should add text watermark', async () => {
        const watermarkOptions = {
          text: 'Copyright 2024',
          position: 'bottom-right',
          opacity: 0.8
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/watermarked.mp4' }
        });

        const result = await effects.addWatermark(mockMediaData, watermarkOptions);

        expect(result.url).toBe('https://example.com/watermarked.mp4');
        expect(result.watermark).toEqual(watermarkOptions);
      });

      it('should add image watermark', async () => {
        const watermarkOptions = {
          imageUrl: 'https://example.com/logo.png',
          position: 'top-left',
          size: 'small'
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/logo-watermarked.mp4' }
        });

        const result = await effects.addWatermark(mockMediaData, watermarkOptions);

        expect(result.url).toBe('https://example.com/logo-watermarked.mp4');
        expect(result.watermark).toEqual(watermarkOptions);
      });
    });

    describe('Background Removal', () => {
      const mockMediaData = {
        url: 'https://example.com/image.jpg',
        type: 'image'
      };

      it('should remove background', async () => {
        const options = {
          model: 'u2net',
          threshold: 0.5,
          smoothEdges: true
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/no-bg.jpg' }
        });

        const result = await effects.removeBackground(mockMediaData, options);

        expect(result.url).toBe('https://example.com/no-bg.jpg');
        expect(result.backgroundRemoved).toBe(true);
        expect(result.backgroundRemovalOptions).toEqual(options);
      });
    });

    describe('Face Swap', () => {
      const sourceImage = { url: 'https://example.com/source.jpg', type: 'image' };
      const targetImage = { url: 'https://example.com/target.jpg', type: 'image' };

      it('should perform face swap', async () => {
        const options = {
          model: 'simswap',
          enhanceResult: true
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/face-swapped.jpg' }
        });

        const result = await effects.faceSwap(sourceImage, targetImage, options);

        expect(result).toBeDefined();
        expect(result?.url).toBe('https://example.com/face-swapped.jpg');
        expect(result?.sourceImage).toBe(sourceImage);
        expect(result?.targetImage).toBe(targetImage);
        expect(result?.faceSwap).toBe(true);
      });

      it('should return null on face swap failure', async () => {
        mockMuapi._makeRequest = vi.fn().mockRejectedValue(new Error('Face swap failed'));

        const result = await effects.faceSwap(sourceImage, targetImage);

        expect(result).toBeNull();
      });
    });

    describe('Dress Change', () => {
      const personImage = { url: 'https://example.com/person.jpg', type: 'image' };
      const clothingImage = { url: 'https://example.com/clothes.jpg', type: 'image' };

      it('should change dress', async () => {
        const options = {
          model: 'viton',
          category: 'upper_body'
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/dress-changed.jpg' }
        });

        const result = await effects.dressChange(personImage, clothingImage, options);

        expect(result).toBeDefined();
        expect(result?.url).toBe('https://example.com/dress-changed.jpg');
        expect(result?.dressChange).toBe(true);
      });
    });

    describe('Text Overlays', () => {
      const mockMediaData = {
        url: 'https://example.com/video.mp4',
        type: 'video'
      };

      it('should add text overlay', async () => {
        const textOptions = {
          text: 'Breaking News',
          font: 'Arial',
          size: 48,
          color: '#ff0000',
          position: 'top',
          stroke: true
        };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/with-text.mp4' }
        });

        const result = await effects.addTextOverlay(mockMediaData, textOptions);

        expect(result.url).toBe('https://example.com/with-text.mp4');
        expect(result.textOverlays).toContain(textOptions);
      });
    });

    describe('Video Effects', () => {
      const mockVideoData = {
        url: 'https://example.com/video.mp4',
        type: 'video'
      };

      it('should apply video effect', async () => {
        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/effected.mp4' }
        });

        const result = await effects.applyVideoEffect(mockVideoData, 'slow-motion', {
          intensity: 'medium'
        });

        expect(result.url).toBe('https://example.com/effected.mp4');
        expect(result.appliedEffects).toContainEqual({
          name: 'slow-motion',
          options: { intensity: 'medium' },
          timestamp: expect.any(Date)
        });
      });
    });

    describe('Batch Effects', () => {
      const mockMediaFiles = [
        { url: 'https://example.com/image1.jpg', type: 'image' },
        { url: 'https://example.com/image2.jpg', type: 'image' }
      ];

      it('should apply batch effects', async () => {
        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/processed.jpg' }
        });

        const effectsList = ['blur', 'sharpen', { name: 'color-grade', options: { brightness: 0.1 } }];
        const results = await effects.applyBatchEffects(mockMediaFiles, effectsList);

        expect(results).toHaveLength(2);
        results.forEach(result => {
          expect(result.url).toBe('https://example.com/processed.jpg');
        });
      });
    });

    describe('AI Video Effects', () => {
      const mockVideoData = {
        url: 'https://example.com/video.mp4',
        type: 'video'
      };

      it('should apply AI video effect', async () => {
        const options = {
          prompt: 'add dramatic lighting',
          effectName: 'cinematic-lighting',
          quality: 'high'
        };

        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'req-123' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/ai-effect.mp4']
            }
          });

        const result = await effects.applyAIVideoEffect(mockVideoData, options);

        expect(result.success).toBe(true);
        expect(result.outputs).toEqual(['https://example.com/ai-effect.mp4']);
      });

      it('should apply motion control effects', async () => {
        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'req-456' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/motion.mp4']
            }
          });

        const result = await effects.applyMotionControl(mockVideoData, 'zoom', {
          duration: 5
        });

        expect(result.success).toBe(true);
      });

      it('should apply VFX effects', async () => {
        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'req-789' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/vfx.mp4']
            }
          });

        const result = await effects.applyVFX(mockVideoData, 'explosion');

        expect(result.success).toBe(true);
      });
    });

    describe('Audio Generation', () => {
      it('should generate music', async () => {
        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'music-req-123' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/generated-music.mp3']
            }
          });

        const result = await effects.generateMusic('epic cinematic soundtrack', {
          genre: 'orchestral',
          duration: 60
        });

        expect(result.success).toBe(true);
        expect(result.outputs).toEqual(['https://example.com/generated-music.mp3']);
      });

      it('should perform lip sync', async () => {
        const videoData = { url: 'https://example.com/video.mp4' };
        const audioData = { url: 'https://example.com/audio.mp3' };

        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'lipsync-req-123' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/lipsynced.mp4']
            }
          });

        const result = await effects.lipSync(videoData, audioData, {
          model: 'sync-lipsync'
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Workflow Execution', () => {
      it('should execute workflow', async () => {
        const workflowData = {
          id: 'video-edit-workflow',
          inputs: { videoUrl: 'https://example.com/input.mp4' }
        };

        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'workflow-req-123' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              result: { outputUrl: 'https://example.com/processed.mp4' }
            }
          });

        const result = await effects.executeWorkflow(workflowData);

        expect(result.success).toBe(true);
      });

      it('should create storyboard', async () => {
        const projectData = {
          name: 'Test Storyboard',
          characters: ['Hero', 'Villain'],
          episodes: ['Episode 1']
        };

        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({
            success: true,
            data: { request_id: 'storyboard-req-123' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              storyboard: { frames: [] }
            }
          });

        const result = await effects.createStoryboard(projectData);

        expect(result.success).toBe(true);
      });
    });

    describe('Presets', () => {
      it('should return available presets', () => {
        const presets = MuAPIAdvancedEffects.getPresets();

        expect(presets).toHaveProperty('vintage-film');
        expect(presets).toHaveProperty('cyberpunk');
        expect(presets).toHaveProperty('cinematic-vfx');
        expect(presets).toHaveProperty('character-animation');
        expect(presets).toHaveProperty('hollywood-blockbuster');
      });

      it('should apply preset effects', async () => {
        const mockMediaData = { url: 'https://example.com/image.jpg' };

        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { url: 'https://example.com/preset-applied.jpg' }
        });

        const result = await effects.applyPreset(mockMediaData, 'vintage-film');

        expect(result.url).toBe('https://example.com/preset-applied.jpg');
      });

      it('should throw error for unknown preset', async () => {
        const mockMediaData = { url: 'https://example.com/image.jpg' };

        await expect(effects.applyPreset(mockMediaData, 'unknown-preset'))
          .rejects
          .toThrow('Unknown preset: unknown-preset');
      });
    });

    describe('Polling and Async Operations', () => {
      it('should poll for results successfully', async () => {
        mockMuapi._makeRequest = vi.fn()
          .mockResolvedValueOnce({ success: false }) // First attempt
          .mockResolvedValueOnce({ success: false }) // Second attempt
          .mockResolvedValueOnce({
            success: true,
            data: {
              status: 'completed',
              outputs: ['https://example.com/result.mp4']
            }
          });

        const result = await effects.pollForResult('req-123', 5, 10);

        expect(result.success).toBe(true);
        expect(result.outputs).toEqual(['https://example.com/result.mp4']);
      });

      it('should handle polling timeout', async () => {
        mockMuapi._makeRequest = vi.fn().mockResolvedValue({ success: false });

        const result = await effects.pollForResult('req-123', 2, 10);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Polling timeout exceeded');
      });

      it('should handle failed status', async () => {
        mockMuapi._makeRequest = vi.fn().mockResolvedValue({
          success: true,
          data: { status: 'failed', error: 'Processing failed' }
        });

        const result = await effects.pollForResult('req-123');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Processing failed');
      });
    });
  });

  describe('Cinema Studio (CINEMATIC_THEME)', () => {
    describe('Theme Constants', () => {
      it('should export CINEMATIC_THEME object', () => {
        const { CINEMATIC_THEME } = require('../../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME).toHaveProperty('page');
        expect(CINEMATIC_THEME).toHaveProperty('glass');
        expect(CINEMATIC_THEME).toHaveProperty('glow');
        expect(CINEMATIC_THEME).toHaveProperty('active');
        expect(CINEMATIC_THEME).toHaveProperty('text');
        expect(CINEMATIC_THEME).toHaveProperty('buttons');
        expect(CINEMATIC_THEME).toHaveProperty('layout');
        expect(CINEMATIC_THEME).toHaveProperty('accents');
      });

      it('should have proper glass panel styling', () => {
        const { CINEMATIC_THEME } = require('../../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME.glass.panel).toContain('rounded-[28px]');
        expect(CINEMATIC_THEME.glass.panel).toContain('border');
        expect(CINEMATIC_THEME.glass.panel).toContain('bg-white/[0.04]');
        expect(CINEMATIC_THEME.glass.panel).toContain('backdrop-blur-xl');
      });

      it('should have proper glow effects', () => {
        const { CINEMATIC_THEME } = require('../../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME.glow.emerald).toContain('shadow-[0_0_28px_rgba(16,185,129,0.18)]');
        expect(CINEMATIC_THEME.glow.indigo).toContain('shadow-[0_0_28px_rgba(99,102,241,0.12)]');
        expect(CINEMATIC_THEME.glow.rose).toContain('shadow-[0_0_26px_rgba(244,63,94,0.14)]');
      });

      it('should have proper button styles', () => {
        const { CINEMATIC_THEME } = require('../../../src/lib/cinematicTheme.js');

        expect(CINEMATIC_THEME.buttons.primary).toContain('rounded-2xl');
        expect(CINEMATIC_THEME.buttons.primary).toContain('bg-white');
        expect(CINEMATIC_THEME.buttons.primary).toContain('text-black');

        expect(CINEMATIC_THEME.buttons.secondary).toContain('rounded-2xl');
        expect(CINEMATIC_THEME.buttons.secondary).toContain('bg-white/[0.04]');
      });
    });

    describe('Utility Functions', () => {
      it('should combine classes with cx function', () => {
        const { cx } = require('../../../src/lib/cinematicTheme.js');

        const result = cx('class1', 'class2', undefined, 'class3');
        expect(result).toBe('class1 class2 class3');
      });

      it('should generate page shell class', () => {
        const { pageShell } = require('../../../src/lib/cinematicTheme.js');

        const result = pageShell('extra-class');
        expect(result).toContain('min-h-screen');
        expect(result).toContain('w-full');
        expect(result).toContain('bg-[#0a0a0b]');
        expect(result).toContain('extra-class');
      });

      it('should generate glass panel class', () => {
        const { glassPanel } = require('../../../src/lib/cinematicTheme.js');

        const result = glassPanel('extra-class');
        expect(result).toContain('rounded-[28px]');
        expect(result).toContain('border');
        expect(result).toContain('bg-white/[0.04]');
        expect(result).toContain('p-5');
        expect(result).toContain('extra-class');
      });

      it('should generate glass card class', () => {
        const { glassCard } = require('../../../src/lib/cinematicTheme.js');

        const result = glassCard('extra-class');
        expect(result).toContain('rounded-2xl');
        expect(result).toContain('border');
        expect(result).toContain('bg-[linear-gradient(180deg,rgba(255,255,255,0.045)');
        expect(result).toContain('extra-class');
      });

      it('should generate chip button class', () => {
        const { chipButton } = require('../../../src/lib/cinematicTheme.js');

        const inactiveResult = chipButton({ active: false, extra: 'extra-class' });
        expect(inactiveResult).toContain('rounded-full');
        expect(inactiveResult).toContain('border');
        expect(inactiveResult).toContain('bg-white/[0.04]');
        expect(inactiveResult).toContain('extra-class');

        const activeResult = chipButton({ active: true });
        expect(activeResult).toContain('bg-white');
        expect(activeResult).toContain('text-black');
      });

      it('should generate action button class', () => {
        const { actionButton } = require('../../../src/lib/cinematicTheme.js');

        const primaryResult = actionButton({ variant: 'primary', extra: 'extra-class' });
        expect(primaryResult).toContain('bg-white');
        expect(primaryResult).toContain('text-black');
        expect(primaryResult).toContain('extra-class');

        const secondaryResult = actionButton({ variant: 'secondary' });
        expect(secondaryResult).toContain('bg-white/[0.04]');
        expect(secondaryResult).toContain('text-zinc-100');
      });

      it('should generate active surface class', () => {
        const { activeSurface } = require('../../../src/lib/cinematicTheme.js');

        const emeraldResult = activeSurface({ tone: 'emerald', extra: 'extra-class' });
        expect(emeraldResult).toContain('border-emerald-400/28');
        expect(emeraldResult).toContain('bg-emerald-500/12');
        expect(emeraldResult).toContain('extra-class');

        const whiteResult = activeSurface({ tone: 'white' });
        expect(whiteResult).toContain('border-white');
        expect(whiteResult).toContain('bg-white');
        expect(whiteResult).toContain('text-black');
      });

      it('should generate accent glow class', () => {
        const { accentGlow } = require('../../../src/lib/cinematicTheme.js');

        const emeraldGlow = accentGlow('emerald');
        expect(emeraldGlow).toContain('rgba(16,185,129,0.18)');

        const indigoGlow = accentGlow('indigo');
        expect(indigoGlow).toContain('rgba(99,102,241,0.12)');
      });

      it('should generate gradient accent class', () => {
        const { gradientAccent } = require('../../../src/lib/cinematicTheme.js');

        const emeraldGradient = gradientAccent('emerald');
        expect(emeraldGradient).toContain('emerald-500/14');

        const roseGradient = gradientAccent('rose');
        expect(roseGradient).toContain('rose-500/16');
      });
    });

    describe('Random Accent Generation', () => {
      it('should return random accent from available colors', () => {
        const { getRandomAccent } = require('../../../src/lib/cinematicTheme.js');

        const result = getRandomAccent();
        const validAccents = ['emerald', 'indigo', 'rose', 'amber', 'cyan'];

        expect(validAccents).toContain(result);
      });

      it('should return random accent object with gradient and glow', () => {
        const { randomAccent } = require('../../../src/lib/cinematicTheme.js');

        const result = randomAccent();

        expect(result).toHaveProperty('gradient');
        expect(result).toHaveProperty('glow');
        expect(result).toHaveProperty('name');

        const validAccents = ['emerald', 'indigo', 'rose', 'amber', 'cyan'];
        expect(validAccents).toContain(result.name);

        expect(result.gradient).toContain(result.name);
        expect(result.glow).toContain(result.name);
      });
    });
  });
});</content>
<parameter name="filePath">tests/unit/advanced-video-features.unit.spec.ts