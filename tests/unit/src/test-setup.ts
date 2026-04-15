/**
 * Test setup file for Timeline Editor unit tests
 *
 * This file runs before each test suite to configure the test environment
 * and set up any global test utilities.
 */

// Set up global test environment
beforeAll(() => {
  // Configure test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITEST = 'true';

  // Mock browser APIs for Node.js environment
  global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    location: {
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    }
  };

  global.document = {
    createElement: vi.fn(() => ({
      className: '',
      style: {},
      appendChild: vi.fn(),
      removeChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => []),
      innerHTML: '',
      textContent: '',
      value: '',
      disabled: false,
      checked: false,
      selected: false,
      options: [],
      files: [],
      click: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn()
    })),
    getElementById: vi.fn(() => null),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createTextNode: vi.fn(() => ({ nodeValue: '' })),
    createDocumentFragment: vi.fn(() => ({
      appendChild: vi.fn()
    }))
  };

  global.navigator = {
    userAgent: 'test-agent',
    platform: 'test-platform'
  };

  global.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };

  global.sessionStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };

  // Mock URL APIs
  global.URL = {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  };

  // Mock fetch API
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob())
    })
  );

  // Mock console methods to reduce noise during tests
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});