/**
 * Prompt Engine - Generates 5-output prompt packs for matrix templates
 * Supports: master_prompt, shot_enhanced_prompt, scene_prompt_pack, voiceover_direction, negative_prompt
 */

// Camera terms for enhancement
const CAMERA_TERMS = [
  'slow dolly movements',
  'shallow depth of field',
  'close-up detail shots',
  'dynamic camera motion',
  'atmospheric lighting',
  'emotionally engaging pacing'
];

// Visual style buckets
const VISUAL_STYLE_BUCKETS = {
  luxury: [
    'luxury cinematic style',
    'premium visual atmosphere',
    'elegant production design',
    'refined composition',
    'high-end commercial aesthetic'
  ],
  dramatic: [
    'dramatic cinematic tension',
    'moody contrast lighting',
    'intense visual storytelling',
    'high-impact composition',
    'emotionally charged atmosphere'
  ],
  documentary: [
    'documentary realism',
    'natural light feel',
    'authentic environment',
    'human-centered storytelling',
    'observational visual style'
  ],
  commercial: [
    'polished commercial look',
    'brand-forward composition',
    'clean product framing',
    'premium advertising aesthetic',
    'high-conversion visual direction'
  ]
};

// Niche enrichment terms
const NICHE_ENRICHMENT = {
  restaurant: ['cinematic food close-ups', 'steam texture plating details', 'warm hospitality atmosphere', 'kitchen action shots', 'guest experience moments'],
  'med-spa': ['luxury treatment rooms', 'clean premium interiors', 'close-up skincare details', 'client glow-up moments', 'elegant beauty-commercial tone'],
  salon: ['precision cutting details', 'stylist artistry', 'transformation moments', 'salon atmosphere', 'client confidence'],
  fitness: ['high-energy training visuals', 'sweat movement strength details', 'motivational transformation beats', 'dynamic gym atmosphere', 'powerful physical storytelling'],
  'real-estate': ['sweeping property reveals', 'luxury interior details', 'lifestyle-driven location shots', 'architectural wide shots', 'elevated listing presentation'],
  dental: ['clean modern clinic interiors', 'close-up treatment precision', 'comfort-focused patient moments', 'bright healthy smile reveals', 'premium care atmosphere'],
  legal: ['professional authority visuals', 'trust-building office atmosphere', 'confident attorney portrait moments', 'clean executive composition', 'credibility-focused visual storytelling'],
  automotive: ['reflective surface highlights', 'aggressive motion reveals', 'luxury vehicle detail shots', 'performance-driven pacing', 'cinematic machine presence'],
  fashion: ['editorial styling', 'fabric movement details', 'luxury lifestyle framing', 'runway-inspired energy', 'high-end visual polish'],
  events: ['crowd energy', 'stage or venue reveals', 'polished motion', 'premium event recap tone', 'celebration moments'],
  luxury: ['luxury cinematic style', 'premium visual atmosphere', 'elegant production design', 'refined composition', 'high-end commercial aesthetic'],
  'general-business': ['professional business setting', 'clear value presentation', 'human-centered brand moments', 'service-focused storytelling', 'premium modern business aesthetic']
};

// Film family story structures
const STORY_STRUCTURES = {
  'cinematic-commercial': ['hook', 'subject introduction', 'hero details', 'human value moment', 'brand reveal / CTA'],
  'promo-film': ['opening atmosphere', 'offer or service intro', 'value demonstration', 'offer reveal', 'CTA'],
  'documentary-style-film': ['context', 'real-world process', 'human detail', 'insight', 'grounded close'],
  'founder-story-film': ['origin', 'struggle', 'mission', 'breakthrough', 'future / CTA'],
  'testimonial-film': ['problem', 'frustration', 'solution', 'transformation', 'trust-building close'],
  'case-study-film': ['challenge', 'strategy', 'execution', 'result', 'proof / CTA'],
  'dramatic-trailer': ['tension hook', 'escalation', 'partial reveal', 'climax', 'title card / CTA'],
  'cinematic-short-film': ['hook', 'subject introduction', 'emotional movement', 'visual payoff', 'ending reveal']
};

/**
 * Clean and normalize prompt text
 */
function cleanPrompt(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/,+/g, ',')
    .trim();
}

/**
 * Remove duplicate terms from array
 */
