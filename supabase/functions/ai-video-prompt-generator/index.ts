import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { basePrompt, role, industry, methodology, tonality, focus, cinematicOptions } = await req.json()

    // Validate required parameters
    if (!basePrompt || !basePrompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'Base prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate optimized prompt using OpenAI
    const optimizedPrompt = await generateGTMPrompt({
      basePrompt: basePrompt.trim(),
      role,
      industry,
      methodology,
      tonality,
      focus,
      cinematicOptions
    })

    return new Response(
      JSON.stringify({ optimizedPrompt }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error generating GTM prompt:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to generate prompt',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Generate GTM-optimized prompt using OpenAI API
 */
async function generateGTMPrompt({
  basePrompt,
  role = 'general',
  industry = 'general',
  methodology = 'general',
  tonality = 'professional',
  focus = [],
  cinematicOptions = {}
}) {
   const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

   if (!OPENAI_API_KEY) {
     console.error('[ai-video-prompt-generator] OPENAI_API_KEY environment variable is not set in Supabase edge function configuration');
     throw new Error('AI prompt enhancement service is not configured. Please set OPENAI_API_KEY in your Supabase edge function environment variables (Settings > Edge Functions > Environment Variables).')
   }

  const systemPrompt = buildSystemPrompt(role, industry, methodology, tonality, focus, cinematicOptions)
  const userPrompt = `Base prompt: "${basePrompt}"

Please enhance this prompt using the specified GTM methodologies and create a comprehensive, conversion-optimized prompt for video generation.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`)
  }

  const data = await response.json()
  const enhancedPrompt = data.choices[0]?.message?.content?.trim()

  if (!enhancedPrompt) {
    throw new Error('No response generated from OpenAI')
  }

  return formatEnhancedPrompt(enhancedPrompt, basePrompt)
}

/**
 * Build system prompt for OpenAI
 */
function buildSystemPrompt(role, industry, methodology, tonality, focus, cinematicOptions = {}) {
  const roleContext = getRoleContext(role)
  const industryContext = getIndustryContext(industry)
  const methodologyContext = getMethodologyContext(methodology)
  const tonalityContext = getTonalityContext(tonality)
  const focusContext = getFocusContext(focus)
  const cinematicContext = getCinematicContext(cinematicOptions)

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

Format the enhanced prompt as a complete, professional cinematic video prompt with clearly labeled sections for each element.`
}

/**
 * Get role-specific context
 */
function getRoleContext(role) {
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
KPIs: Strategic partnerships, market positioning, executive engagement`,

    general: 'General business audience with focus on value and results'
  }
  return contexts[role] || contexts.general
}

/**
 * Get industry-specific context
 */
function getIndustryContext(industry) {
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

    general: 'General business industry with focus on operational efficiency and growth'
  }
  return contexts[industry] || contexts.general
}

/**
 * Get sales methodology context
 */
function getMethodologyContext(methodology) {
  const contexts = {
    meddpicc: `MEDDPICC Sales Methodology Application:
- Metrics: Include specific, measurable business outcomes
- Economic Buyer: Address executive-level decision makers
- Decision Criteria: Map out evaluation and selection process
- Decision Process: Understand buying committee and timeline
- Paper Process: Handle procurement and legal requirements
- Identify Pain: Uncover true business challenges
- Champion: Develop internal advocates and supporters
- Competition: Position against alternative solutions
Apply these elements throughout the prompt to create comprehensive value proposition`,

    spin: `SPIN Selling Methodology Application:
- Situation: Establish current business context and environment
- Problem: Identify specific problems and challenges
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
- Bonding & Rapport: Build trust and relationship foundation
- Pain: Identify and qualify business pain points
- Budget: Establish financial capability and constraints
- Decision: Map decision-making process and timeline
- Fulfillment: Demonstrate capability to deliver results
- Post-Sale: Address implementation and ongoing support
Include qualification elements and risk mitigation`,

    general: 'General sales methodology with focus on value demonstration and relationship building'
  }
  return contexts[methodology] || contexts.general
}

/**
 * Get writing tonality context
 */
function getTonalityContext(tonality) {
  const contexts = {
    executive: `Executive Gravitas Style:
- Formal, authoritative language with industry expertise
- Focus on strategic implications and long-term business impact
- Use sophisticated vocabulary and executive-level insights`,

    challenger: `Challenger Bold Style:
- Confident, assertive messaging that challenges assumptions
- Provocative insights that make prospects think differently
- Bold claims backed by data and unique perspectives`,

    conversational: `Conversational Peer Style:
- Friendly, relatable tone like speaking to a colleague
- Use "we" and "you" to build rapport and shared understanding
- Practical, down-to-earth language and real-world examples`,

    technical: `Technical Expert Style:
- Demonstrate deep technical knowledge and expertise
- Use industry-specific terminology appropriately
- Focus on technical specifications and capabilities`,

    inspirational: `Inspirational Vision Style:
- Paint compelling vision of future possibilities
- Use aspirational language and motivational messaging
- Focus on transformation and breakthrough results`,

    urgent: `Urgent Action Style:
- Create sense of urgency and time-sensitive opportunities
- Use action-oriented language and clear deadlines
- Emphasize immediate benefits and risk of inaction`,

    professional: 'Professional, informative style with clear value communication'
  }
  return contexts[tonality] || contexts.professional
}

/**
 * Get focus area context
 */
function getFocusContext(focus) {
  if (!focus || focus.length === 0) return 'General conversion optimization'

  const focusContexts = {
    'lead-gen': 'Lead Generation Focus: Optimize for capturing contact information and qualifying prospects',
    awareness: 'Brand Awareness Focus: Optimize for building recognition and consideration',
    education: 'Education Focus: Optimize for teaching and knowledge sharing',
    demo: 'Product Demo Focus: Optimize for showcasing capabilities and benefits'
  }

  return focus.map(area => focusContexts[area]).filter(Boolean).join('; ')
}

/**
 * Get cinematic context based on selected options
 */
function getCinematicContext(cinematicOptions = {}) {
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
 * Format the enhanced prompt
 */
function formatEnhancedPrompt(enhancedPrompt, basePrompt) {
  return `🎬 CINEMATIC VIDEO PROMPT - GTM OPTIMIZED

${enhancedPrompt}

---
Original Concept: ${basePrompt}
Generated with GTM methodologies and cinematic techniques for maximum engagement and conversion impact.`
}