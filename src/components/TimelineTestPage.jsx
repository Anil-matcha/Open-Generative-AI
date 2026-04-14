import { Timeline } from '../../components/Timeline.js';

const TimelineTestPage = () => {
  // Create container element
  const element = document.createElement('div');
  element.style.cssText = 'height: 100vh; display: flex; flex-direction: column;';

  const header = document.createElement('h1');
  header.textContent = 'Timeline Editor Test';
  element.appendChild(header);

  const container = document.createElement('div');
  container.style.cssText = 'flex: 1; overflow: hidden;';
  element.appendChild(container);

  // Initialize the timeline component after a short delay to ensure DOM is ready
  setTimeout(() => {
    const timeline = new Timeline();
    const timelineElement = timeline.mount(container);
  }, 100);

  return element;
};

export default TimelineTestPage;