import { BaseModal } from './BaseModal.jsx';

/**
 * VideoPersonalizer Modal
 * Personalized video generation based on audience/contact data
 */
export class VideoPersonalizer extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'Video Personalization',
      size: 'large',
      showFooter: true,
      footerContent: `
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-primary" data-action="personalize">Generate Personalized Video</button>
      `,
      ...options
    });

    this.contacts = [];
    this.selectedContacts = [];
    this.personalizationType = 'name';
    this.customField = '';
    this.template = 'default';
    this.isGenerating = false;
    this.generationProgress = 0;
  }

  renderBody() {
    return `
      <div class="video-personalizer">
        <div class="personalization-type-section">
          <label>Personalization Type</label>
          <div class="type-grid">
            <button class="type-card ${this.personalizationType === 'name' ? 'active' : ''}" data-type="name">
              <span class="type-icon">👤</span>
              <span class="type-name">Name</span>
              <span class="type-desc">Insert viewer name</span>
            </button>
            <button class="type-card ${this.personalizationType === 'company' ? 'active' : ''}" data-type="company">
              <span class="type-icon">🏢</span>
              <span class="type-name">Company</span>
              <span class="type-desc">Insert company name</span>
            </button>
            <button class="type-card ${this.personalizationType === 'custom' ? 'active' : ''}" data-type="custom">
              <span class="type-icon">✏️</span>
              <span class="type-name">Custom Field</span>
              <span class="type-desc">Use custom data field</span>
            </button>
          </div>
        </div>

        <div class="contacts-section">
          <div class="section-header">
            <label>Select Contacts</label>
            <span class="contact-count">${this.selectedContacts.length} selected</span>
          </div>
          
          <div class="contacts-list">
            ${this.contacts.length > 0 ? this.contacts.map(contact => `
              <div class="contact-item ${this.selectedContacts.includes(contact.id) ? 'selected' : ''}" data-id="${contact.id}">
                <div class="contact-avatar">${contact.name.charAt(0).toUpperCase()}</div>
                <div class="contact-info">
                  <div class="contact-name">${contact.name}</div>
                  <div class="contact-email">${contact.email}</div>
                </div>
                <div class="contact-check">✓</div>
              </div>
            `).join('') : `
              <div class="empty-contacts">
                <p>No contacts available</p>
                <button class="import-contacts-btn">Import Contacts</button>
              </div>
            `}
          </div>
        </div>

        <div class="template-section">
          <label>Video Template</label>
          <div class="template-grid">
            <div class="template-card ${this.template === 'default' ? 'active' : ''}" data-template="default">
              <div class="template-preview default-preview"></div>
              <span class="template-name">Default</span>
            </div>
            <div class="template-card ${this.template === 'professional' ? 'active' : ''}" data-template="professional">
              <div class="template-preview professional-preview"></div>
              <span class="template-name">Professional</span>
            </div>
            <div class="template-card ${this.template === 'casual' ? 'active' : ''}" data-template="casual">
              <div class="template-preview casual-preview"></div>
              <span class="template-name">Casual</span>
            </div>
          </div>
        </div>

        ${this.isGenerating ? `
          <div class="generation-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.generationProgress}%"></div>
            </div>
            <span class="progress-text">Generating personalized videos... ${this.generationProgress}%</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Type cards
    this.content.querySelectorAll('.type-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.personalizationType = e.currentTarget.dataset.type;
        this.render();
      });
    });

    // Contact items
    this.content.querySelectorAll('.contact-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const contactId = e.currentTarget.dataset.id;
        if (this.selectedContacts.includes(contactId)) {
          this.selectedContacts = this.selectedContacts.filter(id => id !== contactId);
        } else {
          this.selectedContacts.push(contactId);
        }
        this.render();
      });
    });

    // Template cards
    this.content.querySelectorAll('.template-card').forEach(card => {
      card.addEventListener('click', (e) => {
        this.template = e.currentTarget.dataset.template;
        this.render();
      });
    });

    // Import contacts button
    this.content.querySelector('.import-contacts-btn')?.addEventListener('click', () => {
      alert('Import contacts feature - connects to ContactImporterModal');
    });

    // Footer buttons
    this.content.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.close();
    });

    this.content.querySelector('[data-action="personalize"]')?.addEventListener('click', () => {
      this.handlePersonalize();
    });
  }

  handlePersonalize() {
    if (this.selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    this.isGenerating = true;
    this.generationProgress = 0;
    this.render();

    // Simulate generation for multiple videos
    const totalVideos = this.selectedContacts.length;
    let generatedCount = 0;

    const progressInterval = setInterval(() => {
      generatedCount++;
      this.generationProgress = Math.round((generatedCount / totalVideos) * 100);
      
      if (generatedCount >= totalVideos) {
        clearInterval(progressInterval);
        this.generationProgress = 100;
        this.onComplete?.({
          count: totalVideos,
          personalizationType: this.personalizationType,
          template: this.template
        });
        this.close();
      } else {
        this.render();
      }
    }, 300);
  }
}