/**
 * GTM Content Library - Comprehensive GTM methodologies and templates
 * Based on gtm-skills.com repository structure and content
 * Provides role-based playbooks, industry frameworks, and sales methodologies
 */

class GTMContentLibrary {
  constructor() {
    this.roles = this.initializeRoles();
    this.industries = this.initializeIndustries();
    this.methodologies = this.initializeMethodologies();
    this.tonalities = this.initializeTonalities();
    this.workflows = this.initializeWorkflows();
  }

  /**
   * Get role-based content for a specific role
   * @param {string} role - Role identifier (sdr, ae, sales-manager, etc.)
   * @returns {Object} Role content and templates
   */
  getRoleContent(role) {
    return this.roles[role] || this.roles.sdr;
  }

  /**
   * Get industry-specific content and considerations
   * @param {string} industry - Industry identifier
   * @returns {Object} Industry content and frameworks
   */
  getIndustryContent(industry) {
    return this.industries[industry] || this.industries.saas;
  }

  /**
   * Get sales methodology framework
   * @param {string} methodology - Methodology identifier
   * @returns {Object} Methodology framework and application guide
   */
  getMethodology(methodology) {
    return this.methodologies[methodology] || this.methodologies.spin;
  }

  /**
   * Get writing tonality guidelines
   * @param {string} tonality - Tonality identifier
   * @returns {Object} Writing style guidelines
   */
  getTonality(tonality) {
    return this.tonalities[tonality] || this.tonalities.professional;
  }

  /**
   * Get complete workflow templates
   * @param {string} workflow - Workflow identifier
   * @returns {Object} Complete workflow structure
   */
  getWorkflow(workflow) {
    return this.workflows[workflow] || this.workflows['cold-to-close'];
  }

  /**
   * Generate optimized prompt using GTM frameworks
   * @param {Object} params - Generation parameters
   * @returns {string} Optimized prompt
   */
  generateOptimizedPrompt({
    basePrompt,
    role,
    industry,
    methodology,
    tonality,
    focus = []
  }) {
    const roleContent = this.getRoleContent(role);
    const industryContent = this.getIndustryContent(industry);
    const methodologyContent = this.getMethodology(methodology);
    const tonalityContent = this.getTonality(tonality);

    const focusElements = focus.map(area => this.getFocusElement(area)).filter(Boolean);

    return this.buildOptimizedPrompt({
      basePrompt,
      roleContent,
      industryContent,
      methodologyContent,
      tonalityContent,
      focusElements
    });
  }

  /**
   * Build the final optimized prompt
   */
  buildOptimizedPrompt({
    basePrompt,
    roleContent,
    industryContent,
    methodologyContent,
    tonalityContent,
    focusElements
  }) {
    const sections = [
      `🎯 ${roleContent.title} Video Prompt`,
      ``,
      `Role Context: ${roleContent.description}`,
      `Objectives: ${roleContent.objectives.join(', ')}`,
      ``,
      `Industry Focus: ${industryContent.description}`,
      `Key Considerations: ${industryContent.considerations.join(', ')}`,
      ``,
      `Sales Framework: ${methodologyContent.name}`,
      `Application: ${methodologyContent.application}`,
      ``,
      `Writing Style: ${tonalityContent.name}`,
      `Guidelines: ${tonalityContent.guidelines}`,
      ``
    ];

    if (focusElements.length > 0) {
      sections.push(`Focus Areas: ${focusElements.join(', ')}`);
      sections.push(``);
    }

    sections.push(`Core Concept: ${basePrompt}`);
    sections.push(``);
    sections.push(`Create a compelling video that leverages these GTM frameworks to drive ${roleContent.primaryKPI} and achieve ${roleContent.objectives[0].toLowerCase()}.`);

    return sections.join('\n');
  }

  /**
   * Get focus area elements
   */
  getFocusElement(area) {
    const elements = {
      'lead-gen': 'Lead generation with contact capture',
      awareness: 'Brand awareness and market education',
      education: 'Educational content and knowledge sharing',
      demo: 'Product demonstration and capability showcase'
    };
    return elements[area];
  }

  // ===== ROLE DEFINITIONS =====

