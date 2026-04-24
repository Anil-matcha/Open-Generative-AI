import { BaseModal } from './BaseModal.jsx';
import { openaiService } from '../../lib/openaiService.js';
import { gtmContentLibrary } from '../../lib/gtmContentLibrary.js';
import { supabase } from '../../lib/supabase.js';

/**
 * GTMPromptModal - GTM-Powered Prompt Enhancement Modal
 * Creates conversion-optimized video prompts using GTM methodologies
 * Adapts to each app's color scheme and loads prompts into prompt spaces
 */
export class GTMPromptModal extends BaseModal {
  constructor(options = {}) {
    super({
      title: 'GTM Prompt Enhancer',
      size: 'large',
      showFooter: true,
      footerContent: `
        <button class="modal-btn modal-btn-secondary" data-action="cancel">Cancel</button>
        <button class="modal-btn modal-btn-primary" data-action="generate">Generate Prompt</button>
      `,
      ...options
    });

    // App-specific theming
    this.appTheme = options.appTheme || 'timeline-editor';
    this.appColors = this.getAppColorScheme(this.appTheme);

    // GTM Selection State
    this.selectedRole = '';
    this.selectedIndustry = '';
    this.selectedMethodology = '';
    this.selectedTonality = '';
    this.basePrompt = '';
    this.generatedPrompt = '';

    // Advanced options
    this.focusAreas = [];

    // UI State
    this.isGenerating = false;
    this.generationStep = 0;
    this.showAdvanced = false;

    // Callback for when prompt is generated
    this.onPromptGenerated = options.onPromptGenerated || (() => {});
  }

  getAppColorScheme(theme) {
    const schemes = {
      'timeline-editor': {
        primary: '#3b82f6',
        accent: '#06b6d4',
        secondary: '#64748b'
      },
      'video-studio': {
        primary: '#8b5cf6',
        accent: '#a855f7',
        secondary: '#6b7280'
      },
      'text-to-video': {
        primary: '#059669',
        accent: '#10b981',
        secondary: '#4b5563'
      },
      'image-to-video': {
        primary: '#dc2626',
        accent: '#ef4444',
        secondary: '#6b7280'
      },
      'director': {
        primary: '#d97706',
        accent: '#f59e0b',
        secondary: '#64748b'
      },
      'video-agent': {
        primary: '#7c3aed',
        accent: '#8b5cf6',
        secondary: '#6b7280'
      },
      'cinema-template-studio': {
        primary: '#be123c',
        accent: '#dc2626',
        secondary: '#64748b'
      }
    };
    return schemes[theme] || schemes['timeline-editor'];
  }

