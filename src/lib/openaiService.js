/**
 * OpenAI Service - Handles AI-powered content generation for GTM prompts
 * Integrates with OpenAI API for prompt enhancement and content creation
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Will be set via environment

class OpenAIService {
  constructor() {
    this.apiKey = OPENAI_API_KEY;
    this.model = 'gpt-4'; // Can be configured
    this.maxTokens = 2000;
    this.temperature = 0.7;
  }

  /**
   * Generate GTM-optimized prompt based on user selections
   * @param {Object} params - Generation parameters
   * @param {string} params.basePrompt - User's original prompt
   * @param {string} params.role - Target role (sdr, ae, sales-manager, etc.)
   * @param {string} params.industry - Target industry
   * @param {string} params.methodology - Sales methodology
   * @param {string} params.tonality - Writing style
   * @param {Array} params.focus - Conversion focus areas
   * @returns {Promise<string>} Enhanced prompt
   */
  async generateGTMPrompt({
    basePrompt,
    role,
    industry,
    methodology,
    tonality,
    focus = []
  }) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(role, industry, methodology, tonality, focus);
    const userPrompt = `Base prompt: "${basePrompt}"

Please enhance this prompt using the specified GTM methodologies and create a comprehensive, conversion-optimized prompt for video generation.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const enhancedPrompt = data.choices[0]?.message?.content?.trim();

      if (!enhancedPrompt) {
        throw new Error('No response generated from OpenAI');
      }

      return this.formatEnhancedPrompt(enhancedPrompt, basePrompt);

    } catch (error) {
      console.error('OpenAI generation failed:', error);
      // Fallback to template-based generation
      return this.generateFallbackPrompt({
        basePrompt,
        role,
        industry,
        methodology,
        tonality,
        focus
      });
    }
  }

  /**
   * Build system prompt for OpenAI based on GTM parameters
   */
  buildSystemPrompt(role, industry, methodology, tonality, focus) {
    const roleContext = this.getRoleContext(role);
    const industryContext = this.getIndustryContext(industry);
    const methodologyContext = this.getMethodologyContext(methodology);
    const tonalityContext = this.getTonalityContext(tonality);
    const focusContext = this.getFocusContext(focus);

    return `You are a senior sales enablement expert specializing in GTM (Go-To-Market) methodologies and conversion-optimized content creation.

Your task is to enhance video generation prompts by applying enterprise sales frameworks and GTM best practices.

ROLE CONTEXT: ${roleContext}

INDUSTRY CONTEXT: ${industryContext}

METHODOLOGY CONTEXT: ${methodologyContext}

TONALITY CONTEXT: ${tonalityContext}

FOCUS AREAS: ${focusContext}

INSTRUCTIONS:
- Create prompts that incorporate sales methodologies naturally
- Optimize for conversion and engagement
- Use the specified tonality and writing style
- Include industry-specific terminology and pain points
- Structure prompts to drive specific outcomes based on target role
- Ensure prompts are comprehensive and actionable
- Focus on storytelling and emotional connection
- Include specific visual and narrative elements that support sales goals

Format the enhanced prompt as a complete, ready-to-use video generation prompt.`;
  }

  /**
   * Get role-specific context and objectives
   */
  getRoleContext(role) {
    const contexts = {
      sdr: `Target: SDR/BDR (Sales Development Representatives/Business Development Representatives)
Objectives: Generate interest, qualify leads, create pipeline opportunities
Focus: Problem identification, value introduction, next-step creation
Tone: Professional, approachable, solution-oriented
KPIs: Response rates, meeting bookings, lead quality`,

      ae: `Target: Account Executives (Sales Representatives)
Objectives: Demonstrate value, handle objections, close deals
Focus: ROI demonstration, competitive positioning, urgency creation
Tone: Authoritative, consultative, results-focused
KPIs: Deal closure, revenue generation, customer acquisition`,

      'sales-manager': `Target: Sales Managers and Team Leaders
Objectives: Build credibility, showcase capabilities, drive team performance
Focus: Results demonstration, team expertise, scalability
Tone: Strategic, leadership-oriented, performance-driven
KPIs: Team productivity, revenue growth, market expansion`,

      revops: `Target: Revenue Operations Professionals
Objectives: Process optimization, data-driven insights, efficiency gains
Focus: Analytics, automation, operational excellence
Tone: Analytical, process-oriented, innovation-focused
KPIs: Operational efficiency, data accuracy, process improvement`,

      csm: `Target: Customer Success Managers
Objectives: Build loyalty, identify expansion opportunities, reduce churn
Focus: Customer value, relationship building, proactive service
Tone: Supportive, partnership-oriented, value-focused
KPIs: Retention rates, expansion revenue, customer satisfaction`,

      founder: `Target: Founders and Executive Leadership
