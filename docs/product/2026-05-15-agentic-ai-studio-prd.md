# MozenAIGC Agentic Studio 总体 PRD

> 版本：v0.1  
> 日期：2026-05-15  
> 状态：总体规划草案  
> 目标读者：产品、工程、Agent 编排、AIGC 制片工作流设计者

## 1. 产品定位

MozenAIGC Agentic Studio 是一个本地优先、开源可扩展的 Agent 生图生视频与 AI 影视漫剧生产平台。

它不是单纯的“模型调用器”，而是面向完整创作链路的智能制片系统：从一句想法、小说文本、参考视频或角色设定出发，自动完成剧本分析、角色资产、风格定调、分镜设计、镜头生成、口型同步、配音配乐、剪辑合成、质检复盘和发布导出。

对标参考是 Flova 这类 Storyboard + Agent + Timeline 的新一代 AI 视频平台，但本项目的差异化目标是：

- 本地优先：能接入本机已有项目、模型服务、GPU 服务和素材库。
- 开源可控：核心流程、数据结构、Agent 技能和工具适配层可自定义。
- 多项目融合：把 MozenAIGC、LumenX Studio、OpenMontage、MozenGene 等能力整合为统一生产系统。
- 面向影视漫剧：重点支持短剧、漫剧、动画短片、口播、宣传片、电影感镜头和批量内容生产。

## 2. 背景与机会

当前 Open-Generative-AI / MozenAIGC 已具备较宽的生成能力底座：

- 图像创作：文生图、图生图、多图参考、模型选择、生成历史。
- 视频创作：文生视频、图生视频、视频续写、视频历史恢复。
- 口型同步：人像图/视频 + 音频生成对口型视频。
- 电影控制：镜头、焦距、光圈、画幅等电影提示词控制。
- API Provider：多供应商配置、检测、白名单与能力标记。
- 本地推理：Electron + sd.cpp + Wan2GP 入口。
- 工作流与智能体：已有页面和 workspace 依赖，但主体验仍处于开发中。

同时，本地已有多个互补项目：

- LumenX Studio：小说到短漫剧的剧本分析、角色/场景/道具抽取、风格定调、分镜、Motion、Assembly。
- OpenMontage：Agentic video production，提供 pipeline manifests、stage director skills、tool registry、成本跟踪和渲染质检。
- MozenGene：预期作为角色基因、风格一致性、人物资产与模型记忆模块。
- OpenStoryline / openshorts / ArcReel / ArtCraft / Toonflow 等：可作为后续故事、短视频、剪辑、风格化和动画方向的插件能力。

机会点在于：把“单点模型生成”升级成“项目级 Agent 制片闭环”。

## 3. 产品愿景

一句话愿景：

> 让创作者用自然语言驱动一支可扩展的 AI 制片团队，从故事到成片都可控、可复用、可本地化。

长期形态：

- 用户创建一个项目，输入想法、小说、脚本、参考视频或角色设定。
- 系统生成项目记忆：主题、角色、世界观、风格、目标平台、预算、时长。
- Director Agent 选择合适 pipeline，并拆分任务给子 Agent。
- Story Agent 生成剧本、分集、场景和镜头。
- Art Agent 生成角色、场景、道具和风格资产。
- Storyboard Agent 生成可编辑分镜板。
- Motion Agent 批量生成镜头视频，支持抽卡和版本对比。
- Audio Agent 生成配音、口型、BGM、SFX 和字幕。
- Editor Agent 使用 OpenMontage / FFmpeg / Remotion / HyperFrames 合成时间线。
- Reviewer Agent 做一致性、节奏、字幕、音量、画面缺陷、成本和交付要求检查。
- 用户最终选择版本，一键导出或发布。

## 4. 目标用户

### 4.1 核心用户

1. AI 短漫剧创作者
   - 输入小说或剧情梗概。
   - 需要稳定角色、连续分镜、批量镜头和快速成片。
   - 关注角色一致性、画风统一、竖屏节奏、低成本批量产出。

