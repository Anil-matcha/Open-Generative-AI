import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create Supabase client for ai-storyboarder
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

class ApiService {
  constructor() {
    this.baseURL = '/.netlify/functions'
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    const response = await fetch(url, config)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    return response.json()
  }

  // Projects
  async getProjects() {
    return this.request('/storyboarder-projects')
  }

  async getProject(id) {
    return this.request(`/storyboarder-projects/${id}`)
  }

  async createProject(data) {
    return this.request('/storyboarder-projects', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async deleteProject(id) {
    return this.request(`/storyboarder-projects/${id}`, {
      method: 'DELETE'
    })
  }

  async duplicateProject(id) {
    return this.request(`/storyboarder-projects/${id}/duplicate`, {
      method: 'POST'
    })
  }

  // Scripts
  async getScripts(projectId) {
    return this.request(`/storyboarder-scripts?project_id=${projectId}`)
  }

  async createScript(data) {
    return this.request('/storyboarder-scripts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async analyzeScript(text, genre) {
    return this.request('/storyboarder-scripts/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, genre })
    })
  }

  // Scenes
  async getScenes(scriptId) {
    return this.request(`/storyboarder-scenes?script_id=${scriptId}`)
  }

  async generateSceneImage(sceneId) {
    return this.request(`/storyboarder-scenes/${sceneId}/generate-image`, {
      method: 'POST'
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/storyboarder-health')
  }
}

const api = new ApiService()
export { api, supabase }
export default api