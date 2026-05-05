export function WorkflowStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg text-white gap-4';

    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        <path d="M6.5 10v4M17.5 10v4M10 6.5h4M10 17.5h4"/>
    </svg>`;

    const title = document.createElement('p');
    title.textContent = 'Workflow Studio';
    title.className = 'text-lg font-bold opacity-60';

    const sub = document.createElement('p');
    sub.textContent = 'Available in the web app at open-generative-ai.com';
    sub.className = 'text-sm opacity-40';

    container.appendChild(icon);
    container.appendChild(title);
    container.appendChild(sub);
    return container;
}