2. AI 影视短片团队
   - 制作预告片、概念短片、广告片、剧情片段。
   - 需要电影感镜头、镜头语言、剪辑、配乐和版本管理。

3. 短视频运营团队
   - 批量生成口播、混剪、产品视频、种草视频、解说视频。
   - 关注模板复用、批量生产、平台适配、字幕和发布效率。

4. AI 工具开发者
   - 想把本地模型、脚本、工作流、API 服务接入统一平台。
   - 关注插件化、可调试、可替换、可扩展。

### 4.2 非核心用户

- 只想生成一张图的轻量用户。
- 只想用封闭 SaaS 快速出片且不关心可控性的用户。
- 完全不愿配置 API、本地服务或工作流的用户。

## 5. 成功标准

### 5.1 北极星指标

用户从输入故事梗概到导出 30-90 秒可用视频的成功率与平均耗时。

### 5.2 阶段性指标

MVP 阶段：

- 80% 的测试项目能完成“剧本 -> 分镜 -> 关键帧 -> 镜头视频 -> 合成导出”的最小闭环。
- 单个 30 秒短漫剧 demo 可在一次项目会话内完成。
- 每个生成资产都有来源、参数、版本和所属镜头。
- 至少支持 1 条 LumenX 漫剧路线和 1 条 OpenMontage 成片路线。

Beta 阶段：

- 支持 3 类模板：短漫剧、电影预告、口播短视频。
- 支持项目级角色一致性复用。
- 支持镜头级抽卡、评分、替换和回滚。
- 支持本地 Wan2GP 或云端视频模型混合调度。

长期：

- 用户可沉淀自己的 Skill / Pipeline / Style Pack。
- 多项目之间可复用角色、世界观、风格和工作流。
- 可作为本地 AI 影视生产中枢，统一管理多个外部项目。

## 6. 竞品与对标

### 6.1 Flova 的关键能力

公开文档显示，Flova 的核心概念包括：

- Storyboard：作为每个 scene 和 action 的核心视觉参考。
- Resource Group：同一素材的多个版本组织。
- Project Documents：保存项目记忆和制作约束。
- Timeline：把 Storyboard 物理实现为最终视频。
- Skill：可复用的专门能力。
- Planner：读取用户意图、Storyboard、Project Documents 和 Skill，调度子 Agent。
- 子 Agent：Storyboard Designer、Media Generator、Video Assembler 等。

参考：

- https://www.flova.ai/docs/en/CoreConcept
- https://www.flova.ai/docs/en/How_Flova_Works
- https://www.flova.ai/docs/zh-CN/SkillSystem

### 6.2 本项目超越方向

| 维度 | Flova 参考 | MozenAIGC Agentic Studio 目标 |
| --- | --- | --- |
| 部署 | 云端产品为主 | 本地优先 + Web + Electron + 可自托管 |
| 模型 | 平台内置能力 | Muapi/云端 API/本地 Wan2GP/sd.cpp/外部项目统一接入 |
| Agent | Planner + 子 Agent | Director Agent + Pipeline Agent + 本地工具注册表 |
| 分镜 | Storyboard 核心 | LumenX StoryBoard + MozenGene 一致性 + 版本资产组 |
| 后期 | Timeline/Assembler | OpenMontage + FFmpeg + Remotion + HyperFrames |
| 技能 | Skill 系统 | OpenMontage skills + Mozen 自定义 Skill Pack |
| 扩展 | 平台能力边界内 | 接入本地项目、脚本、模型、CLI、MCP、API |
| 垂直场景 | AI video generalist | AI 影视、短漫剧、短视频工业化生产 |

## 7. 产品原则

1. Storyboard 是项目主干  
   所有角色、场景、镜头、关键帧、视频片段、配音、字幕和时间线都要能回到具体分镜。

2. 项目记忆是长期资产  
   角色设定、世界观、风格规范、镜头偏好和用户审美反馈要沉淀为可复用 Project Memory。

