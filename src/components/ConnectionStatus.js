/**
 * Connection Status Indicator
 * Shows online/offline status and sync progress
 */

import { hybridSupabase } from '../lib/hybrid-supabase.js';

export class ConnectionStatus {
  constructor(container) {
    this.container = container;
    this.currentStatus = 'offline';
    this.isVisible = false;
    this.hideTimeout = null;

    this.init();
    this.createIndicator();
    this.updateStatus();
  }

  init() {
    // Listen for connection status changes
    this.checkStatusInterval = setInterval(() => {
      this.updateStatus();
    }, 5000); // Check every 5 seconds

    // Listen for network events
    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());
  }

  createIndicator() {
    this.indicator = document.createElement('div');
    this.indicator.className = 'connection-status-indicator';
    this.indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: none;
    `;

    this.container.appendChild(this.indicator);
  }

  updateStatus() {
    const isOnline = navigator.onLine;
    const supabaseOnline = hybridSupabase.isOnline();
    const lastSync = hybridSupabase.getLastSyncTime();

    let status, color, bgColor, text;

    if (!isOnline) {
      status = 'offline';
      color = '#ffffff';
      bgColor = '#ef4444';
      text = 'Offline';
    } else if (!supabaseOnline) {
      status = 'connecting';
      color = '#ffffff';
      bgColor = '#f59e0b';
      text = 'Connecting...';
    } else {
      status = 'online';
      color = '#ffffff';
      bgColor = '#10b981';

      if (lastSync) {
        const timeAgo = this.getTimeAgo(lastSync);
        text = `Online • Synced ${timeAgo}`;
      } else {
        text = 'Online • Syncing...';
      }
    }

    if (status !== this.currentStatus) {
      this.currentStatus = status;
      this.showIndicator(color, bgColor, text);
    }
  }

  showIndicator(color, bgColor, text) {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.indicator.style.color = color;
    this.indicator.style.backgroundColor = bgColor;
    this.indicator.textContent = text;
    this.indicator.style.display = 'block';
    this.isVisible = true;

    // Auto-hide after 5 seconds for online status
    if (this.currentStatus === 'online') {
      this.hideTimeout = setTimeout(() => {
        this.hideIndicator();
      }, 5000);
    }
  }

  hideIndicator() {
    this.indicator.style.display = 'none';
    this.isVisible = false;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  // Manual methods for external control
  show() {
    if (!this.isVisible) {
      this.updateStatus();
    }
  }

  hide() {
    this.hideIndicator();
  }

  destroy() {
    if (this.checkStatusInterval) {
      clearInterval(this.checkStatusInterval);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    if (this.indicator && this.indicator.parentNode) {
      this.indicator.parentNode.removeChild(this.indicator);
    }
  }
}

// Global instance
let connectionStatusInstance = null;

export function initConnectionStatus(container = document.body) {
  if (connectionStatusInstance) {
    connectionStatusInstance.destroy();
  }
  connectionStatusInstance = new ConnectionStatus(container);
  return connectionStatusInstance;
}

export function getConnectionStatus() {
  return connectionStatusInstance;
}

export function showConnectionStatus() {
  if (connectionStatusInstance) {
    connectionStatusInstance.show();
  }
}

export function hideConnectionStatus() {
  if (connectionStatusInstance) {
    connectionStatusInstance.hide();
  }
}