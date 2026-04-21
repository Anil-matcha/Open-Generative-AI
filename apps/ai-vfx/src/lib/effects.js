// VFX Effects Library for AI-VFX app
export const vfxEffects = {
  camera: {
    title: 'Cinematic Camera Moves',
    effects: [
      { id: 'dolly-zoom', name: 'Dolly Zoom', description: 'Classic Hitchcock effect with depth shift' },
      { id: 'crane-up', name: 'Crane Up', description: 'Rising camera movement' },
      { id: 'pan-left', name: 'Pan Left', description: 'Horizontal camera pan' },
      { id: 'pan-right', name: 'Pan Right', description: 'Horizontal camera pan' },
      { id: 'tilt-up', name: 'Tilt Up', description: 'Vertical camera tilt' },
      { id: 'tilt-down', name: 'Tilt Down', description: 'Vertical camera tilt' },
      { id: 'orbit-left', name: 'Orbit Left', description: 'Circular camera movement' },
      { id: 'orbit-right', name: 'Orbit Right', description: 'Circular camera movement' },
      { id: 'truck-left', name: 'Truck Left', description: 'Lateral camera movement' },
      { id: 'truck-right', name: 'Truck Right', description: 'Lateral camera movement' },
      { id: 'pedestal-up', name: 'Pedestal Up', description: 'Vertical camera rise' },
      { id: 'pedestal-down', name: 'Pedestal Down', description: 'Vertical camera drop' },
      { id: 'zoom-in', name: 'Zoom In', description: 'Forward zoom movement' },
      { id: 'zoom-out', name: 'Zoom Out', description: 'Backward zoom movement' },
      { id: 'dutch-angle', name: 'Dutch Angle', description: 'Tilted camera angle' },
      { id: 'rack-focus', name: 'Rack Focus', description: 'Focus plane shift' }
    ]
  },
  vfx: {
    title: 'Visual Effects',
    effects: [
      { id: 'explosion', name: 'Explosion', description: 'Dramatic explosion effect' },
      { id: 'fire', name: 'Fire', description: 'Realistic fire simulation' },
      { id: 'smoke', name: 'Smoke', description: 'Dynamic smoke clouds' },
      { id: 'dust', name: 'Dust', description: 'Particle dust effect' },
      { id: 'sparks', name: 'Sparks', description: 'Electrical spark effects' },
      { id: 'lightning', name: 'Lightning', description: 'Thunderbolt effects' },
      { id: 'water', name: 'Water Splash', description: 'Liquid splash simulation' },
      { id: 'glass-shatter', name: 'Glass Shatter', description: 'Breaking glass effect' },
      { id: 'metal-debris', name: 'Metal Debris', description: 'Flying metal fragments' },
      { id: 'energy-wave', name: 'Energy Wave', description: 'Shockwave distortion' },
      { id: 'portal', name: 'Portal', description: 'Sci-fi portal effect' },
      { id: 'force-field', name: 'Force Field', description: 'Energy barrier' },
      { id: 'hologram', name: 'Hologram', description: 'Digital projection' },
      { id: 'matrix-code', name: 'Matrix Code', description: 'Falling code effect' },
      { id: 'particle-field', name: 'Particle Field', description: 'Ambient particles' },
      { id: 'chroma-shift', name: 'Chroma Shift', description: 'Color distortion' }
    ]
  },
  ai: {
    title: 'AI Effects',
    effects: [
      { id: 'venom', name: 'Venom', description: 'Symbiote transformation' },
      { id: 'hulk', name: 'Hulk', description: 'Muscle expansion effect' },
      { id: 'wolverine', name: 'Wolverine', description: 'Healing regeneration' },
      { id: 'deadpool', name: 'Deadpool', description: 'Fourth wall break' },
      { id: 'iron-man', name: 'Iron Man', description: 'Armor transformation' },
      { id: 'captain-america', name: 'Captain America', description: 'Superhero pose' },
      { id: 'thor', name: 'Thor', description: 'Godly transformation' },
      { id: 'loki', name: 'Loki', description: 'Shape-shifting illusion' },
      { id: 'black-widow', name: 'Black Widow', description: 'Stealth movement' },
      { id: 'hawkeye', name: 'Hawkeye', description: 'Precision targeting' },
      { id: 'scarlet-witch', name: 'Scarlet Witch', description: 'Reality warping' },
      { id: 'vision', name: 'Vision', description: 'Intangibility effect' },
      { id: 'ant-man', name: 'Ant-Man', description: 'Size manipulation' },
      { id: 'wasp', name: 'Wasp', description: 'Flight and shrinking' },
      { id: 'falcon', name: 'Falcon', description: 'Wing deployment' },
      { id: 'winter-soldier', name: 'Winter Soldier', description: 'Mechanical arm' }
    ]
  }
};

export const getEffectById = (effectId) => {
  for (const category of Object.values(vfxEffects)) {
    const effect = category.effects.find(e => e.id === effectId);
    if (effect) return effect;
  }
  return null;
};

export const getAllEffects = () => {
  return Object.values(vfxEffects).flatMap(category =>
    category.effects.map(effect => ({
      ...effect,
      category: category.title
    }))
  );
};