Objectives: Strategic partnership, vision alignment, transformation
Focus: Business impact, strategic value, executive-level decision making
Tone: Visionary, strategic, executive-level
KPIs: Strategic partnerships, market positioning, executive engagement`
    };
    return contexts[role] || 'General business audience with focus on value and results';
  }

  /**
   * Get industry-specific context and considerations
   */
  getIndustryContext(industry) {
    const contexts = {
      saas: `SaaS Industry Considerations:
- Address subscription model concerns and pricing structures
- Focus on user adoption, implementation, and time-to-value
- Emphasize scalability, integrations, and total cost of ownership
- Include competitive positioning against other SaaS solutions`,

      fintech: `FinTech Industry Considerations:
- Address security, compliance, and regulatory requirements
- Focus on transaction processing, risk management, and fraud prevention
- Emphasize reliability, auditability, and industry certifications
- Include integration with financial systems and data security`,

      healthcare: `Healthcare Industry Considerations:
- Address HIPAA compliance and patient data protection
- Focus on clinical workflows, patient outcomes, and care quality
- Emphasize regulatory compliance and industry certifications
- Include integration with EHR systems and clinical decision support`,

      manufacturing: `Manufacturing Industry Considerations:
- Address operational efficiency and production optimization
- Focus on supply chain management and quality control
- Emphasize ROI from automation and process improvements
- Include integration with existing manufacturing systems`,

      'professional-services': `Professional Services Considerations:
- Address expertise demonstration and thought leadership
- Focus on ROI measurement and business impact
- Emphasize relationship building and trust establishment
- Include case studies and service delivery methodology`,

      ecommerce: `E-commerce Considerations:
- Address conversion optimization and customer experience
- Focus on traffic generation, cart abandonment, and repeat purchases
- Emphasize platform scalability and payment processing
- Include mobile commerce and omnichannel strategies`,

      'real-estate': `Real Estate Considerations:
- Address property search and market intelligence
- Focus on lead generation and transaction management
- Emphasize market data accuracy and local market expertise
- Include virtual tours and property marketing automation`,

      education: `Education Considerations:
- Address learning outcomes and student engagement
- Focus on content delivery and assessment systems
- Emphasize accessibility and learning analytics
- Include integration with LMS and administrative systems`
    };
    return contexts[industry] || 'General business industry with focus on operational efficiency and growth';
  }

  /**
   * Get sales methodology context and application
   */
  getMethodologyContext(methodology) {
    const contexts = {
      meddpicc: `MEDDPICC Sales Methodology Application:
- Metrics: Include specific, measurable business outcomes
- Economic Buyer: Address executive-level decision makers
- Decision Criteria: Map out evaluation and selection process
- Decision Process: Navigate complex buying committees
- Paper Process: Address procurement and legal requirements
- Identify Pain: Uncover and articulate business challenges
- Champion: Develop internal advocates and supporters
- Competition: Position against alternative solutions
Apply these elements throughout the prompt to create comprehensive value proposition`,

      spin: `SPIN Selling Methodology Application:
- Situation: Establish current business context and environment
- Problem: Identify challenges and pain points
- Implication: Explore impact of unsolved problems on business
- Need-payoff: Demonstrate value of proposed solutions
Structure the prompt to build from current state awareness to solution value`,

      challenger: `Challenger Sale Methodology Application:
- Teach: Provide unique insights and industry knowledge
- Tailor: Customize messaging to specific situation and needs
- Take Control: Guide the conversation strategically
- Build constructive tension around unsolved problems
Create prompts that challenge assumptions and provide unique perspectives`,

      'gap-selling': `Gap Selling Methodology Application:
- Current State: Assess existing capabilities and performance
- Future State: Define desired outcomes and objectives
- Gap Analysis: Identify difference between current and future state
- Fill the Gap: Position solution as bridge to desired future
Structure prompts around transformation and change management`,

      'value-selling': `Value Selling Methodology Application:
- Business Value: Focus on business outcomes and ROI
- Personal Value: Address individual stakeholder benefits
- Strategic Value: Demonstrate competitive advantage
- Quantified Value: Include specific metrics and measurements
Emphasize tangible business impact and quantified results`,

      sandler: `Sandler Selling Methodology Application:
- Bonding & Rapport: Build trust and relationship
- Pain: Identify and qualify business pain points
- Budget: Establish financial capability and constraints
- Decision: Map decision-making process and timeline
- Fulfillment: Demonstrate capability to deliver results
- Post-Sale: Address implementation and ongoing support
Include qualification elements and risk mitigation`
    };
    return contexts[methodology] || 'General sales methodology with focus on value demonstration and relationship building';
  }

  /**
   * Get writing tonality and style guidelines
   */
  getTonalityContext(tonality) {
    const contexts = {
      executive: `Executive Gravitas Style:
- Formal, authoritative language with industry expertise
- Focus on strategic implications and long-term business impact
- Use sophisticated vocabulary and executive-level insights
- Emphasize vision, leadership, and strategic positioning`,

      challenger: `Challenger Bold Style:
