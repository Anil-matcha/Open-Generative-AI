export function AssistantStudio() {
  const element = document.createElement('div');
  element.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg text-white gap-4';

  const icon = document.createElement('div');
  icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    <path d="M9 9h.01M15 9h.01"/>
  </svg>`;

  const title = document.createElement('p');
  title.textContent = 'Assistant Studio';
  title.className = 'text-lg font-bold opacity-60';

  const sub = document.createElement('p');
  sub.textContent = 'Available in the web app at open-generative-ai.com';
  sub.className = 'text-sm opacity-40';

  element.appendChild(icon);
  element.appendChild(title);
  element.appendChild(sub);
  return element;
}