3. 人在关键节点审批  
   Agent 可以自动生成和建议，但剧本、角色、分镜、最终镜头和导出版本需要支持用户确认。

4. 生成结果必须可追溯  
   每个资产记录模型、provider、prompt、seed、参考图、成本、生成时间和父级任务。

5. 本地服务优先作为一等能力  
   LumenX、OpenMontage、MozenGene、Wan2GP 等不是临时脚本，而是可注册、可检测、可调用的能力服务。

6. 先闭环，再追求大而全  
   第一阶段优先打通一个可演示、可重复的短漫剧/短片闭环，而不是一次性覆盖所有项目。

## 8. 总体信息架构

主导航建议调整为：

- 项目中心
- Agent 制片
- 故事/剧本
- 角色资产
- 分镜板
- 镜头生成
- 音频口型
- 时间线/合成
- 工作流
- 模型/API
- 应用中心

现有工作台保留，但从“散点功能”升级为“项目上下文内的工具”：

- 图像创作：成为资产生成、分镜图生成、角色图生成的工具。
- 视频创作：成为镜头 Motion 生成工具。
- 口型同步：成为 Audio/LipSync 工具。
- 电影创作：成为镜头语言与电影风格控制工具。
- 工作流：成为 Pipeline 编辑和调试工具。
- 智能体：成为 Director/子 Agent 管理工具。
- API 管理：成为 Provider/Local Runtime 管理工具。

## 9. 核心模块规划

### 9.1 项目中心 Project Hub

目标：管理所有 AI 影视/漫剧项目。

能力：

- 新建项目：选择类型、时长、画幅、目标平台、风格方向。
- 项目列表：草稿、生成中、待审查、已导出。
- 项目概览：故事、角色、分镜、资产、时间线、任务状态。
- 项目设置：Provider 策略、本地服务、预算、默认模型。

关键数据：

- project_id
- title
- type: comic_drama / cinematic_short / talking_head / product_ad / montage
- aspect_ratio
- target_duration
- target_platform
- project_memory
- default_pipeline
- provider_policy

### 9.2 Agent 制片 Director

目标：统一调度所有子系统。

能力：

- 理解用户意图。
- 判断项目类型。
- 选择 pipeline。
- 拆分任务。
- 调用外部服务。
- 汇总结果。
- 请求用户审批。
- 记录每一步决策。

子 Agent：

- Story Agent：故事、剧本、分集、场景。
- Character Agent：角色设定、形象一致性、参考资产。
- Art Director Agent：风格定调、色彩、镜头语言。
- Storyboard Agent：镜头拆分、分镜图、镜头说明。
- Motion Agent：图生视频、文生视频、视频续写。
- Audio Agent：配音、口型、BGM、SFX、字幕。
- Editor Agent：剪辑、时间线、转场、导出。
- Reviewer Agent：质量检查、成本检查、一致性检查。

### 9.3 故事与剧本 Storyline

目标：从输入文本、小说、梗概或参考视频生成可执行剧本。

能力：

- 小说/脚本导入。
- 自动提取角色、场景、道具、关系。
- 生成剧情大纲、分集、场景列表。
- 输出适合视频生产的结构化脚本。
- 支持用户编辑和锁定关键设定。

优先接入：

- LumenX 的实体提取和短漫剧 SOP。
- OpenStoryline 作为后续故事结构模块。

### 9.4 角色与资产库 Asset Genome

目标：保证角色、场景、道具、服装、风格的一致性。

能力：

- 角色卡：姓名、年龄、性格、外观、服装、动作、禁忌。
- 角色参考图：全身图、三视图、头像、表情、动作。
- 场景卡：空间、时代、光线、色彩、氛围。
- 道具卡：形状、材质、用途、出现镜头。
- 风格卡：正向提示词、负向提示词、色彩、镜头、画风。
- 版本组：同一角色/场景/道具的多个生成版本。

优先接入：