  initializeRoles() {
    return {
      sdr: {
        title: 'SDR/BDR Prospecting',
        description: 'Sales Development Representative / Business Development Representative content for cold outreach and lead qualification',
        objectives: [
          'Generate qualified leads',
          'Create pipeline opportunities',
          'Establish initial contact and interest'
        ],
        primaryKPI: 'meeting bookings',
        templates: [
          'Pain-point identification and solution introduction',
          'Value proposition delivery with clear next steps',
          'Social proof and credibility establishment'
        ],
        promptStarters: [
          'Create a prospecting video that identifies common challenges in [industry]',
          'Develop a cold outreach video that demonstrates understanding of [pain points]',
          'Build a lead magnet video that provides immediate value'
        ]
      },

      ae: {
        title: 'Account Executive Discovery',
        description: 'Account Executive content for qualified prospects, discovery, and value demonstration',
        objectives: [
          'Advance qualified opportunities',
          'Demonstrate ROI and business value',
          'Handle objections and concerns'
        ],
        primaryKPI: 'deal progression',
        templates: [
          'ROI calculation and business case development',
          'Competitive positioning and differentiation',
          'Risk mitigation and implementation planning'
        ],
        promptStarters: [
          'Create a discovery video that addresses [specific objection]',
          'Develop a value demonstration video showing [quantified benefits]',
          'Build a competitive positioning video against [competitor]'
        ]
      },

      'sales-manager': {
        title: 'Sales Management',
        description: 'Sales leadership content for team enablement and pipeline management',
        objectives: [
          'Accelerate team performance',
          'Build management credibility',
          'Drive revenue growth'
        ],
        primaryKPI: 'team quota attainment',
        templates: [
          'Team capability showcase and success stories',
          'Market intelligence and competitive insights',
          'Strategic planning and market expansion'
        ],
        promptStarters: [
          'Create a leadership video demonstrating [team capability]',
          'Develop a market intelligence video sharing [industry insight]',
          'Build a strategic planning video for [market opportunity]'
        ]
      },

      revops: {
        title: 'Revenue Operations',
        description: 'Revenue Operations content for process optimization and data-driven insights',
        objectives: [
          'Improve operational efficiency',
          'Enhance data accuracy and insights',
          'Optimize sales processes and automation'
        ],
        primaryKPI: 'operational efficiency gains',
        templates: [
          'Process optimization and automation benefits',
          'Data-driven decision making frameworks',
          'Performance analytics and forecasting'
        ],
        promptStarters: [
          'Create a process optimization video showing [efficiency gains]',
          'Develop an analytics video demonstrating [data insights]',
          'Build an automation video highlighting [time savings]'
        ]
      },

      csm: {
        title: 'Customer Success',
        description: 'Customer Success Management content for retention and expansion',
        objectives: [
          'Reduce customer churn',
          'Identify expansion opportunities',
          'Build long-term customer loyalty'
        ],
        primaryKPI: 'customer retention and expansion',
        templates: [
          'Customer onboarding and adoption acceleration',
          'Value realization and ROI demonstration',
          'Relationship building and proactive support'
        ],
        promptStarters: [
          'Create an onboarding video that accelerates [customer time-to-value]',
          'Develop a success story video showcasing [customer results]',
          'Build an expansion video identifying [growth opportunities]'
        ]
      },

      founder: {
        title: 'Executive Leadership',
        description: 'Founder and executive content for strategic partnerships and vision communication',
        objectives: [
          'Build strategic relationships',
          'Communicate company vision',
          'Drive executive-level engagement'
        ],
        primaryKPI: 'strategic partnership development',
        templates: [
          'Vision communication and market positioning',
          'Strategic partnership development',
          'Executive decision-making frameworks'
        ],
        promptStarters: [
          'Create a vision video communicating [strategic direction]',
          'Develop a partnership video for [target executive audience]',
          'Build a positioning video establishing [market leadership]'
        ]
      }
    };
  }

  // ===== INDUSTRY DEFINITIONS =====