function uniqueTerms(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Infer niche from prompt text
 */
function inferNiche(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('spa') || p.includes('med spa') || p.includes('skincare')) return 'med-spa';
  if (p.includes('restaurant') || p.includes('food') || p.includes('cafe')) return 'restaurant';
  if (p.includes('real estate') || p.includes('property') || p.includes('realtor')) return 'real-estate';
  if (p.includes('gym') || p.includes('fitness') || p.includes('workout')) return 'fitness';
  if (p.includes('law') || p.includes('attorney') || p.includes('legal')) return 'legal';
  if (p.includes('dental') || p.includes('dentist') || p.includes('smile')) return 'dental';
  if (p.includes('salon') || p.includes('hair') || p.includes('barber')) return 'salon';
  if (p.includes('car') || p.includes('auto') || p.includes('vehicle')) return 'automotive';
  if (p.includes('fashion') || p.includes('clothing') || p.includes('style')) return 'fashion';
  if (p.includes('event') || p.includes('party') || p.includes('wedding')) return 'events';
  if (p.includes('luxury') || p.includes('premium') || p.includes('exclusive')) return 'luxury';
  return 'general-business';
}

/**
 * Generate the 5-output prompt pack
 * @param {Object} template - The matrix template with filmFamily, storyBlueprint, etc.
 * @param {Object} formInputs - User inputs from the form (prompt, subject, setting, etc.)
 * @returns {Object} - 5-output prompt pack
 */
export function generatePromptPack(template, formInputs) {
  const filmFamily = template.filmFamily || 'cinematic-commercial';
  const storyBlueprint = template.storyBlueprint || STORY_STRUCTURES[filmFamily] || STORY_STRUCTURES['cinematic-commercial'];
  const niche = template.niche || inferNiche(formInputs.prompt || '');
  const nicheTerms = NICHE_ENRICHMENT[niche] || NICHE_ENRICHMENT['general-business'];
  const visualStyle = template.visualStyle || 'luxury';
  const styleTerms = VISUAL_STYLE_BUCKETS[visualStyle] || VISUAL_STYLE_BUCKETS.luxury;

  return {
    masterPrompt: buildMasterPrompt(template, formInputs, styleTerms, nicheTerms, storyBlueprint),
    shotEnhancedPrompt: buildShotPrompt(template, formInputs, styleTerms, storyBlueprint),
    scenePromptPack: buildScenePack(storyBlueprint, formInputs),
    voiceoverDirection: buildVoiceover(template, formInputs),
    negativePrompt: buildNegativePrompt()
  };
}

/**
 * Build the master prompt
 */
function buildMasterPrompt(template, inputs, styleTerms, nicheTerms, storyBlueprint) {
  return cleanPrompt(
    uniqueTerms([
      inputs.prompt || template.promptGoal || 'cinematic shot',
      template.templateFormat || 'cinematic commercial',
      ...styleTerms.slice(0, 3),
      ...CAMERA_TERMS,
      ...nicheTerms.slice(0, 3),
      ...storyBlueprint.slice(0, 4),
      inputs.setting,
      inputs.subject,
      inputs.effect ? `effect: ${inputs.effect}` : '',
      inputs.aspectRatio ? `aspect ratio: ${inputs.aspectRatio}` : '',
      inputs.duration ? `duration: ${inputs.duration} seconds` : '',
      inputs.extraInstructions
    ].filter(Boolean)).join(', ')
  );
}

/**
 * Build shot-enhanced prompt with camera/lens details
 */
function buildShotPrompt(template, inputs, styleTerms, storyBlueprint) {
  return cleanPrompt(
    uniqueTerms([
      'shot-level detail',
      ...CAMERA_TERMS,
      ...styleTerms.slice(0, 2),
      inputs.aspectRatio ? `aspect ratio: ${inputs.aspectRatio}` : '',
      inputs.duration ? `duration: ${inputs.duration}s` : '',
      inputs.prompt || template.promptGoal || ''
    ].filter(Boolean)).join(', ')
  );
}

/**
 * Build scene-by-scene breakdown
 */
function buildScenePack(storyBlueprint, inputs) {
  return storyBlueprint.map((scene, index) => ({
    beat: index + 1,
    name: scene,
    direction: `Scene ${index + 1}: ${scene}`
  }));
}

/**
 * Build voiceover direction
 */
function buildVoiceover(template, inputs) {
  return cleanPrompt([
    `Create a premium voiceover for a ${template.templateFormat || 'cinematic commercial'}`,
    inputs.audience ? `speak to ${inputs.audience}` : 'speak to the ideal viewer',
    'open with a fast hook',
    'build emotional or commercial momentum',
    inputs.cta ? `end with: ${inputs.cta}` : 'end with a clear call to action'
  ].join(', '));
}

/**
 * Build negative prompt
 */
function buildNegativePrompt() {
  return cleanPrompt([
    'avoid generic visuals',
    'avoid flat lighting',
    'avoid repetitive cinematic wording',
    'avoid cluttered frames',
    'avoid weak subject focus',
    'avoid conflicting styles'
  ].join(', '));
}

/**
 * Enhance a single field value
 */
