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
            面向开发者和 AI 智能体
        </div>
        <h1 class="text-4xl md:text-5xl font-bold tracking-tight">MCP 与 CLI</h1>
        <p class="text-secondary text-base md:text-lg max-w-2xl">
            你可以在终端、IDE 或任何兼容 MCP 的助手中使用 Open Generative AI。
            无需离开现有工作流，就能生成电影感图像、视频和音频。
        </p>
    `;
    inner.appendChild(hero);

    // Quick start
    const quick = document.createElement('section');
    quick.className = 'glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-4';
    quick.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-widest text-secondary">快速上手</span>
            <div class="flex-1 h-px bg-white/5"></div>
        </div>
        <div class="grid md:grid-cols-3 gap-4">
            ${quickStep('1', '安装 CLI', 'npm install -g muapi-cli')}
            ${quickStep('2', '登录', 'muapi auth login')}
            ${quickStep('3', '添加技能', 'npx skills add SamurAIGPT/Generative-Media-Skills')}
        </div>
    `;
    inner.appendChild(quick);

    // Feature cards
    const cards = document.createElement('section');
    cards.className = 'grid md:grid-cols-3 gap-4';

    cards.appendChild(featureCard({
        tag: 'CLI',
        title: 'muapi-cli',
        body: '在终端中调用 14+ 个 AI 模型生成图像、视频和音频。双重输出模式兼顾人类可读内容与智能体可用的 JSON（支持 --output-json、--jq 过滤），并提供异步工作流、文件上传和额度跟踪。',
        code: 'npm install -g muapi-cli\nmuapi image generate "a cyberpunk city" \\\n  --model flux-dev',
        link: 'https://github.com/SamurAIGPT/muapi-cli',
        linkLabel: '在 GitHub 查看 muapi-cli',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    }));

    cards.appendChild(featureCard({
        tag: 'MCP',
        title: 'muapi-mcp-server',
        body: '把 Claude、Cursor、Windsurf 以及任何兼容 MCP 的助手连接到 100+ 个生成模型。提供托管端点，无需安装；内置 19 个结构化工具，包含输入输出 schema、异步轮询和账户管理。',
        code: 'claude mcp add --transport http muapi \\\n  https://api.muapi.ai/mcp \\\n  --header "Authorization: Bearer YOUR_KEY"',
        link: 'https://github.com/SamurAIGPT/muapi-mcp-server',
        linkLabel: '在 GitHub 查看 muapi-mcp-server',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>`,
    }));

    cards.appendChild(featureCard({
        tag: '技能',
        title: '生成媒体技能',
        body: '面向 Claude Code、Cursor 和 Gemini CLI 的多模态工具包。内含 Cinema Director、Nano-Banana、UI Designer、Logo Creator、Seedance 2、AI Clipping 和 YouTube Shorts 等预设，适合智能体直接驱动，支持 JSON 输出与语义化退出码。',
        code: 'npx skills add SamurAIGPT/Generative-Media-Skills --all',
        link: 'https://github.com/SamurAIGPT/Generative-Media-Skills',
        linkLabel: '在 GitHub 查看生成媒体技能',
        icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z"/></svg>`,
    }));

    inner.appendChild(cards);

    // Usage examples
    const examples = document.createElement('section');
    examples.className = 'flex flex-col gap-4';
    examples.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-[11px] font-bold uppercase tracking-widest text-secondary">示例</span>
            <div class="flex-1 h-px bg-white/5"></div>
        </div>
        <div class="grid md:grid-cols-2 gap-4">
            ${exampleBlock('图像生成', 'muapi image generate "清晨宁静的山间湖泊" \\\n  --model flux-dev --download ./outputs')}
            ${exampleBlock('文生视频', 'muapi video generate "一只狗在海滩上奔跑" \\\n  --model kling-master')}
            ${exampleBlock('音频生成', 'muapi audio create "适合学习的轻快 lo-fi hip hop"')}
            ${exampleBlock('运行技能', 'bash library/visual/nano-banana/scripts/\\\n  generate-nano-art.sh --file image.jpg --view')}
        </div>
    `;
    inner.appendChild(examples);

    // Footer note
    const footer = document.createElement('p');
    footer.className = 'text-center text-xs text-secondary opacity-60 pb-4';
    footer.textContent = '开源 · MIT 许可 · 兼容 Claude、Cursor、Windsurf 和 Gemini CLI';
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
            <span>在 GitHub 查看</span>
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
