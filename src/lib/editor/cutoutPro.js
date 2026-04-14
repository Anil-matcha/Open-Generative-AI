/**
 * Cutout Pro Integration Module
 * Implements background removal, smart BG replacement, and other Cutout Pro features
 */

import { imageEditorManager } from './imageEditors.js';

// Cutout Pro API Integration
export class CutoutProAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey || 'demo-key';
    this.baseUrl = 'https://api.cutout.pro/v1';
  }

  async removeBackground(imageBlob, options = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('format', options.format || 'png');
      formData.append('bg_color', options.bgColor || 'transparent');

      const response = await fetch(`${this.baseUrl}/remove-background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Cutout Pro API error: ${response.status}`);
      }

      const result = await response.blob();
      return URL.createObjectURL(result);
    } catch (error) {
      console.error('Cutout Pro background removal failed:', error);
      // Fallback to basic canvas-based removal
      return this.fallbackBackgroundRemoval(imageBlob);
    }
  }

  async replaceBackground(imageBlob, backgroundImage, options = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('background', backgroundImage);
      formData.append('mode', options.mode || 'smart');

      const response = await fetch(`${this.baseUrl}/replace-background`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Cutout Pro API error: ${response.status}`);
      }

      const result = await response.blob();
      return URL.createObjectURL(result);
    } catch (error) {
      console.error('Cutout Pro background replacement failed:', error);
      // Fallback to overlay approach
      return this.fallbackBackgroundReplacement(imageBlob, backgroundImage);
    }
  }

  async createPassport(imageBlob, options = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('template', options.template || 'standard');
      formData.append('size', options.size || '35x45mm');

      const response = await fetch(`${this.baseUrl}/passport-maker`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Cutout Pro API error: ${response.status}`);
      }

      const result = await response.blob();
      return URL.createObjectURL(result);
    } catch (error) {
      console.error('Cutout Pro passport creation failed:', error);
      return imageBlob; // Return original
    }
  }

  async cartoonify(imageBlob, options = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('style', options.style || '3d-cartoon');

      const response = await fetch(`${this.baseUrl}/cartoon-selfie`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Cutout Pro API error: ${response.status}`);
      }

      const result = await response.blob();
      return URL.createObjectURL(result);
    } catch (error) {
      console.error('Cutout Pro cartoonify failed:', error);
      return imageBlob; // Return original
    }
  }

  async animatePhoto(imageBlob, options = {}) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob);
      formData.append('animation', options.type || 'subtle');
      formData.append('duration', options.duration || 3);

      const response = await fetch(`${this.baseUrl}/photo-animer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Cutout Pro API error: ${response.status}`);
      }

      const result = await response.blob();
      return URL.createObjectURL(result);
    } catch (error) {
      console.error('Cutout Pro photo animation failed:', error);
      return imageBlob; // Return original
    }
  }

  // Fallback implementations for when API is unavailable
  async fallbackBackgroundRemoval(imageBlob) {
    // Basic canvas-based background removal (simplified)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Simple edge detection and transparency (very basic)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Make corners transparent (rough background removal)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // If pixel is close to white/light, make transparent
          if (r > 200 && g > 200 && b > 200) {
            data[i + 3] = 0; // Alpha channel
          }
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob(resolve);
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  async fallbackBackgroundReplacement(imageBlob, backgroundImage) {
    // Simple overlay approach
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // If background image provided, overlay it
        if (backgroundImage) {
          const bgImg = new Image();
          bgImg.onload = () => {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve);
          };
          bgImg.src = backgroundImage;
        } else {
          resolve(canvas.toDataURL());
        }
      };
      img.src = URL.createObjectURL(imageBlob);
    });
  }
}

// Credit System for Cutout Pro
export class CutoutProCredits {
  constructor() {
    this.credits = parseInt(localStorage.getItem('cutoutProCredits') || '10');
    this.usageHistory = JSON.parse(localStorage.getItem('cutoutProUsage') || '[]');
  }

  getCredits() {
    return this.credits;
  }

  hasCredits(cost = 1) {
    return this.credits >= cost;
  }

  deductCredits(cost = 1) {
    if (this.credits >= cost) {
      this.credits -= cost;
      this.usageHistory.push({
        timestamp: Date.now(),
        cost: cost,
        type: 'deduction'
      });
      this.save();
      return true;
    }
    return false;
  }

  addCredits(amount) {
    this.credits += amount;
    this.usageHistory.push({
      timestamp: Date.now(),
      amount: amount,
      type: 'addition'
    });
    this.save();
  }

  getUsageHistory() {
    return this.usageHistory;
  }

  save() {
    localStorage.setItem('cutoutProCredits', this.credits.toString());
    localStorage.setItem('cutoutProUsage', JSON.stringify(this.usageHistory));
  }

  reset() {
    this.credits = 10;
    this.usageHistory = [];
    this.save();
  }
}

// Main Cutout Pro Manager
export class CutoutProManager {
  constructor(apiKey = null) {
    this.api = new CutoutProAPI(apiKey);
    this.credits = new CutoutProCredits();
    this.features = {
      backgroundRemoval: { cost: 1, name: 'Background Removal' },
      backgroundReplacement: { cost: 2, name: 'Smart BG Replacement' },
      passportMaker: { cost: 3, name: 'Passport Maker' },
      cartoonSelfie: { cost: 2, name: 'Cartoon Selfie' },
      photoAnimer: { cost: 3, name: 'Photo Animer' }
    };
  }

  async processImage(feature, imageBlob, options = {}) {
    const featureConfig = this.features[feature];
    if (!featureConfig) {
      throw new Error(`Unknown feature: ${feature}`);
    }

    if (!this.credits.hasCredits(featureConfig.cost)) {
      throw new Error(`Insufficient credits. Need ${featureConfig.cost}, have ${this.credits.getCredits()}`);
    }

    let result;
    switch (feature) {
      case 'backgroundRemoval':
        result = await this.api.removeBackground(imageBlob, options);
        break;
      case 'backgroundReplacement':
        result = await this.api.replaceBackground(imageBlob, options.background, options);
        break;
      case 'passportMaker':
        result = await this.api.createPassport(imageBlob, options);
        break;
      case 'cartoonSelfie':
        result = await this.api.cartoonify(imageBlob, options);
        break;
      case 'photoAnimer':
        result = await this.api.animatePhoto(imageBlob, options);
        break;
      default:
        throw new Error(`Feature not implemented: ${feature}`);
    }

    // Deduct credits on success
    this.credits.deductCredits(featureConfig.cost);

    return result;
  }

  getFeatureCost(feature) {
    return this.features[feature]?.cost || 0;
  }

  getAvailableCredits() {
    return this.credits.getCredits();
  }

  getFeatureList() {
    return Object.entries(this.features).map(([key, config]) => ({
      id: key,
      name: config.name,
      cost: config.cost
    }));
  }
}

// Global instances
export const cutoutProManager = new CutoutProManager();
export const cutoutProCredits = new CutoutProCredits();