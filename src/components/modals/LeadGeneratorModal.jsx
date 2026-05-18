/**
 * LeadGeneratorModal.jsx
 * Lead generation modal for capturing and managing leads from video content
 * Following Timeline Design System with consistent styling
 */

import { BaseModal } from './BaseModal.jsx';
import { supabase } from '../../lib/supabase.js';

export class LeadGeneratorModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: '📋 Lead Generator',
      size: 'large',
      showFooter: true,
      footerContent: `
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-primary" data-action="save">Save Lead</button>
      `,
      ...options
    });

    this.lead = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      source: 'video',
      notes: '',
      tags: []
    };
    this.availableTags = ['Hot Lead', 'Cold Lead', 'Follow Up', 'Qualified', 'Demo Scheduled', 'Customer'];
  }

  renderBody() {
    return `
      <div class="lead-generator">
        <div class="lead-form-section">
          <h4>Contact Information</h4>
          <div class="form-grid">
            <div class="form-group">
              <label for="first-name">First Name</label>
              <input type="text" id="first-name" class="text-input" placeholder="John" value="${this.lead.firstName}">
            </div>
            <div class="form-group">
              <label for="last-name">Last Name</label>
              <input type="text" id="last-name" class="text-input" placeholder="Smith" value="${this.lead.lastName}">
            </div>
            <div class="form-group full-width">
              <label for="email">Email *</label>
              <input type="email" id="email" class="text-input" placeholder="john@company.com" value="${this.lead.email}" required>
            </div>
            <div class="form-group">
              <label for="phone">Phone</label>
              <input type="tel" id="phone" class="text-input" placeholder="+1 555-1234" value="${this.lead.phone}">
            </div>
            <div class="form-group">
              <label for="company">Company</label>
              <input type="text" id="company" class="text-input" placeholder="Acme Corp" value="${this.lead.company}">
            </div>
            <div class="form-group full-width">
              <label for="job-title">Job Title</label>
              <input type="text" id="job-title" class="text-input" placeholder="Marketing Manager" value="${this.lead.jobTitle}">
            </div>
          </div>
        </div>

        <div class="lead-source-section">
          <h4>Lead Source</h4>
          <div class="source-options">
            <label class="source-option ${this.lead.source === 'video' ? 'selected' : ''}">
              <input type="radio" name="source" value="video" ${this.lead.source === 'video' ? 'checked' : ''}>
              <span class="source-icon">🎬</span>
              <span>Video</span>
            </label>
            <label class="source-option ${this.lead.source === 'landing_page' ? 'selected' : ''}">
              <input type="radio" name="source" value="landing_page" ${this.lead.source === 'landing_page' ? 'checked' : ''}>
              <span class="source-icon">🏠</span>
              <span>Landing Page</span>
            </label>
            <label class="source-option ${this.lead.source === 'email' ? 'selected' : ''}">
              <input type="radio" name="source" value="email" ${this.lead.source === 'email' ? 'checked' : ''}>
              <span class="source-icon">📧</span>
              <span>Email Campaign</span>
            </label>
            <label class="source-option ${this.lead.source === 'social' ? 'selected' : ''}">
              <input type="radio" name="source" value="social" ${this.lead.source === 'social' ? 'checked' : ''}>
              <span class="source-icon">📱</span>
              <span>Social Media</span>
            </label>
          </div>
        </div>

        <div class="lead-tags-section">
          <h4>Tags</h4>
          <div class="tags-container">
            ${this.availableTags.map(tag => `
              <button class="tag-btn ${this.lead.tags.includes(tag) ? 'selected' : ''}" data-tag="${tag}">
                ${tag}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="lead-notes-section">
          <h4>Notes</h4>
          <textarea id="notes" class="form-textarea" placeholder="Add notes about this lead..." rows="3">${this.lead.notes}</textarea>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Form inputs
    const inputIds = ['first-name', 'last-name', 'email', 'phone', 'company', 'job-title'];
    inputIds.forEach(id => {
      const input = this.content.querySelector(`#${id}`);
      if (input) {
        input.addEventListener('input', (e) => {
          const field = id.replace('-', '');
          this.lead[field.charAt(0).toUpperCase() + field.slice(1)] = e.target.value;
        });
      }
    });

    // Notes
    const notesInput = this.content.querySelector('#notes');
    if (notesInput) {
      notesInput.addEventListener('input', (e) => {
        this.lead.notes = e.target.value;
      });
    }

    // Source options
    this.content.querySelectorAll('input[name="source"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.lead.source = e.target.value;
      });
    });

    // Tag buttons
    this.content.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tag = e.currentTarget.dataset.tag;
        if (this.lead.tags.includes(tag)) {
          this.lead.tags = this.lead.tags.filter(t => t !== tag);
        } else {
          this.lead.tags.push(tag);
        }
        this.render();
        this.setupEventListeners();
      });
    });

    // Footer buttons
    this.content.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.close();
    });

    this.content.querySelector('[data-action="save"]')?.addEventListener('click', () => {
      this.handleSave();
    });
  }

  async handleSave() {
    if (!this.lead.email) {
      
      return;
    }

    try {
      // Send lead data to backend for email processing
      const { data, error } = await supabase.functions.invoke('lead-processor', {
        body: {
          lead: {
            ...this.lead,
            id: Date.now(),
            createdAt: new Date().toISOString()
          },
          action: 'capture',
          personalizationData: this.personalizationData || {}
        }
      });

      if (error) throw error;

      // Send welcome email if personalization data exists
      if (this.personalizationData) {
        await supabase.functions.invoke('email-service', {
          body: {
            to: this.lead.email,
            subject: 'Your Personalized Video Experience',
            template: 'personalized_video_welcome',
            personalizationData: this.personalizationData,
            leadData: this.lead
          }
        });
      }

      this.onComplete?.({
        ...this.lead,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        emailSent: true
      });

      
      this.close();

    } catch (error) {
      console.error('Lead processing error:', error);
      
    }
  }
}
