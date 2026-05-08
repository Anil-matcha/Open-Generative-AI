export const EFFECT_CATEGORIES = {
  CAMERA_MOVES: 'camera_moves',
  VISUAL_EFFECTS: 'visual_effects',
  AI_EFFECTS: 'ai_effects'
};

export const EFFECTS = [
  // Cinematic Camera Moves - Orbit Shots
  { id: '360-orbit', name: '360 Orbit', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Full 360 degree orbit around subject' },
  { id: 'arc-shot', name: 'Arc Shot', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Camera arcs around the subject' },
  { id: 'hero-run', name: 'Hero Run', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Dynamic hero shot with running camera' },

  // Cinematic Camera Moves - Zoom Effects
  { id: 'crash-zoom-in', name: 'Crash Zoom In', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Sudden dramatic zoom into subject' },
  { id: 'crash-zoom-out', name: 'Crash Zoom Out', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Sudden dramatic zoom out from subject' },
  { id: 'dolly-in', name: 'Dolly In', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Smooth push into subject' },
  { id: 'dolly-out', name: 'Dolly Out', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Smooth pull away from subject' },

  // Cinematic Camera Moves - Crane Movements
  { id: 'crane-up', name: 'Crane Up', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Rising crane shot' },
  { id: 'crane-down', name: 'Crane Down', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Descending crane shot' },
  { id: 'overhead-crane', name: 'Overhead Crane', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Birdseye overhead crane movement' },

  // Cinematic Camera Moves - Dynamic Shots
  { id: 'matrix-shot', name: 'Matrix Shot', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Bullet time effect' },
  { id: 'car-chase', name: 'Car Chase', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Dynamic car chase camera movement' },
  { id: 'vertigo-effect', name: 'Vertigo Effect', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Dolly zoom effect' },
  { id: 'spinning-orbit', name: 'Spinning Orbit', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Spin while orbiting subject' },
  { id: 'tracking-shot', name: 'Tracking Shot', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Side tracking movement' },
  { id: 'pedestal-shot', name: 'Pedestal Shot', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Vertical pedestal movement' },
  { id: 'handheld', name: 'Handheld', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Shaky handheld camera effect' },
  { id: 'steady-cam', name: 'Steady Cam', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Smooth steady cam movement' },
  { id: 'drone-shot', name: 'Drone Shot', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: 'Aerial drone movement' },
  { id: 'parallax', name: 'Parallax Effect', category: EFFECT_CATEGORIES.CAMERA_MOVES, description: '3D parallax depth effect' },

  // Visual Effects - Destruction
  { id: 'disintegration', name: 'Disintegration', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Subject disintegrates into particles' },
  { id: 'decay-time-lapse', name: 'Decay Time-Lapse', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Time-lapse decay effect' },
  { id: 'building-explosion', name: 'Building Explosion', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Building demolition explosion' },
  { id: 'car-explosion', name: 'Car Explosion', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Vehicle explosion effect' },
  { id: 'huge-explosion', name: 'Huge Explosion', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Massive explosion' },
  { id: 'debris-scatter', name: 'Debris Scatter', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Debris flying outward' },

  // Visual Effects - Elements
  { id: 'fire', name: 'Fire', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Fiery flames engulfing subject' },
  { id: 'electricity', name: 'Electricity', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Lightning and electric effects' },
  { id: 'tornado', name: 'Tornado', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Tornado vortex effect' },
  { id: 'tsunami', name: 'Tsunami', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Massive wave effect' },
  { id: 'lightning', name: 'Lightning Strike', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Dramatic lightning bolts' },
  { id: 'water-flood', name: 'Water Flood', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Rushing water effect' },
  { id: 'magma', name: 'Magma Flow', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Molten lava pouring' },
  { id: 'ice-crystals', name: 'Ice Crystals', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Freezing ice effect' },
  { id: 'wind-force', name: 'Wind Force', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Powerful wind effect' },

  // Visual Effects - Supernatural
  { id: 'levitate', name: 'Levitate', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Subject floating upward' },
  { id: 'flying', name: 'Flying', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Subject flying through air' },
  { id: 'invisibility', name: 'Invisibility', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Subject becoming invisible' },
  { id: 'tentacles', name: 'Tentacles', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Tentacle emergence effect' },
  { id: 'ghost-form', name: 'Ghost Form', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Ethereal ghost transformation' },
  { id: 'telekinesis', name: 'Telekinesis', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Objects moving by thought' },
  { id: 'portal', name: 'Portal Opening', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Dimensional portal effect' },
  { id: 'soul-extraction', name: 'Soul Extraction', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Soul being pulled from body' },

  // Visual Effects - Transformations
  { id: 'robotic-face', name: 'Robotic Face Reveal', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Face transforming to robot' },
  { id: 'turning-metal', name: 'Turning Metal', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Body turning into metal' },
  { id: 'crystalization', name: 'Crystalization', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Body turning to crystal' },
  { id: 'cyberpunk', name: 'Cyberpunk', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Cyberpunk transformation' },
  { id: 'aging', name: 'Aging Effect', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Rapid aging effect' },
  { id: 'morphing', name: 'Morphing', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Shape-shifting morph effect' },
  { id: 'glitch', name: 'Glitch Effect', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Digital glitch distortion' },
  { id: 'time-freeze', name: 'Time Freeze', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Time stopping effect' },
  { id: 'time-reverse', name: 'Time Reverse', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Reverse time effect' },
  { id: 'slow-motion', name: 'Slow Motion', category: EFFECT_CATEGORIES.VISUAL_EFFECTS, description: 'Cinematic slow motion' },

  // AI Effects
  { id: 'kiss-me-ai', name: 'Kiss Me AI', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Romantic kiss effect' },
  { id: 'venom', name: 'Venom', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Venom symbiote transformation' },
  { id: 'hulk', name: 'Hulk', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Hulk transformation' },
  { id: 'muscle-surge', name: 'Muscle Surge', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Muscles bulging effect' },
  { id: 'tiger-touch', name: 'Tiger Touch', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Tiger transformation' },
  { id: 'dragon-fire', name: 'Dragon Fire', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Dragon breath effect' },
   { id: 'zombie', name: 'Zombie', category: EFFECT_CATEGORIES.AI_EFFECTS, description: 'Zombie transformation' }
];

// Helper functions for effect management
export function getEffectsByCategory(category) {
  return EFFECTS.filter(effect => effect.category === category);
}

export function getAllCategories() {
  return Object.values(EFFECT_CATEGORIES);
}

export function getCategoryName(categoryId) {
  const names = {
    [EFFECT_CATEGORIES.CAMERA_MOVES]: 'Camera Moves',
    [EFFECT_CATEGORIES.VISUAL_EFFECTS]: 'Visual Effects',
    [EFFECT_CATEGORIES.AI_EFFECTS]: 'AI Effects'
  };
  return names[categoryId] || categoryId;
}