- LumenX 角色/场景/道具资产生成。
- MozenGene 角色基因和风格一致性能力。
- ArtCraft 作为风格化资产能力。

### 9.5 分镜板 Storyboard

目标：把剧本转成可编辑、可生成、可审查的镜头结构。

能力：

- 自动生成镜头列表。
- 每个镜头包含画面、角色、场景、道具、动作、台词、时长、镜头语言。
- 每个镜头可以绑定角色参考、场景参考、道具参考和风格参考。
- 生成关键帧/分镜图。
- 支持镜头增删改、重排、锁定。
- 支持镜头级抽卡和版本对比。

优先接入：

- LumenX StoryBoard。
- MozenAIGC ImageStudio 多图参考。

### 9.6 镜头生成 Motion

目标：从分镜图和镜头说明批量生成视频片段。

能力：

- T2V：文本生成镜头。
- I2V：分镜图生成镜头。
- R2V：角色动作参考生成镜头。
- V2V：视频风格迁移、续写、修复。
- 多 batch 抽卡。
- 镜头质量评分。
- 镜头替换和回滚。

优先接入：

- MozenAIGC VideoStudio。
- Wan2GP 本地视频模型。
- LumenX Motion。
- Muapi 视频模型。

### 9.7 音频、口型与字幕 Audio

目标：让视频从画面片段升级成完整视听作品。

能力：

- 角色配音。
- 旁白生成。
- 音色管理。
- 口型同步。
- BGM 生成/选择。
- SFX 生成/选择。
- 字幕生成、校对和烧录。
- 音量、响度、淡入淡出。

优先接入：

- MozenAIGC LipSyncStudio。
- LumenX TTS/SFX/BGM。
- OpenMontage subtitle/audio tools。

### 9.8 时间线与合成 Timeline

目标：把镜头、音频、字幕和特效合成为最终视频。

能力：

- 镜头时间线。
- 轨道：视频、配音、BGM、SFX、字幕、Overlay。
- 自动转场。
- 平台模板：9:16、16:9、1:1。
- 导出：mp4、webm、字幕文件、项目包。
- 渲染报告：帧率、分辨率、码率、音频、字幕、时长。

优先接入：

- OpenMontage video_compose。
- Remotion。
- HyperFrames。
- FFmpeg。
- LumenX Assembly。

### 9.9 Skill 与 Pipeline 系统

目标：沉淀可复用的 Agent 能力。

能力：

- Skill 注册。
- Pipeline manifest 注册。
- Tool registry。
- 能力检测。
- 成本估算。
- 执行日志。
- 成功/失败复盘。

优先接入：

- OpenMontage skills。
- OpenMontage pipeline_defs。
- Mozen 自定义 Skill Pack。

### 9.10 Provider 与本地 Runtime

目标：统一管理云端 API、本地模型和外部项目服务。

能力：

- API Provider 管理。
- 模型白名单。
- 能力标签：image / video / audio / agent / workflow / local。
- 本地服务检测：LumenX、OpenMontage、MozenGene、Wan2GP。
- 健康检查。
- 自动 fallback。
- 成本和速度策略。

## 10. 推荐系统架构

### 10.1 前端

- Next.js App Router 作为主 Web 入口。
- Electron 作为桌面入口和本地能力桥。
- packages/studio 作为共享 UI 组件库。
- 新增 Project Hub、Storyboard、Timeline、Asset Library 组件。

### 10.2 后端/服务层

建议新增统一的 Integration API 层：

- `/api/projects/*`：项目数据。
- `/api/agents/*`：Agent 会话与任务调度。
- `/api/integrations/lumenx/*`：LumenX 服务适配。
- `/api/integrations/openmontage/*`：OpenMontage pipeline/tool 适配。
- `/api/integrations/mozengene/*`：角色基因与一致性适配。
- `/api/jobs/*`：异步任务、状态、日志。
- `/api/assets/*`：资产、版本、文件引用。

### 10.3 数据存储

