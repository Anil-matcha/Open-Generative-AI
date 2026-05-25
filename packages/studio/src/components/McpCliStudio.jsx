"use client";

import React from 'react';
import { FaGithub, FaTerminal, FaPlug, FaStar, FaExternalLinkAlt } from 'react-icons/fa';

const FEATURES = [
  {
    tag: 'CLI',
    title: 'muapi-cli',
    icon: FaTerminal,
    description:
      '在终端中调用 14+ 个 AI 模型生成图像、视频和音频。双重输出模式，兼顾人类可读内容与智能体可用的 JSON（支持 --output-json、--jq 过滤），并提供异步工作流、文件上传和额度跟踪。',
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
      '把 Claude、Cursor、Windsurf 以及任何兼容 MCP 的助手连接到 100+ 个生成模型。提供托管端点，无需安装；内置 19 个结构化工具，包含输入输出 schema、异步轮询和账户管理。',
    code: `claude mcp add --transport http muapi \\
  https://api.muapi.ai/mcp \\
  --header "Authorization: Bearer YOUR_KEY"`,
    href: 'https://github.com/SamurAIGPT/muapi-mcp-server',
  },
  {
    tag: '技能',
    title: '生成媒体技能',
    icon: FaStar,
    description:
      '面向 Claude Code、Cursor 和 Gemini CLI 的多模态工具包。内含 Cinema Director、Nano-Banana、UI Designer、Logo Creator、Seedance 2、AI Clipping 和 YouTube Shorts 等预设，适合智能体直接驱动，支持 JSON 输出与语义化退出码。',
    code: `npx skills add SamurAIGPT/Generative-Media-Skills --all`,
    href: 'https://github.com/SamurAIGPT/Generative-Media-Skills',
  },
];

const QUICK_STEPS = [
  { num: '1', title: '安装 CLI', code: 'npm install -g muapi-cli' },
  { num: '2', title: '登录', code: 'muapi auth login' },
  { num: '3', title: '添加技能', code: 'npx skills add SamurAIGPT/Generative-Media-Skills' },
];

const EXAMPLES = [
  { title: '图像生成', code: 'muapi image generate "清晨宁静的山间湖泊" \\\n  --model flux-dev --download ./outputs' },
  { title: '文生视频', code: 'muapi video generate "一只狗在海滩上奔跑" \\\n  --model kling-master' },
  { title: '音频生成', code: 'muapi audio create "适合学习的轻快 lo-fi hip hop"' },
  { title: '运行技能', code: 'bash library/visual/nano-banana/scripts/\\\n  generate-nano-art.sh --file image.jpg --view' },
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
            面向开发者和 AI 智能体
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MCP 与 CLI</h1>
          <p className="text-white/60 text-base md:text-lg max-w-2xl">
            你可以在终端、IDE 或任何兼容 MCP 的助手中使用 MozenAIGC。
            无需离开现有工作流，就能生成电影感图像、视频和音频。
          </p>
        </section>

        {/* Quick start */}
        <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 md:p-8 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">快速上手</span>
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
                  <span>在 GitHub 查看</span>
                  <FaExternalLinkAlt className="text-[10px]" />
                </div>
              </a>
            );
          })}
        </section>

        {/* Examples */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">示例</span>
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
          开源 · MIT 许可 · 兼容 Claude、Cursor、Windsurf 和 Gemini CLI
        </p>
      </div>
    </div>
  );
}
