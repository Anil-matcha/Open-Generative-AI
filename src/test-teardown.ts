// Global test teardown
import { afterEach, vi } from 'vitest';

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();

  // Clean up localStorage/sessionStorage
  localStorage.clear();
  sessionStorage.clear();

  // Reset all timers
  vi.clearAllTimers();

  // Restore all mocks
  vi.restoreAllMocks();
});