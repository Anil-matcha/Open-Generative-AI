# Prompt 复盘

## 目标

复盘三张 `imagegen` 概念图的 Prompt 表现，记录哪些约束有效、哪些约束需要下次加强，方便后续资产批量生成时复用。

## 总体结论

- 有效方向：明确资产用途、画幅、工作流阶段、禁止外部 Logo 和水印，会显著提升可用性。
- 主要风险：模型仍倾向生成看似真实但不可读的 UI 文本；中文短字有时可用，但不适合承载关键信息。
- 下一轮策略：保留“深色工作台 + 酸性黄绿色状态信号”的风格基因，同时把可读文字改为抽象块、图标、标签形状。

## concept-hero.png

- 类型：主视觉
- Prompt id：`codex-lab-hero`
- 用途：页面主视觉、工作流总览、实验文档封面。

### 有效约束

- `left-to-right workflow` 让输入、分析、Prompt、输出的顺序非常清楚。
- `not an actual UI screenshot` 降低了直接复刻页面的风险，使画面更像产品概念图。
- `acid lime accents` 和 `dark product workspace` 保持了与 `/codex-lab` 页面一致的视觉识别。

### 失效或偏弱约束

- `no readable fake UI text` 没有完全抑制 UI 文本，画面仍出现了较多类似可读的中文和英文标签。
- 画面把流程扩展成 4 步，而不是实验页定义的 3 条闭环；概念上可接受，但下次应更明确“三个闭环卡片”。

### 下次 Prompt 调整

```text
Replace all readable UI copy with abstract blocks, icons, and short neutral labels.
Show exactly three loop cards: analysis report, prompt pack, accepted image asset.
```

## concept-character.png

- 类型：角色/智能体
- Prompt id：`codex-lab-agent`
- 用途：智能体头像、能力卡片、内部角色化表达。

### 有效约束

- `no literal robot cliche` 有效避免了普通机器人形象。
- `layered analysis panes, image tiles, prompt cards` 让“智能体”与多模态工作流绑定，而不是独立吉祥物。
- `centered 1:1 portrait` 使缩略图和卡片头像场景都比较稳。

### 失效或偏弱约束

- 方形图用于头像时仍偏复杂，中心主体在小尺寸下可能不够锐利。
- 周围界面碎片较多，作为导航头像时需要裁切或二次生成简化版。

### 下次 Prompt 调整

```text
Simplify the surrounding panels by 40 percent.
Keep one luminous core silhouette and no more than six supporting tiles.
Make it readable at 96px square.
```

## concept-scene.png

- 类型：场景风格板
- Prompt id：`codex-lab-scene`
- 用途：分镜参考、流程说明、场景气质板。

### 有效约束

- `local project studio`、`folders, analysis notes, prompt cards` 让本地图像工作流的物理感更强。
- `warm highlights with cool shadows` 让画面比纯黑 UI 更有叙事空间。
- `left-to-right process path` 保持了可解释的流程阅读方向。

### 失效或偏弱约束

- 模型仍生成了较多可读/半可读中文文本，作为纯风格板可以接受，但不能当准确 UI 文案使用。
- 画面视觉完成度高，但信息密度偏大；用于小尺寸文档插图时需要裁切重点区域。

### 下次 Prompt 调整

```text
Use abstract placeholder text only: lines, blocks, and icons, no readable words.
Reduce secondary paper notes; make the final asset board the single brightest focal point.
```

## 可复用规则

1. 每条 Prompt 必须声明资产用途和最终落点。
2. 对 UI/报告类画面，优先要求 `abstract text blocks`，避免“可读但错误”的生成文字。
3. 对项目资产，继续保留 `no external service logos, no watermark, no random brand marks`。
4. 对系列一致性，固定：深色工作台、黑玻璃面板、柔白报告块、酸性黄绿色信号点。
5. 对下游页面，所有 accepted 图片必须进入 `public/assets/codex-lab/` 并写入 `asset-index.json`。
