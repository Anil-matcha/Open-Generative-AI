import { Component } from './base/Component.js';
import { getStore } from './base/Store.js';
import { editorStyles } from '../lib/constants/editorStyles.js';
import moment from 'moment';

import TimeLineSlider from './common/timeline/TimeLineSlider.js';
import SortableLayers from './common/timeline/SortableLayers.js';
import PlayButton from './common/timeline/PlayButton.js';
import PlusButton from './common/timeline/PlusButton.js';
import PlayTime from './common/timeline/PlayTime.js';
import PopcornElements from './common/timeline/PopcornElements.js';
import SliderArrow from './common/timeline/SliderArrow.js';
import ContextMenu from './common/timeline/ContextMenu.js';
import TimelineRuler from './common/timeline/TimelineRuler.js';

// Placeholder SVG imports - will be replaced with actual icons
const plusIcon = '+';
const minusIcon = '-';
const resetIcon = '⟲';
import { mainTooltips } from '../lib/constants/tooltips.js';
import HelpIconComponent from './common/HelpIcon.js';

const date = '2018-08-01 00:00:00';

export class Timeline extends Component {
  constructor(props = {}) {
    super(props);
    this.sortableRef = null;
    this.layersRef = null;
    this.timelineRef = null;
    this.timelineSideRef = null;

    // Get stores
    this.projectStore = getStore('projectStore');
    this.uiStore = getStore('uiStore');
    this.timelineStore = getStore('timelineStore');

    // Initialize state
    this.state = {
      sortableWidth: 0,
      windowWidth: window.innerWidth,
      endDate: null,
      zoom: 1,
      isShowScroll: false,
      startDateWithZoom: null,
      endDateWithZoom: null,
    };

    // Bind methods
    this.onTrayHandleMousedown = this.onTrayHandleMousedown.bind(this);
    this.onTrayHandleMousemove = this.onTrayHandleMousemove.bind(this);
    this.navigateTimeline = this.navigateTimeline.bind(this);
    this.onTrayHandleMouseup = this.onTrayHandleMouseup.bind(this);
    this.closeOpenTimeline = this.closeOpenTimeline.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
    this.zoomReset = this.zoomReset.bind(this);
    this.handleTimelineZoomLevel = this.handleTimelineZoomLevel.bind(this);
    this.onSortEnd = this.onSortEnd.bind(this);
    this.setIsActiveTimeline = this.setIsActiveTimeline.bind(this);

    // Subscribe to store changes
    this.subscribeToStore(this.projectStore, () => this.update());
    this.subscribeToStore(this.uiStore, () => this.update());
    this.subscribeToStore(this.timelineStore, () => this.update());
  }

  onMount() {
    super.onMount();
    this.initializeTimeline();
    this.setupEventListeners();
  }

  onUnmount() {
    super.onUnmount();
    this.removeEventListeners();
  }

  initializeTimeline() {
    const startDate = moment(date);
    this.setState({
      endDate: moment(startDate.diff(0) + (this.projectStore.getState().duration * 10)),
      startDateWithZoom: startDate,
      endDateWithZoom: moment(startDate.diff(0) + (this.projectStore.getState().duration * 10)),
    });
  }

  setupEventListeners() {
    // Timeline height toggle listener
    if (this.timelineRef) {
      const trayResize = this.timelineRef.querySelector('.tray-resize');
      if (trayResize) {
        trayResize.addEventListener('mousedown', this.onTrayHandleMousedown);
      }
    }

    // Window resize listener
    window.addEventListener('resize', () => {
      this.setState({ windowWidth: window.innerWidth });
    });
  }

  removeEventListeners() {
    if (this.timelineRef) {
      const trayResize = this.timelineRef.querySelector('.tray-resize');
      if (trayResize) {
        trayResize.removeEventListener('mousedown', this.onTrayHandleMousedown);
      }
    }
    window.removeEventListener('resize', () => {
      // This is a no-op since we're not storing the handler
    });
  }

  navigateTimeline(direction) {
    // Navigate timeline left/right
    const currentTime = this.projectStore.getState().time;
    const duration = this.projectStore.getState().duration;
    const step = 5; // seconds to step

    let newTime;
    if (direction === 'left') {
      newTime = Math.max(0, currentTime - step);
    } else {
      newTime = Math.min(duration, currentTime + step);
    }

    this.projectStore.updateState({ time: newTime });
  }

  setIsActiveTimeline(active) {
    this.timelineStore.updateState({ isActiveTimeline: active });
  }

