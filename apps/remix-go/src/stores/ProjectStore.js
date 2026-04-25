import { makeAutoObservable } from 'mobx';
import ApiClient from '../lib/api';

class ProjectStore {
  projects = [];
  activeProject = null;
  templates = [];
  templateCategories = [];
  isLoading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Project CRUD operations
  async loadUserProjects() {
    this.isLoading = true;
    this.error = null;

    try {
      const projects = await ApiClient.getUserProjects();
      this.projects = projects;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async loadProject(projectId) {
    this.isLoading = true;
    this.error = null;

    try {
      const project = await ApiClient.getProject(projectId);
      this.activeProject = project;
      return project;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async createProject(projectData) {
    this.isLoading = true;
    this.error = null;

    try {
      const newProject = await ApiClient.createProject(projectData);
      this.projects.unshift(newProject);
      this.activeProject = newProject;
      return newProject;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async updateProject(projectId, projectData) {
    this.isLoading = true;
    this.error = null;

    try {
      const updatedProject = await ApiClient.updateProject(projectId, projectData);

      // Update in projects array
      const index = this.projects.findIndex(p => p._id === projectId);
      if (index !== -1) {
        this.projects[index] = updatedProject;
      }

      // Update active project if it's the same
      if (this.activeProject?._id === projectId) {
        this.activeProject = updatedProject;
      }

      return updatedProject;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async deleteProject(projectId) {
    this.isLoading = true;
    this.error = null;

    try {
      await ApiClient.deleteProject(projectId);
      this.projects = this.projects.filter(p => p._id !== projectId);

      if (this.activeProject?._id === projectId) {
        this.activeProject = null;
      }
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async publishProject(projectId) {
    this.isLoading = true;
    this.error = null;

    try {
      const publishedProject = await ApiClient.publishProject(projectId);

      // Update the project in the list
      const index = this.projects.findIndex(p => p._id === projectId);
      if (index !== -1) {
        this.projects[index] = publishedProject;
      }

      if (this.activeProject?._id === projectId) {
        this.activeProject = publishedProject;
      }

      return publishedProject;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Template operations
  async loadTemplates() {
    this.isLoading = true;
    this.error = null;

    try {
      const [templates, categories] = await Promise.all([
        ApiClient.getTemplates(),
        ApiClient.getTemplateCategories()
      ]);

      this.templates = templates;
      this.templateCategories = categories;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async createFromTemplate(templateId, customization = {}) {
    this.isLoading = true;
    this.error = null;

    try {
      const template = this.templates.find(t => t._id === templateId);
      if (!template) throw new Error('Template not found');

      const projectData = {
        ...template,
        ...customization,
        templateId: template._id,
        createdAt: new Date().toISOString()
      };

      return await this.createProject(projectData);
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  // Active project management
  setActiveProject(project) {
    this.activeProject = project;
  }

  clearActiveProject() {
    this.activeProject = null;
  }

  // Computed properties
  get publishedProjects() {
    return this.projects.filter(project => project.published);
  }

  get draftProjects() {
    return this.projects.filter(project => !project.published);
  }

  get recentProjects() {
    return [...this.projects]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }

  get templatesByCategory() {
    const categorized = {};
    this.templateCategories.forEach(category => {
      categorized[category._id] = {
        ...category,
        templates: this.templates.filter(template =>
          template.category === category._id
        )
      };
    });
    return categorized;
  }
}

export default ProjectStore;