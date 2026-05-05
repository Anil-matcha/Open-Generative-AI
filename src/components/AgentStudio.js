export function AgentStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg text-white gap-4';

    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
        <path d="M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4"/>
        <path d="M8 14a6 6 0 0 0-6 6h20a6 6 0 0 0-6-6H8z"/>
        <path d="M9 9h.01M15 9h.01"/>
    </svg>`;

    const title = document.createElement('p');
    title.textContent = 'Agent Studio';
    title.className = 'text-lg font-bold opacity-60';

    const sub = document.createElement('p');
    sub.textContent = 'Available in the web app at open-generative-ai.com';
    sub.className = 'text-sm opacity-40';

    container.appendChild(icon);
    container.appendChild(title);
    container.appendChild(sub);
    return container;
}
