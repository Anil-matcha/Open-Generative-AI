import Foundation
import SwiftUI

enum StudioKind: String, CaseIterable, Identifiable, Hashable, Codable {
    case image
    case video
    case cinema
    case lipSync
    case workflows
    case agents
    case mcpCli

    var id: String { rawValue }

    var title: String {
        switch self {
        case .image: "Image Studio"
        case .video: "Video Studio"
        case .cinema: "Cinema Studio"
        case .lipSync: "Lip Sync"
        case .workflows: "Workflows"
        case .agents: "Agents"
        case .mcpCli: "MCP and CLI"
        }
    }

    var shortTitle: String {
        switch self {
        case .image: "Image"
        case .video: "Video"
        case .cinema: "Cinema"
        case .lipSync: "Lip Sync"
        case .workflows: "Workflows"
        case .agents: "Agents"
        case .mcpCli: "MCP"
        }
    }

    var subtitle: String {
        switch self {
        case .image: "Generate and transform still images with cloud or local engines."
        case .video: "Create clips, extend motion, and queue longer renders."
        case .cinema: "Compose camera, lens, lighting, and shot language."
        case .lipSync: "Match dialogue to source footage."
        case .workflows: "Organize repeatable creative pipelines."
        case .agents: "Run assistant-driven creative jobs."
        case .mcpCli: "Manage MCP tooling and command-line handoff."
        }
    }

    var symbolName: String {
        switch self {
        case .image: "photo"
        case .video: "video"
        case .cinema: "camera.aperture"
        case .lipSync: "waveform.and.mic"
        case .workflows: "point.3.connected.trianglepath.dotted"
        case .agents: "person.2.wave.2"
        case .mcpCli: "terminal"
        }
    }

    var shortcut: KeyEquivalent {
        switch self {
        case .image: "1"
        case .video: "2"
        case .cinema: "3"
        case .lipSync: "4"
        case .workflows: "5"
        case .agents: "6"
        case .mcpCli: "7"
        }
    }

    var defaultPrompt: String {
        switch self {
        case .image:
            "A cinematic product shot with natural light, crisp detail, and a calm editorial mood"
        case .video:
            "A slow tracking shot through a neon rain street, soft reflections, subtle camera drift"
        case .cinema:
            "Warm 70mm close-up, shallow depth of field, gentle halation, practical lights in background"
        case .lipSync:
            "Clean dialogue sync with natural mouth movement and stable facial identity"
        case .workflows:
            "Create a reusable image-to-video workflow with review and export steps"
        case .agents:
            "Plan three creative directions, pick the strongest, then prepare generation prompts"
        case .mcpCli:
            "Prepare local tools for asset staging, generation monitoring, and result export"
        }
    }

    var modes: [StudioMode] {
        switch self {
        case .image:
            [
                StudioMode(id: "text-to-image", title: "Text to Image", symbolName: "text.below.photo"),
                StudioMode(id: "image-to-image", title: "Image to Image", symbolName: "photo.badge.arrow.down"),
                StudioMode(id: "local-image", title: "Local Model", symbolName: "cpu")
            ]
        case .video:
            [
                StudioMode(id: "text-to-video", title: "Text to Video", symbolName: "text.below.photo"),
                StudioMode(id: "image-to-video", title: "Image to Video", symbolName: "photo.on.rectangle.angled"),
                StudioMode(id: "video-to-video", title: "Video to Video", symbolName: "film.stack"),
                StudioMode(id: "extend", title: "Extend", symbolName: "arrow.right.to.line")
            ]
        case .cinema:
            [
                StudioMode(id: "shot", title: "Shot Builder", symbolName: "camera.viewfinder"),
                StudioMode(id: "preset", title: "Camera Preset", symbolName: "slider.horizontal.3")
            ]
        case .lipSync:
            [
                StudioMode(id: "video-audio", title: "Video and Audio", symbolName: "waveform.and.mic"),
                StudioMode(id: "image-audio", title: "Image and Audio", symbolName: "person.crop.rectangle")
            ]
        case .workflows:
            [
                StudioMode(id: "builder", title: "Builder", symbolName: "point.3.connected.trianglepath.dotted"),
                StudioMode(id: "templates", title: "Templates", symbolName: "square.grid.2x2")
            ]
        case .agents:
            [
                StudioMode(id: "chat", title: "Agent Chat", symbolName: "bubble.left.and.text.bubble.right"),
                StudioMode(id: "create", title: "Create Agent", symbolName: "person.badge.plus")
            ]
        case .mcpCli:
            [
                StudioMode(id: "cli", title: "CLI", symbolName: "terminal"),
                StudioMode(id: "mcp", title: "MCP Server", symbolName: "server.rack")
            ]
        }
    }

