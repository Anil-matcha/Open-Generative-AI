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
        tooltip: 'Dissolve - Crossfade between clips with adjustable softness for smooth blending',
        params: {
          softness: { value: 0.5, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Adjust the feathering at the edge of the dissolve for smoother or sharper transitions' },
          direction: { value: 'normal', options: ['normal', 'reverse'], tooltip: 'Direction - Choose whether the dissolve plays forward or in reverse' }
        },
        render: this.renderDissolve.bind(this)
      },

      // Wipe transitions
      wipeLeft: {
        name: 'Wipe Left',
        category: 'wipe',
        icon: '⬅️',
        description: 'Horizontal wipe from right to left',
        tooltip: 'Wipe Left - Horizontal wipe that reveals the incoming clip by sliding from right to left',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the wipe boundary for a softer look' },
          direction: { value: 'left', options: ['left', 'right', 'up', 'down'], tooltip: 'Direction - Set the direction the wipe moves across the frame' }
        },
        render: this.renderWipe.bind(this)
      },
      wipeRight: {
        name: 'Wipe Right',
        category: 'wipe',
        icon: '➡️',
        description: 'Horizontal wipe from left to right',
        tooltip: 'Wipe Right - Horizontal wipe that reveals the incoming clip by sliding from left to right',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the wipe boundary for a softer look' } },
        render: this.renderWipe.bind(this)
      },
      wipeUp: {
        name: 'Wipe Up',
        category: 'wipe',
        icon: '⬆️',
        description: 'Vertical wipe from bottom to top',
        tooltip: 'Wipe Up - Vertical wipe that reveals the incoming clip by sliding from bottom to top',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the wipe boundary for a softer look' } },
        render: this.renderWipe.bind(this)
      },
      wipeDown: {
        name: 'Wipe Down',
        category: 'wipe',
        icon: '⬇️',
        description: 'Vertical wipe from top to bottom',
        tooltip: 'Wipe Down - Vertical wipe that reveals the incoming clip by sliding from top to bottom',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the wipe boundary for a softer look' } },
        render: this.renderWipe.bind(this)
      },
      wipeDiagonal: {
        name: 'Wipe Diagonal',
        category: 'wipe',
        icon: '↗️',
        description: 'Diagonal wipe across the frame',
        tooltip: 'Wipe Diagonal - Diagonal wipe that sweeps across the frame at a customizable angle',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the wipe boundary for a softer look' },
          angle: { value: 45, min: 0, max: 90, step: 15, tooltip: 'Angle - Set the angle of the diagonal wipe from 0 to 90 degrees' }
        },
        render: this.renderWipe.bind(this)
      },

      // Push transitions
      pushLeft: {
        name: 'Push Left',
        category: 'push',
        icon: '⬅️',
        description: 'Push outgoing clip left while bringing in new clip',
        tooltip: 'Push Left - Push the outgoing clip to the left while simultaneously revealing the incoming clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add motion blur effect to the push animation for smoother movement' } },
        render: this.renderPush.bind(this)
      },
      pushRight: {
        name: 'Push Right',
        category: 'push',
        icon: '➡️',
        description: 'Push outgoing clip right while bringing in new clip',
        tooltip: 'Push Right - Push the outgoing clip to the right while simultaneously revealing the incoming clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add motion blur effect to the push animation for smoother movement' } },
        render: this.renderPush.bind(this)
      },
      pushUp: {
        name: 'Push Up',
        category: 'push',
        icon: '⬆️',
        description: 'Push outgoing clip up while bringing in new clip',
        tooltip: 'Push Up - Push the outgoing clip upward while simultaneously revealing the incoming clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add motion blur effect to the push animation for smoother movement' } },
        render: this.renderPush.bind(this)
      },
      pushDown: {
        name: 'Push Down',
        category: 'push',
        icon: '⬇️',
        description: 'Push outgoing clip down while bringing in new clip',
        tooltip: 'Push Down - Push the outgoing clip downward while simultaneously revealing the incoming clip',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add motion blur effect to the push animation for smoother movement' } },
        render: this.renderPush.bind(this)
      },

      // Zoom transitions
      zoomIn: {
        name: 'Zoom In',
        category: 'zoom',
        icon: '🔍+',
        description: 'Scale incoming clip from small to full size',
        tooltip: 'Zoom In - Scale the incoming clip from small to full size for a dramatic reveal effect',
        params: {
          scale: { value: 0.5, min: 0.1, max: 2, step: 0.1, tooltip: 'Scale - Set the starting scale factor for the zoom; smaller values start more zoomed in' },
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add blur during the zoom motion for a more cinematic feel' }
        },
        render: this.renderZoom.bind(this)
      },
      zoomOut: {
        name: 'Zoom Out',
        category: 'zoom',
        icon: '🔍-',
        description: 'Scale outgoing clip from full size to small',
        tooltip: 'Zoom Out - Scale the outgoing clip from full size to small for a shrinking away effect',
        params: {
          scale: { value: 1.5, min: 1, max: 3, step: 0.1, tooltip: 'Scale - Set the ending scale factor for the zoom; larger values zoom out more' },
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add blur during the zoom motion for a more cinematic feel' }
        },
        render: this.renderZoom.bind(this)
      },
      zoomPan: {
        name: 'Zoom & Pan',
        category: 'zoom',
        icon: '🎬',
        description: 'Combined zoom and pan transition',
        tooltip: 'Zoom & Pan - Combine zooming and panning movements for a dynamic camera-like transition',
        params: {
          scale: { value: 1.2, min: 1, max: 2, step: 0.1, tooltip: 'Scale - Set the zoom intensity; values above 1 zoom in, below 1 zoom out' },
          panX: { value: 0.2, min: -1, max: 1, step: 0.1, tooltip: 'Pan X - Set the horizontal pan distance; positive values pan right, negative pan left' },
          panY: { value: 0.2, min: -1, max: 1, step: 0.1, tooltip: 'Pan Y - Set the vertical pan distance; positive values pan down, negative pan up' },
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add motion blur during the zoom and pan for smoother movement' }
        },
        render: this.renderZoomPan.bind(this)
      },

      // Iris transitions
      irisCircle: {
        name: 'Iris Circle',
        category: 'iris',
        icon: '⭕',
        description: 'Circular iris reveal transition',
        tooltip: 'Iris Circle - Classic circular iris effect that opens or closes to reveal the next clip',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the iris boundary for a softer look' },
          reverse: { value: false, type: 'boolean', tooltip: 'Reverse - Toggle to close the iris instead of opening it' }
        },
        render: this.renderIris.bind(this)
      },
      irisDiamond: {
        name: 'Iris Diamond',
        category: 'iris',
        icon: '💎',
        description: 'Diamond-shaped iris reveal',
        tooltip: 'Iris Diamond - Diamond-shaped iris effect that opens or closes with a geometric pattern',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the diamond boundary for a softer look' },
          reverse: { value: false, type: 'boolean', tooltip: 'Reverse - Toggle to close the diamond iris instead of opening it' }
        },
        render: this.renderIris.bind(this)
      },
      irisSquare: {
        name: 'Iris Square',
        category: 'iris',
        icon: '▢',
        description: 'Square iris reveal',
        tooltip: 'Iris Square - Square-shaped iris effect that opens or closes with clean geometric edges',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the square boundary for a softer look' },
          reverse: { value: false, type: 'boolean', tooltip: 'Reverse - Toggle to close the square iris instead of opening it' }
        },
        render: this.renderIris.bind(this)
      },

      // Shape transitions
      shapeStar: {
        name: 'Star Wipe',
        category: 'shape',
        icon: '⭐',
        description: 'Star-shaped wipe transition',
        tooltip: 'Star Wipe - Star-shaped transition that reveals the incoming clip with a multi-pointed pattern',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the star boundary for a softer look' },
          points: { value: 5, min: 3, max: 12, step: 1, tooltip: 'Points - Set the number of points on the star from 3 to 12' }
        },
        render: this.renderShape.bind(this)
      },
      shapeHeart: {
        name: 'Heart Wipe',
        category: 'shape',
        icon: '❤️',
        description: 'Heart-shaped wipe transition',
        tooltip: 'Heart Wipe - Heart-shaped transition that reveals the incoming clip with a romantic pattern',
        params: { softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the heart boundary for a softer look' } },
        render: this.renderShape.bind(this)
      },
      shapeCustom: {
        name: 'Custom Shape',
        category: 'shape',
        icon: '🎨',
        description: 'Custom SVG path-based transition',
        tooltip: 'Custom Shape - Create your own transition using a custom SVG path for unique reveal patterns',
        params: {
          softness: { value: 0, min: 0, max: 1, step: 0.1, tooltip: 'Softness - Add feathered edges to the custom shape boundary for a softer look' },
          svgPath: { value: '', type: 'text', tooltip: 'SVG Path - Enter an SVG path string to define the custom transition shape' }
        },
        render: this.renderCustomShape.bind(this)
      }
    };
  }

  initializePresets() {
    return {
      cinematic: [
        { name: 'Cinematic Fade', transition: 'dissolve', params: { softness: 0.8 }, tooltip: 'Cinematic Fade - A soft, elegant fade transition perfect for dramatic scenes and emotional moments' },
        { name: 'Smooth Wipe', transition: 'wipeLeft', params: { softness: 0.3 }, tooltip: 'Smooth Wipe - A gentle horizontal wipe with feathered edges for seamless scene changes' },
        { name: 'Dramatic Zoom', transition: 'zoomIn', params: { scale: 0.3, softness: 0.2 }, tooltip: 'Dramatic Zoom - An intense zoom-in transition that creates impact and draws attention' }
      ],
      modern: [
        { name: 'Quick Push', transition: 'pushRight', params: { softness: 0.0 }, tooltip: 'Quick Push - A snappy push transition with no blur for fast-paced, energetic edits' },
        { name: 'Modern Iris', transition: 'irisCircle', params: { softness: 0.1 }, tooltip: 'Modern Iris - A subtle circular iris with slight feathering for contemporary style' },
        { name: 'Tech Zoom', transition: 'zoomPan', params: { scale: 1.1, panX: 0.1, panY: 0.1 }, tooltip: 'Tech Zoom - A combined zoom and pan with subtle movement for a tech-forward look' }
      ],
      vintage: [
        { name: 'Film Dissolve', transition: 'dissolve', params: { softness: 0.9 }, tooltip: 'Film Dissolve - A heavily softened dissolve that mimics classic film crossfades' },
        { name: 'Classic Wipe', transition: 'wipeDiagonal', params: { softness: 0, angle: 45 }, tooltip: 'Classic Wipe - A clean diagonal wipe at 45 degrees reminiscent of vintage film transitions' },
        { name: 'Old School Iris', transition: 'irisCircle', params: { softness: 0.5, reverse: true }, tooltip: 'Old School Iris - A closing iris with medium feathering for a nostalgic film ending' }
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
