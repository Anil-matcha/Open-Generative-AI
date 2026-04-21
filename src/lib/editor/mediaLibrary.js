/**
 * Media Library Module
 * Handles media asset management, upload, and library interactions
 * Enhanced with CineGen Elements system for consistent character/location/prop references
 */

// CineGen Elements System - Professional asset references for consistent video production
const CINEGEN_ELEMENTS = {
  characters: [
    {
      id: 'character-male-business',
      name: 'Businessman',
      category: 'Character',
      type: 'reference',
      references: {
        front: '/elements/characters/businessman-front.jpg',
        profile: '/elements/characters/businessman-profile.jpg',
        back: '/elements/characters/businessman-back.jpg',
        detail: '/elements/characters/businessman-detail.jpg'
      },
      description: 'Professional businessman reference',
      icon: '👔'
    },
    {
      id: 'character-female-professional',
      name: 'Professional Woman',
      category: 'Character',
      type: 'reference',
      references: {
        front: '/elements/characters/professional-front.jpg',
        profile: '/elements/characters/professional-profile.jpg',
        back: '/elements/characters/professional-back.jpg',
        detail: '/elements/characters/professional-detail.jpg'
      },
      description: 'Professional woman reference',
      icon: '💼'
    },
    {
      id: 'character-teen-boy',
      name: 'Teen Boy',
      category: 'Character',
      type: 'reference',
      references: {
        front: '/elements/characters/teen-boy-front.jpg',
        profile: '/elements/characters/teen-boy-profile.jpg',
        back: '/elements/characters/teen-boy-back.jpg',
        detail: '/elements/characters/teen-boy-detail.jpg'
      },
      description: 'Teenage boy reference',
      icon: '👦'
    },
    {
      id: 'character-teen-girl',
      name: 'Teen Girl',
      category: 'Character',
      type: 'reference',
      references: {
        front: '/elements/characters/teen-girl-front.jpg',
        profile: '/elements/characters/teen-girl-profile.jpg',
        back: '/elements/characters/teen-girl-back.jpg',
        detail: '/elements/characters/teen-girl-detail.jpg'
      },
      description: 'Teenage girl reference',
      icon: '👧'
    }
  ],
  locations: [
    {
      id: 'location-office-modern',
      name: 'Modern Office',
      category: 'Location',
      type: 'reference',
      references: {
        overview: '/elements/locations/office-modern-overview.jpg',
        detail: '/elements/locations/office-modern-detail.jpg',
        entrance: '/elements/locations/office-modern-entrance.jpg'
      },
      description: 'Contemporary office environment',
      icon: '🏢'
    },
    {
      id: 'location-home-livingroom',
      name: 'Living Room',
      category: 'Location',
      type: 'reference',
      references: {
        overview: '/elements/locations/livingroom-overview.jpg',
        detail: '/elements/locations/livingroom-detail.jpg',
        window: '/elements/locations/livingroom-window.jpg'
      },
      description: 'Cozy living room setting',
      icon: '🏠'
    },
    {
      id: 'location-cafe-outdoor',
      name: 'Outdoor Cafe',
      category: 'Location',
      type: 'reference',
      references: {
        overview: '/elements/locations/cafe-outdoor-overview.jpg',
        detail: '/elements/locations/cafe-outdoor-detail.jpg',
        entrance: '/elements/locations/cafe-outdoor-entrance.jpg'
      },
      description: 'Outdoor cafe environment',
      icon: '☕'
    },
    {
      id: 'location-park-urban',
      name: 'Urban Park',
      category: 'Location',
      type: 'reference',
      references: {
        overview: '/elements/locations/park-urban-overview.jpg',
        detail: '/elements/locations/park-urban-detail.jpg',
        pathway: '/elements/locations/park-urban-pathway.jpg'
      },
      description: 'City park setting',
      icon: '🌳'
    }
  ],
  props: [
    {
      id: 'prop-laptop-macbook',
      name: 'MacBook Pro',
      category: 'Prop',
      type: 'reference',
      references: {
        closed: '/elements/props/macbook-closed.jpg',
        open: '/elements/props/macbook-open.jpg',
        screen: '/elements/props/macbook-screen.jpg'
      },
      description: 'Professional laptop reference',
      icon: '💻'
    },
    {
      id: 'prop-coffee-mug',
      name: 'Coffee Mug',
      category: 'Prop',
      type: 'reference',
      references: {
        side: '/elements/props/coffee-mug-side.jpg',
        top: '/elements/props/coffee-mug-top.jpg',
        steam: '/elements/props/coffee-mug-steam.jpg'
      },
      description: 'Coffee mug with steam',
      icon: '☕'
    },
    {
      id: 'prop-smartphone-iphone',
      name: 'iPhone',
      category: 'Prop',
      type: 'reference',
      references: {
        front: '/elements/props/iphone-front.jpg',
        back: '/elements/props/iphone-back.jpg',
        screen: '/elements/props/iphone-screen.jpg'
      },
      description: 'Modern smartphone reference',
      icon: '📱'
    }
  ],
  vehicles: [
    {
      id: 'vehicle-sedan-business',
      name: 'Business Sedan',
      category: 'Vehicle',
      type: 'reference',
      references: {
        front: '/elements/vehicles/sedan-front.jpg',
        side: '/elements/vehicles/sedan-side.jpg',
        rear: '/elements/vehicles/sedan-rear.jpg',
        interior: '/elements/vehicles/sedan-interior.jpg'
      },
      description: 'Professional business sedan',
      icon: '🚗'
    },
    {
      id: 'vehicle-suv-family',
      name: 'Family SUV',
      category: 'Vehicle',
      type: 'reference',
      references: {
        front: '/elements/vehicles/suv-front.jpg',
        side: '/elements/vehicles/suv-side.jpg',
        rear: '/elements/vehicles/suv-rear.jpg',
        interior: '/elements/vehicles/suv-interior.jpg'
      },
      description: 'Family SUV vehicle',
      icon: '🚙'
    }
  ]
};

