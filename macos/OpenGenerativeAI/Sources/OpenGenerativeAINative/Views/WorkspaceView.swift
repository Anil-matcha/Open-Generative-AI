import AppKit
import AVKit
import SwiftUI

struct WorkspaceView: View {
    @Environment(StudioStore.self) private var store

    var body: some View {
        @Bindable var store = store

        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                StudioHeader(studio: store.selectedStudio)

                if store.selectedStudio == .mcpCli {
                    McpCliWorkspace()
                } else if store.selectedStudio == .workflows || store.selectedStudio == .agents {
                    WebOnlyStudioPanel(studio: store.selectedStudio)
                } else {
                    HStack(alignment: .top, spacing: 24) {
                        ComposerPanel(
                            modeID: $store.modeID,
                            prompt: $store.prompt,
                            negativePrompt: $store.negativePrompt,
                            selectedModel: Binding(
                                get: { store.selectedModel },
                                set: { store.selectedModel = $0 }
                            ),
                            aspectRatio: $store.aspectRatio,
                            resolution: $store.resolution,
                            quality: $store.quality,
                            duration: $store.duration,
                            steps: $store.steps,
                            guidance: $store.guidance,
                            imageCount: $store.imageCount,
                            seed: $store.seed,
                            stylePreset: $store.stylePreset,
                            loraID: $store.loraID,
                            loraWeight: $store.loraWeight,
                            referenceStrength: $store.referenceStrength,
                            camera: $store.camera,
                            lens: $store.lens,
                            focalLength: $store.focalLength,
                            aperture: $store.aperture,
                            effect: $store.effect,
                            requestID: $store.requestID,
                            showAdvanced: $store.showAdvanced
                        )

                        InspectorPanel()
                            .frame(width: 320)
                    }

                    ResultAndHistoryPanel()
                }
            }
            .padding(28)
            .frame(maxWidth: 1320, alignment: .leading)
        }
        .backgroundExtensionEffect()
    }
}

struct WebOnlyStudioPanel: View {
    let studio: StudioKind

    var body: some View {
        GroupBox {
            ContentUnavailableView(
                studio.title,
                systemImage: studio.symbolName,
                description: Text(studio == .workflows ? "This section is a web-only placeholder in the Electron app." : "This section is a web-only placeholder in the Electron app.")
            )
            .frame(maxWidth: .infinity, minHeight: 320)
        }
    }
}

struct McpCliWorkspace: View {
    @State private var selectedCommand = DeveloperCommand.presets[0]
    @State private var selectedFormat = CommandFormat.default
    @State private var copied = false

