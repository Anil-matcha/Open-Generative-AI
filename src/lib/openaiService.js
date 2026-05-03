/**
 * OpenAI Service - Handles AI-powered content generation for GTM prompts
 * Integrates with OpenAI API for prompt enhancement and content creation
 */

import { openaiConfig } from './config/openaiConfig.js';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

class OpenAIService {
  constructor() {
    // Use centralized configuration
    this.config = openaiConfig;
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
    focus = [],
    cinematicOptions = {}
  }) {
    this.config.validateApiKey();

    const systemPrompt = this.buildSystemPrompt(role, industry, methodology, tonality, focus, cinematicOptions);
    const userPrompt = `Base prompt: "${basePrompt}"

Please enhance this prompt using the specified GTM methodologies and create a comprehensive, conversion-optimized prompt for video generation.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.getApiKey()}`
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
  buildSystemPrompt(role, industry, methodology, tonality, focus, cinematicOptions = {}) {
    const roleContext = this.getRoleContext(role);
    const industryContext = this.getIndustryContext(industry);
    const methodologyContext = this.getMethodologyContext(methodology);
    const tonalityContext = this.getTonalityContext(tonality);
    const focusContext = this.getFocusContext(focus);
    const cinematicContext = this.getCinematicContext(cinematicOptions);

    return `You are a master cinematic video director and senior sales enablement expert specializing in GTM (Go-To-Market) methodologies and conversion-optimized content creation.

Your task is to transform basic video prompts into professional cinematic masterpieces that incorporate enterprise sales frameworks, cinematic storytelling techniques, and conversion optimization.

ROLE CONTEXT: ${roleContext}

INDUSTRY CONTEXT: ${industryContext}

METHODOLOGY CONTEXT: ${methodologyContext}

TONALITY CONTEXT: ${tonalityContext}

FOCUS AREAS: ${focusContext}

CINEMATIC ELEMENTS: ${cinematicContext}

INSTRUCTIONS:
- Create comprehensive cinematic video prompts that incorporate ALL selected cinematic elements
- Apply GTM sales methodologies naturally throughout the video structure
- Optimize for conversion using psychological triggers and emotional engagement
- Use professional cinematography terminology and techniques
- Structure prompts with clear sections for each cinematic element
- Include specific visual, audio, pacing, and editing instructions
- Focus on storytelling arcs that build emotional connection
- Integrate CTAs seamlessly within the cinematic narrative flow

Format the enhanced prompt as a complete, professional cinematic video prompt with clearly labeled sections for each element.`;
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
    if (!focus || focus.length === 0) return 'General conversion optimization'

    const focusContexts = {
      'lead-gen': 'Lead Generation Focus: Optimize for capturing contact information and qualifying prospects',
      awareness: 'Brand Awareness Focus: Optimize for building recognition and consideration',
      education: 'Education Focus: Optimize for teaching and knowledge sharing',
      demo: 'Product Demo Focus: Optimize for showcasing capabilities and benefits'
    }

    return focus.map(area => focusContexts[area]).filter(Boolean).join('; ')
  }

  getCinematicContext(cinematicOptions = {}) {
    const enabledElements = [];

    if (cinematicOptions.openingHook) {
      enabledElements.push('OPENING HOOKS: Include attention-grabbing hooks (curiosity gaps, emotional triggers, value promises, pattern interrupts) in the first 5 seconds');
    }

    if (cinematicOptions.storytellingStructure) {
      enabledElements.push('STORYTELLING STRUCTURE: Apply 3-act structure (Hook 0-15s, Conflict/Build 15-75s, Resolution 75-100s) with hero\'s journey, transformation arcs, and emotional payoffs');
    }

    if (cinematicOptions.visualElements) {
      enabledElements.push('VISUAL CINEMATOGRAPHY: Professional lighting (three-point setup), dynamic composition (rule of thirds, leading lines), camera work (dolly zooms, tracking shots), color grading for mood');
    }

    if (cinematicOptions.audioElements) {
      enabledElements.push('AUDIO EXCELLENCE: Sound design (foley effects, ambient atmosphere), emotional music scoring, clear voiceover with varied pacing, strategic silence for emphasis');
    }

    if (cinematicOptions.pacingEditing) {
      enabledElements.push('PACING & EDITING: Visual rhythm (5-15 second cuts), pacing shifts (speed ramping), montage sequences, attention control through editing patterns');
    }

    if (cinematicOptions.emotionalEngagement) {
      enabledElements.push('EMOTIONAL ENGAGEMENT: Authentic reactions, relatable challenges, emotional arcs (low→peak→payoff), empathy building, show-don\'t-tell demonstrations');
    }

    if (cinematicOptions.ctaIntegration) {
      enabledElements.push('CTA INTEGRATION: Strategic timing (after value delivery), narrative flow integration, multi-touchpoints (subscribe/like/share/contact), emotional momentum utilization');
    }

    return enabledElements.length > 0 ? enabledElements.join('; ') : 'Include basic cinematic elements for professional video production';
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

  // ===============================
  // Image Generation & Editing Methods
  // ===============================

  /**
   * Generate images from text prompts using GPT Image API
   * @param {Object} params - Generation parameters
   * @param {string} params.prompt - Text prompt for image generation
   * @param {number} params.n - Number of images to generate (1-10)
   * @param {string} params.size - Image size: "1024x1024", "1024x1792", "1792x1024"
   * @param {string} params.quality - Quality: "standard" or "hd"
   * @param {string} params.style - Style: "natural" or "vivid" (for gpt-image-2)
   * @returns {Promise<Object>} Generated images with base64 data
   */
  async generateImage({
    prompt,
    n = 1,
    size = "1024x1024",
    quality = "auto",
    style = "vivid",
    background = "auto",
    output_format = "png",
    output_compression,
    moderation = "auto"
  }) {
    this.config.validateApiKey();

    try {
      const response = await fetch(`${OPENAI_IMAGES_URL}/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.getApiKey()}`
        },
         const requestBody = {
           model: this.config.getImageModel(),
           prompt,
           n,
           size,
           quality,
           style,
           background,
           output_format,
           response_format: 'b64_json',
           moderation
         };

        // Only include compression if specified and format supports it
        if (output_compression !== undefined && ['jpeg', 'webp'].includes(output_format)) {
          requestBody.output_compression = output_compression;
        }

        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Image API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        images: data.data.map(img => ({
          base64: img.b64_json,
          revised_prompt: img.revised_prompt
        })),
        usage: data.usage
      };

    } catch (error) {
      console.error('OpenAI image generation failed:', error);
      throw error;
    }
  }

  /**
   * Edit existing images using prompts and masks
   * @param {Object} params - Edit parameters
   * @param {string} params.image - Base64 encoded image to edit
   * @param {string} params.mask - Base64 encoded mask (transparent areas to edit)
   * @param {string} params.prompt - Edit instructions
   * @param {number} params.n - Number of variations (1-10)
   * @param {string} params.size - Image size
   * @returns {Promise<Object>} Edited images
   */
  async editImage({
    image,
    images = [], // Array of additional reference images
    mask,
    prompt,
    n = 1,
    size = "1024x1024",
    quality = "auto",
    style = "vivid",
    background = "auto",
    output_format = "png",
    output_compression,
    input_fidelity = "auto",
    moderation = "auto"
  }) {
    this.config.validateApiKey();

    try {
      const formData = new FormData();

      // Convert base64 to blob for FormData
      const imageBlob = this.base64ToBlob(image);
      const maskBlob = mask ? this.base64ToBlob(mask) : null;

      formData.append('model', this.config.getImageModel());
      formData.append('image', imageBlob, 'image.png');

      // Add additional reference images if provided
      if (images && images.length > 0) {
        images.forEach((img, index) => {
          const imgBlob = this.base64ToBlob(img);
          formData.append('image', imgBlob, `reference_${index}.png`);
        });
      }

      if (maskBlob) {
        formData.append('mask', maskBlob, 'mask.png');
      }

      formData.append('prompt', prompt);
      formData.append('n', n.toString());
      formData.append('size', size);
      formData.append('quality', quality);
      formData.append('style', style);
      formData.append('background', background);
       formData.append('output_format', output_format);
       formData.append('response_format', 'b64_json');
       formData.append('input_fidelity', input_fidelity);
      formData.append('moderation', moderation);

      // Only include compression if specified and format supports it
      if (output_compression !== undefined && ['jpeg', 'webp'].includes(output_format)) {
        formData.append('output_compression', output_compression.toString());
      }

      const response = await fetch(`${OPENAI_IMAGES_URL}/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.getApiKey()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Image Edit API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        images: data.data.map(img => ({
          base64: img.b64_json,
          revised_prompt: img.revised_prompt
        })),
        usage: data.usage
      };

    } catch (error) {
      console.error('OpenAI image editing failed:', error);
      throw error;
    }
  }

  /**
   * Generate variations of an existing image
   * @param {Object} params - Variation parameters
   * @param {string} params.image - Base64 encoded image
   * @param {number} params.n - Number of variations (1-10)
   * @param {string} params.size - Image size
   * @returns {Promise<Object>} Image variations
   */
  async generateVariations({
    image,
    n = 1,
    size = "1024x1024",
    output_format = "png",
    output_compression
  }) {
    this.config.validateApiKey();

    try {
      const formData = new FormData();
      const imageBlob = this.base64ToBlob(image);

      formData.append('model', this.config.getImageModel());
      formData.append('image', imageBlob, 'image.png');
      formData.append('n', n.toString());
      formData.append('size', size);
       formData.append('output_format', output_format);
       formData.append('response_format', 'b64_json');

       // Only include compression if specified and format supports it
      if (output_compression !== undefined && ['jpeg', 'webp'].includes(output_format)) {
        formData.append('output_compression', output_compression.toString());
      }

      const response = await fetch(`${OPENAI_IMAGES_URL}/variations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.getApiKey()}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Image Variations API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        images: data.data.map(img => ({
          base64: img.b64_json
        })),
        usage: data.usage
      };

    } catch (error) {
      console.error('OpenAI image variations failed:', error);
      throw error;
    }
  }

  /**
   * Stream image generation for real-time feedback
   * @param {Object} params - Streaming parameters
   * @param {string} params.prompt - Generation prompt
   * @param {Function} params.onPartialImage - Callback for partial images
   * @param {number} params.partialImages - Number of partial images (0-3)
   * @returns {Promise<Object>} Final generated images
   */
  async streamImageGeneration({
    prompt,
    onPartialImage,
    partialImages = 2,
    size = "1024x1024",
    quality = "auto",
    style = "vivid",
    background = "auto",
    output_format = "png",
    output_compression,
    moderation = "auto"
  }) {
    this.config.validateApiKey();

    try {
      const response = await fetch(`${OPENAI_IMAGES_URL}/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.getApiKey()}`
        },
         const requestBody = {
           model: this.config.getImageModel(),
           prompt,
           stream: true,
           partial_images: partialImages,
           size,
           quality,
           style,
           background,
           output_format,
           response_format: 'b64_json',
           moderation
         };

        // Only include compression if specified and format supports it
        if (output_compression !== undefined && ['jpeg', 'webp'].includes(output_format)) {
          requestBody.output_compression = output_compression;
        }

        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Streaming API error: ${error.error?.message || 'Unknown error'}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let finalImages = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'image_generation.partial_image') {
                onPartialImage?.(parsed);
              } else if (parsed.type === 'image_generation.complete') {
                finalImages = parsed.data.map(img => ({
                  base64: img.b64_json,
                  revised_prompt: img.revised_prompt
                }));
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e);
            }
          }
        }
      }

      return { images: finalImages };

    } catch (error) {
      console.error('OpenAI streaming failed:', error);
      throw error;
    }
  }

  /**
   * Multi-turn image editing using Responses API for conversational editing
   * @param {Object} params - Multi-turn parameters
   * @param {string} params.input - User instruction for editing
   * @param {string} params.previousResponseId - ID from previous response (for continuation)
   * @param {Array} params.imageInputs - Previous images in context
   * @returns {Promise<Object>} Edited images with conversation context
   */
  async multiTurnImageEditing({
    input,
    previousResponseId,
    imageInputs = []
  }) {
    this.config.validateApiKey();

    try {
      const messages = [];
      const tools = [{ type: "image_generation" }];

      // Add previous images to context
      if (imageInputs.length > 0) {
        messages.push({
          role: "user",
          content: imageInputs.map(img => ({
            type: "image_url",
            image_url: { url: `data:image/png;base64,${img.base64}` }
          }))
        });
      }

      messages.push({
        role: "user",
        content: [{ type: "input_text", text: input }]
      });

      const requestBody = {
        model: "gpt-4.1", // Updated to valid model for Responses API
        input: messages,
        tools
      };

      if (previousResponseId) {
        requestBody.previous_response_id = previousResponseId;
      }

      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.getApiKey()}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI Responses API error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Extract image generation results
      const imageResults = data.output
        .filter(output => output.type === 'image_generation_call')
        .map(output => ({
          base64: output.result,
          revised_prompt: output.revised_prompt,
          call_id: output.id
        }));

      return {
        response_id: data.id,
        images: imageResults,
        conversation: data.output
      };

    } catch (error) {
      console.error('OpenAI multi-turn editing failed:', error);
      throw error;
    }
  }

  /**
   * Utility: Convert base64 string to Blob for FormData
   * @param {string} base64 - Base64 encoded image
   * @returns {Blob} Image blob
   */
  base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/png' });
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;