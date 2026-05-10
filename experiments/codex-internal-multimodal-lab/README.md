# Codex Internal Multimodal Lab

本目录用于测试 Codex 内部能力辅助项目创作，不接入外部 PAI、视频或语音模型。

## 当前边界

- 分析推理：由 Codex 中的 GPT-5.5 xhigh 完成。
- 图像生成：由 Codex `imagegen` 技能完成，默认使用内置图像生成路径。
- 视频/语音/音乐：暂不接入模型，只产出规格、脚本、分镜和后续接入建议。
- 项目运行时：不直接调用 Codex 内部模型能力。

## 目录约定

```text
experiments/codex-internal-multimodal-lab/
  input/              # 放置参考图、截图、关键帧
  output/             # 放置分析报告、prompt 包和生成资产
  manifest.json       # 测试能力矩阵
```

## 建议测试闭环

1. 图片/截图分析 -> `output/analysis.md`
2. 中文需求 -> 结构化 Prompt -> `output/prompt-pack.json`
3. Prompt -> imagegen 生图 -> `output/generated-assets/`
4. 视频关键帧 -> 分镜与节奏分析 -> `output/shot-list.md`

## 暂不测试

- 运行时视频生成
- 运行时语音合成
- 运行时音乐生成
- PAI 外部服务接入
- 用户端直接调用 Codex 内部模型