  zoomIn() {
    if (this.state.zoom > 0.1) {
      this.setState({ zoom: parseFloat((this.state.zoom - 0.1).toFixed(1)) });
    }
  }

  zoomOut() {
    const newValue = parseFloat((this.state.zoom + 0.1).toFixed(1));
    if (newValue <= 1) {
      this.setState({ zoom: newValue });
    }
  }

  zoomReset() {
    this.setState({ zoom: 1 });
  }

  handleTimelineZoomLevel(event, newValue) {
    this.setState({ zoom: newValue });
  }

  onSortEnd({ oldIndex, newIndex }) {
    if (oldIndex === newIndex) {
      return;
    }
    this.projectStore.getState().moveElements(oldIndex, newIndex);
  }

  onTrayHandleMousedown(e) {
    e.preventDefault();
    if (this.timelineRef) {
      this.timelineRef.style.transition = '0s';
    }
    window.addEventListener('mousemove', this.onTrayHandleMousemove);
    window.addEventListener('mouseup', this.onTrayHandleMouseup);
  }

  onTrayHandleMousemove(e) {
    if (!this.timelineRef) return;

    const height = window.innerHeight - e.pageY;
    const headerHeight = document.querySelector('.menu-app-bar')?.getBoundingClientRect().height || 0;
    const maxHeight = document.documentElement.clientHeight - headerHeight - (editorStyles.timeline.maxDifferenceHeightPx || 200);

    if (height <= editorStyles.timeline.minHeight) {
      this.timelineRef.style.height = `${editorStyles.timeline.minHeight}px`;
      this.uiStore.updateState({ isTimelineOpen: false });
    } else if (height >= maxHeight) {
      this.timelineRef.style.height = `${maxHeight}px`;
    } else {
      this.uiStore.updateState({ isTimelineOpen: true });
      this.timelineRef.style.height = `${height}px`;
    }
  }

  onTrayHandleMouseup() {
    if (this.timelineRef) {
      this.timelineRef.style.transition = '0.3s';
    }
    window.removeEventListener('mousemove', this.onTrayHandleMousemove, false);
    window.removeEventListener('mouseup', this.onTrayHandleMouseup, false);

    const newHeight = this.timelineRef.getBoundingClientRect().height;
    this.timelineStore.updateState({ timelineHeight: newHeight });

    if (newHeight > editorStyles.timeline.minHeight) {
      this.uiStore.updateState({ isTimelineOpen: true });
    } else {
      this.uiStore.updateState({ isTimelineOpen: false });
    }
  }

  closeOpenTimeline() {
    const { isTimelineOpen } = this.uiStore.getState();
    if (isTimelineOpen) {
      this.timelineStore.updateState({ timelineHeight: editorStyles.timeline.minHeight });
    } else {
      this.timelineStore.updateState({ timelineHeight: editorStyles.timeline.defaultHeight });
    }

    if (this.timelineRef) {
      this.timelineRef.removeAttribute('style');
    }
    this.uiStore.updateState({ isTimelineOpen: !isTimelineOpen });
  }