    var uploadSlots: [UploadSlot] {
        switch self {
        case .image:
            [.referenceImage, .styleImage]
        case .video:
            [.referenceImage, .endFrame, .referenceVideo]
        case .cinema:
            [.referenceImage]
        case .lipSync:
            [.sourceVideo, .sourceImage, .sourceAudio]
        case .workflows:
            [.referenceImage, .referenceVideo, .sourceAudio]
        case .agents:
            [.referenceImage, .document]
        case .mcpCli:
            [.document]
        }
    }

    var featureChecklist: [StudioFeature] {
        switch self {
        case .image:
            [
                StudioFeature(title: "Text and image prompts", detail: "Reference images, prompt enhancer, style tags, and batch count.", symbolName: "photo.on.rectangle"),
                StudioFeature(title: "API and local engines", detail: "MuAPI cloud plus local model handoff points.", symbolName: "cpu"),
                StudioFeature(title: "History and downloads", detail: "Generated outputs stay in a native history table.", symbolName: "clock.arrow.circlepath")
            ]
        case .video:
            [
                StudioFeature(title: "T2V, I2V, V2V", detail: "Image, end-frame, reference-video, and extend modes.", symbolName: "film"),
                StudioFeature(title: "Duration and resolution", detail: "Aspect ratio, duration, resolution, quality, mode, and effects.", symbolName: "slider.horizontal.3"),
                StudioFeature(title: "Wan2GP ready", detail: "Server URL and local generation state are surfaced in Settings.", symbolName: "network")
            ]
        case .cinema:
            [
                StudioFeature(title: "Shot language", detail: "Camera, lens, focal length, aperture, and look presets.", symbolName: "camera.aperture"),
                StudioFeature(title: "Preview metadata", detail: "Prompt cards preserve the cinematic recipe.", symbolName: "rectangle.on.rectangle")
            ]
        case .lipSync:
            [
                StudioFeature(title: "Source media", detail: "Video or still source plus audio upload slots.", symbolName: "waveform"),
                StudioFeature(title: "Sync model", detail: "Model, expression, and generation status live in the native panel.", symbolName: "person.wave.2")
            ]
        case .workflows:
            [
                StudioFeature(title: "Reusable pipelines", detail: "Template and builder modes for repeatable production.", symbolName: "point.3.connected.trianglepath.dotted"),
                StudioFeature(title: "Asset handoff", detail: "Imported source media stays attached to the workflow draft.", symbolName: "folder")
            ]
        case .agents:
            [
                StudioFeature(title: "Agent planning", detail: "Creative direction, prompt planning, and production assistant modes.", symbolName: "person.2.wave.2"),
                StudioFeature(title: "Context attachments", detail: "Images and documents can be staged as agent context.", symbolName: "paperclip")
            ]
        case .mcpCli:
            [
                StudioFeature(title: "CLI examples", detail: "Command generation mirrors the Electron MCP and CLI surface.", symbolName: "terminal"),
                StudioFeature(title: "MCP server handoff", detail: "Hosted server setup and tool-runner states are visible.", symbolName: "server.rack")
            ]
        }
    }