// CineGen Elements Manager
class CineGenElementsManager {
  constructor() {
    this.elements = { ...CINEGEN_ELEMENTS };
    this.selectedCategory = 'characters';
    this.selectedElement = null;
    this.aiModels = this.initializeAIModels();
    this.generationHistory = [];
    this.templates = this.initializeTemplates();
  }

  initializeAIModels() {
    return {
      image: [
        { id: 'flux-schnell', name: 'FLUX Schnell', category: 'image', capabilities: ['fast', 'high-quality'], tooltip: 'Ultra-fast image generation with excellent quality for rapid iteration' },
        { id: 'sdxl-turbo', name: 'SDXL Turbo', category: 'image', capabilities: ['versatile', 'fast'], tooltip: 'Versatile image generation model optimized for speed and creativity' },
        { id: 'kling-v3', name: 'Kling v3.0', category: 'image', capabilities: ['photorealistic', 'detailed'], tooltip: 'Photorealistic image generation with exceptional detail and lighting' }
      ],
      video: [
        { id: 'ltx-2-pro', name: 'LTX 2 Pro', category: 'video', capabilities: ['high-quality', 'consistent'], tooltip: 'Professional video generation with exceptional consistency and quality' },
        { id: 'sora-2', name: 'Sora 2', category: 'video', capabilities: ['creative', 'dynamic'], tooltip: 'Creative video generation with dynamic camera movements and effects' },
        { id: 'runway-gen-3', name: 'Runway Gen-3', category: 'video', capabilities: ['motion', 'effects'], tooltip: 'Advanced motion graphics and visual effects generation' }
      ],
      audio: [
        { id: 'elevenlabs', name: 'ElevenLabs', category: 'audio', capabilities: ['voice-cloning', 'natural'], tooltip: 'Natural voice cloning and synthesis with emotional expression' },
        { id: 'suno-v4', name: 'Suno v4', category: 'audio', capabilities: ['music', 'lyrics'], tooltip: 'AI music generation with lyrics and multiple genres' }
      ]
    };
  }