MVP 可先用本地 JSON + 文件系统，Beta 再升级 SQLite/Postgres。

建议项目目录结构：

```text
projects/
  <project_id>/
    project.json
    memory.json
    script.json
    characters/
    scenes/
    props/
    storyboard.json
    assets/
    jobs/
    timeline.json
    renders/
    reports/
```

### 10.4 外部项目接入方式

优先采用“服务适配器”而不是直接把所有代码搬进主仓库。

- LumenX：作为 FastAPI 服务运行，主项目通过 HTTP 调用。
- OpenMontage：作为 CLI/Python tool registry 调用，后续可包装为本地 API。
- MozenGene：如果已有服务则 HTTP 接入；如果是库则先 CLI 包装。
- Wan2GP：沿用现有 Electron provider。

## 11. 核心数据模型草案

### 11.1 Project

```json
{
  "id": "project_001",
  "title": "霓虹剑客",
  "type": "comic_drama",
  "aspect_ratio": "9:16",
  "target_duration_seconds": 60,
  "target_platform": "douyin",
  "status": "storyboard",
  "project_memory_id": "memory_001",
  "default_pipeline": "lumenx-comic-drama-v1",
  "created_at": "2026-05-15T00:00:00+08:00",
  "updated_at": "2026-05-15T00:00:00+08:00"
}
```

### 11.2 Shot

```json
{
  "id": "shot_001",
  "scene_id": "scene_001",
  "order": 1,
  "duration_seconds": 4,
  "description": "雨夜街头，女主回头看见霓虹下的追兵。",
  "dialogue": "你们还是追来了。",
  "camera": {
    "shot_size": "medium close-up",
    "movement": "slow push in",
    "lens": "50mm",
    "aperture": "f/1.4"
  },
  "references": {
    "character_ids": ["character_heroine"],
    "scene_ids": ["scene_neon_street"],
    "asset_version_ids": ["assetv_001", "assetv_002"]
  },
  "status": "keyframe_ready"
}
```

### 11.3 Asset Version

```json
{
  "id": "assetv_001",
  "asset_id": "character_heroine",
  "type": "image",
  "role": "character_full_body",
  "url": "/projects/project_001/assets/heroine/full_body_v1.png",
  "provider": "muapi",
  "model": "nano-banana-2-edit",
  "prompt": "consistent cyberpunk heroine full body reference",
  "input_asset_version_ids": [],
  "score": 0.86,
  "locked": true,
  "created_at": "2026-05-15T00:00:00+08:00"
}
```

### 11.4 Job

```json
{
  "id": "job_001",
  "project_id": "project_001",
  "type": "shot_i2v",
  "status": "running",
  "provider": "wan2gp",
  "model": "wan2gp:wan22-i2v",
  "input": {
    "shot_id": "shot_001",
    "keyframe_asset_version_id": "assetv_100"
  },
  "output_asset_version_ids": [],
  "logs": [],
  "cost_estimate": 0,
  "created_at": "2026-05-15T00:00:00+08:00"
}
```

## 12. MVP 范围

MVP 目标：完成一个 30-60 秒短漫剧项目闭环。

### 12.1 必须包含

- 项目中心：创建/打开项目。
- 项目记忆：保存项目类型、画幅、风格、角色、目标时长。
- LumenX 接入：剧本分析、实体提取、分镜生成。
- 资产库：角色/场景/道具基础展示和版本记录。
- 分镜板：镜头列表、镜头详情、关键帧生成入口。
- 镜头生成：调用现有 VideoStudio 或 provider 生成镜头片段。
- 合成导出：调用 OpenMontage 或 FFmpeg 合并镜头。
- 任务中心：显示生成中、成功、失败任务。
- 项目文件落盘：project.json、storyboard.json、assets、timeline。

### 12.2 暂不包含

- 多人协作。
- 复杂权限系统。
- 云端素材市场。
- 完整社区 Skill 商店。
- 全自动发布到平台。
- 精细化收益/支付系统。

## 13. 阶段路线图