  renderBody() {
    return `
      <div class="gtm-prompt-modal" style="--app-primary: ${this.appColors.primary}; --app-accent: ${this.appColors.accent}; --app-secondary: ${this.appColors.secondary}">
        <div class="gtm-header">
          <div class="gtm-icon">🎯</div>
          <div class="gtm-intro">
            <h3>GTM-Powered Prompt Enhancement</h3>
            <p>Create conversion-optimized video prompts using enterprise sales methodologies</p>
          </div>
        </div>

        <div class="gtm-form">
          <div class="form-section">
            <label for="base-prompt">Base Prompt</label>
            <textarea
              id="base-prompt"
              placeholder="Describe your video idea..."
              style="border-color: var(--app-secondary);"
            >${this.basePrompt}</textarea>
          </div>

          <div class="form-grid">
            <div class="form-section">
              <label>Target Role</label>
              <select id="role-select" style="border-color: var(--app-secondary);">
                <option value="">Select Role...</option>
                <option value="sdr">SDR/BDR (Prospecting)</option>
                <option value="ae">Account Executive (Discovery)</option>
                <option value="sales-manager">Sales Manager (Pipeline)</option>
                <option value="revops">RevOps (Optimization)</option>
                <option value="csm">Customer Success (Expansion)</option>
                <option value="founder">Founder/CEO (Strategy)</option>
              </select>
            </div>

            <div class="form-section">
              <label>Industry</label>
              <select id="industry-select" style="border-color: var(--app-secondary);">
                <option value="">Select Industry...</option>
                <option value="saas">SaaS</option>
                <option value="fintech">FinTech</option>
                <option value="healthcare">Healthcare</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="professional-services">Professional Services</option>
                <option value="ecommerce">E-commerce</option>
                <option value="real-estate">Real Estate</option>
                <option value="education">Education</option>
              </select>
            </div>

            <div class="form-section">
              <label>Sales Methodology</label>
              <select id="methodology-select" style="border-color: var(--app-secondary);">
                <option value="">Select Methodology...</option>
                <option value="meddpicc">MEDDPICC (Enterprise)</option>
                <option value="spin">SPIN Selling</option>
                <option value="challenger">Challenger Sale</option>
                <option value="gap-selling">Gap Selling</option>
                <option value="value-selling">Value Selling</option>
                <option value="sandler">Sandler Selling</option>
              </select>
            </div>

            <div class="form-section">
              <label>Writing Style</label>
              <select id="tonality-select" style="border-color: var(--app-secondary);">
                <option value="">Select Style...</option>
                <option value="executive">Executive Gravitas</option>
                <option value="challenger">Challenger Bold</option>
                <option value="conversational">Conversational Peer</option>
                <option value="technical">Technical Expert</option>
                <option value="inspirational">Inspirational Vision</option>
                <option value="urgent">Urgent Action</option>
              </select>
            </div>
          </div>

          <button class="toggle-advanced" data-action="toggle-advanced">
            ${this.showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

            ${this.showAdvanced ? `
            <div class="advanced-options">
              <div class="option-group">
                <label>Conversion Focus</label>
                <div class="checkbox-group">
                  <label><input type="checkbox" name="focus" value="lead-gen" ${this.focusAreas.includes('lead-gen') ? 'checked' : ''}> Lead Generation</label>
                  <label><input type="checkbox" name="focus" value="awareness" ${this.focusAreas.includes('awareness') ? 'checked' : ''}> Brand Awareness</label>
                  <label><input type="checkbox" name="focus" value="education" ${this.focusAreas.includes('education') ? 'checked' : ''}> Education</label>
                  <label><input type="checkbox" name="focus" value="demo" ${this.focusAreas.includes('demo') ? 'checked' : ''}> Product Demo</label>
                </div>
              </div>
            </div>
          ` : ''}

          ${this.isGenerating ? this.renderGenerationProgress() : ''}

          ${this.generatedPrompt ? this.renderGeneratedPrompt() : ''}
        </div>
      </div>
    `;
  }

  renderGenerationProgress() {
    const steps = [
      'Analyzing GTM methodologies...',
      'Applying sales frameworks...',
      'Optimizing for conversion...',
      'Finalizing prompt...'
    ];

    return `
      <div class="generation-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(this.generationStep / steps.length) * 100}%"></div>
        </div>
        <div class="progress-text">${steps[this.generationStep] || 'Complete!'}</div>
      </div>
    `;
  }

