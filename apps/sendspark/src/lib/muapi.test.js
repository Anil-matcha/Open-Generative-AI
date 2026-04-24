import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MuAPIVFXClient } from '../lib/muapi.js'

describe('MuAPIVFXClient', () => {
  let client

  beforeEach(() => {
    // Clear localStorage mock before each test
    vi.clearAllMocks()
    client = new MuAPIVFXClient()
  })

  describe('initialization', () => {
    it('should initialize with empty API key when localStorage is empty', () => {
      // Mock localStorage.getItem to return null
      global.localStorage.getItem.mockReturnValue(null)

      const newClient = new MuAPIVFXClient()
      expect(newClient.apiKey).toBe('')
      expect(newClient.baseUrl).toBe('https://api.muapi.ai')
    })

    it('should initialize with API key from localStorage', () => {
      const testKey = 'test-api-key-123'
      global.localStorage.getItem.mockReturnValue(testKey)

      const newClient = new MuAPIVFXClient()
      expect(newClient.apiKey).toBe(testKey)
    })
  })

  describe('API key management', () => {
    it('should set and store API key', () => {
      const testKey = 'new-api-key-456'
      client.setApiKey(testKey)

      expect(client.apiKey).toBe(testKey)
      expect(global.localStorage.setItem).toHaveBeenCalledWith('muapi_key', testKey)
    })
  })

  describe('generateVFXEffect', () => {
    it('should throw error when no API key is set', async () => {
      client.apiKey = ''

      await expect(client.generateVFXEffect({})).rejects.toThrow('API key not configured')
    })

    it('should make API call with correct parameters', async () => {
      // Setup
      const testKey = 'test-key'
      const testParams = {
        image_url: 'https://example.com/image.jpg',
        effect_type: 'explosion',
        duration: 3
      }
      const mockResponse = { success: true, request_id: '123' }

      client.setApiKey(testKey)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      // Execute
      const result = await client.generateVFXEffect(testParams)

      // Verify
      expect(global.fetch).toHaveBeenCalledWith('https://api.muapi.ai/api/v1/generate_wan_ai_effects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testKey}`,
        },
        body: JSON.stringify(testParams),
      })
      expect(result).toEqual(mockResponse)
    })

    it('should throw error on API failure', async () => {
      client.setApiKey('test-key')
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      })

      await expect(client.generateVFXEffect({
        image_url: 'https://example.com/image.jpg',
        effect_type: 'explosion'
      })).rejects.toThrow('API request failed (400): Bad Request')
    })
  })
})