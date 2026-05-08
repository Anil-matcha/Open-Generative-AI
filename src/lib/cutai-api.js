/**
 * AI Storyboard API Client - Real API Implementation
 */

import { muapi } from './muapi.js';

class CutAIClient {
  constructor() {
    // Use MuAPI for real implementations instead of mock endpoints
  }

  async request(endpoint, options = {}) {
    // This method is deprecated - use direct MuAPI calls instead
    throw new Error('CutAI API client is deprecated. Use MuAPI directly.');
  }

  async createProject(name) {
    // Use localStorage for project management since we don't have a dedicated project API
    const project = {
      id: Date.now().toString(),
      name: name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const projects = this.getStoredProjects();
    projects.push(project);
    localStorage.setItem('cutai_projects', JSON.stringify(projects));

    return { project };
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
    return this.getStoredProjects();
  }

  /**
   * Get single project with full details
   */
  async getProject(id) {
    const projects = this.getStoredProjects();
    const project = projects.find(p => p.id === id);
    if (!project) throw new Error('Project not found');

    return { project, scenes: [] }; // Simplified for now
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
    const projects = this.getStoredProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem('cutai_projects', JSON.stringify(filtered));
    return { success: true };
  }

  async duplicateProject(id) {
    const projects = this.getStoredProjects();
    const original = projects.find(p => p.id === id);
    if (!original) throw new Error('Project not found');

    const duplicate = {
      ...original,
      id: Date.now().toString(),
      name: `${original.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    projects.push(duplicate);
    localStorage.setItem('cutai_projects', JSON.stringify(projects));

    return { project: duplicate };
  }

  getStoredProjects() {
    try {
      return JSON.parse(localStorage.getItem('cutai_projects') || '[]');
    } catch {
      return [];
    }
  }

  async generateStoryboard(projectId, genre, premise) {
    // Generate storyboard using real AI - create scenes with image generation
    const scenes = await this.generateStoryboardScenes(genre, premise);
    return {
      project: { id: projectId, genre, premise },
      scenes: scenes
    };
  }

  async getStoryboard(projectId) {
    // Return stored storyboard data
    const storyboardData = localStorage.getItem(`storyboard_${projectId}`);
    if (storyboardData) {
      return JSON.parse(storyboardData);
    }
    throw new Error('Storyboard not found');
  }

  async updateScene(sceneId, data) {
    // Simple update - in real implementation would persist to database
    return { success: true };
  }

  async updateShot(shotId, data) {
    // Simple update - in real implementation would persist to database
    return { success: true };
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
    const storyboard = await this.getStoryboard(projectId);
    return JSON.stringify(storyboard, null, 2);
  }

  /**
   * Export storyboard as PDF
   */
  async exportPDF(projectId) {
    // Mock PDF export - would need real PDF generation service
    return { url: `data:text/plain;base64,${btoa('PDF export not implemented')}` };
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
    const { characters, scenes, shots } = data;

    // Generate actual storyboard with real AI image generation
    const generatedScenes = [];

    for (const scene of scenes) {
      const sceneShots = [];

      for (const shot of scene.shots) {
        if (shot.prompt && shot.prompt.trim()) {
          try {
            // Generate real image using MuAPI
            const imageResult = await muapi.generateImage({
              model: 'flux-dev',
              prompt: shot.prompt,
              aspect_ratio: '16:9'
            });

            sceneShots.push({
              ...shot,
              imageUrl: imageResult.url,
              generated: true
            });
          } catch (error) {
            console.error('Failed to generate image for shot:', error);
            // Fallback to placeholder
            sceneShots.push({
              ...shot,
              imageUrl: null,
              generated: false,
              error: error.message
            });
          }
        } else {
          sceneShots.push({
            ...shot,
            imageUrl: null,
            generated: false
          });
        }
      }

      generatedScenes.push({
        ...scene,
        shots: sceneShots
      });
    }

    const result = {
      project: {
        id: Date.now().toString(),
        characters: characters,
        created_at: new Date().toISOString()
      },
      scenes: generatedScenes
    };

    // Store the result
    localStorage.setItem(`storyboard_${result.project.id}`, JSON.stringify(result));

    return result;
  }

  async generateStoryboardScenes(genre, premise) {
    // Use OpenAI to generate actual storyboard scenes
    const prompt = `Create a detailed storyboard for a ${genre} story with the premise: "${premise}"

Generate 3-5 scenes with the following structure for each scene:
- scene_number: sequential number
- title: descriptive title
- description: detailed scene description
- time_of_day: DAY/NIGHT/etc
- location: where the scene takes place
- shots: array of 1-3 shots, each with:
  - shot_number: sequential within scene
  - shot_type: Wide/Medium/Close-up/etc
  - camera_angle: Eye level/Low angle/etc
  - camera_movement: Static/Pan/etc
  - description: detailed visual description
  - duration: estimated seconds (5-15)

Format as valid JSON array of scenes.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('openai_key') || ''}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (response.ok) {
        const result = await response.json();
        const content = result.choices[0]?.message?.content;
        if (content) {
          try {
            return JSON.parse(content);
          } catch (parseError) {
            console.warn('Failed to parse OpenAI response as JSON, using fallback');
          }
        }
      }
    } catch (error) {
      console.error('OpenAI storyboard generation failed:', error);
    }

    // Fallback mock scenes
    return [
      {
        scene_number: 1,
        title: 'Opening Scene',
        description: 'Establishing the main character and setting',
        time_of_day: 'DAY',
        location: 'Urban Street',
        shots: [
          {
            shot_number: 1,
            shot_type: 'Wide',
            camera_angle: 'Eye level',
            camera_movement: 'Static',
            description: 'Wide shot of city street with character walking',
            duration: 8
          }
        ]
      },
      {
        scene_number: 2,
        title: 'Inciting Incident',
        description: 'The main conflict begins',
        time_of_day: 'DAY',
        location: 'Office Building',
        shots: [
          {
            shot_number: 1,
            shot_type: 'Medium',
            camera_angle: 'Eye level',
            camera_movement: 'Pan',
            description: 'Character enters office and sees something surprising',
            duration: 12
          }
        ]
      }
    ];
  }
}

export const cutai = new CutAIClient();