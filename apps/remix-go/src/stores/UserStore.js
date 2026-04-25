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
    if (!ApiClient.isAuthenticated()) return;

    this.isLoading = true;
    this.error = null;

    try {
      const user = await ApiClient.getCurrentUser();
      this.user = user;
    } catch (error) {
      this.error = error.message;
      this.logout(); // Clear invalid tokens
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
    return !!this.user;
  }

  get hasFeature() {
    return (featureName) => {
      return this.user?.features?.[featureName]?.state === 'enabled';
    };
  }

  get canAccessTemplates() {
    return this.hasFeature('templates');
  }

  get canUsePersonalization() {
    return this.hasFeature('personalization');
  }

  get canCreateCampaigns() {
    return this.hasFeature('campaigns');
  }
}

export default UserStore;