  initializeTemplates() {
    return {
      character: [
        { id: 'hero-male', name: 'Epic Hero', prompt: 'Powerful male hero standing confidently', category: 'character', tooltip: 'Generate epic hero characters for action/adventure content' },
        { id: 'villain-dark', name: 'Dark Villain', prompt: 'Mysterious villain with intense gaze', category: 'character', tooltip: 'Create compelling villain characters with dark, mysterious presence' },
        { id: 'mentor-wise', name: 'Wise Mentor', prompt: 'Elderly wise mentor figure', category: 'character', tooltip: 'Generate wise mentor characters for guidance and storytelling' }
      ],
      location: [
        { id: 'castle-fantasy', name: 'Fantasy Castle', prompt: 'Magical castle on mountain peak', category: 'location', tooltip: 'Create magical fantasy castle environments' },
        { id: 'office-modern', name: 'Modern Office', prompt: 'Contemporary office space with glass walls', category: 'location', tooltip: 'Generate modern office environments for professional content' },
        { id: 'forest-mystical', name: 'Mystical Forest', prompt: 'Ancient forest with magical atmosphere', category: 'location', tooltip: 'Create enchanting forest settings with magical elements' }
      ]
    };
  }

  getCategories() {
    return Object.keys(this.elements);
  }

  getElementsByCategory(category) {
    return this.elements[category] || [];
  }

  getElementById(id) {
    for (const category of Object.values(this.elements)) {
      const element = category.find(el => el.id === id);
      if (element) return element;
    }
    return null;
  }

  getAIModelsByCategory(category) {
    return this.aiModels[category] || [];
  }

  getTemplatesByCategory(category) {
    return this.templates[category] || [];
  }

  getAIModelById(id) {
    for (const category of Object.values(this.aiModels)) {
      const model = category.find(model => model.id === id);
      if (model) return model;
    }
    return null;
  }

  getTemplateById(id) {
    for (const category of Object.values(this.templates)) {
      const template = category.find(template => template.id === id);
      if (template) return template;
    }
    return null;
  }

  // Generate media items for timeline integration
  generateMediaItems() {
    const mediaItems = [];

    // Add CineGen AI Tools section
    mediaItems.push({
      id: 'cinegen-ai-tools',
      label: 'CineGen AI Tools',
      desc: '50+ AI models for generation and enhancement',
      icon: '🤖',
      type: 'category',
      category: 'ai-tools',
      isHeader: true
    });

    // Add AI model categories
    Object.entries(this.aiModels).forEach(([category, models]) => {
      mediaItems.push({
        id: `ai-category-${category}`,
        label: `${category.charAt(0).toUpperCase() + category.slice(1)} AI`,
        desc: `${models.length} AI models available`,
        icon: this.getAICategoryIcon(category),
        type: 'ai-category',
        category: category,
        isHeader: true
      });

      // Add individual AI models
      models.forEach(model => {
        mediaItems.push({
          id: model.id,
          label: model.name,
          desc: model.capabilities.join(', '),
          icon: this.getAIModelIcon(model.id),
          type: 'ai-model',
          modelData: model,
          category: category,
          tooltip: model.tooltip
        });
      });
    });

    // Add Elements section
    Object.entries(this.elements).forEach(([category, items]) => {
      mediaItems.push({
        id: `category-${category}`,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        desc: `${items.length} reference items`,
        icon: this.getCategoryIcon(category),
        type: 'category',
        category: category,
        isHeader: true
      });

      // Add individual elements
      items.forEach(element => {
        mediaItems.push({
          id: element.id,
          label: element.name,
          desc: element.description,
          icon: element.icon,
          type: 'element',
          elementData: element,
          category: category
        });
      });
    });

    // Add Templates section
    Object.entries(this.templates).forEach(([category, templates]) => {
      mediaItems.push({
        id: `templates-${category}`,
        label: `${category.charAt(0).toUpperCase() + category.slice(1)} Templates`,
        desc: `${templates.length} pre-built prompts`,
        icon: '📋',
        type: 'category',
        category: `templates-${category}`,
        isHeader: true
      });

      // Add individual templates
      templates.forEach(template => {
        mediaItems.push({
          id: template.id,
          label: template.name,
          desc: template.prompt.substring(0, 40) + '...',
          icon: '📝',
          type: 'template',
          templateData: template,
          category: `templates-${category}`,
          tooltip: template.tooltip
        });
      });
    });

    return mediaItems;
  }

