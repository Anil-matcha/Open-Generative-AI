import Link from "next/link";
import AssetLibraryClient from "./AssetLibraryClient";
import assetIndex from "../../experiments/codex-internal-multimodal-lab/output/asset-index.json";

export const metadata = {
  title: "Codex Lab｜Open Generative AI",
  description: "本地 Codex 多模态与图像生成实验入口，不接入外部 PAI、视频或语音模型。",
};

const capabilityRows = [
  {
    name: "截图/图片分析",
    input: "图片路径、截图或参考图",
    output: "主体、构图、风格、问题点分析",
    status: "可测",
  },
  {
    name: "多图对比",
    input: "2-6 张参考图",
    output: "一致性、差异矩阵、风格规则",
    status: "可测",
  },
  {
    name: "视频关键帧分析",
    input: "本地抽帧后的图片序列",
    output: "镜头节奏、叙事结构、分镜建议",
    status: "可测",
  },
  {
    name: "创作 Prompt 生成",
    input: "中文需求、角色设定、目标平台",
    output: "多资产 Prompt Pack、分镜、参数建议",
    status: "可测",
  },
  {
    name: "概念图生成",
    input: "结构化 Prompt 或批量 JSONL",
    output: "由 Codex imagegen 生成的位图资产",
    status: "可测",
  },
  {
    name: "资产质量门禁",
    input: "asset-index.json、最终资产目录",
    output: "schema 校验、路径检查、图片尺寸报告",
    status: "可测",
  },
  {
    name: "视频/语音生成",
    input: "脚本、台词、音色、视频参数",
    output: "暂不接入模型，只保留规格草案",
    status: "暂缓",
  },
];

const priorityLoops = [
  {
    id: "01",
    title: "图片/截图分析",
    flow: "图片或截图 -> GPT-5.5 xhigh -> 中文分析报告",
    input: "experiments/codex-internal-multimodal-lab/input/screenshots",
    output: "experiments/codex-internal-multimodal-lab/output/analysis.md",
    checks: ["主体与场景识别", "构图和视觉层级", "可复用风格词", "问题点与改进建议"],
  },
  {
    id: "02",
    title: "创作需求结构化",
    flow: "中文需求 -> GPT-5.5 xhigh -> Prompt / 分镜 / 参数建议",
    input: "experiments/codex-internal-multimodal-lab/input/brief.md",
    output: "experiments/codex-internal-multimodal-lab/output/prompt-pack.json",
    checks: ["中英 Prompt", "镜头表", "画幅/时长/风格参数", "负面约束"],
  },
  {
    id: "03",
    title: "概念图生成",
    flow: "结构化 Prompt -> Codex imagegen -> 项目资产目录",
    input: "experiments/codex-internal-multimodal-lab/output/imagegen-prompts.jsonl",
    output: "public/assets/codex-lab/",
    checks: ["生成图可用于页面", "资产路径稳定", "Prompt 可复现", "不接运行时 API"],
  },
];

const runbook = [
  "把截图、参考图或关键帧放到 input 对应子目录。",
  "用 analysis-template.md 生成中文分析报告，保留观察、判断和建议。",
  "用 prompt-pack.example.json 产出结构化 Prompt、分镜和参数建议。",
  "用 imagegen-prompts.example.jsonl 逐条调用 Codex imagegen。",
  "把最终概念图复制到 public/assets/codex-lab，并在资产索引里记录来源 Prompt。",
];

const outputItems = [
  "analysis.md",
  "analysis-draft.md",
  "multi-image-comparison.md",
  "multi-image-comparison-draft.md",
  "prompt-pack.json",
  "prompt-pack-draft.json",
  "prompt-retrospective.md",
  "shot-list.md",
  "imagegen-prompts.jsonl",
  "imagegen-prompts-draft.jsonl",
  "imagegen-prompts-batch.jsonl",
  "asset-index.json",
  "asset-index-validation.md",
  "asset-check-report.md",
  "integration-decision.md",
  "generated-assets/",
];

const assetTypes = Object.fromEntries(
  assetIndex.types.map((type) => [type.id, type])
);

const assetTypeFilters = assetIndex.types.map((type) => ({
  ...type,
  count: assetIndex.assets.filter((asset) => asset.type === type.id).length,
}));

const assetSlots = assetIndex.assets
  .map((asset) => ({
    name: asset.filename,
    id: asset.id,
    assetType: asset.type,
    type: assetTypes[asset.type]?.label ?? asset.type,
    purpose: asset.purpose,
    source: asset.source_prompt_id,
    status: asset.status === "accepted" ? "已生成" : "待生成",
    preview: `/${asset.workspace_path.replace(/^public\//, "")}`,
    usability: asset.scores?.usability ?? 0,
    tags: asset.tags ?? [],
  }))
  .sort((a, b) => b.usability - a.usability);