  initializeIndustries() {
    return {
      saas: {
        name: 'SaaS',
        description: 'Software as a Service solutions and subscription-based business models',
        considerations: [
          'User adoption and onboarding challenges',
          'Subscription pricing and perceived value',
          'Integration with existing tech stack',
          'Scalability and usage-based pricing',
          'Competitive positioning in crowded market'
        ],
        painPoints: [
          'High implementation costs and complexity',
          'User resistance to change',
          'Integration challenges with legacy systems',
          'Measuring ROI and user engagement'
        ],
        valueDrivers: [
          'Time-to-value and quick implementation',
          'Scalable usage and flexible pricing',
          'Continuous innovation and updates',
          'Lower total cost of ownership'
        ]
      },

      fintech: {
        name: 'FinTech',
        description: 'Financial technology and payment processing solutions',
        considerations: [
          'Regulatory compliance and security requirements',
          'Transaction processing reliability',
          'Integration with financial systems',
          'Risk management and fraud prevention',
          'Industry certifications and auditability'
        ],
        painPoints: [
          'Regulatory complexity and compliance burden',
          'Security vulnerabilities and data breaches',
          'Legacy system integration challenges',
          'Transaction processing bottlenecks'
        ],
        valueDrivers: [
          'Enhanced security and compliance automation',
          'Faster transaction processing',
          'Real-time financial insights',
          'Reduced operational risk'
        ]
      },

      healthcare: {
        name: 'Healthcare',
        description: 'Healthcare technology and patient care solutions',
        considerations: [
          'HIPAA compliance and patient data protection',
          'Clinical workflow integration',
          'Patient outcomes and care quality',
          'Regulatory compliance and certifications',
          'Integration with EHR and medical systems'
        ],
        painPoints: [
          'Regulatory compliance complexity',
          'Patient data security concerns',
          'Clinical workflow disruption',
          'Integration with existing medical systems'
        ],
        valueDrivers: [
          'Improved patient outcomes',
          'Streamlined clinical workflows',
          'Enhanced data security and compliance',
          'Better care coordination'
        ]
      },

      manufacturing: {
        name: 'Manufacturing',
        description: 'Manufacturing and industrial operations solutions',
        considerations: [
          'Operational efficiency and cost reduction',
          'Supply chain optimization',
          'Quality control and compliance',
          'Equipment integration and IoT',
          'Long sales cycles and technical evaluation'
        ],
        painPoints: [
          'Rising operational costs',
          'Supply chain disruptions',
          'Quality control challenges',
          'Legacy equipment integration'
        ],
        valueDrivers: [
          'Reduced operational costs',
          'Improved quality and compliance',
          'Enhanced supply chain visibility',
          'Predictive maintenance capabilities'
        ]
      },

      'professional-services': {
        name: 'Professional Services',
        description: 'Consulting, advisory, and professional service firms',
        considerations: [
          'Expertise demonstration and credibility',
          'ROI measurement and business impact',
          'Relationship building and trust establishment',
          'Service delivery methodology',
          'Competitive differentiation'
        ],
        painPoints: [
          'Measuring service value and ROI',
          'Building trust with new clients',
          'Differentiating from competitors',
          'Managing service delivery expectations'
        ],
        valueDrivers: [
          'Measurable business impact',
          'Proven methodologies and frameworks',
          'Strategic guidance and expertise',
          'Long-term partnership development'
        ]
      }
    };
  }

  // ===== METHODOLOGY DEFINITIONS =====

  initializeMethodologies() {
    return {
      meddpicc: {
        name: 'MEDDPICC',
        fullName: 'Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Identify Pain, Champion, Competition',
        description: 'Enterprise sales qualification framework for complex B2B sales',
        application: 'Apply systematically to understand and navigate enterprise buying processes',
        elements: {
          metrics: 'Quantify business impact and ROI metrics',
          economicBuyer: 'Identify and engage executive decision makers',
          decisionCriteria: 'Map evaluation criteria and requirements',
          decisionProcess: 'Understand buying committee and timeline',
          paperProcess: 'Navigate procurement and legal processes',
          identifyPain: 'Uncover true business challenges and pain points',
          champion: 'Develop internal advocates and supporters',
          competition: 'Position against alternative solutions'
        }
      },

      spin: {
        name: 'SPIN Selling',
        fullName: 'Situation, Problem, Implication, Need-payoff',
        description: 'Consultative selling framework for complex solutions',
        application: 'Progress conversations from current state to solution value',
        elements: {
          situation: 'Understand current business situation and context',
          problem: 'Identify specific problems and challenges',
          implication: 'Explore impact of unsolved problems',
          'need-payoff': 'Demonstrate value of proposed solutions'
        }
      },

      challenger: {
        name: 'Challenger Sale',
        fullName: 'The Challenger Sale',
        description: 'Insight-driven sales approach that challenges customer assumptions',
        application: 'Teach customers, tailor communications, and take control of sales conversations',
        elements: {
          teach: 'Provide unique insights and industry knowledge',
          tailor: 'Customize messaging to specific customer situation',
          takeControl: 'Guide conversations strategically and assertively',
          buildTension: 'Create constructive tension around unsolved problems'
        }
      },

      'gap-selling': {
        name: 'Gap Selling',
        fullName: 'Gap Selling',
        description: 'Framework focusing on the gap between current and desired future state',
        application: 'Identify gaps and position solutions as bridges to desired outcomes',
        elements: {
          currentState: 'Assess existing capabilities and performance',
          futureState: 'Define desired outcomes and objectives',
          gapAnalysis: 'Identify difference between current and future state',
          fillGap: 'Position solution as bridge to desired future'
        }
      },

      'value-selling': {
        name: 'Value Selling',
        fullName: 'Value-Based Selling',
        description: 'Sales approach focused on quantifiable business value and ROI',
        application: 'Demonstrate tangible business impact and quantified results',
        elements: {
          businessValue: 'Focus on business outcomes and ROI',
          quantifiedValue: 'Include specific metrics and measurements',
          strategicValue: 'Demonstrate competitive advantage',
          personalValue: 'Address individual stakeholder benefits'
        }
      },

      sandler: {
        name: 'Sandler Selling',
        fullName: 'Sandler Selling System',
        description: 'Qualification-focused sales process with pain-based selling',
        application: 'Qualify prospects and focus on pain points throughout sales process',
        elements: {
          bondingRapport: 'Build trust and relationship foundation',
          pain: 'Identify and qualify business pain points',
          budget: 'Establish financial capability and constraints',
          decision: 'Map decision-making process and timeline',
          fulfillment: 'Demonstrate capability to deliver results',
          postSale: 'Address implementation and ongoing support'
        }
      }
    };
  }