  getCategoryIcon(category) {
    const icons = {
      characters: '👥',
      locations: '📍',
      props: '🎭',
      vehicles: '🚗'
    };
    return icons[category] || '📦';
  }

  getAICategoryIcon(category) {
    const icons = {
      image: '🖼️',
      video: '🎬',
      audio: '🎵'
    };
    return icons[category] || '🤖';
  }

  getAIModelIcon(modelId) {
    const icons = {
      'flux-schnell': '⚡',
      'sdxl-turbo': '🚀',
      'kling-v3': '🎨',
      'ltx-2-pro': '🎬',
      'sora-2': '🌟',
      'runway-gen-3': '🎭',
      'elevenlabs': '🗣️',
      'suno-v4': '🎵'
    };
    return icons[modelId] || '🤖';
  }

  // Integration with timeline drag & drop
  createTimelineElement(elementData, trackType = 'video') {
    const baseElement = {
      id: Date.now(),
      type: 'cinegen-element',
      elementData: elementData,
      trackType: trackType,
      name: `${elementData.category}: ${elementData.name}`,
      duration: 5, // Default 5 seconds
      references: elementData.references
    };

    // Enhance based on element type
    if (elementData.type === 'ai-model') {
      return {
        ...baseElement,
        type: 'cinegen-ai-model',
        capabilities: elementData.capabilities,
        generateFunction: this.createAIGenerationFunction(elementData),
        tooltip: elementData.tooltip
      };
    }

    if (elementData.type === 'template') {
      return {
        ...baseElement,
        type: 'cinegen-template',
        prompt: elementData.prompt,
        category: elementData.category,
        tooltip: elementData.tooltip
      };
    }

    return baseElement;
  }

  createAIGenerationFunction(modelData) {
    return async (prompt, options = {}) => {
      // Simulate AI generation call with CineGen integration
      const result = {
        url: `https://cinegen-ai-generated.example.com/${modelData.id}/${Date.now()}.${modelData.category === 'video' ? 'mp4' : modelData.category === 'image' ? 'jpg' : 'mp3'}`,
        model: modelData.name,
        prompt: prompt,
        capabilities: modelData.capabilities,
        generatedAt: Date.now(),
        category: modelData.category
      };

      // Add to generation history
      this.generationHistory.push(result);

      return result;
    };
  }

  // Get generation history
  getGenerationHistory() {
    return this.generationHistory;
  }

  // Clear generation history
  clearGenerationHistory() {
    this.generationHistory = [];
  }
}

// Global CineGen Elements instance
const cineGenElements = new CineGenElementsManager();