### Phase 0：统一规划与接口清点

周期：1 周

目标：

- 明确产品信息架构。
- 清点 LumenX、OpenMontage、MozenGene 可调用边界。
- 定义统一 Project/Shot/Asset/Job schema。
- 确认本地服务启动和健康检查方式。

交付：

- 本 PRD。
- Integration inventory。
- Data schema v0.1。
- Local runtime health check 设计。

### Phase 1：项目中心与数据底座

周期：1-2 周

目标：

- 新增 Project Hub。
- 新增项目文件结构。
- 新增项目读写 API。
- 把现有图像/视频生成结果可绑定到项目。

交付：

- `/studio/projects` 页面。
- `/api/projects` API。
- 本地项目目录持久化。
- Asset Version 基础记录。

### Phase 2：LumenX 短漫剧闭环

周期：2-4 周

目标：

- 接入 LumenX 剧本分析、实体提取、分镜生成。
- 在 MozenAIGC 中展示并编辑分镜。
- 支持从分镜生成关键帧。

交付：

- LumenX adapter。
- Story/Character/Scene/Prop 页面。
- Storyboard 页面。
- 角色/场景/道具资产基础版本组。

### Phase 3：镜头视频与抽卡机制

周期：2-4 周

目标：

- 支持分镜图到视频。
- 支持多 batch 生成与候选比较。
- 支持用户选择最终镜头版本。

交付：

- Shot Motion 页面。
- 镜头候选版本组。
- 与 Wan2GP/Muapi 视频模型的统一调用。
- 镜头级评分和锁定。

### Phase 4：OpenMontage 合成与质检

周期：2-4 周

目标：

- 接入 OpenMontage pipeline/tool registry。
- 把选定镜头、字幕、配音、BGM 合成为视频。
- 输出 render report。

交付：

- OpenMontage adapter。
- Timeline v0.1。
- FFmpeg/Remotion/HyperFrames 调用入口。
- 合成结果与质检报告。

### Phase 5：Director Agent 与 Skill 系统

周期：4-8 周

目标：

- 激活 AgentStudio 作为项目制片 Agent 控制台。
- Director Agent 能基于项目状态建议下一步。
- Skill/Pipeline 可注册、可选择、可执行。

交付：

- Agent Run 页面。
- Pipeline selector。
- Skill registry。
- Human approval gates。
- 执行日志和复盘。

### Phase 6：MozenGene 一致性增强

周期：并行推进

目标：

- 加强角色一致性、服装一致性、场景一致性和风格一致性。
- 支持角色基因库跨项目复用。

交付：

- Character Genome。
- Style Genome。
- Reference Pack。
- 一致性评分。

## 14. 用户旅程 MVP 示例

用户目标：生成一条 60 秒竖屏赛博短漫剧。

1. 用户进入项目中心，点击新建项目。
2. 选择“短漫剧”，画幅 9:16，目标时长 60 秒。
3. 粘贴剧情梗概或小说片段。
4. Director Agent 调用 LumenX 分析剧本，生成角色、场景、道具。
5. 用户确认角色设定和风格方向。
6. 系统生成 10-15 个分镜。
7. 用户编辑分镜顺序和台词。
8. 系统为主角生成全身图、三视图、头像。
9. 系统为每个分镜生成关键帧。
10. 用户选择满意关键帧并锁定。
11. 系统批量生成镜头视频，每个镜头生成 2-4 个候选。
12. 用户选择最终镜头。
13. 系统生成配音、字幕、BGM，并做口型同步。
14. OpenMontage 合成时间线。
15. Reviewer Agent 输出质检报告。
16. 用户导出最终 mp4。

## 15. 关键风险

1. 范围过大  
   风险：同时接太多模块，无法闭环。  
   应对：第一阶段只做“短漫剧 60 秒 MVP”。

2. 外部项目接口不稳定  
   风险：LumenX/OpenMontage/MozenGene 不是统一服务形态。  
   应对：先做 adapter 和 health check，不直接深度耦合。