    var models: [StudioModel] {
        switch self {
        case .image:
            [
                StudioModel(name: "Nano Banana", family: "Google", endpoint: "nano-banana", detail: "Fast image generation"),
                StudioModel(name: "Flux Dev", family: "Black Forest Labs", endpoint: "flux-dev-image", detail: "High fidelity prompts"),
                StudioModel(name: "Ideogram V3", family: "Ideogram", endpoint: "ideogram-v3", detail: "Typography-aware images")
            ]
        case .video:
            [
                StudioModel(name: "Seedance Lite", family: "ByteDance", endpoint: "seedance-lite-t2v", detail: "Fast text-to-video"),
                StudioModel(name: "Seedance Pro", family: "ByteDance", endpoint: "seedance-pro-t2v", detail: "Higher quality motion"),
                StudioModel(name: "Wan2GP Server", family: "Local", endpoint: "wan2gp", detail: "Bring-your-own GPU server")
            ]
        case .cinema:
            [
                StudioModel(name: "Cinema Prime", family: "Prompt Kit", endpoint: "cinema-prime", detail: "Shot language builder"),
                StudioModel(name: "Anamorphic", family: "Prompt Kit", endpoint: "anamorphic", detail: "Lens and flare presets")
            ]
        case .lipSync:
            [
                StudioModel(name: "Lip Sync Pro", family: "MuAPI", endpoint: "lip-sync-pro", detail: "Dialogue to video"),
                StudioModel(name: "Expressive Sync", family: "MuAPI", endpoint: "expressive-sync", detail: "Expression-preserving sync")
            ]
        case .workflows:
            [
                StudioModel(name: "Creative Pipeline", family: "Workflow", endpoint: "workflow", detail: "Multi-step studio flow"),
                StudioModel(name: "Review Loop", family: "Workflow", endpoint: "review-loop", detail: "Generate, compare, export")
            ]
        case .agents:
            [
                StudioModel(name: "Creative Director", family: "Agent", endpoint: "creative-director", detail: "Prompt planning"),
                StudioModel(name: "Production Assistant", family: "Agent", endpoint: "production-assistant", detail: "Job orchestration")
            ]
        case .mcpCli:
            [
                StudioModel(name: "MCP Tool Runner", family: "Local", endpoint: "mcp-tool-runner", detail: "Tool execution"),
                StudioModel(name: "CLI Handoff", family: "Local", endpoint: "cli-handoff", detail: "Terminal workflow")
            ]
        }
    }
}

struct StudioModel: Identifiable, Hashable, Codable {
    let catalogID: String
    var id: String { catalogID }
    let name: String
    let family: String
    let endpoint: String
    let detail: String
    let source: String?
    let provider: String?
    let category: String?
    let imageField: String?
    let lastImageField: String?
    let videoField: String?
    let hasPrompt: Bool?
    let needsImage: Bool?
    let required: [String]?
    let type: String?
    let filename: String?
    let downloadUrl: String?
    let sizeGB: Double?
    let aspectRatios: [String]?
    let defaultSteps: Int?
    let defaultGuidance: Double?
    let sampler: String?
    let scheduler: String?
    let requiresAuxiliary: Bool?
    let fn: String?
    let fnAliases: [String]?
    let inputs: [String: ModelInput]?

    enum CodingKeys: String, CodingKey {
        case catalogID = "id"
        case name
        case family
        case endpoint
        case detail
        case source
        case provider
        case category
        case imageField
        case lastImageField
        case videoField
        case hasPrompt
        case needsImage
        case required
        case type
        case filename
        case downloadUrl
        case sizeGB
        case aspectRatios
        case defaultSteps
        case defaultGuidance
        case sampler
        case scheduler
        case requiresAuxiliary
        case fn
        case fnAliases
        case inputs
    }