export function renderMediaGrid(mediaItems, container, onMediaSelect, showToast, state) {
  if (!container) return;

  container.innerHTML = '';

  // Add CineGen Elements section header
  const cinegenHeader = document.createElement('div');
  cinegenHeader.className = 'media-section-header';
  cinegenHeader.innerHTML = `
    <h3 class="section-title">🎭 CineGen Elements</h3>
    <p class="section-desc">Professional character, location, prop, and vehicle references for consistent video production</p>
  `;
  container.appendChild(cinegenHeader);

  // Add CineGen Elements
  const cinegenItems = cineGenElements.generateMediaItems();
  cinegenItems.forEach((media, index) => {
    const item = document.createElement('button');
    item.className = `media-item drag-ready ${media.isHeader ? 'media-category-header' : ''}`;
    item.dataset.mediaIndex = index;
    item.dataset.cinegenCategory = media.category;
    item.dataset.elementType = media.type;

    if (media.isHeader) {
      item.innerHTML = `
        <span class="media-icon category-icon">${media.icon}</span>
        <span class="media-copy">
          <div class="media-label category-label">${media.label}</div>
          <div class="media-desc category-desc">${media.desc}</div>
        </span>
      `;
      item.classList.add('category-header');
    } else {
      item.innerHTML = `
        <span class="media-icon">${media.icon}</span>
        <span class="media-copy">
          <div class="media-label">${media.label}</div>
          <div class="media-desc">${media.desc}</div>
        </span>
      `;
    }

    // Enhanced title for tooltips
    item.title = media.isHeader
      ? `${media.label} - ${media.desc}`
      : `${media.label}\n${media.desc}\nClick to add reference or drag to timeline`;

    item.addEventListener('click', () => {
      if (media.isHeader) {
        // Toggle category visibility
        toggleCategoryVisibility(container, media.category);
      } else {
        onMediaSelect(media, index, showToast);
      }
    });

    // Add mouse enter/leave for enhanced tooltips
    item.addEventListener('mouseenter', () => {
      item.classList.add('media-item-hover');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('media-item-hover');
    });

    container.appendChild(item);
  });

  // Add separator
  const separator = document.createElement('div');
  separator.className = 'media-separator';
  separator.innerHTML = '<hr class="separator-line">';
  container.appendChild(separator);

  // Add existing media items
  const existingItemsHeader = document.createElement('div');
  existingItemsHeader.className = 'media-section-header';
  existingItemsHeader.innerHTML = `
    <h3 class="section-title">📚 Media Library</h3>
    <p class="section-desc">Your uploaded and generated media assets</p>
  `;
  container.appendChild(existingItemsHeader);

  mediaItems.forEach((media, index) => {
    const item = document.createElement('button');
    item.className = 'media-item drag-ready';
    item.dataset.mediaIndex = index + cinegenItems.length;
    item.innerHTML = `
      <span class="media-icon">${media.icon}</span>
      <span class="media-copy">
        <div class="media-label">${media.label}</div>
        <div class="media-desc">${media.desc}</div>
      </span>
    `;

    // Enhanced title for tooltips
    item.title = `${media.label}\n${media.desc}\nClick to add or drag to timeline`;

    item.addEventListener('click', () => onMediaSelect(media, index, showToast));

    // Add mouse enter/leave for enhanced tooltips
    item.addEventListener('mouseenter', () => {
      item.classList.add('media-item-hover');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('media-item-hover');
    });

    container.appendChild(item);
  });

  // Initialize drag and drop for media items
  if (state) {
    import('./dragDrop.js').then(({ initializeMediaLibraryDragDrop }) => {
      initializeMediaLibraryDragDrop(state, container);
    });
  }
}

function toggleCategoryVisibility(container, category) {
  const categoryItems = container.querySelectorAll(`[data-cinegen-category="${category}"]:not(.category-header)`);
  const isVisible = !categoryItems[0]?.classList.contains('hidden');

  categoryItems.forEach(item => {
    if (isVisible) {
      item.classList.add('hidden');
    } else {
      item.classList.remove('hidden');
    }
  });
}