export default function CodexLabPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[#080808]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-[#d9ff00]">
              本地实验分支
            </p>
            <h1 className="text-3xl font-black leading-tight">
              Codex 多模态实验台
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
              用 Codex 中的 GPT-5.5 xhigh 做分析推理，用 imagegen 生成位图资产。
              当前页面只定义测试入口和产物规范，不在项目运行时接入外部 PAI、视频或语音模型。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/studio"
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
            >
              返回工作台
            </Link>
            <a
              href="#task-sheet"
              className="rounded-lg bg-[#d9ff00] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
            >
              开始测试
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[360px_1fr]">
        <aside id="task-sheet" className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 className="mb-4 text-lg font-bold">任务单</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/60">
                  测试目标
                </span>
                <textarea
                  className="min-h-28 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d9ff00]/60"
                  placeholder="例如：分析三张参考图，提炼统一角色风格，并生成两组概念图 Prompt。"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/60">
                  输入素材路径
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d9ff00]/60"
                  placeholder="experiments/.../input"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/60">
                  输出目录
                </span>
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d9ff00]/60"
                  placeholder="experiments/.../output"
                />
              </label>
              <button
                type="button"
                disabled
                title="下一步接入本地脚本或人工 Codex 执行"
                className="h-11 w-full rounded-lg bg-white/10 text-sm font-bold text-white/35"
              >
                生成本地任务包
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0b0b0b] p-5">
            <h2 className="mb-4 text-lg font-bold">执行边界</h2>
            <div className="space-y-3 text-sm leading-6 text-white/55">
              <p>分析推理：Codex GPT-5.5 xhigh。</p>
              <p>图像生成：Codex imagegen，默认内置路径。</p>
              <p>视频语音：暂不接入，先输出规格。</p>
              <p>线上 API：本实验页不直接调用。</p>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="grid gap-4 xl:grid-cols-3">
            {priorityLoops.map((loop) => (
              <div
                key={loop.id}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-md bg-[#d9ff00] px-2.5 py-1 text-xs font-black text-black">
                    Loop {loop.id}
                  </span>
                  <span className="text-xs font-semibold text-white/35">本地闭环</span>
                </div>
                <h2 className="text-lg font-bold">{loop.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-white/55">
                  {loop.flow}
                </p>
                <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-black/35 p-3 font-mono text-xs leading-5 text-white/45">
                  <div>input: {loop.input}</div>
                  <div>output: {loop.output}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {loop.checks.map((check) => (
                    <span
                      key={check}
                      className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white/55"
                    >
                      {check}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-bold">功能测试矩阵</h2>
                <p className="mt-1 text-sm text-white/45">
                  先验证 Codex 可稳定产出哪些内容，再决定是否接入正式服务。
                </p>
              </div>
              <span className="rounded-lg border border-[#d9ff00]/30 bg-[#d9ff00]/10 px-3 py-1 text-sm font-bold text-[#d9ff00]">
                不接 PAI
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/10">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[1.1fr_1.2fr_1.4fr_80px] bg-white/[0.04] text-sm font-bold text-white/60">
                  <div className="p-3">能力</div>
                  <div className="p-3">输入</div>
                  <div className="p-3">输出</div>
                  <div className="p-3">状态</div>
                </div>
                {capabilityRows.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1.1fr_1.2fr_1.4fr_80px] border-t border-white/10 text-sm"
                  >
                    <div className="p-3 font-semibold text-white/85">{row.name}</div>
                    <div className="p-3 text-white/50">{row.input}</div>
                    <div className="p-3 text-white/50">{row.output}</div>
                    <div className="p-3">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                          row.status === "可测"
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-amber-400/10 text-amber-300"
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-[#0b0b0b] p-5">
              <h2 className="mb-4 text-lg font-bold">建议执行流程</h2>
              <ol className="space-y-3">
                {runbook.map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-white/55">
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[#d9ff00]/15 text-xs font-black text-[#d9ff00]">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0b0b0b] p-5">
              <h2 className="mb-4 text-lg font-bold">产物目录</h2>
              <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm leading-7 text-white/65">
                <div>experiments/codex-internal-multimodal-lab/</div>
                {outputItems.map((item) => (
                  <div key={item} className="pl-5 text-white/45">
                    output/{item}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-white/45">
                生图结果若用于项目页面，需要从 Codex 默认生成目录复制到本仓库资产目录后再引用。
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#0b0b0b] p-5">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-bold">项目资产落点</h2>
                <p className="mt-1 text-sm text-white/45">
                  imagegen 生成结果统一进入 public/assets/codex-lab，页面从 asset-index.json 派生展示。
                </p>
              </div>
              <span className="font-mono text-xs text-white/35">
                /assets/codex-lab/*
              </span>
            </div>
            <AssetLibraryClient filters={assetTypeFilters} assets={assetSlots} />
          </section>
        </div>
      </section>
    </main>
  );
}
