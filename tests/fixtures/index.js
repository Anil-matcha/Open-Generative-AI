// Test fixtures and mock data

export const mockUser = {
  id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    theme: 'dark',
    language: 'en'
  }
};

export const mockProject = {
  id: 'project123',
  name: 'Test Project',
  type: 'video',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

export const mockMediaFile = {
  id: 'media123',
  name: 'test-video.mp4',
  type: 'video/mp4',
  size: 1024000,
  url: 'https://example.com/test-video.mp4',
  thumbnailUrl: 'https://example.com/thumbnail.jpg'
};

export const mockTimelineData = {
  tracks: [
    {
      id: 'track1',
      name: 'Video Track',
      type: 'video',
      clips: [
        {
          id: 'clip1',
          startTime: 0,
          endTime: 5,
          mediaId: 'media123',
          name: 'Test Clip'
        }
      ]
    }
  ],
  duration: 10,
  playhead: 0
};

// Mock API responses
export const mockAPIResponses = {
  generateImage: {
    success: true,
    imageUrl: 'https://example.com/generated-image.jpg',
    prompt: 'test prompt'
  },
  generateVideo: {
    success: true,
    videoUrl: 'https://example.com/generated-video.mp4',
    duration: 5
  },
  uploadFile: {
    success: true,
    fileId: 'file123',
    url: 'https://example.com/uploaded-file.mp4'
  }
};

// Test utilities
export const waitForLoading = async (page, selector = '[data-loading]') => {
  await page.waitForSelector(selector, { state: 'hidden' });
};

export const waitForContent = async (page, selector = '[data-content]') => {
  await page.waitForSelector(selector, { state: 'visible' });
};

export const mockFileUpload = async (page, filePath, fileName = 'test.mp4') => {
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: fileName,
    mimeType: 'video/mp4',
    buffer: Buffer.from('mock file content')
  });
};