export function enhanceFieldValue(fieldKey, value, form) {
  const raw = (value || '').trim();
  if (!raw) return '';

  const niche = form.niche || inferNiche(form.prompt || raw);
  const styleTerms = VISUAL_STYLE_BUCKETS[form.visualStyle] || VISUAL_STYLE_BUCKETS.luxury;
  const nicheTerms = NICHE_ENRICHMENT[niche] || NICHE_ENRICHMENT['general-business'];
  const story = STORY_STRUCTURES[form.templateType] || STORY_STRUCTURES['promo-film'];

  const fieldStrategies = {
    prompt: [
      raw,
      `${(form.templateType || 'promo-film').replaceAll('-', ' ')}`,
      ...styleTerms.slice(0, 3),
      ...CAMERA_TERMS,
      ...nicheTerms.slice(0, 3),
      ...story.slice(0, 4),
      form.effect ? `effect: ${form.effect}` : '',
      form.aspectRatio ? `aspect ratio: ${form.aspectRatio}` : '',
      form.duration ? `duration: ${form.duration} seconds` : ''
    ],
    subject: [
      raw,
      'cinematic subject focus',
      'emotionally readable expression',
      'clear visual storytelling anchor',
      ...CAMERA_TERMS.slice(0, 2),
      ...styleTerms.slice(0, 2)
    ],
    setting: [
      raw,
      'visually rich environment',
      'layered depth and atmosphere',
      ...nicheTerms.slice(0, 3),
      ...styleTerms.slice(0, 2),
      CAMERA_TERMS[0]
    ],
    businessType: [
      raw,
      'commercially relevant visual direction',
      'industry-specific cinematic storytelling',
      ...nicheTerms.slice(0, 2),
      ...styleTerms.slice(0, 2)
    ],
    audience: [
      raw,
      'audience-aware messaging',
      'emotionally relevant tone',
      form.cta ? `aligned with CTA: ${form.cta}` : '',
      form.templateType ? `${form.templateType.replaceAll('-', ' ')}` : ''
    ],
    cta: [
      raw,
      'clean closing line',
      'conversion-focused ending',
      'fits premium cinematic brand reveal'
    ],
    extraInstructions: [
      raw,
      ...styleTerms.slice(0, 2),
      ...CAMERA_TERMS.slice(0, 2),
      ...story.slice(0, 2),
      'avoid generic filler',
      'optimize for cinematic output'
    ]
  };

  return cleanPrompt(uniqueTerms(fieldStrategies[fieldKey] || [raw]).join(', '));
}

/**
 * Build a personalized image prompt using scan data
 */
export function buildPersonalizedImagePrompt(scanData, inputs = {}) {
  const tokens = extractTokensFromScan(scanData);
  const style = inputs.visualStyle || 'cinematic';
  const aspect = inputs.aspectRatio || '16:9';

  const base = [
    `Cinematic portrait of ${tokens.full_name || inputs.targetName}`,
    tokens.company ? `at ${tokens.company}` : '',
    tokens.bio ? `— ${tokens.bio}` : '',
    VISUAL_STYLE_BUCKETS[style] ? VISUAL_STYLE_BUCKETS[style][0] : VISUAL_STYLE_BUCKETS.cinematic[0],
    `optimized for ${aspect} aspect ratio`,
    inputs.extraInstructions || ''
  ].filter(Boolean);

  return cleanPrompt(base.join(', '));
}

/**
 * Build a complete personalized video prompt pack
 */
export function buildPersonalizedVideoPromptPack(scanData, inputs = {}) {
  const tokens = extractTokensFromScan(scanData);
  const storyType = inputs.storyType || 'founder-story';
  const duration = inputs.durationSeconds || 30;

  const storyBlueprint = STORY_STRUCTURES[storyType] || STORY_STRUCTURES['founder-story-film'];

  return {
    masterPrompt: buildPersonalizedImagePrompt(scanData, inputs),
    scenePrompts: storyBlueprint.map((beat, i) => ({
      beat: i + 1,
      name: beat,
      prompt: `Scene ${i + 1}: ${beat} — ${tokens.full_name || inputs.targetName} at ${tokens.company || 'their workspace'}`
    })),
    voiceoverDirection: `Personalized voiceover for ${tokens.full_name || inputs.targetName}. Tone: ${inputs.tone || 'professional'}. Duration: ${duration}s.`,
    negativePrompt: 'blurry, low quality, generic stock footage, text overlays, watermark'
  };
}

function extractTokensFromScan(scanData) {
  const tokens = { first_name: '', last_name: '', full_name: '', company: '', bio: '' };
  if (scanData?.platforms) {
    const gh = scanData.platforms.find(p => p.platform === 'github');
    if (gh) {
      tokens.company = gh.company || '';
      tokens.bio = gh.bio || '';
    }
  }
  return tokens;
}

export default {
  generatePromptPack,
  enhanceFieldValue,
  buildPersonalizedImagePrompt,
  buildPersonalizedVideoPromptPack,
  CAMERA_TERMS,
  VISUAL_STYLE_BUCKETS,
  NICHE_ENRICHMENT,
  STORY_STRUCTURES
};
