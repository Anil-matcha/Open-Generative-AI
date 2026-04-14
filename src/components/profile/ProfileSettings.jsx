import { profileService } from '../../lib/profile/profileService.js';
import { showToast } from '../../lib/loading.js';

/**
 * ProfileSettings Component - Quick profile settings modal/page
 */
export function ProfileSettings() {
  const container = document.createElement('div');
  container.className = 'max-w-md mx-auto bg-bg-card border border-border-color rounded-lg p-6 space-y-6';

  // Avatar Section
  const avatarSection = document.createElement('div');
  avatarSection.className = 'text-center';

  const avatarContainer = document.createElement('div');
  avatarContainer.className = 'relative inline-block mb-4';

  const avatarImg = document.createElement('div');
  avatarImg.className = 'w-20 h-20 bg-bg-panel rounded-full flex items-center justify-center mx-auto';
  avatarImg.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-muted">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;

  const avatarInput = document.createElement('input');
  avatarInput.type = 'file';
  avatarInput.accept = 'image/*';
  avatarInput.className = 'hidden';
  avatarInput.onchange = (e) => handleAvatarUpload(e.target.files[0]);

  const avatarBtn = document.createElement('button');
  avatarBtn.className = 'absolute bottom-0 right-0 w-6 h-6 bg-color-primary rounded-full flex items-center justify-center text-black hover:bg-color-primary-hover transition-colors';
  avatarBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  `;
  avatarBtn.onclick = () => avatarInput.click();
  avatarBtn.title = 'Change avatar';

  avatarContainer.appendChild(avatarImg);
  avatarContainer.appendChild(avatarBtn);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Your name';
  nameInput.className = 'w-full text-center text-lg font-medium bg-transparent border-none text-text-primary focus:outline-none focus:ring-0';

  avatarSection.appendChild(avatarContainer);
  avatarSection.appendChild(nameInput);

  // Quick Settings
  const settingsSection = document.createElement('div');
  settingsSection.className = 'space-y-4';

  const settingsTitle = document.createElement('h3');
  settingsTitle.className = 'text-sm font-medium text-text-primary';
  settingsTitle.textContent = 'Quick Settings';

  // Theme toggle
  const themeRow = document.createElement('div');
  themeRow.className = 'flex items-center justify-between';

  const themeLabel = document.createElement('span');
  themeLabel.className = 'text-sm text-text-primary';
  themeLabel.textContent = 'Theme';

  const themeToggle = document.createElement('button');
  themeToggle.className = 'relative inline-flex h-6 w-11 items-center rounded-full bg-bg-panel transition-colors focus:outline-none focus:ring-2 focus:ring-color-primary';
  themeToggle.innerHTML = `
    <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
  `;
  themeToggle.onclick = () => toggleTheme();

  themeRow.appendChild(themeLabel);
  themeRow.appendChild(themeToggle);

  // Notifications toggle
  const notificationsRow = document.createElement('div');
  notificationsRow.className = 'flex items-center justify-between';

  const notificationsLabel = document.createElement('span');
  notificationsLabel.className = 'text-sm text-text-primary';
  notificationsLabel.textContent = 'Notifications';

  const notificationsToggle = document.createElement('input');
  notificationsToggle.type = 'checkbox';
  notificationsToggle.className = 'w-4 h-4 text-color-primary bg-bg-panel border-border-color rounded focus:ring-color-primary';

  notificationsRow.appendChild(notificationsLabel);
  notificationsRow.appendChild(notificationsToggle);

  // Auto-save toggle
  const autoSaveRow = document.createElement('div');
  autoSaveRow.className = 'flex items-center justify-between';

  const autoSaveLabel = document.createElement('span');
  autoSaveLabel.className = 'text-sm text-text-primary';
  autoSaveLabel.textContent = 'Auto-save';

  const autoSaveToggle = document.createElement('input');
  autoSaveToggle.type = 'checkbox';
  autoSaveToggle.className = 'w-4 h-4 text-color-primary bg-bg-panel border-border-color rounded focus:ring-color-primary';

  autoSaveRow.appendChild(autoSaveLabel);
  autoSaveRow.appendChild(autoSaveToggle);

  settingsSection.appendChild(settingsTitle);
  settingsSection.appendChild(themeRow);
  settingsSection.appendChild(notificationsRow);
  settingsSection.appendChild(autoSaveRow);

  // Action buttons
  const actionsSection = document.createElement('div');
  actionsSection.className = 'flex gap-3';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'flex-1 px-4 py-2 bg-color-primary text-black font-medium rounded-lg hover:bg-color-primary-hover transition-colors';
  saveBtn.textContent = 'Save';
  saveBtn.onclick = () => saveSettings();

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'flex-1 px-4 py-2 bg-bg-panel text-text-primary font-medium rounded-lg hover:bg-card transition-colors';
  cancelBtn.textContent = 'Cancel';

  actionsSection.appendChild(cancelBtn);
  actionsSection.appendChild(saveBtn);

  // Assemble container
  container.appendChild(avatarSection);
  container.appendChild(settingsSection);
  container.appendChild(actionsSection);

  // State
  let currentProfile = null;

  // Load current profile
  const loadProfile = async () => {
    try {
      currentProfile = await profileService.getCurrentProfile();

      // Update avatar
      if (currentProfile.avatar_url) {
        avatarImg.innerHTML = `<img src="${currentProfile.avatar_url}" class="w-full h-full rounded-full object-cover" alt="Avatar">`;
      }

      // Update name
      nameInput.value = currentProfile.display_name || '';

      // Update toggles
      const isDarkTheme = currentProfile.preferences?.theme === 'dark';
      themeToggle.classList.toggle('bg-color-primary', isDarkTheme);
      themeToggle.querySelector('span').classList.toggle('translate-x-6', isDarkTheme);

      notificationsToggle.checked = currentProfile.preferences?.notifications !== false;
      autoSaveToggle.checked = currentProfile.preferences?.auto_save !== false;
    } catch (error) {
      console.error('[ProfileSettings] Failed to load profile:', error);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (file) => {
    if (!file) return;

    try {
      showToast('Uploading avatar...', 'info');
      const avatarUrl = await profileService.uploadAvatar(file);
      avatarImg.innerHTML = `<img src="${avatarUrl}" class="w-full h-full rounded-full object-cover" alt="Avatar">`;
      showToast('Avatar updated successfully', 'success');
    } catch (error) {
      console.error('[ProfileSettings] Failed to upload avatar:', error);
      showToast('Failed to upload avatar', 'error');
    }
  };

  // Toggle theme
  const toggleTheme = () => {
    const isDark = themeToggle.classList.contains('bg-color-primary');
    themeToggle.classList.toggle('bg-color-primary', !isDark);
    themeToggle.querySelector('span').classList.toggle('translate-x-6', !isDark);
  };

  // Save settings
  const saveSettings = async () => {
    try {
      const updates = {};

      // Name
      if (nameInput.value !== currentProfile.display_name) {
        updates.display_name = nameInput.value;
      }

      // Preferences
      const newPreferences = { ...currentProfile.preferences };

      const isDarkTheme = themeToggle.classList.contains('bg-color-primary');
      if (isDarkTheme !== (currentProfile.preferences?.theme === 'dark')) {
        newPreferences.theme = isDarkTheme ? 'dark' : 'light';
      }

      if (notificationsToggle.checked !== (currentProfile.preferences?.notifications !== false)) {
        newPreferences.notifications = notificationsToggle.checked;
      }

      if (autoSaveToggle.checked !== (currentProfile.preferences?.auto_save !== false)) {
        newPreferences.auto_save = autoSaveToggle.checked;
      }

      if (Object.keys(newPreferences).length > 0) {
        updates.preferences = newPreferences;
      }

      if (Object.keys(updates).length > 0) {
        await profileService.updateProfile(updates);
        showToast('Settings saved successfully', 'success');
      } else {
        showToast('No changes to save', 'info');
      }
    } catch (error) {
      console.error('[ProfileSettings] Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    }
  };

  // Initialize
  loadProfile();

  return container;
}