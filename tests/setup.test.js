// Vitest test setup for comprehensive testing
import { vi } from 'vitest';

// Mock fetch globally for API calls
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock Supabase environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock MuAPI key for tests
localStorageMock.getItem.mockReturnValue('test-api-key-12345');

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test-url');
global.URL.revokeObjectURL = vi.fn();

// Mock File and Blob
global.File = vi.fn((parts, filename, options) => ({
  name: filename,
  size: parts?.[0]?.length || 0,
  type: options?.type || 'application/octet-stream',
}));
global.Blob = vi.fn((parts, options) => ({
  size: parts?.[0]?.length || 0,
  type: options?.type || 'application/octet-stream',
}));

// Mock Image constructor for image loading
global.Image = vi.fn(() => ({
  onload: null,
  onerror: null,
  src: '',
  width: 100,
  height: 100,
}));

// Mock canvas and WebGL context
global.HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === '2d') {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(400) })),
      putImageData: vi.fn(),
      createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(400) })),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getContextAttributes: vi.fn(() => ({})),
      reset: vi.fn(),
      roundRect: vi.fn(),
    };
  }
  if (contextType === 'webgl' || contextType === 'experimental-webgl') {
    return {
      getExtension: vi.fn(),
      createShader: vi.fn(() => ({})),
      createProgram: vi.fn(() => ({})),
      attachShader: vi.fn(),
      linkProgram: vi.fn(),
      useProgram: vi.fn(),
      getAttribLocation: vi.fn(() => 0),
      getUniformLocation: vi.fn(() => ({})),
      uniform1i: vi.fn(),
      uniform1f: vi.fn(),
      uniform2f: vi.fn(),
      enableVertexAttribArray: vi.fn(),
      vertexAttribPointer: vi.fn(),
      createBuffer: vi.fn(() => ({})),
      bindBuffer: vi.fn(),
      bufferData: vi.fn(),
      createTexture: vi.fn(() => ({})),
      bindTexture: vi.fn(),
      texParameteri: vi.fn(),
      texImage2D: vi.fn(),
      activeTexture: vi.fn(),
      clearColor: vi.fn(),
      clear: vi.fn(),
      viewport: vi.fn(),
      getProgramParameter: vi.fn(() => true),
      getShaderParameter: vi.fn(() => true),
      getShaderInfoLog: vi.fn(() => ''),
      getProgramInfoLog: vi.fn(() => ''),
      shaderSource: vi.fn(),
      compileShader: vi.fn(),
      deleteShader: vi.fn(),
      deleteProgram: vi.fn(),
      deleteBuffer: vi.fn(),
      deleteTexture: vi.fn(),
    };
  }
  return null;
});

// Mock performance.now
global.performance.now = vi.fn(() => Date.now());

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Web Audio API
global.AudioContext = vi.fn(() => ({
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 1, setValueAtTime: vi.fn() },
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
  })),
  destination: {},
  currentTime: 0,
}));

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
}));

// Mock Notification API
global.Notification = vi.fn(() => ({
  show: vi.fn(),
}));
global.Notification.requestPermission = vi.fn(() => Promise.resolve('granted'));

// Mock MediaRecorder
global.MediaRecorder = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
}));

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() => Promise.resolve({
    getTracks: vi.fn(() => []),
    getVideoTracks: vi.fn(() => []),
    getAudioTracks: vi.fn(() => []),
  })),
};

// Mock Geolocation
global.navigator.geolocation = {
  getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 0, longitude: 0 } })),
  watchPosition: vi.fn(() => 1),
  clearWatch: vi.fn(),
};

// Setup default fetch mock for API calls
global.fetch.mockImplementation((url, options) => {
  // Mock successful API responses for testing
  if (url.includes('/effects/') || url.includes('/functions/v1/muapi-proxy')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          url: 'https://example.com/processed-media.mp4',
          id: 'test-job-id',
        },
      }),
      text: () => Promise.resolve('{"success":true,"data":{"url":"https://example.com/processed-media.mp4"}}'),
    });
  }

  // Default response for other URLs
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('{}'),
  });
});