    init(name: String, family: String, endpoint: String, detail: String) {
        self.catalogID = endpoint
        self.name = name
        self.family = family
        self.endpoint = endpoint
        self.detail = detail
        self.source = nil
        self.provider = nil
        self.category = nil
        self.imageField = nil
        self.lastImageField = nil
        self.videoField = nil
        self.hasPrompt = nil
        self.needsImage = nil
        self.required = nil
        self.type = nil
        self.filename = nil
        self.downloadUrl = nil
        self.sizeGB = nil
        self.aspectRatios = nil
        self.defaultSteps = nil
        self.defaultGuidance = nil
        self.sampler = nil
        self.scheduler = nil
        self.requiresAuxiliary = nil
        self.fn = nil
        self.fnAliases = nil
        self.inputs = nil
    }
}

struct ModelInput: Hashable, Codable {
    let key: String
    let name: String
    let title: String
    let type: String
    let description: String
    let defaultValue: String?
    let enumValues: [String]?
    let minValue: Double?
    let maxValue: Double?
    let step: Double?
    let maxItems: Int?
}

struct ModelCatalog: Codable {
    let textToImage: [StudioModel]
    let imageToImage: [StudioModel]
    let textToVideo: [StudioModel]
    let imageToVideo: [StudioModel]
    let videoToVideo: [StudioModel]
    let lipSync: [StudioModel]
    let audio: [StudioModel]
    let local: [StudioModel]
    let localAuxiliary: [String: LocalAuxiliaryFile]?
}

struct LocalAuxiliaryFile: Identifiable, Hashable, Codable {
    var id: String
    let filename: String
    let displayName: String
    let sizeGB: Double
    let downloadUrl: String
}

struct StudioMode: Identifiable, Hashable {
    let id: String
    let title: String
    let symbolName: String
}

struct StudioFeature: Identifiable, Hashable {
    var id: String { title }
    let title: String
    let detail: String
    let symbolName: String
}

enum UploadSlot: String, CaseIterable, Identifiable, Hashable {
    case referenceImage
    case styleImage
    case endFrame
    case referenceVideo
    case sourceVideo
    case sourceImage
    case sourceAudio
    case document

    var id: String { rawValue }

    var title: String {
        switch self {
        case .referenceImage: "Reference Image"
        case .styleImage: "Style Image"
        case .endFrame: "End Frame"
        case .referenceVideo: "Reference Video"
        case .sourceVideo: "Source Video"
        case .sourceImage: "Source Image"
        case .sourceAudio: "Source Audio"
        case .document: "Document"
        }
    }

    var symbolName: String {
        switch self {
        case .referenceImage, .styleImage, .endFrame, .sourceImage: "photo"
        case .referenceVideo, .sourceVideo: "video"
        case .sourceAudio: "waveform"
        case .document: "doc.text"
        }
    }

    var allowedExtensions: [String] {
        switch self {
        case .referenceImage, .styleImage, .endFrame, .sourceImage:
            ["png", "jpg", "jpeg", "webp", "heic"]
        case .referenceVideo, .sourceVideo:
            ["mp4", "mov", "webm", "m4v"]
        case .sourceAudio:
            ["mp3", "wav", "m4a", "aac", "flac"]
        case .document:
            ["txt", "md", "json", "pdf"]
        }
    }
}

struct AttachedFile: Identifiable, Hashable {
    let id = UUID()
    let url: URL
    let addedAt = Date()

    var displayName: String {
        url.lastPathComponent
    }
}

enum GenerationStatus: Hashable, Codable {
    case draft
    case queued
    case running(Double)
    case completed(URL?)
    case failed(String)

    private enum CodingKeys: String, CodingKey {
        case type
        case progress
        case url
        case message
    }

    private enum StatusType: String, Codable {
        case draft
        case queued
        case running
        case completed
        case failed
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(StatusType.self, forKey: .type)

