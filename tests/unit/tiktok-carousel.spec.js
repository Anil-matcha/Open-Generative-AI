import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  generateTikTokCarousel,
  uploadCarouselMusic,
  generateCarouselPreview
} from '../../src/lib/muapiEnhanced.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('TikTok Carousel Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-api-key-12345');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('generateTikTokCarousel', () => {
    const mockImageUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];

    it('should generate TikTok carousel with default options', async () => {
      const mockSubmitResponse = { data: { request_id: 'carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/carousel.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(mockImageUrls);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/carousel.mp4');
      expect(result.optimized).toBe(true);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://api.muapi.ai/api/v1/generate_tiktok_carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-api-key-12345' },
        body: JSON.stringify({
          images: mockImageUrls,
          layout: 'horizontal',
          transition_effect: 'slide',
          slide_timings: [5, 5, 5], // 5 seconds per image
          background_music: null,
          resolution: '1080p',
          aspect_ratio: '9:16',
          total_duration: 5,
          optimize_for_tiktok: true
        })
      });
    });

    it('should generate carousel with custom options', async () => {
      const customOptions = {
        layout: 'vertical',
        transitions: 'fade',
        timings: [2, 3, 4],
        musicUrl: 'https://example.com/music.mp3',
        resolution: '4k',
        aspectRatio: '1:1',
        duration: 10
      };

      const mockSubmitResponse = { data: { request_id: 'custom-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/custom-carousel.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(mockImageUrls, customOptions);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/custom-carousel.mp4');

      expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://api.muapi.ai/api/v1/generate_tiktok_carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-api-key-12345' },
        body: JSON.stringify({
          images: mockImageUrls,
          layout: 'vertical',
          transition_effect: 'fade',
          slide_timings: [2, 3, 4],
          background_music: 'https://example.com/music.mp3',
          resolution: '4k',
          aspect_ratio: '1:1',
          total_duration: 10,
          optimize_for_tiktok: true
        })
      });
    });

    it('should handle maximum image limit (10 images)', async () => {
      const maxImages = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i + 1}.jpg`);

      const mockSubmitResponse = { data: { request_id: 'max-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/max-carousel.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(maxImages);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"images":["https://example.com/image1.jpg"')
        })
      );
    });

    it('should reject when more than 10 images provided', async () => {
      const tooManyImages = Array.from({ length: 11 }, (_, i) => `https://example.com/image${i + 1}.jpg`);

      await expect(generateTikTokCarousel(tooManyImages))
        .rejects.toThrow('Maximum 10 images allowed for carousel generation');
    });

    it('should reject when no images provided', async () => {
      await expect(generateTikTokCarousel([]))
        .rejects.toThrow('At least one image URL is required');
    });

    it('should handle API submission errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid images' })
      });

      const result = await generateTikTokCarousel(mockImageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid images');
    });

    it('should handle polling timeout', async () => {
      const mockSubmitResponse = { data: { request_id: 'timeout-carousel-123' } };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            data: { status: 'processing' } // Never completes
          })
        });

      const result = await generateTikTokCarousel(mockImageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Carousel generation timeout');
    });

    it('should handle processing failure', async () => {
      const mockSubmitResponse = { data: { request_id: 'failed-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'failed',
          error: 'Image processing failed'
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      const result = await generateTikTokCarousel(mockImageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Image processing failed');
    });

    it('should normalize slide timings to match total duration', async () => {
      const customOptions = {
        timings: [1, 1, 1], // 3 seconds total, but duration is 5
        duration: 5
      };

      const mockSubmitResponse = { data: { request_id: 'normalized-carousel-123' } };
      const mockResultResponse = {
        data: {
          status: 'completed',
          outputs: ['https://example.com/normalized-carousel.mp4']
        }
      };

      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSubmitResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResultResponse)
        });

      await generateTikTokCarousel(mockImageUrls, customOptions);

      expect(global.fetch).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"slide_timings":[1.6666666666666665,1.6666666666666665,1.6666666666666665]')
      }));
    });

    it('should throw error when API key not configured', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await expect(generateTikTokCarousel(mockImageUrls))
        .rejects.toThrow('MuAPI key not configured');
    });

    it('should throw error when API key is too short', async () => {
      localStorageMock.getItem.mockReturnValue('short');

      await expect(generateTikTokCarousel(mockImageUrls))
        .rejects.toThrow('Invalid MuAPI key format');
    });
  });

  describe('uploadCarouselMusic', () => {
    it('should upload music file successfully', async () => {
      const mockFile = new File(['music data'], 'background.mp3', { type: 'audio/mpeg' });
      const mockResponse = {
        url: 'https://example.com/uploaded-music.mp3',
        duration: 120,
        format: 'mp3'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await uploadCarouselMusic(mockFile);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://example.com/uploaded-music.mp3');
      expect(result.duration).toBe(120);
      expect(result.format).toBe('mp3');

      expect(global.fetch).toHaveBeenCalledWith('https://api.muapi.ai/api/v1/upload', {
        method: 'POST',
        headers: { 'x-api-key': 'test-api-key-12345' },
        body: expect.any(FormData)
      });
    });

    it('should reject non-audio files', async () => {
      const mockFile = new File(['image data'], 'not-music.jpg', { type: 'image/jpeg' });

      await expect(uploadCarouselMusic(mockFile))
        .rejects.toThrow('Valid audio file required');
    });

    it('should handle upload API errors', async () => {
      const mockFile = new File(['music data'], 'background.mp3', { type: 'audio/mpeg' });

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Upload failed' })
      });

      const result = await uploadCarouselMusic(mockFile);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });
  });

  describe('generateCarouselPreview', () => {
    const mockImageUrls = [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg'
    ];

    it('should generate carousel preview with default options', async () => {
      const mockResponse = {
        thumbnail_url: 'https://example.com/preview.jpg',
        layout: 'horizontal',
        imageCount: 3
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateCarouselPreview(mockImageUrls);

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBe('https://example.com/preview.jpg');
      expect(result.layout).toBe('horizontal');
      expect(result.imageCount).toBe(3);

      expect(global.fetch).toHaveBeenCalledWith('https://api.muapi.ai/api/v1/generate_carousel_preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': 'test-api-key-12345' },
        body: JSON.stringify({
          images: mockImageUrls.slice(0, 4), // Preview with first 4 images
          layout: 'horizontal',
          transition_effect: 'slide',
          width: 300,
          height: 500,
          preview_only: true
        })
      });
    });

    it('should generate preview with custom options', async () => {
      const customOptions = {
        layout: 'vertical',
        transitions: 'fade',
        width: 400,
        height: 600
      };

      const mockResponse = {
        thumbnail_url: 'https://example.com/custom-preview.jpg'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await generateCarouselPreview(mockImageUrls, customOptions);

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBe('https://example.com/custom-preview.jpg');

      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: JSON.stringify({
          images: mockImageUrls.slice(0, 4),
          layout: 'vertical',
          transition_effect: 'fade',
          width: 400,
          height: 600,
          preview_only: true
        })
      }));
    });

    it('should return error when no images provided', async () => {
      const result = await generateCarouselPreview([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No images provided');
    });

    it('should handle preview generation API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      });

      const result = await generateCarouselPreview(mockImageUrls);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Preview generation failed');
    });

    it('should limit preview to first 4 images even when more provided', async () => {
      const manyImages = Array.from({ length: 10 }, (_, i) => `https://example.com/image${i + 1}.jpg`);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ thumbnail_url: 'preview.jpg' })
      });

      await generateCarouselPreview(manyImages);

      expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        body: expect.stringContaining('"images":["https://example.com/image1.jpg","https://example.com/image2.jpg","https://example.com/image3.jpg","https://example.com/image4.jpg"]')
      }));
    });
  });
});