    private var command: String {
        "muapi \(selectedCommand.arguments)\(selectedFormat.suffix)"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(alignment: .top, spacing: 18) {
                quickStart
                commandBuilder
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 280), spacing: 16)], alignment: .leading, spacing: 16) {
                ForEach(DeveloperToolCard.cards) { card in
                    DeveloperToolCardView(card: card)
                }
            }

            examples
        }
    }

    private var quickStart: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 14) {
                Label("Quick Start", systemImage: "bolt")
                    .font(.headline)

                CommandStep(number: "1", title: "Install the CLI", code: "npm install -g muapi-cli")
                CommandStep(number: "2", title: "Sign in", code: "muapi auth login")
                CommandStep(number: "3", title: "Add media skills", code: "npx skills add SamurAIGPT/Generative-Media-Skills")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var commandBuilder: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 14) {
                Label("Command Builder", systemImage: "terminal")
                    .font(.headline)

                Picker("Target", selection: $selectedCommand) {
                    ForEach(DeveloperCommand.presets) { command in
                        Text(command.title).tag(command)
                    }
                }

                Picker("Output", selection: $selectedFormat) {
                    ForEach(CommandFormat.allCases) { format in
                        Text(format.title).tag(format)
                    }
                }

                HStack(spacing: 10) {
                    Text(command)
                        .font(.system(.caption, design: .monospaced))
                        .textSelection(.enabled)
                        .lineLimit(3)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))

                    Button {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(command, forType: .string)
                        copied = true
                    } label: {
                        Label(copied ? "Copied" : "Copy", systemImage: copied ? "checkmark" : "doc.on.doc")
                    }
                    .controlSize(.small)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var examples: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 12) {
                Label("Examples", systemImage: "curlybraces")
                    .font(.headline)

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 300), spacing: 12)], alignment: .leading, spacing: 12) {
                    CommandExample(title: "Image generation", code: "muapi image generate \"a serene mountain lake at sunrise\" --model flux-dev --download ./outputs")
                    CommandExample(title: "Text to video", code: "muapi video generate \"a dog running on a beach\" --model kling-master")
                    CommandExample(title: "Audio creation", code: "muapi audio create \"upbeat lo-fi hip hop for studying\"")
                    CommandExample(title: "Run a skill", code: "bash library/visual/nano-banana/scripts/generate-nano-art.sh --file image.jpg --view")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct CommandStep: View {
    let number: String
    let title: String
    let code: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Text(number)
                .font(.caption.bold())
                .foregroundStyle(.background)
                .frame(width: 22, height: 22)
                .background(.primary, in: Circle())

            VStack(alignment: .leading, spacing: 5) {
                Text(title)
                    .font(.callout.weight(.semibold))
                Text(code)
                    .font(.system(.caption, design: .monospaced))
                    .textSelection(.enabled)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
    }
}

struct DeveloperToolCardView: View {
    let card: DeveloperToolCard

    var body: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: card.symbolName)
                        .frame(width: 32, height: 32)
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                    Spacer()
                    Text(card.tag)
                        .font(.caption.bold())
                        .foregroundStyle(.secondary)
                }

                Text(card.title)
                    .font(.headline)
                Text(card.body)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                Text(card.code)
                    .font(.system(.caption, design: .monospaced))
                    .textSelection(.enabled)
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                Link("View on GitHub", destination: card.url)
                    .font(.caption.weight(.semibold))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct CommandExample: View {
    let title: String
    let code: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
            Text(code)
                .font(.system(.caption, design: .monospaced))
                .textSelection(.enabled)
                .padding(9)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
        }
    }
}

struct DeveloperToolCard: Identifiable, Hashable {
    var id: String { title }
    let tag: String
    let title: String
    let body: String
    let code: String
    let url: URL
    let symbolName: String

    static let cards: [DeveloperToolCard] = [
        DeveloperToolCard(
            tag: "CLI",
            title: "muapi-cli",
            body: "Generate images, videos, and audio from the terminal with human output or JSON for agents.",
            code: "muapi image generate \"a cyberpunk city\" --model flux-dev",
            url: URL(string: "https://github.com/SamurAIGPT/muapi-cli")!,
            symbolName: "terminal"
        ),
        DeveloperToolCard(
            tag: "MCP",
            title: "muapi-mcp-server",
            body: "Connect Claude, Cursor, Windsurf, and other MCP-compatible assistants to MuAPI tools.",
            code: "claude mcp add --transport http muapi https://api.muapi.ai/mcp",
            url: URL(string: "https://github.com/SamurAIGPT/muapi-mcp-server")!,
            symbolName: "server.rack"
        ),
        DeveloperToolCard(
            tag: "Skills",
            title: "Generative Media Skills",
            body: "Agent-native media workflows for image, video, UI, logos, clipping, and shorts.",
            code: "npx skills add SamurAIGPT/Generative-Media-Skills --all",
            url: URL(string: "https://github.com/SamurAIGPT/Generative-Media-Skills")!,
            symbolName: "sparkles"
        ),
    ]
}

struct DeveloperCommand: Identifiable, Hashable {
    var id: String { title }
    let title: String
    let arguments: String

    static let presets: [DeveloperCommand] = [
        DeveloperCommand(title: "Flux Dev Image", arguments: "image generate 'a retro-futuristic synthwave car' --model flux-dev"),
        DeveloperCommand(title: "Midjourney Image", arguments: "image generate 'oil painting of an astronaut' --model midjourney"),
        DeveloperCommand(title: "Kling Video", arguments: "video generate 'cinematic drone shot of an ancient castle' --model kling-master"),
        DeveloperCommand(title: "Luma Ray Video", arguments: "video generate 'cyberpunk neon alleyway rain' --model luma-ray"),
        DeveloperCommand(title: "Audio", arguments: "audio create 'ambient electronic space synth for gaming'"),
    ]
}

enum CommandFormat: String, CaseIterable, Identifiable {
    case `default`
    case json
    case url

    var id: String { rawValue }

    var title: String {
        switch self {
        case .default: "Default"
        case .json: "JSON Object"
        case .url: "Filtered URL"
        }
    }