- Confident, assertive messaging that challenges assumptions
- Provocative insights that make audiences think differently
- Bold claims backed by data and unique perspectives
- Direct, authoritative tone with intellectual leadership`,

      conversational: `Conversational Peer Style:
- Friendly, relatable tone like speaking to a colleague
- Use "we" and "you" to build rapport and shared understanding
- Practical, down-to-earth language and real-world examples
- Collaborative, partnership-oriented approach`,

      technical: `Technical Expert Style:
- Demonstrate deep technical knowledge and expertise
- Use industry-specific terminology appropriately
- Focus on specifications, capabilities, and technical benefits
- Authoritative voice based on technical credibility`,

      inspirational: `Inspirational Vision Style:
- Paint compelling vision of future possibilities
- Use aspirational language and motivational messaging
- Focus on transformation and breakthrough results
- Emotional connection with aspirational goals`,

      urgent: `Urgent Action Style:
- Create sense of urgency and time-sensitive opportunities
- Use action-oriented language and clear deadlines
- Emphasize immediate benefits and risk of inaction
- Direct calls-to-action with compelling rationale`
    };
    return contexts[tonality] || 'Professional, informative style with clear value communication';
  }

  /**
   * Get focus area context
   */
  getFocusContext(focus) {
    if (!focus || focus.length === 0) return 'General conversion optimization';

    const focusContexts = {
      'lead-gen': 'Lead Generation Focus: Optimize for capturing contact information and qualifying prospects',
      awareness: 'Brand Awareness Focus: Optimize for building recognition and consideration',
      education: 'Education Focus: Optimize for teaching and knowledge transfer',
      demo: 'Product Demo Focus: Optimize for showcasing capabilities and benefits'
    };

    return focus.map(area => focusContexts[area]).filter(Boolean).join('; ');
  }

  /**
   * Format the enhanced prompt with proper structure
   */
  formatEnhancedPrompt(enhancedPrompt, basePrompt) {
    return `🎯 GTM-Optimized Video Prompt

${enhancedPrompt}

---
Original Concept: ${basePrompt}
Generated with GTM methodologies for maximum conversion impact.`;
  }

  /**
   * Fallback prompt generation when OpenAI is unavailable
   */
  generateFallbackPrompt(params) {
    const { basePrompt, role, industry, methodology, tonality } = params;

    // Template-based fallback
    const rolePrefix = this.getRolePrefix(role);
    const industryContext = this.getIndustryFallbackContext(industry);
    const methodologyElements = this.getMethodologyElements(methodology);
    const tonalityStyle = this.getTonalityStyle(tonality);

    return `🎯 GTM-Optimized Video Prompt

${rolePrefix}

${industryContext}

${methodologyElements}

${tonalityStyle}

Core Concept: ${basePrompt}

Create a compelling video that drives engagement and conversion through strategic storytelling and value demonstration.

---
Generated with GTM framework fallback (OpenAI unavailable)`;
  }

  getRolePrefix(role) {
    const prefixes = {
      sdr: '🎯 SDR/BDR Prospecting Video:',
      ae: '💼 Account Executive Discovery Video:',
      'sales-manager': '📊 Sales Leadership Video:',
      revops: '⚙️ Revenue Operations Video:',
      csm: '🤝 Customer Success Video:',
      founder: '🚀 Executive Vision Video:'
    };
    return prefixes[role] || '🎬 Professional Video:';
  }

  getIndustryFallbackContext(industry) {
    const contexts = {
      saas: 'Focus on user adoption, scalability, and subscription value.',
      fintech: 'Emphasize security, compliance, and financial innovation.',
      healthcare: 'Highlight compliance, outcomes, and patient care.',
      manufacturing: 'Showcase efficiency, quality, and operational excellence.'
    };
    return contexts[industry] || 'Demonstrate business value and competitive advantage.';
  }

  getMethodologyElements(methodology) {
    const elements = {
      meddpicc: 'Include metrics, address economic buyers, map decision processes.',
      spin: 'Establish situation, identify problems, show implications, demonstrate value.',
      challenger: 'Teach unique insights, tailor messaging, build tension constructively.',
      'gap-selling': 'Show current state, paint future vision, fill the gap with solutions.'
    };
    return elements[methodology] || 'Apply proven sales methodology for maximum impact.';
  }

  getTonalityStyle(tonality) {
    const styles = {
      executive: 'Use formal, strategic language with executive-level insights.',
      challenger: 'Be bold, provocative, and insight-driven.',
      conversational: 'Speak as a trusted peer with relatable examples.',
      technical: 'Demonstrate deep expertise with precise terminology.',
      inspirational: 'Paint aspirational vision with motivational messaging.',
      urgent: 'Create urgency with clear calls-to-action.'
    };
    return styles[tonality] || 'Maintain professional, engaging tone.';
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;