  renderGeneratedPrompt() {
    return `
      <div class="generated-prompt-section">
        <label>Generated GTM-Optimized Prompt</label>
        <div class="generated-prompt-container">
          <textarea readonly class="generated-prompt">${this.generatedPrompt}</textarea>
          <button class="copy-prompt-btn" data-action="copy-prompt" style="background: var(--app-primary);">
            📋 Copy & Use
          </button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Base prompt input
    const basePromptEl = this.content.querySelector('#base-prompt');
    if (basePromptEl) {
      basePromptEl.addEventListener('input', (e) => {
        this.basePrompt = e.target.value;
      });
    }

    // Select elements
    const roleSelect = this.content.querySelector('#role-select');
    const industrySelect = this.content.querySelector('#industry-select');
    const methodologySelect = this.content.querySelector('#methodology-select');
    const tonalitySelect = this.content.querySelector('#tonality-select');

    if (roleSelect) roleSelect.addEventListener('change', (e) => this.selectedRole = e.target.value);
    if (industrySelect) industrySelect.addEventListener('change', (e) => this.selectedIndustry = e.target.value);
    if (methodologySelect) methodologySelect.addEventListener('change', (e) => this.selectedMethodology = e.target.value);
    if (tonalitySelect) tonalitySelect.addEventListener('change', (e) => this.selectedTonality = e.target.value);

    // Toggle advanced options
    const toggleBtn = this.content.querySelector('[data-action="toggle-advanced"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.showAdvanced = !this.showAdvanced;
        this.render();
      });
    }

    // Focus area checkboxes
    const focusCheckboxes = this.content.querySelectorAll('input[name="focus"]');
    focusCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const value = e.target.value;
        if (e.target.checked) {
          if (!this.focusAreas.includes(value)) {
            this.focusAreas.push(value);
          }
        } else {
          this.focusAreas = this.focusAreas.filter(area => area !== value);
        }
      });
    });

    // Footer buttons
    this.content.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this.close();
    });

    this.content.querySelector('[data-action="generate"]')?.addEventListener('click', () => {
      this.handleGenerate();
    });

    // Copy prompt button
    this.content.querySelector('[data-action="copy-prompt"]')?.addEventListener('click', () => {
      this.handleCopyPrompt();
    });
  }

  async handleGenerate() {
    if (!this.basePrompt.trim()) {
      alert('Please enter a base prompt first');
      return;
    }

    this.isGenerating = true;
    this.generationStep = 0;
    this.render();

    try {
      // Update progress steps
      const steps = ['Analyzing GTM methodologies...', 'Applying sales frameworks...', 'Optimizing for conversion...', 'Finalizing prompt...'];

      for (let i = 0; i < steps.length; i++) {
        this.generationStep = i;
        this.render();
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Generate the optimized prompt using Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('ai-video-prompt-generator', {
        body: {
          basePrompt: this.basePrompt,
          role: this.selectedRole,
          industry: this.selectedIndustry,
          methodology: this.selectedMethodology,
          tonality: this.selectedTonality,
          focus: this.focusAreas
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      this.generatedPrompt = data.optimizedPrompt;
      this.isGenerating = false;
      this.render();

    } catch (error) {
      console.error('Prompt generation failed:', error);

      // Fallback to local generation
      try {
        this.generatedPrompt = gtmContentLibrary.generateOptimizedPrompt({
          basePrompt: this.basePrompt,
          role: this.selectedRole,
          industry: this.selectedIndustry,
          methodology: this.selectedMethodology,
          tonality: this.selectedTonality,
          focus: this.focusAreas
        });
        this.isGenerating = false;
        this.render();
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
        this.isGenerating = false;
        this.setError(true, 'Failed to generate prompt. Please try again.');
      }
    }
  }



  getRoleContext(role) {
    const contexts = {
      sdr: '🎯 SDR/BDR Focus: Prospecting & Qualification\n• Target cold/warm leads with pain-point driven messaging\n• Focus on problem identification and solution introduction\n• End with clear next steps for engagement',
      ae: '💼 AE Focus: Discovery & Value Proposition\n• Target qualified prospects ready for detailed solutions\n• Demonstrate ROI and business impact\n• Address specific challenges and requirements',
      'sales-manager': '📊 Sales Manager Focus: Pipeline Acceleration\n• Showcase team capabilities and success metrics\n• Build credibility through case studies and results\n• Position as strategic partner for growth',
      revops: '⚙️ RevOps Focus: Process Optimization\n• Highlight efficiency gains and automation benefits\n• Demonstrate data-driven decision making\n• Show scalability and operational excellence',
      csm: '🤝 CSM Focus: Customer Success & Expansion\n• Emphasize retention, growth, and long-term value\n• Showcase support capabilities and proactive service\n• Demonstrate customer-centric approach',
      founder: '🚀 Founder Focus: Vision & Strategy\n• Communicate big-picture vision and market opportunity\n• Build executive-level credibility and thought leadership\n• Position as strategic partner for transformation'
    };
    return contexts[role] || '';
  }

  getIndustryContext(industry) {
    const contexts = {
      saas: '🏢 SaaS Industry Context\n• Address subscription model concerns and ROI metrics\n• Focus on user adoption, scalability, and integration\n• Highlight competitive advantages and market position',
      fintech: '💰 FinTech Industry Context\n• Emphasize security, compliance, and regulatory requirements\n• Focus on transaction processing, risk management, and innovation\n• Demonstrate financial technology expertise and reliability',
      healthcare: '🏥 Healthcare Industry Context\n• Address HIPAA compliance and patient data security\n• Focus on clinical workflows, patient outcomes, and care quality\n• Highlight regulatory compliance and industry expertise',
      manufacturing: '🏭 Manufacturing Industry Context\n• Address operational efficiency and production optimization\n• Focus on supply chain, quality control, and cost reduction\n• Demonstrate industry-specific manufacturing knowledge',
      'professional-services': '💼 Professional Services Context\n• Emphasize expertise, methodology, and proven results\n• Focus on ROI, risk mitigation, and strategic value\n• Highlight service quality and relationship building'
    };
    return contexts[industry] || '';
  }

  getMethodologyContext(methodology) {
    const contexts = {
      meddpicc: '📋 MEDDPICC Framework\n• Metrics: Quantify business impact and ROI\n• Economic Buyer: Address executive-level decision making\n• Decision Criteria: Map decision-making process\n• Decision Process: Navigate complex buying committees\n• Paper Process: Handle procurement and legal requirements\n• Identify Pain: Uncover true business challenges\n• Champion: Develop internal advocates\n• Competition: Position against alternatives',
      spin: '🔄 SPIN Selling Framework\n• Situation: Understand current business context\n• Problem: Identify challenges and pain points\n• Implication: Explore impact of unsolved problems\n• Need-payoff: Demonstrate value of proposed solutions\n• Build problems before presenting solutions\n• Focus on implications rather than features',
      challenger: '⚔️ Challenger Framework\n• Teach: Provide unique insights and industry knowledge\n• Tailor: Customize messaging to specific situation\n• Take Control: Guide the conversation strategically\n• Build constructive tension around unsolved problems\n• Position as trusted advisor with unique perspective',
      'gap-selling': '🎯 Gap Selling Framework\n• Current State: Assess existing situation and capabilities\n• Future State: Define desired outcomes and objectives\n• Gap Analysis: Identify difference between current and future state\n• Fill the Gap: Position solution as bridge to desired future\n• Focus on transformation and change management'
    };
    return contexts[methodology] || '';
  }

  getTonalityContext(tonality) {
    const contexts = {
      executive: '🎩 Executive Gravitas\n• Formal, authoritative language with industry expertise\n• Focus on strategic implications and business impact\n• Use sophisticated vocabulary and executive-level insights',
      challenger: '⚡ Challenger Bold\n• Confident, assertive messaging that challenges assumptions\n• Provocative insights that make prospects think differently\n• Bold claims backed by data and unique perspectives',
      conversational: '💬 Conversational Peer\n• Friendly, relatable tone like speaking to a colleague\n• Use "we" and "you" to build rapport and shared understanding\n• Practical, down-to-earth language and real-world examples',
      technical: '🔧 Technical Expert\n• Demonstrate deep technical knowledge and expertise\n• Use industry-specific terminology appropriately\n• Focus on technical specifications and implementation details',
      inspirational: '✨ Inspirational Vision\n• Paint compelling vision of future possibilities\n• Use aspirational language and motivational messaging\n• Focus on transformation and breakthrough results',
      urgent: '🚨 Urgent Action\n• Create sense of urgency and time-sensitive opportunities\n• Use action-oriented language and clear deadlines\n• Emphasize immediate benefits and risk of inaction'
    };
    return contexts[tonality] || '';
  }

  handleCopyPrompt() {
    if (!this.generatedPrompt) return;

    navigator.clipboard.writeText(this.generatedPrompt).then(() => {
      // Trigger the callback to load prompt into the app
      if (this.onPromptGenerated) {
        this.onPromptGenerated(this.generatedPrompt);
      }
      this.close();
    }).catch(err => {
      console.error('Failed to copy prompt:', err);
      alert('Failed to copy prompt to clipboard');
    });
  }
}

// App-specific factory functions
export function createGTMPromptModal(appTheme = 'timeline-editor') {
  return new GTMPromptModal({ appTheme });
}</content>
<parameter name="filePath">src/components/modals/GTMPromptModal.jsx