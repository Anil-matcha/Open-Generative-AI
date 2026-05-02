import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getApiBaseUrl,
  getGenerateVideoUrl,
  getEnhanceTextUrl,
  enhanceText,
  generateVideo,
  getJobStatus
} from '../../../src/services/apiService';

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('REACT_APP_API_BASE_URL', '');
    vi.stubEnv('REACT_APP_SUPABASE_URL', '');
    vi.stubEnv('REACT_APP_SUPABASE_ANON_KEY', '');
    vi.stubEnv('REACT_APP_API_KEY', '');
  });

  describe('getApiBaseUrl', () => {
    it('returns default localhost when no env set', () => {
      expect(getApiBaseUrl()).toBe('http://localhost:8000');
    });

    it('returns REACT_APP_API_BASE_URL when set', () => {
      vi.stubEnv('REACT_APP_API_BASE_URL', 'http://api.example.com');
      expect(getApiBaseUrl()).toBe('http://api.example.com');
    });
  });

  describe('getEnhanceTextUrl', () => {
    it('returns Supabase function URL when REACT_APP_SUPABASE_URL is set', () => {
      vi.stubEnv('REACT_APP_SUPABASE_URL', 'https://xyz.supabase.co');
      expect(getEnhanceTextUrl()).toBe('https://xyz.supabase.co/functions/v1/enhance-text');
    });

    it('returns API base endpoint when REACT_APP_SUPABASE_URL is not set', () => {
      vi.stubEnv('REACT_APP_API_BASE_URL', 'http://localhost:8000');
      expect(getEnhanceTextUrl()).toBe('http://localhost:8000/enhance-text');
    });
  });

  describe('getGenerateVideoUrl', () => {
    it('returns Supabase function URL when REACT_APP_SUPABASE_URL is set', () => {
      vi.stubEnv('REACT_APP_SUPABASE_URL', 'https://xyz.supabase.co');
      expect(getGenerateVideoUrl()).toBe('https://xyz.supabase.co/functions/v1/generate-video-proxy');
    });

    it('returns API base endpoint when REACT_APP_SUPABASE_URL is not set', () => {
      vi.stubEnv('REACT_APP_API_BASE_URL', 'http://localhost:8000');
      expect(getGenerateVideoUrl()).toBe('http://localhost:8000/generate-video');
    });
  });

  describe('enhanceText', () => {
    it('sends POST with text and pipeline_type in body when no auth key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ enhanced_text: 'Enhanced text' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await enhanceText('my text', 'idea2video');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/enhance-text',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'my text', pipeline_type: 'idea2video' }),
        })
      );
      expect(result).toBe('Enhanced text');
    });

    it('includes Authorization header from SUPABASE_ANON_KEY', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ enhanced_text: 'ok' }),
      });
      vi.stubGlobal('fetch', mockFetch);
      vi.stubEnv('REACT_APP_SUPABASE_ANON_KEY', 'supakey123');

      await enhanceText('test', 'cameo');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer supakey123',
            'Apikey': 'supakey123',
          }),
        })
      );
    });

    it('includes Authorization header from REACT_APP_API_KEY as fallback', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ enhanced_text: 'ok' }),
      });
      vi.stubGlobal('fetch', mockFetch);
      vi.stubEnv('REACT_APP_API_KEY', 'apikey456');

      await enhanceText('test', 'script2video');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer apikey456',
          }),
        })
      );
    });

    it('trims whitespace from text before sending', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ enhanced_text: 'ok' }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await enhanceText('  my text  ', 'idea2video');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ text: 'my text', pipeline_type: 'idea2video' }),
        })
      );
    });

    it('throws error when response is not ok (detail as string)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: 'Enhancement failed' }),
      }));

      await expect(enhanceText('x', 'y')).rejects.toThrow('Enhancement failed');
    });

    it('throws error when response is not ok (no detail field)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      }));

      await expect(enhanceText('x', 'y')).rejects.toThrow('Enhancement failed.');
    });

    it('throws error on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await expect(enhanceText('x', 'y')).rejects.toThrow('Network error');
    });
  });

  describe('generateVideo', () => {
    it('POSTs FormData to correct URL with API key header', async () => {
      const mockAxios = {
        post: vi.fn().mockResolvedValue({ data: { job_id: 'job-123' } }),
      };
      vi.stubGlobal('axios', mockAxios);
      vi.stubEnv('REACT_APP_API_BASE_URL', 'http://localhost:8000');

      const formData = new FormData();
      formData.append('idea', 'My cool idea');
      formData.append('pipeline_type', 'idea2video');

      const result = await generateVideo(formData);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/generate-video',
        formData,
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
      expect(result).toEqual({ job_id: 'job-123' });
    });

    it('uses Supabase proxy URL when REACT_APP_SUPABASE_URL is set', async () => {
      const mockAxios = {
        post: vi.fn().mockResolvedValue({ data: { job_id: 'job-456' } }),
      };
      vi.stubGlobal('axios', mockAxios);
      vi.stubEnv('REACT_APP_SUPABASE_URL', 'https://xyz.supabase.co');

      const formData = new FormData();
      const result = await generateVideo(formData);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://xyz.supabase.co/functions/v1/generate-video-proxy',
        formData,
        expect.any(Object)
      );
      expect(result.job_id).toBe('job-456');
    });

    it('includes Authorization header from SUPABASE_ANON_KEY', async () => {
      const mockAxios = {
        post: vi.fn().mockResolvedValue({ data: { job_id: 'job-789' } }),
      };
      vi.stubGlobal('axios', mockAxios);
      vi.stubEnv('REACT_APP_SUPABASE_ANON_KEY', 'anonkey123');

      const formData = new FormData();
      await generateVideo(formData);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer anonkey123',
            'Apikey': 'anonkey123',
          }),
        })
      );
    });

    it('includes Authorization header from REACT_APP_API_KEY when no anon key', async () => {
      const mockAxios = {
        post: vi.fn().mockResolvedValue({ data: { job_id: 'job-000' } }),
      };
      vi.stubGlobal('axios', mockAxios);
      vi.stubEnv('REACT_APP_API_KEY', 'myapikey');

      const formData = new FormData();
      await generateVideo(formData);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        formData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer myapikey',
          }),
        })
      );
    });

    it('returns job_id from response data', async () => {
      const mockAxios = {
        post: vi.fn().mockResolvedValue({ data: { job_id: 'my-job-123' } }),
      };
      vi.stubGlobal('axios', mockAxios);

      const formData = new FormData();
      const result = await generateVideo(formData);

      expect(result.job_id).toBe('my-job-123');
    });

    it('throws error when axios request fails', async () => {
      const mockAxios = {
        post: vi.fn().mockRejectedValue({
          response: { data: { detail: 'Invalid API key' } },
        }),
      };
      vi.stubGlobal('axios', mockAxios);

      const formData = new FormData();
      await expect(generateVideo(formData)).rejects.toThrow('Invalid API key');
    });
  });

  describe('getJobStatus', () => {
    it('GETs job status from correct endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'processing', progress: 50 }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await getJobStatus('job-123');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/job/job-123');
      expect(result).toEqual({ status: 'processing', progress: 50 });
    });

    it('throws error when response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      }));

      await expect(getJobStatus('missing')).rejects.toThrow('Failed to get job status: 404');
    });

    it('throws error on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await expect(getJobStatus('job-123')).rejects.toThrow('Network error');
    });

    it('returns full job object on success', async () => {
      const jobData = {
        status: 'completed',
        progress: 100,
        scenes: [],
        message: 'Done',
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(jobData),
      }));

      const result = await getJobStatus('job-complete');
      expect(result).toBe(jobData);
    });
  });
});
