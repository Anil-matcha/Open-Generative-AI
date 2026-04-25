import { makeAutoObservable } from 'mobx';
import ApiClient from '../lib/api';

class UserStore {
  user = null;
  isLoading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  async login(credentials) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await ApiClient.login(credentials);
      this.user = response.user;
      ApiClient.setAuthToken(response.token, response.user._id);
      return response;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async register(userData) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await ApiClient.register(userData);
      this.user = response.user;
      ApiClient.setAuthToken(response.token, response.user._id);
      return response;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async logout() {
    try {
      await ApiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.user = null;
      ApiClient.clearAuthToken();
    }
  }

  async loadCurrentUser() {
    this.isLoading = true;
    this.error = null;

    try {
      // Demo mode - always load demo user
      const user = await ApiClient.getCurrentUser();
      this.user = user;
    } catch (error) {
      this.error = error.message;
      // Don't logout in demo mode
    } finally {
      this.isLoading = false;
    }
  }

  async updateUser(userData) {
    this.isLoading = true;
    this.error = null;

    try {
      const updatedUser = await ApiClient.updateUser(userData);
      this.user = updatedUser;
      return updatedUser;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  get isAuthenticated() {
    return true; // Always allow access in demo mode
  }

  get hasFeature() {
    return (featureName) => {
      return true; // All features enabled in demo mode
    };
  }

  get canAccessTemplates() {
    return true;
  }

  get canUsePersonalization() {
    return true;
  }

  get canCreateCampaigns() {
    return true;
  }
}

export default UserStore;