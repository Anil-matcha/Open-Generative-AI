/**
 * Test teardown file for Timeline Editor unit tests
 *
 * This file runs after each test suite to clean up resources
 * and reset the test environment.
 */

// Clean up after each test suite
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  vi.resetAllMocks();

  // Reset global state
  if (global.localStorage?.clear) {
    global.localStorage.clear();
  }
  if (global.sessionStorage?.clear) {
    global.sessionStorage.clear();
  }

  // Reset DOM mocks
  if (global.document?.body) {
    global.document.body.innerHTML = '';
  }
});

// Clean up after all test suites
afterAll(() => {
  // Restore original implementations
  vi.restoreAllMocks();

  // Clean up global mocks
  delete global.window;
  delete global.document;
  delete global.navigator;
  delete global.localStorage;
  delete global.sessionStorage;
  delete global.URL;
  delete global.fetch;
  delete global.console;
});