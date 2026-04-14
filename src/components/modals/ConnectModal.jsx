import { BaseModal } from './BaseModal';

const SERVICES = [
  {
    id: 'google',
    name: 'Google',
    icon: 'google',
    description: 'Connect Google Drive, Photos, and more',
    color: '#4285F4',
    features: ['Google Drive', 'Google Photos', 'Google Calendar']
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: 'dropbox',
    description: 'Access your Dropbox files',
    color: '#0061FF',
    features: ['File Storage', 'File Sharing', 'Smart Sync']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'youtube',
    description: 'Import and export videos to YouTube',
    color: '#FF0000',
    features: ['Video Import', 'Direct Upload', 'Playlist Sync']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    description: 'Connect to Facebook Pages and Groups',
    color: '#1877F2',
    features: ['Page Management', 'Group Posting', 'Analytics']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram',
    description: 'Share content to Instagram',
    color: '#E4405F',
    features: ['Photo Posts', 'Stories', 'Reels']
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: 'twitter',
    description: 'Post updates and track engagement',
    color: '#000000',
    features: ['Tweet Posting', 'Analytics', 'Schedule']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin',
    description: 'Professional network integration',
    color: '#0A66C2',
    features: ['Company Pages', 'Personal Posts', 'Lead Gen']
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: 'onedrive',
    description: 'Microsoft cloud storage',
    color: '#0078D4',
    features: ['File Storage', 'Office Integration', 'Sharing']
  }
];

const CONNECTED_SERVICES = ['google', 'youtube'];

export class ConnectModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Connect Services',
      size: 'large',
      showFooter: false,
      ...options
    });

    this.services = SERVICES;
    this.connectedServices = options.connectedServices || CONNECTED_SERVICES;
    this.searchQuery = '';
    this.activeFilter = 'all';
    this.oauthInProgress = null;
  }

  renderBody() {
    return `
      <div class="connect-container">
        <div class="connect-header">
          <div class="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" class="search-input" placeholder="Search services..." value="${this.searchQuery}" />
          </div>
          <div class="filter-tabs">
            <button class="filter-tab ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
            <button class="filter-tab ${this.activeFilter === 'connected' ? 'active' : ''}" data-filter="connected">Connected</button>
            <button class="filter-tab ${this.activeFilter === 'storage' ? 'active' : ''}" data-filter="storage">Storage</button>
            <button class="filter-tab ${this.activeFilter === 'social' ? 'active' : ''}" data-filter="social">Social</button>
          </div>
        </div>

        <div class="services-grid">
          ${this.getFilteredServices().map(service => this.renderServiceCard(service)).join('')}
        </div>

        ${this.oauthInProgress ? this.renderOAuthModal() : ''}
      </div>
    `;
  }

  getFilteredServices() {
    let filtered = this.services;

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query)
      );
    }

    if (this.activeFilter !== 'all') {
      if (this.activeFilter === 'connected') {
        filtered = filtered.filter(s => this.connectedServices.includes(s.id));
      } else if (this.activeFilter === 'storage') {
        filtered = filtered.filter(s => ['google', 'dropbox', 'onedrive'].includes(s.id));
      } else if (this.activeFilter === 'social') {
        filtered = filtered.filter(s => ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'].includes(s.id));
      }
    }

    return filtered;
  }

  renderServiceCard(service) {
    const isConnected = this.connectedServices.includes(service.id);
    return `
      <div class="service-card ${isConnected ? 'connected' : ''}">
        <div class="service-icon" style="background: ${service.color}20; border-color: ${service.color}40;">
          ${this.getServiceIcon(service.icon)}
        </div>
        <div class="service-info">
          <h4 class="service-name">${service.name}</h4>
          <p class="service-description">${service.description}</p>
          <div class="service-features">
            ${service.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
          </div>
        </div>
        <div class="service-actions">
          ${isConnected ? `
            <span class="connected-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Connected
            </span>
            <button class="modal-btn modal-btn-secondary disconnect-btn" data-service="${service.id}">Disconnect</button>
          ` : `
            <button class="modal-btn modal-btn-primary connect-btn" data-service="${service.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Connect
            </button>
          `}
        </div>
      </div>
    `;
  }

  getServiceIcon(icon) {
    const icons = {
      google: '<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>',
      dropbox: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#0061FF"><path d="M6 2l6 3.75L6 9.5 0 5.75 6 2zm12 0l6 3.75-6 3.75-6-3.75L12 2zM0 13.25L6 9.5l6 3.75-6 3.75-6-3.75zm18-3.75l6 3.75-6 3.75-6-3.75 6-3.75zM6 18.25l6-3.75 6 3.75-6 3.75-6-3.75z"/></svg>',
      youtube: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
      facebook: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      instagram: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#E4405F"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>',
      twitter: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
      linkedin: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
      onedrive: '<svg width="24" height="24" viewBox="0 0 24 24" fill="#0078D4"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>'
    };
    return icons[icon] || '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';
  }

  renderOAuthModal() {
    return `
      <div class="oauth-overlay">
        <div class="oauth-modal">
          <div class="oauth-spinner"></div>
          <h3>Connecting to ${this.services.find(s => s.id === this.oauthInProgress)?.name}</h3>
          <p>Please wait while we authorize your account...</p>
          <button class="modal-btn modal-btn-secondary cancel-oauth-btn">Cancel</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    const searchInput = this.overlay.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }

    this.overlay.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.activeFilter = e.currentTarget.dataset.filter;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    });

    this.overlay.querySelectorAll('.connect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const serviceId = e.currentTarget.dataset.service;
        this.startOAuth(serviceId);
      });
    });

    this.overlay.querySelectorAll('.disconnect-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const serviceId = e.currentTarget.dataset.service;
        this.disconnectService(serviceId);
      });
    });

    const cancelOauthBtn = this.overlay.querySelector('.cancel-oauth-btn');
    if (cancelOauthBtn) {
      cancelOauthBtn.addEventListener('click', () => {
        this.oauthInProgress = null;
        this.updateBody(this.renderBody());
        this.setupEventListeners();
      });
    }
  }

  startOAuth(serviceId) {
    this.oauthInProgress = serviceId;
    this.updateBody(this.renderBody());
    this.setupEventListeners();

    setTimeout(() => {
      this.connectedServices.push(serviceId);
      this.oauthInProgress = null;
      this.onConfirm({ action: 'connect', service: serviceId });
      this.updateBody(this.renderBody());
      this.setupEventListeners();
    }, 2000);
  }

  disconnectService(serviceId) {
    this.connectedServices = this.connectedServices.filter(id => id !== serviceId);
    this.onConfirm({ action: 'disconnect', service: serviceId });
    this.updateBody(this.renderBody());
    this.setupEventListeners();
  }
}

export default ConnectModal;
