// Cleanup utilities after each test
afterEach(() => {
  // Clear any remaining timers
  vi.clearAllMocks();
  vi.restoreAllMocks();

  // Reset DOM
  document.body.innerHTML = '';

  // Clear any pending promises
  // (microtasks queue will drain naturally between tests)
});

// Global test configuration
vi.setConfig({ testTimeout: 10000 });