3. 角色一致性不足  
   风险：生成结果能出片但不连续。  
   应对：优先接 LumenX 主参考图链路和 MozenGene 一致性能力。

4. 本地任务耗时长  
   风险：视频模型慢，用户等待不明确。  
   应对：任务中心、进度、失败恢复、后台继续生成。

5. 数据结构后期难迁移  
   风险：先用 localStorage 会限制项目级生产。  
   应对：项目数据从一开始落盘为 JSON/schema，localStorage 只做 UI 偏好。

6. UI 从工作台变复杂系统  
   风险：导航和页面散乱。  
   应对：以 Project Hub 为主入口，现有工作台变成项目工具。

## 16. 技术优先级建议

最高优先级：

- Project schema。
- Local project storage。
- LumenX health check + script/storyboard adapter。
- Storyboard UI。
- Asset version registry。

第二优先级：

- Shot generation queue。
- OpenMontage compose adapter。
- Timeline v0.1。
- Render report。

第三优先级：

- Director Agent。
- Skill registry。
- MozenGene consistency score。
- Cross-project asset reuse。

## 17. 需要进一步确认的问题

1. MozenGene 当前实际路径、技术栈和可调用接口是什么？
2. LumenX 是否应作为常驻 FastAPI 服务，还是按需启动？
3. OpenMontage 是先走 CLI 调用，还是先包装成本地 API？
4. 项目数据第一版是否接受 JSON 文件落盘，还是直接上 SQLite？
5. MVP 第一个模板选择“短漫剧”还是“电影预告片”？
6. 是否需要在第一版支持中文小说长文本切片？
7. 是否需要先支持竖屏 9:16，横屏作为后续？

## 18. 推荐第一版执行切入点

建议第一版不要先重做 UI，也不要先做完整 Agent。

最短闭环应为：

```text
Project Hub
  -> 粘贴剧情
  -> 调用 LumenX 生成角色/场景/道具/分镜
  -> 在 MozenAIGC 展示分镜
  -> 选中一个分镜生成关键帧
  -> 选中关键帧生成视频
  -> 选中多个镜头调用 OpenMontage/FFmpeg 合成
  -> 导出 mp4
```

这个闭环跑通后，再把 Director Agent 放到上面做自动规划和调度。

## 19. 里程碑验收标准

### M1：项目可创建

- 用户能创建项目。
- 项目写入本地目录。
- 刷新后仍能打开。

### M2：LumenX 分镜可导入

- 用户输入剧情。
- 系统生成结构化角色、场景、道具、分镜。
- 分镜能在 MozenAIGC 中展示。

### M3：分镜可生成素材

- 单个分镜能生成关键帧。
- 关键帧记录为 Asset Version。
- Asset Version 绑定到 Shot。

### M4：分镜可生成视频

- 单个 Shot 能生成 1 个视频候选。
- 多候选可以选择和锁定。

### M5：可合成导出

- 至少 3 个 Shot 能合成为一个 mp4。
- 输出 timeline.json 和 render_report。

### M6：Agent 可建议下一步

- Director Agent 能读取项目状态。
- Agent 能告诉用户下一步该生成什么。
- Agent 能触发至少一个受控任务。

## 20. 总结判断

MozenAIGC Agentic Studio 的核心路线不是复制某个参考网站的界面，而是构建一个本地优先、项目级、Agent 驱动的 AI 制片操作系统。

Flova 的启发是 Storyboard、Project Memory、Skill、Planner 和 Timeline。  
本项目的机会是用 MozenAIGC 做统一入口，用 LumenX 做短漫剧生产链路，用 OpenMontage 做 Agent 管线和后期合成，用 MozenGene 做角色与风格一致性。

第一阶段的胜负手是“闭环”，不是“功能数量”。只要 60 秒短漫剧 MVP 能稳定跑通，后续就可以自然扩展到电影预告、口播短视频、广告片、长剧集和自动化内容工厂。
