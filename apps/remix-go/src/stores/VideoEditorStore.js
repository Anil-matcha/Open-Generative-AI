import { makeAutoObservable } from 'mobx';

class VideoEditorStore {
  // Video state
  videoElement = null;
  currentTime = 0;
  duration = 0;
  isPlaying = false;
  volume = 1;

  // Timeline state
  timelineZoom = 1;
  selectedClip = null;
  clips = [];

  // Canvas/fabric state
  canvas = null;
  activeElement = null;
  elements = [];

  // Editor state
  stage = 'caption-customise'; // caption-customise, timeline, etc.
  toolbar = null;

  // Collaboration state
  collaborators = [];
  isCollaborating = false;

  constructor() {
    makeAutoObservable(this);
    this.initializeDemoContent();
  }

  initializeDemoContent() {
    // Add a demo text element after canvas is initialized
    setTimeout(() => {
      if (this.canvas) {
        this.addTextElement({
          text: 'Welcome to VideoRemix Go!',
          left: 100,
          top: 100,
          fontSize: 32,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        });
      }
    }, 2000);
  }

  initializeDemoContent() {
    // Add a demo text element after canvas is initialized
    setTimeout(() => {
      if (this.canvas) {
        this.addTextElement({
          text: 'Welcome to VideoRemix Go!',
          left: 100,
          top: 100,
          fontSize: 32,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
        });
      }
    }, 2000);
  }

  // Video methods
  setVideoElement(element) {
    this.videoElement = element;
    if (element) {
      this.initializeVideoEvents();
    }
  }

  initializeVideoEvents() {
    if (!this.videoElement) return;

    // Set up event listeners
    this.videoElement.addEventListener('timeupdate', () => {
      this.currentTime = this.videoElement.currentTime;
    });

    this.videoElement.addEventListener('loadedmetadata', () => {
      this.duration = this.videoElement.duration;
    });

    this.videoElement.addEventListener('play', () => {
      this.isPlaying = true;
    });

    this.videoElement.addEventListener('pause', () => {
      this.isPlaying = false;
    });

    this.videoElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.currentTime = 0;
    });
  }

  play() {
    if (this.videoElement) {
      this.videoElement.play();
    }
  }

  pause() {
    if (this.videoElement) {
      this.videoElement.pause();
    }
  }

  seek(time) {
    if (this.videoElement) {
      this.videoElement.currentTime = time;
      this.currentTime = time;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.videoElement) {
      this.videoElement.volume = this.volume;
    }
  }

  // Timeline methods
  setTimelineZoom(zoom) {
    this.timelineZoom = Math.max(0.1, Math.min(5, zoom));
  }

  addClip(clipData) {
    const clip = {
      id: Date.now().toString(),
      start: clipData.start || 0,
      end: clipData.end || this.duration,
      duration: clipData.duration || this.duration,
      src: clipData.src,
      ...clipData
    };
    this.clips.push(clip);
    return clip;
  }

  removeClip(clipId) {
    this.clips = this.clips.filter(clip => clip.id !== clipId);
    if (this.selectedClip?.id === clipId) {
      this.selectedClip = null;
    }
  }

  selectClip(clip) {
    this.selectedClip = clip;
  }

  updateClip(clipId, updates) {
    const index = this.clips.findIndex(clip => clip.id === clipId);
    if (index !== -1) {
      this.clips[index] = { ...this.clips[index], ...updates };
    }
  }

  // Canvas methods (for fabric.js integration)
  initializeCanvas(canvasElement) {
    if (typeof fabric === 'undefined') return;

    this.canvas = new fabric.Canvas(canvasElement, {
      width: 800,
      height: 450,
      backgroundColor: 'transparent'
    });

    // Set up canvas event listeners
    this.canvas.on('selection:created', (e) => {
      this.activeElement = e.target;
    });

    this.canvas.on('selection:cleared', () => {
      this.activeElement = null;
    });

    this.canvas.on('object:modified', (e) => {
      // Update element in store
      const element = e.target;
      this.updateElement(element.id, {
        left: element.left,
        top: element.top,
        scaleX: element.scaleX,
        scaleY: element.scaleY,
        angle: element.angle
      });
    });
  }

  addTextElement(options = {}) {
    if (!this.canvas) return;

    const textElement = new fabric.IText('Your text here', {
      id: Date.now().toString(),
      left: 100,
      top: 100,
      width: 200,
      fontSize: 24,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1,
      fontFamily: 'Arial',
      ...options
    });

    this.canvas.add(textElement);
    this.elements.push(textElement);
    this.canvas.setActiveObject(textElement);
  }

  addImageElement(imageUrl, options = {}) {
    if (!this.canvas) return;

    fabric.Image.fromURL(imageUrl, (img) => {
      img.set({
        id: Date.now().toString(),
        left: 100,
        top: 100,
        scaleX: 0.5,
        scaleY: 0.5,
        ...options
      });

      this.canvas.add(img);
      this.elements.push(img);
      this.canvas.setActiveObject(img);
    });
  }

  removeElement(elementId) {
    if (!this.canvas) return;

    const element = this.canvas.getObjects().find(obj => obj.id === elementId);
    if (element) {
      this.canvas.remove(element);
      this.elements = this.elements.filter(el => el.id !== elementId);
    }
  }

  updateElement(elementId, updates) {
    const element = this.elements.find(el => el.id === elementId);
    if (element) {
      Object.assign(element, updates);
      this.canvas.renderAll();
    }
  }

  // Element properties
  setElementProperty(property, value) {
    if (!this.activeElement) return;

    this.activeElement.set(property, value);
    this.canvas.renderAll();

    // Update in elements array
    const index = this.elements.findIndex(el => el.id === this.activeElement.id);
    if (index !== -1) {
      this.elements[index][property] = value;
    }
  }

  // Editor stage management
  setStage(stage) {
    this.stage = stage;
    this.toolbar = null; // Reset toolbar when changing stages
  }

  setToolbar(toolbar) {
    this.toolbar = toolbar;
  }

  // Collaboration methods
  setCollaborators(collaborators) {
    this.collaborators = collaborators;
  }

  setCollaborating(isCollaborating) {
    this.isCollaborating = isCollaborating;
  }

  // Utility methods
  get formattedCurrentTime() {
    return this.formatTime(this.currentTime);
  }

  get formattedDuration() {
    return this.formatTime(this.duration);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  // Export methods
  async exportVideo(options = {}) {
    // This would integrate with video rendering service
    console.log('Exporting video with options:', options);
    // Implementation would call API to render video
  }

  // Cleanup
  dispose() {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }

    this.videoElement = null;
    this.elements = [];
    this.clips = [];
  }
}

export default VideoEditorStore;