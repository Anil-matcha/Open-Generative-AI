"use client";

import React from 'react';
import { FaGithub, FaTerminal, FaPlug, FaStar, FaExternalLinkAlt } from 'react-icons/fa';

const FEATURES = [
  {
    tag: 'CLI',
    title: 'muapi-cli',
    icon: FaTerminal,
    description:
      'Generate images, videos, and audio from the terminal across 14+ AI models. Dual interface — colored human output plus JSON for agents (--output-json, --jq filtering). Async workflows, file uploads, credit tracking.',
    code: `npm install -g muapi-cli
muapi auth login
muapi image generate "a cyberpunk city" \\
  --model flux-dev`,
    href: 'https://github.com/SamurAIGPT/muapi-cli',
  },
  {
    tag: 'MCP',
    title: 'muapi-mcp-server',
    icon: FaPlug,
    description:
      'Connect Claude, Cursor, Windsurf, and any MCP-compatible assistant to 100+ generative models. Hosted endpoint — no install. 19 structured tools with input/output schemas, async polling, and account management.',
    code: `claude mcp add --transport http muapi \\
  https://api.muapi.ai/mcp \\
  --header "Authorization: Bearer YOUR_KEY"`,
    href: 'https://github.com/SamurAIGPT/muapi-mcp-server',
  },
  {
    tag: 'Skills',
    title: 'Generative Media Skills',
    icon: FaStar,
    description:
      'Multimodal toolkit for Claude Code, Cursor, and Gemini CLI. Cinema Director, Nano-Banana, UI Designer, Logo Creator, Seedance 2, AI Clipping, and YouTube Shorts presets. Agent-native with JSON outputs and semantic exit codes.',
    code: `npx skills add SamurAIGPT/Generative-Media-Skills --all`,
    href: 'https://github.com/SamurAIGPT/Generative-Media-Skills',
  },
];

const QUICK_STEPS = [
  { num: '1', title: 'Install the CLI', code: 'npm install -g muapi-cli' },
  { num: '2', title: 'Sign in', code: 'muapi auth login' },
  { num: '3', title: 'Add the skills', code: 'npx skills add SamurAIGPT/Generative-Media-Skills' },
];

const EXAMPLES = [
  { title: 'Image generation', code: 'muapi image generate "a serene mountain lake at sunrise" \\\n  --model flux-dev --download ./outputs' },
  { title: 'Text-to-video', code: 'muapi video generate "a dog running on a beach" \\\n  --model kling-master' },
  { title: 'Audio creation', code: 'muapi audio create "upbeat lo-fi hip hop for studying"' },
  { title: 'Run a skill', code: 'bash library/visual/nano-banana/scripts/\\\n  generate-nano-art.sh --file image.jpg --view' },
];

function CodeBlock({ children, className = '' }) {
  return (
    <pre
      className={`text-[11.5px] font-mono text-[#d9ff00] bg-black/50 border border-white/5 rounded-md px-3 py-2 overflow-x-auto whitespace-pre ${className}`}
    >
      {children}
    </pre>
  );
}

export default function McpCliStudio() {
  return (
    <div className="w-full h-full overflow-y-auto bg-[#050505] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-12">

        {/* Hero */}
        <section className="flex flex-col items-center text-center gap-4">
          <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-white/60">
            For developers &amp; AI agents
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MCP &amp; CLI</h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl">
            Use Open Higgsfield AI from your terminal, your IDE, or any MCP-compatible
            assistant. Generate cinematic images, videos, and audio across 100+ models —
            without leaving your workflow.
          </p>
        </section>

        {/* Quick start */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Quick start</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {QUICK_STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                  <span className="text-sm font-bold">{step.title}</span>
                </div>
                <CodeBlock className="text-[11.5px]">{step.code}</CodeBlock>
              </div>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section className="grid md:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <a
                key={f.title}
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col gap-3 hover:bg-white/[0.04] hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                    <Icon className="text-lg" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{f.tag}</span>
                </div>
                <h3 className="text-lg font-bold">{f.title}</h3>
                <p className="text-[13px] text-white/60 leading-relaxed">{f.description}</p>
                <CodeBlock>{f.code}</CodeBlock>
                <div className="mt-auto flex items-center gap-1.5 text-[12px] font-bold text-white/50 group-hover:text-white transition-colors">
                  <FaGithub className="text-sm" />
                  <span>View on GitHub</span>
                  <FaExternalLinkAlt className="text-[10px]" />
                </div>
              </a>
            );
          })}
        </section>

        {/* Examples */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Examples</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {EXAMPLES.map((ex) => (
              <div
                key={ex.title}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2"
              >
                <span className="text-[12px] font-bold text-white/80">{ex.title}</span>
                <CodeBlock>{ex.code}</CodeBlock>
              </div>
            ))}
          </div>
        </section>

        <p className="text-center text-xs text-white/40 pb-4">
          Open-source · MIT licensed · Works with Claude, Cursor, Windsurf, and Gemini CLI
        </p>
      </div>
    </div>
  );
}
