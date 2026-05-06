/**
 * AI Storyboard API Client for CutAI
 * 
 * Uses serverless infrastructure:
 * - Netlify Functions for AI operations (storyboard generation, script processing)
 * - Supabase Edge Functions for database operations
 * - NO separate servers required
 */

class CutAIClient {
  constructor() {
    this.netlifyFunctionsBase = '/.netlify/functions';
    this.supabaseFunctionsBase = '/functions/v1';
  }

  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('CutAI API Error:', error);
      throw error;
    }
  }

  // =============================================================================
  // NETLIFY FUNCTIONS - AI Operations
  // =============================================================================

  /**
   * Generate a script from genre and premise using OpenAI
   */
  async generateScript(genre, premise, numScenes = 5) {
    const response = await fetch(`${this.netlifyFunctionsBase}/cutai-script-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre, premise, numScenes })
    });

    if (!response.ok) {
      throw new Error('Failed to generate script');
    }

    const data = await response.json();
    return data.script;
  }

  /**
   * Parse script text into structured scenes for storyboarding
   */
  async parseScriptToScenes(scriptText, genre = 'drama') {
    const response = await fetch(`${this.netlifyFunctionsBase}/cutai-script-parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scriptText, genre })
    });

    if (!response.ok) {
      throw new Error('Failed to parse script');
    }

    return response.json();
  }

  /**
   * Generate complete storyboard from genre/premise or existing script
   * 
   * Signature: generateStoryboard(genre, premise, options)
   * OR (legacy): generateStoryboard(projectId, genre, premise) where projectId is ignored
   */
  async generateStoryboard(genreOrProjectId, premiseOrOptions, optionsOrPremise) {
    let genre, premise, options;
    
    // Handle both old and new signatures
    if (typeof premiseOrOptions === 'string') {
      // Old signature: generateStoryboard(projectId, genre, premise)
      genre = genreOrProjectId === 0 ? premiseOrOptions : genreOrProjectId;
      premise = optionsOrPremise || premiseOrOptions;
      options = {};
    } else {
      // New signature: generateStoryboard(genre, premise, options)
      genre = genreOrProjectId;
      premise = premiseOrOptions;
      options = optionsOrPremise || {};
    }

    const response = await fetch(`${this.netlifyFunctionsBase}/cutai-storyboard-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        genre,
        premise,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate storyboard');
    }

    return response.json();
  }

  /**
   * Analyze a scene and generate enhanced SD prompts
   */
  async analyzeScene(sceneData) {
    const response = await fetch(`${this.supabaseFunctionsBase}/cutai-scene-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sceneData)
    });

    if (!response.ok) {
      throw new Error('Failed to analyze scene');
    }

    return response.json();
  }

  // =============================================================================
  // SUPABASE EDGE FUNCTIONS - Database CRUD Operations
  // =============================================================================

  /**
   * Get all projects
   */
  async getProjects() {
    return this.request(`${this.netlifyFunctionsBase}/storyboarder-projects`);
  }

  /**
   * Get single project with full details
   */
  async getProject(id) {
    return this.request(`${this.netlifyFunctionsBase}/storyboarder-projects/${id}`);
  }

  /**
   * Create new project
   */
  async createProject(name, genre = 'drama') {
    return this.request(`${this.netlifyFunctionsBase}/storyboarder-projects`, {
      method: 'POST',
      body: { title: name, genre }
    });
  }

  /**
   * Delete project
   */
  async deleteProject(id) {
    return this.request(`${this.netlifyFunctionsBase}/storyboarder-projects/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Duplicate project
   */
  async duplicateProject(id, newTitle) {
    return this.request(`${this.netlifyFunctionsBase}/storyboarder-projects/${id}/duplicate`, {
      method: 'POST',
      body: { title: newTitle }
    });
  }

  // =============================================================================
  // SUPABASE EDGE FUNCTIONS - Scene Operations
  // =============================================================================

  /**
   * Get scenes for a script
   */
  async getScenes(scriptId) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-scenes?script_id=${scriptId}`);
  }

  /**
   * Get single scene
   */
  async getScene(id) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-scenes/${id}`);
  }

  /**
   * Create scene
   */
  async createScene(sceneData) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-scenes`, {
      method: 'POST',
      body: sceneData
    });
  }

  /**
   * Update scene
   */
  async updateScene(id, data) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-scenes/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  /**
   * Delete scene
   */
  async deleteScene(id) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-scenes/${id}`, {
      method: 'DELETE'
    });
  }

  // =============================================================================
  // SUPABASE EDGE FUNCTIONS - Shot Operations
  // =============================================================================

  /**
   * Get shots for a scene
   */
  async getShots(sceneId) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-shots?scene_id=${sceneId}`);
  }

  /**
   * Get single shot
   */
  async getShot(id) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-shots/${id}`);
  }

  /**
   * Create shot
   */
  async createShot(shotData) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-shots`, {
      method: 'POST',
      body: shotData
    });
  }

  /**
   * Update shot
   */
  async updateShot(id, data) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-shots/${id}`, {
      method: 'PUT',
      body: data
    });
  }

  /**
   * Delete shot
   */
  async deleteShot(id) {
    return this.request(`${this.supabaseFunctionsBase}/storyboarder-shots/${id}`, {
      method: 'DELETE'
    });
  }

  // =============================================================================
  // EXPORT FUNCTIONS
  // =============================================================================

  /**
   * Export storyboard as JSON
   */
  async exportJSON(projectId) {
    return this.request(`${this.supabaseFunctionsBase}/cutai-export-json`, {
      method: 'POST',
      body: { project_id: projectId }
    });
  }

  /**
   * Export storyboard as PDF
   */
  async exportPDF(projectId) {
    return this.request(`${this.supabaseFunctionsBase}/cutai-export-pdf`, {
      method: 'POST',
      body: { project_id: projectId }
    });
  }

  // =============================================================================
  // LEGACY COMPATIBILITY - Maps old API calls to new functions
  // =============================================================================

  /**
   * @deprecated Use getProject() instead
   */
  async getStoryboard(projectId) {
    return this.getProject(projectId);
  }

  /**
   * @deprecated Use updateScene() instead
   */
  async updateScene(sceneId, data) {
    return this.updateScene(sceneId, data);
  }

  /**
   * @deprecated Use updateShot() instead
   */
  async updateShot(shotId, data) {
    return this.updateShot(shotId, data);
  }

  /**
   * @deprecated Use generateStoryboard() instead
   */
  async createStoryboardProject(data) {
    return this.generateStoryboard(data.genre, data.premise, {
      numScenes: data.numScenes,
      title: data.title
    });
  }
}

export const cutai = new CutAIClient();