export function addMediaToTimeline(media, index, state, showToast) {
  // Handle CineGen Elements differently
  if (media.type === 'element' && media.elementData) {
    return addCineGenElementToTimeline(media, state, showToast);
  }

  const targetTrack = getTargetTrackForMedia(media, state.tracks);
  const newId = Date.now() + index;
  const startTime = Math.min(state.timelineSeconds - 10, 5 + targetTrack.items.length * 8);
  const duration = getDurationForMedia(media);

  const newItem = {
    id: newId,
    assetId: 'asset-' + (index + 1),
    type: getTypeForMedia(media),
    start: startTime,
    end: startTime + duration,
    sourceStart: 0,
    sourceEnd: duration,
    lane: 0,
    trimIn: 0,
    trimOut: duration,
    volume: 1,
    playbackRate: 1,
    effects: [],
    name: `${media.label} ${targetTrack.items.length + 1}`
  };

  targetTrack.items.push(newItem);
  state.selectedClipId = newId;

  return { newItem, targetTrack };
}

function addCineGenElementToTimeline(media, state, showToast) {
  const elementData = media.elementData;
  const targetTrack = getTargetTrackForCineGenElement(elementData, state.tracks);

  const newId = Date.now();
  const startTime = Math.min(state.timelineSeconds - 5, 2 + targetTrack.items.length * 6);
  const duration = 3; // Reference elements are typically shorter

  // Create timeline item with CineGen element data
  const newItem = {
    id: newId,
    assetId: elementData.id,
    type: 'cinegen-element',
    elementCategory: elementData.category,
    elementData: elementData,
    references: elementData.references,
    start: startTime,
    end: startTime + duration,
    sourceStart: 0,
    sourceEnd: duration,
    lane: 0,
    trimIn: 0,
    trimOut: duration,
    volume: 1,
    playbackRate: 1,
    effects: [],
    name: `${elementData.category}: ${elementData.name}`,
    isReference: true,
    description: elementData.description
  };

  targetTrack.items.push(newItem);
  state.selectedClipId = newId;

  // Show success toast with element details
  if (showToast) {
    showToast(`Added ${elementData.name} reference to timeline`, 'success');
  }

  return { newItem, targetTrack };
}

function getTargetTrackForMedia(media, tracks) {
  if (media.label === 'Audio Track') {
    return tracks.find(t => t.name === 'Audio') || tracks[1] || tracks[0];
  }
  if (media.label === 'Image Frame') {
    return tracks.find(t => t.name === 'Text') || tracks[0];
  }
  if (media.label === 'B-Roll Asset') {
    return tracks.find(t => t.name === 'B-Roll') || tracks[0];
  }
  return tracks.find(t => t.name === 'Video') || tracks[0];
}

function getTargetTrackForCineGenElement(elementData, tracks) {
  // Route CineGen elements to appropriate tracks based on category
  switch (elementData.category) {
    case 'characters':
    case 'locations':
      return tracks.find(t => t.name === 'Video') || tracks[0];
    case 'props':
      return tracks.find(t => t.name === 'B-Roll') || tracks[0];
    case 'vehicles':
      return tracks.find(t => t.name === 'Video') || tracks[0];
    default:
      return tracks[0];
  }
}

function getTypeForMedia(media) {
  if (media.label === 'Audio Track') return 'audio';
  if (media.label === 'Image Frame') return 'text';
  if (media.label === 'B-Roll Asset') return 'broll';
  if (media.type === 'element') return 'cinegen-element';
  return 'video';
}

function getDurationForMedia(media) {
  if (media.label === 'Audio Track') return 20;
  if (media.label === 'Image Frame') return 5;
  if (media.label === 'B-Roll Asset') return 8;
  if (media.type === 'element') return 3; // CineGen elements are reference items
  return 10;
}

