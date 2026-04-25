import { makeAutoObservable } from 'mobx';
import UserStore from './UserStore';
import ProjectStore from './ProjectStore';

class RootStore {
  userStore = new UserStore();
  projectStore = new ProjectStore();

  constructor() {
    makeAutoObservable(this);
  }

  // Initialize the app - load user data, etc.
  async initialize() {
    try {
      await this.userStore.loadCurrentUser();
      if (this.userStore.isAuthenticated) {
        await this.projectStore.loadUserProjects();
        await this.projectStore.loadTemplates();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }

  // Reset all stores (for logout, etc.)
  reset() {
    this.userStore.user = null;
    this.userStore.error = null;
    this.projectStore.projects = [];
    this.projectStore.activeProject = null;
    this.projectStore.templates = [];
    this.projectStore.templateCategories = [];
    this.projectStore.error = null;
  }
}

const rootStore = new RootStore();
export default rootStore;