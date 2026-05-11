# 多图对比分析草稿

## 基本信息

- 草稿生成时间：2026-05-11T01:07:45.805Z
- 资产索引：`experiments/codex-internal-multimodal-lab/output/asset-index.json`
- 输出文件：`experiments/codex-internal-multimodal-lab/output/multi-image-comparison-draft.md`
- 资产范围：accepted assets only
- 工作流设定：本脚本只生成多图对比草稿，不调用外部 API，不替代 Codex 多模态观察。

## 待对比资产

| id | 类型 | 路径 | 可用性 | Prompt 控制 | 视觉贴合 | 文本风险 | bytes |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| concept-hero | 主视觉 | `public/assets/codex-lab/concept-hero.png` | 92 | 82 | 94 | 66 | 1815686 |
| concept-character | 角色/智能体 | `public/assets/codex-lab/concept-character.png` | 87 | 88 | 90 | 84 | 1822799 |
| concept-scene | 场景风格板 | `public/assets/codex-lab/concept-scene.png` | 84 | 78 | 92 | 62 | 2408658 |

## Codex 多图观察提示

1. 查看 `public/assets/codex-lab/concept-hero.png`，记录它的主体、构图、色彩、文本风险、最适合的页面位置和可复用 Prompt 词。
2. 查看 `public/assets/codex-lab/concept-character.png`，记录它的主体、构图、色彩、文本风险、最适合的页面位置和可复用 Prompt 词。
3. 查看 `public/assets/codex-lab/concept-scene.png`，记录它的主体、构图、色彩、文本风险、最适合的页面位置和可复用 Prompt 词。

## 一、整体一致性

- 共同风格基因：
- 共同色彩与材质：
- 共同叙事方向：
- 系列感是否成立：

## 二、单图分工

| 资产 | 最适合用途 | 最强视觉点 | 主要风险 | 建议使用位置 |
| --- | --- | --- | --- | --- |
| concept-hero.png |  |  |  |  |
| concept-character.png |  |  |  |  |
| concept-scene.png |  |  |  |  |

## 三、两两差异矩阵

| 对比组 | 相同点 | 差异点 | 是否需要重生成 |
| --- | --- | --- | --- |
| concept-hero.png vs concept-character.png |  |  |  |
| concept-hero.png vs concept-scene.png |  |  |  |
| concept-character.png vs concept-scene.png |  |  |  |

## 四、可复用风格规则

1.
2.
3.

## 五、下游 Prompt 线索

```text
主体：
场景：
风格：
构图：
颜色：
避免：
```

## 六、结论

- 可直接复用资产：
- 需要裁切或二次生成资产：
- 下一轮最值得测试的变体：