        switch type {
        case .draft:
            self = .draft
        case .queued:
            self = .queued
        case .running:
            self = .running(try container.decodeIfPresent(Double.self, forKey: .progress) ?? 0)
        case .completed:
            self = .completed(try container.decodeIfPresent(URL.self, forKey: .url))
        case .failed:
            self = .failed(try container.decodeIfPresent(String.self, forKey: .message) ?? "Generation failed.")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .draft:
            try container.encode(StatusType.draft, forKey: .type)
        case .queued:
            try container.encode(StatusType.queued, forKey: .type)
        case .running(let progress):
            try container.encode(StatusType.running, forKey: .type)
            try container.encode(progress, forKey: .progress)
        case .completed(let url):
            try container.encode(StatusType.completed, forKey: .type)
            try container.encodeIfPresent(url, forKey: .url)
        case .failed(let message):
            try container.encode(StatusType.failed, forKey: .type)
            try container.encode(message, forKey: .message)
        }
    }

    var shouldResume: Bool {
        switch self {
        case .queued, .running:
            return true
        case .draft, .completed, .failed:
            return false
        }
    }

    var label: String {
        switch self {
        case .draft: "Draft"
        case .queued: "Queued"
        case .running(let progress): "\(Int(progress * 100))%"
        case .completed: "Complete"
        case .failed: "Failed"
        }
    }

    var symbolName: String {
        switch self {
        case .draft: "square.and.pencil"
        case .queued: "clock"
        case .running: "arrow.triangle.2.circlepath"
        case .completed: "checkmark.circle"
        case .failed: "exclamationmark.triangle"
        }
    }
}

struct StudioDraft: Hashable {
    var modeID: String
    var prompt: String
    var negativePrompt = ""
    var aspectRatio: String
    var resolution: String
    var quality = "standard"
    var duration = 5
    var steps = 25
    var guidance = 7.5
    var imageCount = 1
    var seed = -1
    var stylePreset = "None"
    var loraID = ""
    var loraWeight = 1.0
    var referenceStrength = 50.0
    var camera = "Full-Frame Cine Digital"
    var lens = "Classic Anamorphic"
    var focalLength = "35mm"
    var aperture = "f/2.8"
    var effect = "None"
    var requestID = ""
    var showAdvanced = true
    var attachments: [UploadSlot: [AttachedFile]] = [:]

    static func defaults(for studio: StudioKind) -> StudioDraft {
        StudioDraft(
            modeID: studio.modes.first?.id ?? "default",
            prompt: studio.defaultPrompt,
            aspectRatio: studio == .video ? "16:9" : "1:1",
            resolution: studio == .video ? "480p" : "1024"
        )
    }
}

struct GenerationJob: Identifiable, Hashable, Codable {
    let id: UUID
    let studio: StudioKind
    let prompt: String
    let model: StudioModel
    var status: GenerationStatus
    var createdAt: Date
    var requestID: String?
    var resultURL: URL?

    init(
        id: UUID = UUID(),
        studio: StudioKind,
        prompt: String,
        model: StudioModel,
        status: GenerationStatus,
        createdAt: Date = Date(),
        requestID: String? = nil,
        resultURL: URL? = nil
    ) {
        self.id = id
        self.studio = studio
        self.prompt = prompt
        self.model = model
        self.status = status
        self.createdAt = createdAt
        self.requestID = requestID
        self.resultURL = resultURL
    }
}

struct PendingGenerationJob: Identifiable, Hashable, Codable {
    var id: UUID { job.id }
    let job: GenerationJob
    let requestID: String
    let maxAttempts: Int
    let submittedAt: Date
}

enum RenderEngine: String, CaseIterable, Identifiable {
    case cloud
    case wan2gp
    case local

    var id: String { rawValue }

    var title: String {
        switch self {
        case .cloud: "MuAPI Cloud"
        case .wan2gp: "Wan2GP Server"
        case .local: "Local Models"
        }
    }

    var symbolName: String {
        switch self {
        case .cloud: "cloud"
        case .wan2gp: "network"
        case .local: "cpu"
        }
    }
}