    var suffix: String {
        switch self {
        case .default: ""
        case .json: " --output-json"
        case .url: " --output-json | jq '.data.url'"
        }
    }
}

struct StudioHeader: View {
    let studio: StudioKind

    var body: some View {
        GlassEffectContainer {
            HStack(spacing: 16) {
                Image(systemName: studio.symbolName)
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 54, height: 54)
                    .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 15, style: .continuous))

                VStack(alignment: .leading, spacing: 4) {
                    Text(studio.title)
                        .font(.title.bold())
                        .lineLimit(1)
                    Text(studio.subtitle)
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                Spacer()

                Label("Native macOS 26", systemImage: "desktopcomputer")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.thinMaterial, in: Capsule())
            }
            .padding(18)
            .glassEffect(.regular, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
    }
}

struct ComposerPanel: View {
    @Environment(StudioStore.self) private var store

    @Binding var modeID: String
    @Binding var prompt: String
    @Binding var negativePrompt: String
    @Binding var selectedModel: StudioModel
    @Binding var aspectRatio: String
    @Binding var resolution: String
    @Binding var quality: String
    @Binding var duration: Int
    @Binding var steps: Int
    @Binding var guidance: Double
    @Binding var imageCount: Int
    @Binding var seed: Int
    @Binding var stylePreset: String
    @Binding var loraID: String
    @Binding var loraWeight: Double
    @Binding var referenceStrength: Double
    @Binding var camera: String
    @Binding var lens: String
    @Binding var focalLength: String
    @Binding var aperture: String
    @Binding var effect: String
    @Binding var requestID: String
    @Binding var showAdvanced: Bool

    private let styles = ["None", "Editorial", "Cinematic", "Product", "Anime", "Photoreal", "Illustration"]
    private let cameras = ["Modular 8K Digital", "Full-Frame Cine Digital", "Grand Format 70mm Film", "Studio Digital S35", "Classic 16mm Film", "Premium Large Format Digital"]
    private let lenses = ["Creative Tilt Lens", "Compact Anamorphic", "Extreme Macro", "70s Cinema Prime", "Classic Anamorphic", "Premium Modern Prime", "Warm Cinema Prime", "Swirl Bokeh Portrait", "Vintage Prime", "Halation Diffusion", "Clinical Sharp Prime"]
    private let focalLengths = ["8mm", "14mm", "24mm", "35mm", "50mm", "85mm"]
    private let apertures = ["f/1.4", "f/2", "f/2.8", "f/4", "f/8", "f/11"]

