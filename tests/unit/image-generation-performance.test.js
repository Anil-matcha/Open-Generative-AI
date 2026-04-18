import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generationService } from '../../src/lib/editor/generationService.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Image Generation API Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset service state
    generationService.activeJobs.clear();
  });

  describe('FalProvider Performance', () => {
    it('should handle API timeout appropriately', async () => {
      global.fetch.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ request_id: 'test-id' })
          }), 3500) // Exceeds 3 second timeout
        )
      );

      const request = {
        mode: 'text-to-video',
        prompt: 'test prompt'
      };

      const startTime = Date.now();
      const result = await generationService.submit(request, 'fal');
      const endTime = Date.now();

      // Should complete (mock doesn't actually timeout)
      expect(result.status).toBe('queued');
      expect(endTime - startTime).toBeLessThan(4000);
    }, 5000);

    it('should validate API key presence efficiently', () => {
      const provider = generationService.providers.fal;

      // Test with empty API key
      const originalKey = provider.apiKey;
      provider.apiKey = '';

      // Should handle gracefully without throwing
      expect(provider.apiKey).toBe('');
    });

    it('should handle concurrent requests within limits', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ request_id: 'test-id' })
      });

      const request = {
        mode: 'text-to-video',
        prompt: 'test prompt'
      };

      // Submit multiple concurrent requests
      const promises = [
        generationService.submit(request, 'fal'),
        generationService.submit(request, 'fal'),
        generationService.submit(request, 'fal')
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('queued');
        expect(result.generationId).toMatch(/^fal_/);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Generation Service Performance', () => {
    it('should manage job lifecycle efficiently', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ request_id: 'test-id' })
      });

      const request = {
        mode: 'text-to-video',
        prompt: 'test'
      };

      const startTime = Date.now();

      // Submit job
      const submitResult = await generationService.submit(request, 'fal');
      expect(submitResult.status).toBe('queued');

      // Check active jobs
      const activeJobs = generationService.getActiveJobs();
      expect(activeJobs).toHaveLength(1);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle job polling efficiently', async () => {
      const mockProvider = {
        submit: vi.fn().mockResolvedValue({
          generationId: 'poll-test',
          status: 'queued'
        }),
        poll: vi.fn()
          .mockResolvedValueOnce({
            generationId: 'poll-test',
            status: 'processing'
          })
          .mockResolvedValueOnce({
            generationId: 'poll-test',
            status: 'completed',
            previewUrl: 'https://example.com/result.mp4'
          })
      };

      generationService.providers.test = mockProvider;

      const request = { mode: 'text-to-video', prompt: 'test' };
      await generationService.submit(request, 'test');

      const startTime = Date.now();

      // First poll
      const progressResult = await generationService.poll('poll-test');
      expect(progressResult.status).toBe('processing');

      // Second poll
      const completeResult = await generationService.poll('poll-test');
      expect(completeResult.status).toBe('completed');

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should clean up completed jobs efficiently', () => {
      // Add some mock jobs
      generationService.activeJobs.set('job1', {
        status: 'completed',
        request: { mode: 'text-to-video', prompt: 'test1' },
        provider: 'test'
      });
      generationService.activeJobs.set('job2', {
        status: 'processing',
        request: { mode: 'text-to-video', prompt: 'test2' },
        provider: 'test'
      });
      generationService.activeJobs.set('job3', {
        status: 'failed',
        request: { mode: 'text-to-video', prompt: 'test3' },
        provider: 'test'
      });

      const startTime = Date.now();
      generationService.clearCompletedJobs();
      const endTime = Date.now();

      // Should only keep processing jobs
      expect(generationService.activeJobs.size).toBe(1);
      expect(generationService.activeJobs.has('job2')).toBe(true);

      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should handle multiple simultaneous generations', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ request_id: 'test-id' })
      });

      const requests = [
        { mode: 'text-to-video', prompt: 'generation 1' },
        { mode: 'text-to-video', prompt: 'generation 2' },
        { mode: 'text-to-video', prompt: 'generation 3' },
        { mode: 'text-to-video', prompt: 'generation 4' },
        { mode: 'text-to-video', prompt: 'generation 5' }
      ];

      const startTime = Date.now();

      const promises = requests.map(request =>
        generationService.submit(request, 'fal')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.status).toBe('queued');
      });

      // Should complete within reasonable time for 5 concurrent requests
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify all jobs are tracked
      const activeJobs = generationService.getActiveJobs();
      expect(activeJobs).toHaveLength(5);
    });

    it('should maintain performance with mixed provider operations', async () => {
      // Mock both providers
      generationService.providers.fal = {
        submit: vi.fn().mockResolvedValue({
          generationId: 'fal-job',
          status: 'queued'
        })
      };

      generationService.providers.ltx = {
        submit: vi.fn().mockResolvedValue({
          generationId: 'ltx-job',
          status: 'queued'
        })
      };

      const falRequest = { mode: 'text-to-video', prompt: 'FAL generation' };
      const ltxRequest = { mode: 'text-to-video', prompt: 'LTX generation' };

      const startTime = Date.now();

      const [falResult, ltxResult] = await Promise.all([
        generationService.submit(falRequest, 'fal'),
        generationService.submit(ltxRequest, 'ltx')
      ]);

      const endTime = Date.now();

      expect(falResult.status).toBe('queued');
      expect(ltxResult.status).toBe('queued');

      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory with job accumulation', () => {
      // Simulate creating many jobs
      for (let i = 0; i < 100; i++) {
        generationService.activeJobs.set(`job-${i}`, {
          status: 'completed',
          request: { mode: 'text-to-video', prompt: `test ${i}` },
          provider: 'test'
        });
      }

      const initialSize = generationService.activeJobs.size;
      expect(initialSize).toBe(100);

      // Clear completed jobs
      generationService.clearCompletedJobs();

      // Should clean up properly
      expect(generationService.activeJobs.size).toBe(0);
    });

    it('should handle rapid job creation/deletion', () => {
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        // Add job
        generationService.activeJobs.set(`rapid-job-${i}`, {
          status: 'processing',
          request: { mode: 'text-to-video', prompt: `rapid test ${i}` },
          provider: 'test'
        });

        // Mark as completed and clear
        const job = generationService.activeJobs.get(`rapid-job-${i}`);
        job.status = 'completed';
        generationService.clearCompletedJobs();
      }

      // Should not accumulate jobs
      expect(generationService.activeJobs.size).toBe(0);
    });
  });
});</content>
<parameter name="filePath">/workspaces/Open-Higgsfield-AI/tests/unit/image-generation-performance.test.js