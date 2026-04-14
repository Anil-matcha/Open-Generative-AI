/**
 * AI Storyboard Page - Main entry point
 */
import { AIStoryboardStudio } from './ai-storyboard/AIStoryboardStudio.jsx';

export function AIStoryboardPage() {
  const container = document.createElement('div');
  container.className = 'w-full h-full flex flex-col bg-app-bg overflow-hidden relative';

  container.appendChild(AIStoryboardStudio());

  return container;
}
