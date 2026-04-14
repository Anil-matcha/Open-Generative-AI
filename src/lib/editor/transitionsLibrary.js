/**
 * Comprehensive Transitions System for Timeline Editor
 * Provides a wide range of transition effects with visual preview and advanced controls
 */

export class TransitionsLibrary {
  constructor() {
    this.transitions = this.initializeTransitions();
    this.presets = this.initializePresets();
  }

  initializeTransitions() {
    return {
      // Dissolve/Fade transitions (existing, enhanced)
      dissolve: {
        name: 'Dissolve',
        category: 'fade',
        icon: '🌫️',
        description: 'Crossfade between clips with customizable softness',
        params: {
          softness: { value: 0.5, min: 0, max: 1, step: 0.1 },
          direction: { value: 'normal', options: ['normal', 'reverse'] }
        },
        render: this.renderDissolve.bind(this)
      },

      // Wipe transitions
      wipeLeft: {
        name: 'Wipe Left',
        category: 'wipe',
        icon: '⬅️',
        description: 'Horizontal wipe from right to left',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          direction: { value: 'left', options: ['left', 'right', 'up', 'down'] }
        },
        render: this.renderWipe.bind(this)
      },
      wipeRight: {
        name: 'Wipe Right',
        category: 'wipe',
        icon: '➡️',
        description: 'Horizontal wipe from left to right',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderWipe.bind(this)
      },
      wipeUp: {
        name: 'Wipe Up',
        category: 'wipe',
        icon: '⬆️',
        description: 'Vertical wipe from bottom to top',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderWipe.bind(this)
      },
      wipeDown: {
        name: 'Wipe Down',
        category: 'wipe',
        icon: '⬇️',
        description: 'Vertical wipe from top to bottom',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderWipe.bind(this)
      },
      wipeDiagonal: {
        name: 'Wipe Diagonal',
        category: 'wipe',
        icon: '↗️',
        description: 'Diagonal wipe across the frame',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          angle: { value: 45, min: 0, max: 90, step: 15 }
        },
        render: this.renderWipe.bind(this)
      },

      // Push transitions
      pushLeft: {
        name: 'Push Left',
        category: 'push',
        icon: '⬅️',
        description: 'Push outgoing clip left while bringing in new clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderPush.bind(this)
      },
      pushRight: {
        name: 'Push Right',
        category: 'push',
        icon: '➡️',
        description: 'Push outgoing clip right while bringing in new clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderPush.bind(this)
      },
      pushUp: {
        name: 'Push Up',
        category: 'push',
        icon: '⬆️',
        description: 'Push outgoing clip up while bringing in new clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderPush.bind(this)
      },
      pushDown: {
        name: 'Push Down',
        category: 'push',
        icon: '⬇️',
        description: 'Push outgoing clip down while bringing in new clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderPush.bind(this)
      },

      // Zoom transitions
      zoomIn: {
        name: 'Zoom In',
        category: 'zoom',
        icon: '🔍+',
        description: 'Scale incoming clip from small to full size',
        params: {
          scale: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
          softness: { value: 0, min: 0, max: 1, step: 0.1 }
        },
        render: this.renderZoom.bind(this)
      },
      zoomOut: {
        name: 'Zoom Out',
        category: 'zoom',
        icon: '🔍-',
        description: 'Scale outgoing clip from full size to small',
        params: {
          scale: { value: 1.5, min: 1, max: 3, step: 0.1 },
          softness: { value: 0, min: 0, max: 1, step: 0.1 }
        },
        render: this.renderZoom.bind(this)
      },
      zoomPan: {
        name: 'Zoom & Pan',
        category: 'zoom',
        icon: '🎬',
        description: 'Combined zoom and pan transition',
        params: {
          scale: { value: 1.2, min: 1, max: 2, step: 0.1 },
          panX: { value: 0.2, min: -1, max: 1, step: 0.1 },
          panY: { value: 0.2, min: -1, max: 1, step: 0.1 },
          softness: { value: 0, min: 0, max: 1, step: 0.1 }
        },
        render: this.renderZoomPan.bind(this)
      },

