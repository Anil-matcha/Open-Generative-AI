import { makeAutoObservable } from 'mobx';
import UserStore from './UserStore';
import ProjectStore from './ProjectStore';
import VideoEditorStore from './VideoEditorStore';

class RootStore {
  userStore = new UserStore();
  projectStore = new ProjectStore();
  videoEditorStore = new VideoEditorStore();

  constructor() {
    makeAutoObservable(this);
  }

  // Initialize the app - load user data, etc.
  async initialize() {
    try {
      // Load demo user and templates
      await this.userStore.loadCurrentUser();
      await this.projectStore.loadTemplates();
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
    this.videoEditorStore.dispose();
  }
}

const rootStore = new RootStore();
export default rootStore;