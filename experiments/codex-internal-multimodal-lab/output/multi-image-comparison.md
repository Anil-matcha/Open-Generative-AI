# 多图对比分析

## 对比目标

对比当前 3 张 Codex Lab 概念图资产，验证它们是否能组成同一套“本地多模态创作实验台”的视觉资产组，并提炼后续批量生图可复用的风格规则。

## 对比对象

| 资产 | 类型 | 路径 | 可用性 |
| --- | --- | --- | ---: |
| `concept-hero.png` | 主视觉 | `public/assets/codex-lab/concept-hero.png` | 92 |
| `concept-character.png` | 角色/智能体 | `public/assets/codex-lab/concept-character.png` | 87 |
| `concept-scene.png` | 场景风格板 | `public/assets/codex-lab/concept-scene.png` | 84 |

## 总体结论

三张图可以作为同一组实验资产使用。它们都围绕“深色本地工作台、分析报告、Prompt 卡片、概念图输出”建立系列感，同时各自承担不同功能：`concept-hero.png` 负责解释闭环，`concept-character.png` 负责智能体身份，`concept-scene.png` 负责补充叙事氛围。

当前最大共性风险是生成图里的 UI 文本不应承载真实信息。后续 Prompt 应继续使用 `abstract text blocks`、`icons`、`placeholder panels`，把可读内容交给真实页面渲染。

## 一、整体一致性

- 共同风格基因：深色产品工作台、黑玻璃面板、柔白报告块、酸性黄绿色状态信号。
- 共同叙事方向：都在表达从视觉输入到结构化分析，再到 Prompt 或概念图资产的转化过程。
- 共同适用场景：实验页、内部文档、能力矩阵、工作流说明、资产库预览。
- 系列感判断：成立，但下一轮需要更严格限制可读文字，并统一“3 个闭环”的图形表达。

## 二、单图分工

| 资产 | 最适合用途 | 最强视觉点 | 主要风险 | 建议使用位置 |
| --- | --- | --- | --- | --- |
| `concept-hero.png` | 页面主视觉、实验文档封面 | 能概括输入、分析、Prompt、输出的流程 | 局部 UI 文本可能误导用户 | `/codex-lab` 顶部或工作流总览 |
| `concept-character.png` | 智能体头像、能力卡片 | 中心主体更有识别度，适合表达 Codex 内部助手 | 小尺寸下周边细节会损失 | agent 卡片、侧栏头像、能力介绍 |
| `concept-scene.png` | 场景风格板、分镜参考 | 空间叙事更强，适合说明“创作现场” | 信息密度偏高，裁切后需保留焦点 | 文档插图、分镜说明、案例页 |

## 三、两两差异矩阵

| 对比组 | 相同点 | 差异点 | 是否需要重生成 |
| --- | --- | --- | --- |
| `concept-hero.png` vs `concept-character.png` | 都能体现深色实验台和多模态素材块 | 前者是流程解释，后者是身份符号 | 不需要，角色图可补一个更简化头像版 |
| `concept-hero.png` vs `concept-scene.png` | 都表达从输入到输出的创作路径 | 前者更产品化，后者更叙事化 | 不需要，场景图可补一个低文字风险版 |
| `concept-character.png` vs `concept-scene.png` | 都适合做辅助视觉资产 | 前者聚焦主体，后者聚焦环境和过程 | 不需要，二者用途互补 |

## 四、可复用风格规则

1. 固定核心视觉语言：`dark product workspace`、`black glass panels`、`soft white report blocks`、`acid lime status signals`。
2. 每张图必须声明资产用途和落点，例如 hero、assistant avatar、scene style frame。
3. UI 文本一律改为抽象块、短线、图标或不可读占位，不要求模型生成真实中文。
4. 保留“本地项目文件、分析报告、Prompt 卡片、最终概念图板”四类元素，但根据资产类型调整主次。
5. 禁止外部 API 标志、随机品牌、水印、复杂机器人套路和过度霓虹化。

## 五、下游 Prompt 线索

```text
主体：本地 AI 多模态创作实验台，一组从视觉输入到分析报告、Prompt 卡片和概念图资产的工作流
场景：深色项目工作台，包含本地文件夹、截图缩略图、报告面板、Prompt 卡片、最终资产板
风格：克制的高质量产品概念图，黑玻璃、柔白纸面、酸性黄绿色状态点，专业但有创造力
构图：按用途选择 16:9 主视觉、1:1 智能体头像、3:2 场景风格板；主体清晰，留出可裁切空间
避免：真实 UI 截图、可读错误文字、外部品牌标志、水印、杂乱界面、过度科幻机器人
```

## 六、结论

- 可直接复用资产：`concept-hero.png`、`concept-character.png`、`concept-scene.png` 均可进入当前实验页或文档。
- 需要裁切或二次生成资产：`concept-character.png` 若用于 96px 以下头像，建议生成简化版；`concept-scene.png` 若用于小卡片，建议裁切中心焦点。
- 下一轮最值得测试的变体：低文字风险 hero、极简头像、移动端横幅裁切版。
