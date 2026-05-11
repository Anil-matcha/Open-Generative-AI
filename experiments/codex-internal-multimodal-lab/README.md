# Codex Internal Multimodal Lab

本目录用于测试 Codex 内部能力辅助项目创作，不接入外部 PAI、视频或语音模型。当前优先验证 3 个最有价值的本地闭环。

## 当前边界

- 分析推理：由 Codex 中的 GPT-5.5 xhigh 完成。
- 图像生成：由 Codex `imagegen` 技能完成，默认使用内置图像生成路径。
- 视频/语音/音乐：暂不接入模型，只产出规格、脚本、分镜和后续接入建议。
- 项目运行时：不直接调用 Codex 内部模型能力。
- 项目资产：最终可引用图片统一复制到 `public/assets/codex-lab/`。

## 目录约定

```text
experiments/codex-internal-multimodal-lab/
  input/
    brief.md                    # 创作需求输入模板
    screenshots/                # 图片、截图、页面状态图
    references/                 # 风格参考、角色参考、竞品参考
  output/
    analysis-template.md         # 中文分析报告模板
    analysis-draft.md            # 本地脚本生成的待补充分析草稿
    multi-image-comparison.md     # 当前多图对比分析样例
    multi-image-comparison-draft.md
    prompt-pack.example.json     # Prompt / 分镜 / 参数建议示例
    prompt-retrospective.md      # 三张概念图的 Prompt 复盘
    imagegen-prompts.example.jsonl
    asset-index.example.json
    asset-index.json
    integration-decision.md
    generated-assets/            # imagegen 默认产物转存或候选图记录
  manifest.json                  # 测试能力矩阵

public/assets/codex-lab/          # 项目可直接引用的最终概念图
```

## 三个优先闭环

1. 图片/截图分析 -> 输出中文分析报告
   - 输入：`input/screenshots/*` 或 `input/references/*`
   - 输出：`output/analysis.md`
   - 模板：`output/analysis-template.md`

2. 创作需求 -> 生成结构化 Prompt / 分镜 / 参数建议
   - 输入：`input/brief.md`
   - 输出：`output/prompt-pack.json`
   - 示例：`output/prompt-pack.example.json`

3. Prompt -> 用 imagegen 生成概念图 -> 存入项目资产目录
   - 输入：`output/imagegen-prompts.jsonl`
   - 候选输出：`output/generated-assets/`
   - 最终资产：`public/assets/codex-lab/`
   - 资产索引：`output/asset-index.json`

## 可扩展测试：多图对比

- 输入：`output/asset-index.json` 中的 accepted 资产，或人工指定的 2-6 张参考图。
- 草稿：`output/multi-image-comparison-draft.md`
- 样例：`output/multi-image-comparison.md`
- 验收：输出整体一致性、单图分工、两两差异矩阵、可复用风格规则和下游 Prompt 线索。

## 当前资产

- `public/assets/codex-lab/concept-hero.png`
- `public/assets/codex-lab/concept-character.png`
- `public/assets/codex-lab/concept-scene.png`

页面资产卡片从 `output/asset-index.json` 派生，避免在 `/codex-lab` 页面里重复维护资产清单。

`asset-index.json` 已升级为可筛选资产库，包含：

- `library.filters.types`：可筛选类型列表。
- `types`：类型标签与说明。
- `assets[].type`：资产类型。
- `assets[].tags`：资产标签。
- `assets[].scores.usability`：页面按可用性分数降序展示。

## 执行方式

1. 把截图、参考图或关键帧放到 `input/screenshots/`、`input/references/`。
2. 让 Codex 基于 `analysis-template.md` 输出中文分析报告。
3. 把创作需求填入 `input/brief.md`，生成 `prompt-pack.json`。
4. 从 `prompt-pack.json` 提取最终生图 Prompt，整理为 `imagegen-prompts.jsonl`。
5. 逐条调用 Codex `imagegen`，选择可用概念图。
6. 把最终图片复制到 `public/assets/codex-lab/`，并在 `asset-index.json` 记录来源 Prompt 与用途。

## 本地脚本

把新截图放入 `input/screenshots/` 后，可运行：

```bash
npm run codex-lab:analysis-draft
```

脚本会扫描截图目录并生成 `output/analysis-draft.md`。它只生成结构化草稿，不调用外部 API，也不替代 Codex 多模态观察。

常用参数：

```bash
npm run codex-lab:analysis-draft -- --latest-only
npm run codex-lab:analysis-draft -- --changed-only
npm run codex-lab:compare-draft
```

- `--latest-only`：只保留最新一张截图。
- `--changed-only`：只处理比输出草稿更新的截图。

`codex-lab:compare-draft` 默认读取 `output/asset-index.json` 中的 accepted 资产，并生成 `output/multi-image-comparison-draft.md`。

## 接入决策

当前分支继续保持“不接 PAI、不接正式运行时 API”。决策记录见 `output/integration-decision.md`。

## 暂不测试

- 运行时视频生成
- 运行时语音合成
- 运行时音乐生成
- PAI 外部服务接入
- 用户端直接调用 Codex 内部模型
