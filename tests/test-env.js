// Test environment configuration
import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'https://test-supabase-url.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-12345';
process.env.VITE_MUAPI_URL = 'https://test-muapi.ai';

// Mock localStorage for tests
global.localStorage = {
  getItem: function(key) {
    const testData = {
      'muapi_key': 'test-api-key-12345',
      'user_preferences': JSON.stringify({ theme: 'dark', language: 'en' }),
      'muapi_history': JSON.stringify([
        { id: '1', prompt: 'test image', url: 'https://example.com/image1.jpg', timestamp: Date.now() }
      ]),
      'video_history': JSON.stringify([
        { id: '1', prompt: 'test video', url: 'https://example.com/video1.mp4', timestamp: Date.now() }
      ])
    };
    return testData[key] || null;
  },
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock sessionStorage
global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock console methods to reduce noise during testing
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Restore console for debugging specific tests
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Mock environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  VITE_SUPABASE_URL: 'https://test-supabase-url.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345',
  VITE_MUAPI_URL: 'https://test-muapi.ai',
  VITE_FAL_KEY: 'test-fal-key',
  VITE_OPENAI_KEY: 'test-openai-key',
  VITE_ANTHROPIC_KEY: 'test-anthropic-key'
});

// Mock import.meta.env for Vite
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test-supabase-url.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345',
      VITE_MUAPI_URL: 'https://test-muapi.ai',
      VITE_FAL_KEY: 'test-fal-key',
      VITE_OPENAI_KEY: 'test-openai-key',
      VITE_ANTHROPIC_KEY: 'test-anthropic-key',
      DEV: false,
      PROD: false
    }
  }
};

// Export test utilities
export const createMockMediaData = (type = 'image') => ({
  url: `https://example.com/test-${type}.${type === 'image' ? 'jpg' : 'mp4'}`,
  type,
  id: 'test-media-id',
  size: 1024000,
  width: type === 'image' ? 1920 : undefined,
  height: type === 'image' ? 1080 : undefined,
  duration: type === 'video' ? 30 : undefined
});

export const createMockApiResponse = (success = true, data = {}) => ({
  success,
  data: success ? {
    url: 'https://example.com/processed-media.mp4',
    id: 'test-job-id',
    ...data
  } : null,
  error: success ? null : 'Test error message'
});

// Mock timers for testing
export const mockTimers = () => {
  jest.useFakeTimers();
  return {
    advanceTimersByTime: jest.advanceTimersByTime,
    runOnlyPendingTimers: jest.runOnlyPendingTimers,
    clearAllTimers: jest.clearAllTimers,
    restoreTimers: () => jest.useRealTimers()
  };
};