    var body: some View {
        GlassEffectContainer {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 12) {
                    Label("Composer", systemImage: "text.cursor")
                        .font(.headline)

                    Spacer()

                    Picker("Mode", selection: $modeID) {
                        ForEach(store.selectedStudio.modes) { mode in
                            Label(mode.title, systemImage: mode.symbolName)
                                .tag(mode.id)
                        }
                    }
                    .frame(width: 180)

                    Picker("Model", selection: $selectedModel) {
                        ForEach(store.availableModels) { model in
                            Text(model.name).tag(model)
                        }
                    }
                    .frame(width: 210)
                }

                UploadStrip()

                TextEditor(text: $prompt)
                    .font(.body)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 156)
                    .padding(10)
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(.separator.opacity(0.55))
                    }

                QuickTools()

                DisclosureGroup(isExpanded: $showAdvanced) {
                    advancedControls
                        .padding(.top, 10)
                } label: {
                    Label("Advanced controls", systemImage: "slider.horizontal.3")
                }

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(selectedModel.family)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(selectedModel.detail)
                            .font(.callout)
                    }

                    Spacer()

                    Button {
                        Task {
                            await store.generate()
                        }
                    } label: {
                        Label(store.isGenerating ? "Generating" : "Generate", systemImage: "wand.and.sparkles")
                    }
                    .buttonStyle(.glassProminent)
                    .disabled(!store.canGenerate)
                    .help(store.validationMessage ?? "Generate")
                }
            }
            .padding(22)
            .glassEffect(.regular.interactive(), in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
    }

    @ViewBuilder
    private var advancedControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 12) {
                if !store.aspectRatioOptions.isEmpty {
                    GridRow {
                        Text("Aspect")
                        optionPicker("Aspect", selection: $aspectRatio, options: store.aspectRatioOptions)
                    }
                }

                if !store.resolutionOptions.isEmpty {
                    GridRow {
                        Text("Resolution")
                        optionPicker("Resolution", selection: $resolution, options: store.resolutionOptions)
                    }
                }

                if store.supportsQualityControl, !store.qualityOptions.isEmpty {
                    GridRow {
                        Text("Quality")
                        optionPicker("Quality", selection: $quality, options: store.qualityOptions) { $0.capitalized }
                    }
                }

                if store.supportsDurationControl {
                    GridRow {
                        Text("Duration")
                        if store.durationOptions.isEmpty {
                            Stepper("\(duration)s", value: $duration, in: store.durationBounds, step: 1)
                        } else {
                            Picker("Duration", selection: $duration) {
                                ForEach(store.durationOptions, id: \.self) { value in
                                    Text("\(value)s").tag(value)
                                }
                            }
                            .labelsHidden()
                        }
                    }
                }

                if store.usesLocalGenerationControls {
                    GridRow {
                        Text("Steps")
                        Stepper("\(steps)", value: $steps, in: 1...80, step: 1)
                    }

                    GridRow {
                        Text("Guidance")
                        Slider(value: $guidance, in: 1...15, step: 0.5)
                        Text(guidance, format: .number.precision(.fractionLength(1)))
                            .monospacedDigit()
                    }
                }

                if store.supportsBatchControl {
                    GridRow {
                        Text("Batch")
                        Stepper("\(imageCount)", value: $imageCount, in: 1...4)
                    }
                }

                GridRow {
                    Text("Reference")
                    Slider(value: $referenceStrength, in: 0...100, step: 5)
                    Text("\(Int(referenceStrength))%")
                        .monospacedDigit()
                }
            }
            .controlSize(.small)

            if store.selectedStudio == .image {
                imageControls
            }

            if store.selectedStudio == .video {
                videoControls
            }

            if store.selectedStudio == .cinema {
                cinemaControls
            }

            TextField("Negative prompt", text: $negativePrompt, axis: .vertical)
                .textFieldStyle(.roundedBorder)
        }
    }

    private var imageControls: some View {
        Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 12) {
            GridRow {
                Text("Style")
                Picker("Style", selection: $stylePreset) {
                    ForEach(styles, id: \.self) { style in
                        Text(style).tag(style)
                    }
                }
                .labelsHidden()
            }

            GridRow {
                Text("Seed")
                Stepper(seed < 0 ? "Random" : "\(seed)", value: $seed, in: -1...999_999, step: 1)
            }

            GridRow {
                Text("LoRA")
                TextField("civitai:model@version", text: $loraID)
                    .textFieldStyle(.roundedBorder)
                Text(loraWeight, format: .number.precision(.fractionLength(2)))
                    .monospacedDigit()
            }

            GridRow {
                Text("LoRA Weight")
                Slider(value: $loraWeight, in: 0...4, step: 0.05)
            }
        }
        .controlSize(.small)
    }

    private var videoControls: some View {
        Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 12) {
            GridRow {
                Text("Effect")
                Picker("Effect", selection: $effect) {
                    ForEach(store.effectOptions, id: \.self) { effect in
                        Text(effect).tag(effect)
                    }
                }
                .labelsHidden()
            }

            GridRow {
                Text("Extend ID")
                TextField("Previous request id", text: $requestID)
                    .textFieldStyle(.roundedBorder)
            }
        }
        .controlSize(.small)
    }

    private func optionPicker(
        _ title: String,
        selection: Binding<String>,
        options: [String],
        titleTransform: @escaping (String) -> String = { $0 }
    ) -> some View {
        Picker(title, selection: selection) {
            ForEach(options, id: \.self) { value in
                Text(titleTransform(value)).tag(value)
            }
        }
        .labelsHidden()
    }

    private var cinemaControls: some View {
        Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 12) {
            GridRow {
                Text("Camera")
                Picker("Camera", selection: $camera) {
                    ForEach(cameras, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                .labelsHidden()
            }

            GridRow {
                Text("Lens")
                Picker("Lens", selection: $lens) {
                    ForEach(lenses, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                .labelsHidden()
            }

            GridRow {
                Text("Focal")
                Picker("Focal", selection: $focalLength) {
                    ForEach(focalLengths, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                .labelsHidden()
            }

            GridRow {
                Text("Aperture")
                Picker("Aperture", selection: $aperture) {
                    ForEach(apertures, id: \.self) { value in
                        Text(value).tag(value)
                    }
                }
                .labelsHidden()
            }
        }
        .controlSize(.small)
    }
}

struct UploadStrip: View {
    @Environment(StudioStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Inputs", systemImage: "paperclip")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: 10) {
                ForEach(store.selectedStudio.uploadSlots) { slot in
                    UploadSlotButton(slot: slot)
                }
            }
        }
    }
}

struct UploadSlotButton: View {
    @Environment(StudioStore.self) private var store
    let slot: UploadSlot

    private var files: [AttachedFile] {
        store.attachedFiles[slot] ?? []
    }

    var body: some View {
        Button {
            store.chooseFiles(for: slot)
        } label: {
            HStack(spacing: 8) {
                Image(systemName: slot.symbolName)
                VStack(alignment: .leading, spacing: 1) {
                    Text(slot.title)
                    Text(files.isEmpty ? "Add" : "\(files.count) selected")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                if !files.isEmpty {
                    Button {
                        store.clearFiles(for: slot)
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 6)
        }
        .buttonStyle(.glass)
    }
}

struct QuickTools: View {
    @Environment(StudioStore.self) private var store

    private let quickPrompts = [
        ("Editorial", "Photoreal editorial image with natural light and refined composition"),
        ("Cinematic", "Cinematic motion with smooth camera drift and believable physics"),
        ("Product", "Product-ready output with clean subject separation and polished detail")
    ]

    private let tags = ["soft light", "high detail", "cinematic", "natural motion", "clean background", "studio grade"]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Quick tools", systemImage: "wand.and.stars")
                .font(.caption)
                .foregroundStyle(.secondary)

            FlowLayout(spacing: 8) {
                ForEach(quickPrompts, id: \.0) { title, prompt in
                    Button(title) {
                        store.applyQuickPrompt(prompt)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }

                ForEach(tags, id: \.self) { tag in
                    Button("+ \(tag)") {
                        store.appendEnhancement(tag)
                    }
                    .buttonStyle(.borderless)
                    .controlSize(.small)
                }
            }
        }
    }
}

struct InspectorPanel: View {
    @Environment(StudioStore.self) private var store
    @AppStorage(PreferenceKeys.preferredEngine) private var preferredEngine = RenderEngine.cloud.rawValue
    @AppStorage(PreferenceKeys.wan2GPURL) private var wan2gpURL = "http://127.0.0.1:7860"

    private var engine: RenderEngine {
        RenderEngine(rawValue: preferredEngine) ?? .cloud
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            GroupBox {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Engine")
                        .font(.headline)

                    Picker("Engine", selection: $preferredEngine) {
                        ForEach(RenderEngine.allCases) { engine in
                            Label(engine.title, systemImage: engine.symbolName)
                                .tag(engine.rawValue)
                        }
                    }
                    .pickerStyle(.radioGroup)

                    if engine == .wan2gp {
                        TextField("Wan2GP URL", text: $wan2gpURL)
                            .textFieldStyle(.roundedBorder)
                    }
                }
            }

            GroupBox {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Current Model")
                        .font(.headline)
                    Label(store.selectedModel.name, systemImage: store.selectedStudio.symbolName)
                    Text(store.selectedModel.detail)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            GroupBox {
                VStack(alignment: .leading, spacing: 10) {
                    Text("Feature Parity")
                        .font(.headline)
                    ForEach(store.selectedStudio.featureChecklist) { feature in
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(feature.title)
                                Text(feature.detail)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: feature.symbolName)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let lastError = store.lastError {
                Label(lastError, systemImage: "exclamationmark.triangle")
                    .foregroundStyle(.red)
                    .font(.callout)
                    .textSelection(.enabled)
            } else if let validationMessage = store.validationMessage {
                Label(validationMessage, systemImage: "info.circle")
                    .foregroundStyle(.secondary)
                    .font(.callout)
                    .textSelection(.enabled)
            }
        }
    }
}

struct ResultAndHistoryPanel: View {
    @Environment(StudioStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ResultPreview()
            HistoryPanel()
        }
    }
}

struct ResultPreview: View {
    @Environment(StudioStore.self) private var store

    private var currentJob: GenerationJob? {
        store.history.first
    }

    var body: some View {
        GroupBox {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label("Result", systemImage: "sparkles.rectangle.stack")
                        .font(.headline)
                    Spacer()
                    if store.isGenerating {
                        ProgressView()
                    }
                }

                if let job = currentJob {
                    HStack(alignment: .top, spacing: 14) {
                        if let resultURL = job.resultURL {
                            ResultMediaPreview(url: resultURL, studio: job.studio)
                                .frame(width: 168, height: 118)
                        } else {
                            Image(systemName: job.status.symbolName)
                                .font(.title2)
                                .foregroundStyle(statusStyle(job.status))
                                .frame(width: 44, height: 44)
                                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }

                        VStack(alignment: .leading, spacing: 4) {
                            Text(job.prompt)
                                .lineLimit(2)
                            Text(job.model.name)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if let requestID = job.requestID {
                                Text("Request: \(requestID)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .textSelection(.enabled)
                            }
                            if let resultURL = job.resultURL {
                                HStack {
                                    Link("Open result", destination: resultURL)
                                    Button {
                                        NSWorkspace.shared.activateFileViewerSelecting([resultURL])
                                    } label: {
                                        Label("Reveal", systemImage: "folder")
                                    }
                                    .controlSize(.small)
                                    .disabled(!resultURL.isFileURL)
                                }
                            }
                        }
                    }
                } else {
                    ContentUnavailableView("No Result", systemImage: "photo", description: Text("Run a generation to see the latest output here."))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct ResultMediaPreview: View {
    let url: URL
    let studio: StudioKind

    private var isVideo: Bool {
        if studio == .video || studio == .lipSync {
            return true
        }
        return ["mp4", "mov", "webm", "m4v"].contains(url.pathExtension.lowercased())
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(.regularMaterial)

            if isVideo {
                VideoPreview(url: url)
            } else {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFill()
                    case .failure:
                        Image(systemName: "photo.badge.exclamationmark")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    case .empty:
                        ProgressView()
                    @unknown default:
                        EmptyView()
                    }
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(.separator.opacity(0.5))
        }
    }
}

struct VideoPreview: View {
    let url: URL
    @State private var player: AVPlayer?

    var body: some View {
        VideoPlayer(player: player)
            .task(id: url) {
                player = AVPlayer(url: url)
            }
            .onDisappear {
                player?.pause()
            }
    }
}

struct HistoryPanel: View {
    @Environment(StudioStore.self) private var store

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Generation History", systemImage: "clock.arrow.circlepath")
                .font(.headline)

            if store.filteredHistory.isEmpty {
                ContentUnavailableView(
                    "No Jobs",
                    systemImage: "tray",
                    description: Text("Generated and queued native macOS jobs will appear here.")
                )
            } else {
                Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 12) {
                    ForEach(store.filteredHistory) { job in
                        GridRow {
                            Label(job.studio.shortTitle, systemImage: job.studio.symbolName)
                                .frame(width: 130, alignment: .leading)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(job.prompt)
                                    .lineLimit(1)
                                Text(job.model.name)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Label(job.status.label, systemImage: job.status.symbolName)
                                .foregroundStyle(statusStyle(job.status))
                        }
                        Divider()
                    }
                }
                .padding(18)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
        }
    }
}

private func statusStyle(_ status: GenerationStatus) -> Color {
    switch status {
    case .completed: .green
    case .failed: .red
    case .running: .blue
    case .queued: .orange
    case .draft: .secondary
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? 600
        let rows = rows(in: maxWidth, subviews: subviews)
        return CGSize(width: maxWidth, height: rows.reduce(CGFloat.zero) { $0 + $1.height } + CGFloat(max(rows.count - 1, 0)) * spacing)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }

            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }

    private func rows(in maxWidth: CGFloat, subviews: Subviews) -> [CGSize] {
        var rows: [CGSize] = []
        var currentWidth: CGFloat = 0
        var currentHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if currentWidth + size.width > maxWidth, currentWidth > 0 {
                rows.append(CGSize(width: currentWidth, height: currentHeight))
                currentWidth = 0
                currentHeight = 0
            }

            currentWidth += size.width + spacing
            currentHeight = max(currentHeight, size.height)
        }

        if currentWidth > 0 {
            rows.append(CGSize(width: currentWidth, height: currentHeight))
        }

        return rows
    }
}