      // Iris transitions
      irisCircle: {
        name: 'Iris Circle',
        category: 'iris',
        icon: '⭕',
        description: 'Circular iris reveal transition',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          reverse: { value: false, type: 'boolean' }
        },
        render: this.renderIris.bind(this)
      },
      irisDiamond: {
        name: 'Iris Diamond',
        category: 'iris',
        icon: '💎',
        description: 'Diamond-shaped iris reveal',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          reverse: { value: false, type: 'boolean' }
        },
        render: this.renderIris.bind(this)
      },
      irisSquare: {
        name: 'Iris Square',
        category: 'iris',
        icon: '▢',
        description: 'Square iris reveal',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          reverse: { value: false, type: 'boolean' }
        },
        render: this.renderIris.bind(this)
      },

      // Shape transitions
      shapeStar: {
        name: 'Star Wipe',
        category: 'shape',
        icon: '⭐',
        description: 'Star-shaped wipe transition',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          points: { value: 5, min: 3, max: 12, step: 1 }
        },
        render: this.renderShape.bind(this)
      },
      shapeHeart: {
        name: 'Heart Wipe',
        category: 'shape',
        icon: '❤️',
        description: 'Heart-shaped wipe transition',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1 } },
        render: this.renderShape.bind(this)
      },
      shapeCustom: {
        name: 'Custom Shape',
        category: 'shape',
        icon: '🎨',
        description: 'Custom SVG path-based transition',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1 },
          svgPath: { value: '', type: 'text' }
        },
        render: this.renderCustomShape.bind(this)
      }
    };
  }

  initializePresets() {
    return {
      cinematic: [
        { name: 'Cinematic Fade', transition: 'dissolve', params: { softness: 0.8 } },
        { name: 'Smooth Wipe', transition: 'wipeLeft', params: { softness: 0.3 } },
        { name: 'Dramatic Zoom', transition: 'zoomIn', params: { scale: 0.3, softness: 0.2 } }
      ],
      modern: [
        { name: 'Quick Push', transition: 'pushRight', params: { softness: 0 } },
        { name: 'Modern Iris', transition: 'irisCircle', params: { softness: 0.1 } },
        { name: 'Tech Zoom', transition: 'zoomPan', params: { scale: 1.1, panX: 0.1, panY: 0.1 } }
      ],
      vintage: [
        { name: 'Film Dissolve', transition: 'dissolve', params: { softness: 0.9 } },
        { name: 'Classic Wipe', transition: 'wipeDiagonal', params: { softness: 0, angle: 45 } },
        { name: 'Old School Iris', transition: 'irisCircle', params: { softness: 0.5, reverse: true } }
      ]
    };
  }

  // Transition rendering methods
  renderDissolve(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { softness } = params;

    // Apply crossfade with softness
    ctx.globalAlpha = Math.max(0, Math.min(1, progress + softness * (1 - progress * 2)));
    return ctx;
  }

  renderWipe(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { softness, direction = 'left' } = params;

    let startX = 0, startY = 0, endX = canvas.width, endY = canvas.height;

    switch (direction) {
      case 'left':
        endX = canvas.width * (1 - progress);
        break;
      case 'right':
        startX = canvas.width * (1 - progress);
        break;
      case 'up':
        endY = canvas.height * (1 - progress);
        break;
      case 'down':
        startY = canvas.height * (1 - progress);
        break;
    }

    // Create wipe mask
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX, startY, endX - startX, endY - startY);

    if (softness > 0) {
      // Add feathered edges
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1 - softness, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'black';
    }

    ctx.fill();
    ctx.clip();
    return ctx;
  }

  renderPush(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { direction = 'left' } = params;

    let translateX = 0, translateY = 0;

    switch (direction) {
      case 'left':
        translateX = -canvas.width * progress;
        break;
      case 'right':
        translateX = canvas.width * progress;
        break;
      case 'up':
        translateY = -canvas.height * progress;
        break;
      case 'down':
        translateY = canvas.height * progress;
        break;
    }

    ctx.translate(translateX, translateY);
    return ctx;
  }

  renderZoom(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { scale = 1.5 } = params;

    const currentScale = 1 + (scale - 1) * progress;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(currentScale, currentScale);
    ctx.translate(-centerX, -centerY);

    return ctx;
  }

  renderZoomPan(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { scale = 1.2, panX = 0.2, panY = 0.2 } = params;

    const currentScale = 1 + (scale - 1) * progress;
    const currentPanX = panX * canvas.width * progress;
    const currentPanY = panY * canvas.height * progress;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX + currentPanX, centerY + currentPanY);
    ctx.scale(currentScale, currentScale);
    ctx.translate(-centerX, -centerY);

    return ctx;
  }

  renderIris(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { softness = 0, reverse = false } = params;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    let radius;
    if (reverse) {
      radius = maxRadius * (1 - progress);
    } else {
      radius = maxRadius * progress;
    }

    ctx.save();
    ctx.beginPath();

    // Create shape based on transition type
    if (this.currentTransition.name.includes('Diamond')) {
      // Diamond shape
      const size = radius * 1.414; // sqrt(2) for diamond
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX + size, centerY);
      ctx.lineTo(centerX, centerY + size);
      ctx.lineTo(centerX - size, centerY);
      ctx.closePath();
    } else if (this.currentTransition.name.includes('Square')) {
      // Square shape
      ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    } else {
      // Circle (default)
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    }

    if (softness > 0) {
      // Add soft edges
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * (1 - softness), centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'black';
    }

    ctx.fill();
    ctx.clip();
    return ctx;
  }

  renderShape(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { softness = 0, points = 5 } = params;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
    const radius = maxRadius * progress;

    ctx.save();
    ctx.beginPath();

    if (this.currentTransition.name.includes('Star')) {
      // Draw star shape
      const outerRadius = radius;
      const innerRadius = radius * 0.5;
      let angle = -Math.PI / 2;

      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        angle += Math.PI / points;
      }
      ctx.closePath();
    } else if (this.currentTransition.name.includes('Heart')) {
      // Draw heart shape
      const size = radius * 0.8;
      ctx.moveTo(centerX, centerY + size * 0.3);
      ctx.bezierCurveTo(
        centerX - size, centerY - size * 0.3,
        centerX - size * 1.5, centerY + size * 0.8,
        centerX, centerY + size * 1.5
      );
      ctx.bezierCurveTo(
        centerX + size * 1.5, centerY + size * 0.8,
        centerX + size, centerY - size * 0.3,
        centerX, centerY + size * 0.3
      );
    }

    if (softness > 0) {
      // Add soft edges
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * (1 - softness), centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = 'black';
    }

    ctx.fill();
    ctx.clip();
    return ctx;
  }

  renderCustomShape(progress, params, canvas) {
    const ctx = canvas.getContext('2d');
    const { softness = 0, svgPath = '' } = params;

    if (!svgPath) return ctx;

    ctx.save();
    ctx.beginPath();

    // Parse SVG path and apply scaling based on progress
    const scale = progress;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    // This would require a proper SVG path parser - simplified version
    // In a real implementation, you'd use a library like svg-path-parser
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.clip();

    return ctx;
  }

  getTransition(key) {
    return this.transitions[key];
  }

  getTransitionsByCategory(category) {
    return Object.entries(this.transitions)
      .filter(([_, transition]) => transition.category === category)
      .map(([key, transition]) => ({ key, ...transition }));
  }

  getAllTransitions() {
    return Object.entries(this.transitions)
      .map(([key, transition]) => ({ key, ...transition }));
  }

  getPresets(category) {
    return this.presets[category] || [];
  }

  getAllPresets() {
    return this.presets;
  }
}