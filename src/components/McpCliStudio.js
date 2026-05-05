export function McpCliStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full overflow-y-auto bg-app-bg text-white';

    const inner = document.createElement('div');
    inner.className = 'max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12';
    container.appendChild(inner);

    // Hero
    const hero = document.createElement('section');
    hero.className = 'flex flex-col items-center text-center gap-4';
    hero.innerHTML = `
        <div class="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-secondary">
            For developers & AI agents
        </div>
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight">MCP &amp; CLI</h1>
        <p class="text-secondary text-base md:text-lg max-w-2xl">
            Use Open Higgsfield AI from your terminal, your IDE, or any MCP-compatible
            assistant. Generate cinematic images, videos, and audio across 100+ models —
            without leaving your workflow.
        </p>
    `;
    inner.appendChild(hero);

    // Quick start
    const quick = document.createElement('section');
    quick.className = 'glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-4';
    quick.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-widest text-secondary">Quick start</span>
            <div class="flex-1 h-px bg-white/5"></div>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
            ${quickStep('1', 'Install the CLI', 'npm install -g muapi-cli')}
            ${quickStep('2', 'Sign in', 'muapi auth login')}
            ${quickStep('3', 'Generate from chat', 'npx skills add SamurAIGPT/Generative-Media-Skills')}
        </div>
    `;
    inner.appendChild(quick);

    // Feature cards
    const cards = document.createElement('section');
    cards.className = 'grid md:grid-cols-3 gap-4';

    cards.appendChild(featureCard({
        tag: 'CLI',
        title: 'muapi-cli',
        body: 'Generate images, videos, and audio from the terminal across 14+ AI models. Dual interface — colored human output plus JSON for agents (--output-json, --jq filtering). Async workflows, file uploads, credit tracking.',
        code: 'npm install -g muapi-cli\nmuapi image generate "a cyberpunk city" \\\n  --model flux-dev',
        link: 'https://github.com/SamurAIGPT/muapi-cli',
        linkLabel: 'View muapi-cli on GitHub',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    }));

    cards.appendChild(featureCard({
        tag: 'MCP',
        title: 'muapi-mcp-server',
        body: 'Connect Claude, Cursor, Windsurf, and any MCP-compatible assistant to 100+ generative models. Hosted endpoint — no install. 19 structured tools with input/output schemas, async polling, and account management.',
        code: 'claude mcp add --transport http muapi \\\n  https://api.muapi.ai/mcp \\\n  --header "Authorization: Bearer YOUR_KEY"',
        link: 'https://github.com/SamurAIGPT/muapi-mcp-server',
        linkLabel: 'View muapi-mcp-server on GitHub',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>`,
    }));

    cards.appendChild(featureCard({
        tag: 'Skills',
        title: 'Generative Media Skills',
        body: 'Multimodal toolkit for Claude Code, Cursor, and Gemini CLI. Cinema Director, Nano-Banana, UI Designer, Logo Creator, Seedance 2, AI Clipping, and YouTube Shorts presets. Agent-native with JSON outputs and semantic exit codes.',
        code: 'npx skills add SamurAIGPT/Generative-Media-Skills --all',
        link: 'https://github.com/SamurAIGPT/Generative-Media-Skills',
        linkLabel: 'View Generative-Media-Skills on GitHub',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z"/></svg>`,
    }));

    inner.appendChild(cards);

    // Usage examples
    const examples = document.createElement('section');
    examples.className = 'flex flex-col gap-4';
    examples.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-widest text-secondary">Examples</span>
            <div class="flex-1 h-px bg-white/5"></div>
        </div>
        <div class="grid md:grid-cols-2 gap-4">
            ${exampleBlock('Image generation', 'muapi image generate "a serene mountain lake at sunrise" \\\n  --model flux-dev --download ./outputs')}
            ${exampleBlock('Text-to-video', 'muapi video generate "a dog running on a beach" \\\n  --model kling-master')}
            ${exampleBlock('Audio creation', 'muapi audio create "upbeat lo-fi hip hop for studying"')}
            ${exampleBlock('Run a skill', 'bash library/visual/nano-banana/scripts/\\\n  generate-nano-art.sh --file image.jpg --view')}
        </div>
    `;
    inner.appendChild(examples);

    // Footer note
    const footer = document.createElement('p');
    footer.className = 'text-center text-xs text-secondary opacity-60 pb-4';
    footer.textContent = 'Open-source · MIT licensed · Works with Claude, Cursor, Windsurf, and Gemini CLI';
    inner.appendChild(footer);

    return container;
}

function quickStep(num, title, code) {
    return `
        <div class="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
            <div class="flex items-center gap-2">
                <span class="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">${num}</span>
                <span class="text-sm font-bold">${title}</span>
            </div>
            <code class="text-[12px] font-mono text-primary bg-black/40 rounded-md px-2 py-1.5 break-all">${escapeHtml(code)}</code>
        </div>
    `;
}

function featureCard({ tag, title, body, code, link, linkLabel, icon }) {
    const card = document.createElement('a');
    card.href = link;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', linkLabel);
    card.className = 'glass-panel rounded-2xl p-6 flex flex-col gap-3 hover:bg-white/[0.04] transition-colors group';
    card.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">${icon}</div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-secondary">${tag}</span>
        </div>
        <h3 class="text-lg font-bold">${title}</h3>
        <p class="text-[13px] text-secondary leading-relaxed">${body}</p>
        <pre class="text-[11px] font-mono text-primary bg-black/40 rounded-md px-3 py-2 overflow-x-auto whitespace-pre">${escapeHtml(code)}</pre>
        <div class="flex items-center gap-1 text-[12px] font-bold text-secondary group-hover:text-white transition-colors mt-auto">
            <span>View on GitHub</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
        </div>
    `;
    return card;
}

function exampleBlock(title, code) {
    return `
        <div class="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
            <span class="text-[12px] font-bold text-white/80">${title}</span>
            <pre class="text-[11px] font-mono text-primary bg-black/40 rounded-md px-3 py-2 overflow-x-auto whitespace-pre">${escapeHtml(code)}</pre>
        </div>
    `;
}

function escapeHtml(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