// CineGen Elements CSS styles
const cinegenStyles = `
  .media-section-header {
    margin: 16px 0 8px 0;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
  }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-desc {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    margin: 0;
    line-height: 1.4;
  }

  .media-category-header {
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.2);
    margin: 4px 0;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .media-category-header:hover {
    background: rgba(59,130,246,0.15);
    border-color: rgba(59,130,246,0.3);
  }

  .category-icon {
    color: #3b82f6;
    font-size: 16px;
  }

  .category-label {
    font-weight: 600;
    color: rgba(255,255,255,0.9);
  }

  .category-desc {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
  }

  .media-item[data-element-type="element"] {
    border-left: 3px solid rgba(139,92,246,0.4);
    background: rgba(139,92,246,0.05);
  }

  .media-item[data-element-type="element"]:hover {
    border-left-color: rgba(139,92,246,0.6);
    background: rgba(139,92,246,0.1);
  }

  .media-separator {
    margin: 20px 0;
    text-align: center;
  }

  .separator-line {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin: 0;
  }

  .media-item.hidden {
    display: none !important;
  }

  /* AI Tools and Templates Styles */
  .media-item[data-element-type="ai-model"] {
    border-left: 3px solid rgba(34,197,94,0.4);
    background: rgba(34,197,94,0.05);
  }

  .media-item[data-element-type="ai-model"]:hover {
    border-left-color: rgba(34,197,94,0.6);
    background: rgba(34,197,94,0.1);
  }

  .media-item[data-element-type="template"] {
    border-left: 3px solid rgba(245,158,11,0.4);
    background: rgba(245,158,11,0.05);
  }

  .media-item[data-element-type="template"]:hover {
    border-left-color: rgba(245,158,11,0.6);
    background: rgba(245,158,11,0.1);
  }

  .media-category-header[data-cinegen-category="ai-tools"] {
    background: rgba(34,197,94,0.1);
    border: 1px solid rgba(34,197,94,0.2);
  }

  .media-category-header[data-cinegen-category="ai-tools"]:hover {
    background: rgba(34,197,94,0.15);
    border-color: rgba(34,197,94,0.3);
  }

  .media-category-header[data-cinegen-category*="templates"] {
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.2);
  }

  .media-category-header[data-cinegen-category*="templates"]:hover {
    background: rgba(245,158,11,0.15);
    border-color: rgba(245,158,11,0.3);
  }

  .ai-model-icon {
    color: #22c55e;
    font-size: 16px;
  }

  .template-icon {
    color: #f59e0b;
    font-size: 16px;
  }
`;

// Inject CineGen styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = cinegenStyles;
  document.head.appendChild(styleSheet);
}

// Export CineGen Elements manager for external use
export { cineGenElements, CineGenElementsManager };

export function addGeneratedAssetToLibrary(asset, state) {
  const newAsset = {
    id: `asset-${Date.now()}`,
    type: asset.type,
    name: asset.name || `${asset.type.charAt(0).toUpperCase() + asset.type.slice(1)} Asset`,
    url: asset.url,
    duration: asset.duration || 0,
    ...(asset.type === 'audio' && asset.waveformData && { waveformData: asset.waveformData })
  };

  state.assets.push(newAsset);
  return newAsset;
}

export function handleUpload(showToast) {
  // Placeholder for upload functionality
  showToast('Upload flow placeholder triggered');
}

export function searchMedia(query, mediaItems) {
  if (!query.trim()) return mediaItems;

  const searchTerm = query.toLowerCase();
  return mediaItems.filter(media =>
    media.label.toLowerCase().includes(searchTerm) ||
    media.desc.toLowerCase().includes(searchTerm)
  );
}

export function filterMediaByType(type, mediaItems) {
  if (!type || type === 'all') return mediaItems;

  return mediaItems.filter(media => {
    if (type === 'video') return ['Video Clip', 'Generated Video', 'Webcam Recording', 'B-Roll Asset'].includes(media.label);
    if (type === 'audio') return ['Audio Track', 'Generated Speech'].includes(media.label);
    if (type === 'image') return ['Generated Image', 'Edited Image'].includes(media.label);
    if (type === 'text') return media.label === 'Image Frame';
    return false;
  });
}