  // ===== TONALITY DEFINITIONS =====

  initializeTonalities() {
    return {
      executive: {
        name: 'Executive Gravitas',
        description: 'Formal, authoritative language with strategic insights',
        guidelines: 'Use sophisticated vocabulary, focus on strategic implications, emphasize vision and leadership',
        examples: [
          'Strategic transformation through innovative solutions',
          'Executive-level decision making and business impact',
          'Visionary leadership and market positioning'
        ]
      },

      challenger: {
        name: 'Challenger Bold',
        description: 'Confident, assertive messaging that challenges assumptions',
        guidelines: 'Be provocative and insight-driven, challenge conventional thinking, provide unique perspectives',
        examples: [
          'The conventional approach is failing - here\'s why',
          'Industry assumptions that are holding you back',
          'Bold insights that drive competitive advantage'
        ]
      },

      conversational: {
        name: 'Conversational Peer',
        description: 'Friendly, relatable tone like speaking to a trusted colleague',
        guidelines: 'Use "we" and "you", include relatable examples, build rapport through shared understanding',
        examples: [
          'We\'ve all faced this challenge before',
          'Here\'s what worked for companies like yours',
          'Let\'s explore this together as partners'
        ]
      },

      technical: {
        name: 'Technical Expert',
        description: 'Demonstrate deep technical knowledge and expertise',
        guidelines: 'Use industry terminology, focus on specifications and capabilities, show technical credibility',
        examples: [
          'Leveraging advanced algorithms for optimization',
          'Enterprise-grade security with end-to-end encryption',
          'Scalable architecture supporting millions of transactions'
        ]
      },

      inspirational: {
        name: 'Inspirational Vision',
        description: 'Paint compelling vision of future possibilities',
        guidelines: 'Use aspirational language, focus on transformation, create emotional connection to goals',
        examples: [
          'Imagine a future where challenges become opportunities',
          'Transforming how your industry operates tomorrow',
          'Unlocking breakthrough results that redefine success'
        ]
      },

      urgent: {
        name: 'Urgent Action',
        description: 'Create sense of urgency and time-sensitive opportunities',
        guidelines: 'Use action-oriented language, emphasize immediate benefits, highlight risk of inaction',
        examples: [
          'The window for competitive advantage is closing',
          'Don\'t let this opportunity pass you by',
          'Act now to secure your market position'
        ]
      }
    };
  }

  // ===== WORKFLOW DEFINITIONS =====

  initializeWorkflows() {
    return {
      'cold-to-close': {
        name: 'Cold to Close',
        description: 'Complete sales cycle from initial outreach to deal closure',
        stages: [
          'Cold Outreach & Lead Generation',
          'Initial Qualification & Discovery',
          'Needs Assessment & Solution Design',
          'Proposal & Negotiation',
          'Implementation & Onboarding',
          'Post-Sale Support & Expansion'
        ]
      },

      discovery: {
        name: 'Discovery Mastery',
        description: 'Advanced discovery and qualification process',
        stages: [
          'Initial Contact & Rapport Building',
          'Situation Analysis & Context Setting',
          'Pain Point Identification & Validation',
          'Implication Exploration & Impact Assessment',
          'Solution Value Demonstration',
          'Next Steps & Commitment'
        ]
      },

      'demo-proposal': {
        name: 'Demo to Proposal',
        description: 'Technical validation to commercial agreement',
        stages: [
          'Demo Preparation & Planning',
          'Technical Demonstration',
          'Objection Handling & Clarification',
          'Business Value Reinforcement',
          'Proposal Development',
          'Terms Negotiation & Close'
        ]
      }
    };
  }
}

// Export singleton instance
export const gtmContentLibrary = new GTMContentLibrary();
export default gtmContentLibrary;