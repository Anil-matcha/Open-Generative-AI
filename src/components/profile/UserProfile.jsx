import { profileService } from '../../lib/profile/profileService.js';
import { supabase } from '../../lib/supabase.js';
import { showToast } from '../../lib/loading.js';

/**
 * UserProfile Component - Main user profile management interface
 */
export function UserProfile() {
  const container = document.createElement('div');
  container.className = 'flex flex-col h-full bg-bg-app';

  // Header
  const header = document.createElement('div');
  header.className = 'flex items-center justify-between p-6 border-b border-border-color';

  const title = document.createElement('h1');
  title.className = 'text-2xl font-bold text-text-primary';
  title.textContent = 'Profile Settings';

  const actions = document.createElement('div');
  actions.className = 'flex items-center gap-3';

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'px-4 py-2 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors flex items-center gap-2';
  saveBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/>
      <polyline points="17 1 17 9 13 7 9 9 9 1"/>
    </svg>
    Save Changes
  `;
  saveBtn.onclick = () => saveProfile();

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'px-4 py-2 bg-bg-card text-text-primary font-medium rounded-lg hover:bg-bg-panel transition-colors';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => loadProfile();

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);

  header.appendChild(title);
  header.appendChild(actions);

  // Main content area
  const content = document.createElement('div');
  content.className = 'flex-1 p-6 overflow-y-auto custom-scrollbar';

  // Profile sections
  const sections = document.createElement('div');
  sections.className = 'max-w-4xl mx-auto space-y-6';

  // Basic Information Section
  const basicInfoSection = createBasicInfoSection();
  sections.appendChild(basicInfoSection);

  // Preferences Section
  const preferencesSection = createPreferencesSection();
  sections.appendChild(preferencesSection);

  // Feature Flags Section
  const featuresSection = createFeaturesSection();
  sections.appendChild(featuresSection);

  // Statistics Section
  const statsSection = createStatsSection();
  sections.appendChild(statsSection);

  // Danger Zone Section
  const dangerSection = createDangerSection();
  sections.appendChild(dangerSection);

  content.appendChild(sections);

  // State
  let currentProfile = null;
  let originalProfile = null;

  // Load profile data
  const loadProfile = async () => {
    try {
      currentProfile = await profileService.getCurrentProfile();
      originalProfile = JSON.parse(JSON.stringify(currentProfile)); // Deep copy

      updateBasicInfoSection();
      updatePreferencesSection();
      updateFeaturesSection();
      updateStatsSection();
    } catch (error) {
      console.error('[UserProfile] Failed to load profile:', error);
      showToast('Failed to load profile', 'error');
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    try {
      const updates = {};

      // Collect basic info changes
      const displayNameInput = basicInfoSection.querySelector('#display-name');
      const bioTextarea = basicInfoSection.querySelector('#bio');

      if (displayNameInput && displayNameInput.value !== currentProfile.display_name) {
        updates.display_name = displayNameInput.value;
      }

      // Collect preferences changes
      const themeSelect = preferencesSection.querySelector('#theme');
      const languageSelect = preferencesSection.querySelector('#language');
      const notificationsCheckbox = preferencesSection.querySelector('#notifications');
      const autoSaveCheckbox = preferencesSection.querySelector('#auto-save');

      const newPreferences = { ...currentProfile.preferences };

      if (themeSelect && themeSelect.value !== currentProfile.preferences.theme) {
        newPreferences.theme = themeSelect.value;
      }

      if (languageSelect && languageSelect.value !== currentProfile.preferences.language) {
        newPreferences.language = languageSelect.value;
      }

      if (notificationsCheckbox && notificationsCheckbox.checked !== currentProfile.preferences.notifications) {
        newPreferences.notifications = notificationsCheckbox.checked;
      }

      if (autoSaveCheckbox && autoSaveCheckbox.checked !== currentProfile.preferences.auto_save) {
        newPreferences.auto_save = autoSaveCheckbox.checked;
      }

      if (JSON.stringify(newPreferences) !== JSON.stringify(currentProfile.preferences)) {
        updates.preferences = newPreferences;
      }

      // Collect feature flag changes
      const featureCheckboxes = featuresSection.querySelectorAll('.feature-checkbox');
      const newFeatureFlags = { ...currentProfile.feature_flags };

      featureCheckboxes.forEach(checkbox => {
        const featureName = checkbox.dataset.feature;
        const isEnabled = checkbox.checked;
        if (isEnabled !== (currentProfile.feature_flags[featureName] === true)) {
          newFeatureFlags[featureName] = isEnabled;
        }
      });

      if (JSON.stringify(newFeatureFlags) !== JSON.stringify(currentProfile.feature_flags)) {
        updates.feature_flags = newFeatureFlags;
      }

      // Save changes
      if (Object.keys(updates).length > 0) {
        await profileService.updateProfile(updates);
        showToast('Profile updated successfully', 'success');
        await loadProfile(); // Reload to get fresh data
      } else {
        showToast('No changes to save', 'info');
      }
    } catch (error) {
      console.error('[UserProfile] Failed to save profile:', error);
      showToast('Failed to save profile', 'error');
    }
  };

  // Create Basic Info Section
  function createBasicInfoSection() {
    const section = document.createElement('div');
    section.className = 'bg-bg-card border border-border-color rounded-lg p-6';

    section.innerHTML = `
      <h2 class="text-lg font-semibold text-text-primary mb-4">Basic Information</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Email</label>
          <input type="email" id="email" class="w-full px-3 py-2 bg-bg-panel border border-border-color rounded-md text-text-primary" readonly>
          <p class="text-xs text-text-muted mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Display Name</label>
          <input type="text" id="display-name" class="w-full px-3 py-2 bg-bg-panel border border-border-color rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-color-primary">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Bio</label>
          <textarea id="bio" rows="3" class="w-full px-3 py-2 bg-bg-panel border border-border-color rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-color-primary resize-none" placeholder="Tell us about yourself..."></textarea>
        </div>
      </div>
    `;

    return section;
  }

  // Update Basic Info Section
  function updateBasicInfoSection() {
    if (!currentProfile) return;

    const emailInput = basicInfoSection.querySelector('#email');
    const displayNameInput = basicInfoSection.querySelector('#display-name');
    const bioTextarea = basicInfoSection.querySelector('#bio');

    if (emailInput) emailInput.value = currentProfile.email || '';
    if (displayNameInput) displayNameInput.value = currentProfile.display_name || '';
    if (bioTextarea) bioTextarea.value = currentProfile.bio || '';
  }

  // Create Preferences Section
  function createPreferencesSection() {
    const section = document.createElement('div');
    section.className = 'bg-bg-card border border-border-color rounded-lg p-6';

    section.innerHTML = `
      <h2 class="text-lg font-semibold text-text-primary mb-4">Preferences</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Theme</label>
          <select id="theme" class="w-full px-3 py-2 bg-bg-panel border border-border-color rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-color-primary">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">Language</label>
          <select id="language" class="w-full px-3 py-2 bg-bg-panel border border-border-color rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-color-primary">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <input type="checkbox" id="notifications" class="w-4 h-4 text-color-primary bg-bg-panel border-border-color rounded focus:ring-color-primary">
          <label for="notifications" class="text-sm font-medium text-text-primary">Enable notifications</label>
        </div>
        <div class="flex items-center space-x-2">
          <input type="checkbox" id="auto-save" class="w-4 h-4 text-color-primary bg-bg-panel border-border-color rounded focus:ring-color-primary">
          <label for="auto-save" class="text-sm font-medium text-text-primary">Auto-save projects</label>
        </div>
      </div>
    `;

    return section;
  }

  // Update Preferences Section
  function updatePreferencesSection() {
    if (!currentProfile) return;

    const themeSelect = preferencesSection.querySelector('#theme');
    const languageSelect = preferencesSection.querySelector('#language');
    const notificationsCheckbox = preferencesSection.querySelector('#notifications');
    const autoSaveCheckbox = preferencesSection.querySelector('#auto-save');

    if (themeSelect) themeSelect.value = currentProfile.preferences?.theme || 'dark';
    if (languageSelect) languageSelect.value = currentProfile.preferences?.language || 'en';
    if (notificationsCheckbox) notificationsCheckbox.checked = currentProfile.preferences?.notifications !== false;
    if (autoSaveCheckbox) autoSaveCheckbox.checked = currentProfile.preferences?.auto_save !== false;
  }

  // Create Features Section
  function createFeaturesSection() {
    const section = document.createElement('div');
    section.className = 'bg-bg-card border border-border-color rounded-lg p-6';

    section.innerHTML = `
      <h2 class="text-lg font-semibold text-text-primary mb-4">Feature Access</h2>
      <p class="text-text-muted text-sm mb-4">Enable or disable experimental features</p>
      <div id="features-list" class="space-y-3">
        <!-- Features will be populated dynamically -->
      </div>
    `;

    return section;
  }

  // Update Features Section
  function updateFeaturesSection() {
    if (!currentProfile) return;

    const featuresList = featuresSection.querySelector('#features-list');
    featuresList.innerHTML = '';

    const features = [
      { key: 'advanced_editor', label: 'Advanced Editor', description: 'Access to experimental editing features' },
      { key: 'ai_assistant', label: 'AI Assistant', description: 'AI-powered content suggestions' },
      { key: 'collaboration', label: 'Collaboration', description: 'Real-time collaborative editing' },
      { key: 'analytics', label: 'Analytics Dashboard', description: 'Detailed usage analytics' },
      { key: 'api_access', label: 'API Access', description: 'Direct API access for integrations' }
    ];

    features.forEach(feature => {
      const featureDiv = document.createElement('div');
      featureDiv.className = 'flex items-start space-x-3';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'feature-checkbox w-4 h-4 mt-0.5 text-color-primary bg-bg-panel border-border-color rounded focus:ring-color-primary';
      checkbox.dataset.feature = feature.key;
      checkbox.checked = currentProfile.feature_flags?.[feature.key] === true;

      const labelDiv = document.createElement('div');
      labelDiv.innerHTML = `
        <label class="text-sm font-medium text-text-primary cursor-pointer">${feature.label}</label>
        <p class="text-xs text-text-muted">${feature.description}</p>
      `;

      featureDiv.appendChild(checkbox);
      featureDiv.appendChild(labelDiv);
      featuresList.appendChild(featureDiv);
    });
  }

  // Create Stats Section
  function createStatsSection() {
    const section = document.createElement('div');
    section.className = 'bg-bg-card border border-border-color rounded-lg p-6';

    section.innerHTML = `
      <h2 class="text-lg font-semibold text-text-primary mb-4">Account Statistics</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-color-primary" id="projects-count">-</div>
          <div class="text-sm text-text-muted">Projects</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-color-primary" id="media-count">-</div>
          <div class="text-sm text-text-muted">Media Assets</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-color-primary" id="renders-count">-</div>
          <div class="text-sm text-text-muted">Render Jobs</div>
        </div>
      </div>
    `;

    return section;
  }

  // Update Stats Section
  async function updateStatsSection() {
    try {
      const stats = await profileService.getUserStats();

      const projectsCount = statsSection.querySelector('#projects-count');
      const mediaCount = statsSection.querySelector('#media-count');
      const rendersCount = statsSection.querySelector('#renders-count');

      if (projectsCount) projectsCount.textContent = stats.projects;
      if (mediaCount) mediaCount.textContent = stats.mediaAssets;
      if (rendersCount) rendersCount.textContent = stats.renderJobs;
    } catch (error) {
      console.error('[UserProfile] Failed to load stats:', error);
    }
  }

  // Create Danger Zone Section
  function createDangerSection() {
    const section = document.createElement('div');
    section.className = 'bg-red-500/10 border border-red-500/20 rounded-lg p-6';

    section.innerHTML = `
      <h2 class="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
      <div class="space-y-4">
        <div>
          <h3 class="text-sm font-medium text-text-primary mb-2">Export Data</h3>
          <p class="text-xs text-text-muted mb-3">Download a copy of all your data</p>
          <button class="export-btn px-4 py-2 bg-bg-card text-text-primary border border-border-color rounded-md hover:bg-bg-panel transition-colors text-sm">
            Export Data
          </button>
        </div>
        <div class="border-t border-red-500/20 pt-4">
          <h3 class="text-sm font-medium text-red-400 mb-2">Delete Account</h3>
          <p class="text-xs text-red-300 mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button class="delete-btn px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/30 transition-colors text-sm">
            Delete Account
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const exportBtn = section.querySelector('.export-btn');
    const deleteBtn = section.querySelector('.delete-btn');

    exportBtn.onclick = () => handleExportData();
    deleteBtn.onclick = () => handleDeleteAccount();

    return section;
  }

  // Handle export data
  const handleExportData = async () => {
    try {
      const data = await profileService.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('[UserProfile] Failed to export data:', error);
      showToast('Failed to export data', 'error');
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you absolutely sure you want to delete your account?\n\n' +
      'This will permanently delete all your projects, media assets, templates, and profile data.\n\n' +
      'This action CANNOT be undone.'
    );

    if (!confirmed) return;

    const finalConfirmation = prompt(
      'Please type "DELETE" to confirm account deletion:'
    );

    if (finalConfirmation !== 'DELETE') {
      showToast('Account deletion cancelled', 'info');
      return;
    }

    try {
      await profileService.deleteAccount();
      showToast('Account deletion initiated. You will be logged out.', 'warning');

      // Sign out user
      await supabase.auth.signOut();
      // Redirect to login or home
      window.location.reload();
    } catch (error) {
      console.error('[UserProfile] Failed to delete account:', error);
      showToast('Failed to delete account', 'error');
    }
  };

  // Initialize
  container.appendChild(header);
  container.appendChild(content);

  // Load initial data
  loadProfile();

  return container;
}