  render() {
    const { layers, duration, isLoaded } = this.projectStore.getState();
    const { isTimelineOpen } = this.uiStore.getState();
    const { contextMenu, timelineHeight } = this.timelineStore.getState();
    const { zoom, sortableWidth } = this.state;

    const container = document.createElement('div');
    container.className = `timeline ${isTimelineOpen ? 'timeline-open' : ''}`;
    container.style.height = timelineHeight ? `${timelineHeight}px` : '300px';
    container.addEventListener('click', () => this.setIsActiveTimeline(true));

    // Tray resize handle
    const trayResize = document.createElement('div');
    trayResize.className = 'tray-resize';
    container.appendChild(trayResize);

    // Timeline arrow
    const timelineArrow = document.createElement('button');
    timelineArrow.className = `timeline-arrow ${isTimelineOpen ? 'timeline-arrow-open' : ''}`;
    timelineArrow.addEventListener('click', this.closeOpenTimeline);
    container.appendChild(timelineArrow);

    // Zoom controls
    const zoomContainer = document.createElement('div');
    zoomContainer.className = 'timeline-zoom';

    const zoomInBtn = document.createElement('button');
    zoomInBtn.className = 'timeline-zoom__btn';
    zoomInBtn.textContent = '-';
    zoomInBtn.addEventListener('click', this.zoomIn);
    zoomContainer.appendChild(zoomInBtn);

    // Zoom slider would go here - simplified for now
    const zoomValue = document.createElement('span');
    zoomValue.className = 'timeline-zoom__value';
    zoomValue.textContent = `${zoom}x`;
    zoomContainer.appendChild(zoomValue);

    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.className = 'timeline-zoom__btn';
    zoomOutBtn.textContent = '+';
    zoomOutBtn.addEventListener('click', this.zoomOut);
    zoomContainer.appendChild(zoomOutBtn);

    const zoomResetBtn = document.createElement('button');
    zoomResetBtn.className = 'timeline-zoom__btn timeline-zoom__reset';
    zoomResetBtn.textContent = '⟲';
    zoomResetBtn.addEventListener('click', this.zoomReset);
    zoomContainer.appendChild(zoomResetBtn);

    container.appendChild(zoomContainer);

    // Timeline top section
    const timelineTop = document.createElement('div');
    timelineTop.className = 'timeline-top';

    const timelineTopLeft = document.createElement('div');
    timelineTopLeft.className = 'timeline-top-left';

    // Play button
    if (isLoaded) {
      const playButton = new PlayButton();
      timelineTopLeft.appendChild(playButton.render());
    }

    // Plus button
    const plusButton = new PlusButton({
      onClick: () => this.projectStore.getState().addLayer(),
      alt: 'Add Layer',
      className: 'timeline-add'
    });
    timelineTopLeft.appendChild(plusButton.render());

    // Help icon
    const helpIcon = new HelpIconComponent({
      placement: 'right-start',
      noPadding: false,
      message: mainTooltips.timeline
    });
    timelineTopLeft.appendChild(helpIcon.render());

    // Play time
    const playTime = new PlayTime();
    timelineTopLeft.appendChild(playTime.render());

    // Slider arrows for navigation
    const sliderArrowLeft = new SliderArrow({
      direction: 'left',
      onClick: () => this.navigateTimeline('left')
    });
    timelineTopLeft.appendChild(sliderArrowLeft.render());

    const sliderArrowRight = new SliderArrow({
      direction: 'right',
      onClick: () => this.navigateTimeline('right')
    });
    timelineTopLeft.appendChild(sliderArrowRight.render());

    timelineTop.appendChild(timelineTopLeft);

    // Timeline slider
    if (isLoaded) {
      const timelineSlider = new TimeLineSlider({
        startDate: moment(date),
        endDate: this.state.endDate,
        startDateWithZoom: this.state.startDateWithZoom,
        endDateWithZoom: this.state.endDateWithZoom,
        setStartDateWithZoom: (date) => this.setState({ startDateWithZoom: date }),
        setEndDateWithZoom: (date) => this.setState({ endDateWithZoom: date }),
        sortableWidth
      });
      timelineTop.appendChild(timelineSlider.render());
    }

    container.appendChild(timelineTop);

    // Context menu
    if (contextMenu?.buttons?.length && contextMenu.isOpen) {
      const contextMenuComponent = new ContextMenu();
      container.appendChild(contextMenuComponent.render());
    }

    // Timeline content
    const layersContainer = document.createElement('div');
    layersContainer.className = 'layers';

    // Layers settings
    const layersSettings = document.createElement('div');
    layersSettings.className = 'layers-settings';
    this.sortableRef = layersSettings;

    const sortableLayers = new SortableLayers({
      layers,
      onSortEnd: this.onSortEnd,
      onRemove: (item) => this.projectStore.getState().removeLayer(item.id)
    });
    layersSettings.appendChild(sortableLayers.render());

    layersContainer.appendChild(layersSettings);

    // Timeline side
    const timelineSide = document.createElement('div');
    timelineSide.className = 'timeline-side';
    this.timelineSideRef = timelineSide;

    if (isLoaded) {
      // Timeline ruler
      const timelineRuler = new TimelineRuler({
        state: { timelineSeconds: duration },
        zoom
      });
      timelineSide.appendChild(timelineRuler.render());

      // Popcorn elements
      const popcornElements = new PopcornElements({
        startDate: moment(date),
        endDate: this.state.endDate,
        startDateWithZoom: this.state.startDateWithZoom,
        endDateWithZoom: this.state.endDateWithZoom,
        zoom,
        sortableWidth,
        layersRef: this.layersRef
      });
      timelineSide.appendChild(popcornElements.render());
    }

    layersContainer.appendChild(timelineSide);
    container.appendChild(layersContainer);

    this.timelineRef = container;
    return container;
  }

  update() {
    // Re-render when state changes
    if (this.element && this.element.parentNode) {
      const newElement = this.render();
      this.element.parentNode.replaceChild(newElement, this.element);
      this.element = newElement;
    }
  }
}