import AppKit
import Foundation
import Observation
import UniformTypeIdentifiers

@MainActor
@Observable
final class StudioStore {
    var selectedStudio: StudioKind = .image {
        didSet {
            ensureDraft(for: selectedStudio)
            // Make sure the selected model is valid for the current studio and mode
            if let firstModel = availableModels.first {
                selectedModelForStudio[selectedStudio] = firstModel
            } else if selectedModelForStudio[selectedStudio] == nil {
                selectedModelForStudio[selectedStudio] = selectedStudio.models.first
            }
        }
    }

    var searchText = ""
    var isGenerating = false
    var isResumingPending = false
    var lastError: String?
    var history: [GenerationJob] = []

    private var drafts = Dictionary(
        uniqueKeysWithValues: StudioKind.allCases.map { studio in
            (studio, StudioDraft.defaults(for: studio))
        }
    )

    private var selectedModelForStudio = Dictionary(
        uniqueKeysWithValues: StudioKind.allCases.compactMap { studio in
            studio.models.first.map { (studio, $0) }
        }
    )

    private let defaults = UserDefaults.standard
    private let persistence = GenerationPersistenceStore()
    private let localInference = LocalInferenceService()
    private var catalog: ModelCatalog?

    init() {
        if defaults.object(forKey: PreferenceKeys.autoResumePendingJobs) == nil {
            defaults.set(true, forKey: PreferenceKeys.autoResumePendingJobs)
        }
        if let loadedCatalog = loadCatalog() {
            self.catalog = loadedCatalog
        }
        history = persistence.loadHistory().map { job in
            var restored = job
            if restored.status.shouldResume {
                restored.status = .queued
            }
            return restored
        }
        // Initialize default selected models based on available models
        for studio in StudioKind.allCases {
            let mode = drafts[studio]?.modeID ?? studio.modes.first?.id ?? "default"
            let models = availableModels(for: studio, modeID: mode)
            if let firstModel = models.first {
                selectedModelForStudio[studio] = firstModel
                applyDefaults(for: firstModel, studio: studio)
            }
        }

        let shouldResumePending = defaults.object(forKey: PreferenceKeys.autoResumePendingJobs) as? Bool ?? true
        let pending = persistence.loadPending()
        if shouldResumePending, !pending.isEmpty {
            Task {
                await resumePendingJobs(pending)
            }
        }
    }

    private func loadCatalog() -> ModelCatalog? {
        guard let url = Bundle.main.url(forResource: "ModelCatalog", withExtension: "json") else {
            print("ModelCatalog.json not found in main bundle")
            return nil
        }
        do {
            let data = try Data(contentsOf: url)
            let decoded = try JSONDecoder().decode(ModelCatalog.self, from: data)
            print("Successfully loaded \(decoded.textToImage.count) image models, \(decoded.textToVideo.count) video models from catalog")
            return decoded
        } catch {
            print("Failed to decode ModelCatalog: \(error)")
            return nil
        }
    }

    var availableModels: [StudioModel] {
        availableModels(for: selectedStudio, modeID: modeID)
    }

    func availableModels(for studio: StudioKind, modeID: String) -> [StudioModel] {
        guard let catalog = catalog else {
            return studio.models
        }
        switch studio {
        case .image:
            switch modeID {
            case "text-to-image":
                return catalog.textToImage
            case "image-to-image":
                return catalog.imageToImage
            case "local-image":
                return catalog.local.filter { $0.type != "video" }
            default:
                return catalog.textToImage
            }
        case .video:
            switch modeID {
            case "text-to-video":
                let localVideo = catalog.local.filter { $0.isWan2GPProvider && $0.type == "video" && $0.needsImage != true }
                return catalog.textToVideo.filter { !$0.id.contains("extend") && !$0.endpoint.contains("extend") } + localVideo
            case "image-to-video":
                let localVideo = catalog.local.filter { $0.isWan2GPProvider && $0.type == "video" && $0.needsImage == true }
                return catalog.imageToVideo + localVideo
            case "video-to-video":
                return catalog.videoToVideo
            case "extend":
                return catalog.textToVideo.filter { $0.id.contains("extend") || $0.endpoint.contains("extend") }
            default:
                return catalog.textToVideo
            }
        case .lipSync:
            switch modeID {
            case "video-audio":
                return catalog.lipSync.filter { $0.category == "video" }
            case "image-audio":
                return catalog.lipSync.filter { $0.category == "image" }
            default:
                return catalog.lipSync
            }
        default:
            return studio.models
        }
    }

    var draft: StudioDraft {
        get {
            drafts[selectedStudio] ?? .defaults(for: selectedStudio)
        }
        set {
            drafts[selectedStudio] = newValue
        }
    }

    var prompt: String {
        get { draft.prompt }
        set { draft.prompt = newValue }
    }

    var negativePrompt: String {
        get { draft.negativePrompt }
        set { draft.negativePrompt = newValue }
    }

    var modeID: String {
        get { draft.modeID }
        set {
            var nextDraft = draft
            nextDraft.modeID = newValue
            drafts[selectedStudio] = nextDraft

            // When mode changes, reset selection to first model of that mode
            if let firstModel = availableModels.first {
                selectedModelForStudio[selectedStudio] = firstModel
                applyDefaults(for: firstModel, studio: selectedStudio)
            }
        }
    }

    var aspectRatio: String {
        get { draft.aspectRatio }
        set { draft.aspectRatio = newValue }
    }

    var resolution: String {
        get { draft.resolution }
        set { draft.resolution = newValue }
    }

    var quality: String {
        get { draft.quality }
        set { draft.quality = newValue }
    }

    var duration: Int {
        get { draft.duration }
        set { draft.duration = newValue }
    }

    var steps: Int {
        get { draft.steps }
        set { draft.steps = newValue }
    }

    var guidance: Double {
        get { draft.guidance }
        set { draft.guidance = newValue }
    }

    var imageCount: Int {
        get { draft.imageCount }
        set { draft.imageCount = newValue }
    }

    var seed: Int {
        get { draft.seed }
        set { draft.seed = newValue }
    }

    var stylePreset: String {
        get { draft.stylePreset }
        set { draft.stylePreset = newValue }
    }

    var loraID: String {
        get { draft.loraID }
        set { draft.loraID = newValue }
    }

    var loraWeight: Double {
        get { draft.loraWeight }
        set { draft.loraWeight = newValue }
    }

    var referenceStrength: Double {
        get { draft.referenceStrength }
        set { draft.referenceStrength = newValue }
    }

    var camera: String {
        get { draft.camera }
        set { draft.camera = newValue }
    }

    var lens: String {
        get { draft.lens }
        set { draft.lens = newValue }
    }

    var focalLength: String {
        get { draft.focalLength }
        set { draft.focalLength = newValue }
    }

    var aperture: String {
        get { draft.aperture }
        set { draft.aperture = newValue }
    }

    var effect: String {
        get { draft.effect }
        set { draft.effect = newValue }
    }

    var requestID: String {
        get { draft.requestID }
        set { draft.requestID = newValue }
    }

    var showAdvanced: Bool {
        get { draft.showAdvanced }
        set { draft.showAdvanced = newValue }
    }

    var selectedModel: StudioModel {
        get {
            selectedModelForStudio[selectedStudio] ?? selectedStudio.models[0]
        }
        set {
            selectedModelForStudio[selectedStudio] = newValue
            applyDefaults(for: newValue, studio: selectedStudio)
        }
    }

    var aspectRatioOptions: [String] {
        selectedModel.aspectRatioChoices(fallback: defaultAspectRatios(for: selectedStudio))
    }

    var resolutionOptions: [String] {
        selectedModel.enumValues(for: "resolution").ifNotEmpty
            ?? selectedModel.enumValues(for: "size").ifNotEmpty
            ?? defaultResolutions(for: selectedStudio)
    }

    var qualityOptions: [String] {
        selectedModel.enumValues(for: "quality").ifNotEmpty
            ?? selectedModel.enumValues(for: "speed").ifNotEmpty
            ?? (selectedStudio == .image ? ["standard", "high"] : [])
    }

    var durationOptions: [Int] {
        if let values = selectedModel.enumValues(for: "duration").ifNotEmpty {
            return values.compactMap(Int.init)
        }
        return []
    }

    var durationBounds: ClosedRange<Int> {
        guard let input = selectedModel.inputs?["duration"] else {
            return 2...15
        }
        let minValue = Int(input.minValue ?? 2)
        let maxValue = Int(input.maxValue ?? 15)
        return minValue...max(minValue, maxValue)
    }

    var effectOptions: [String] {
        selectedModel.enumValues(for: "name").ifNotEmpty
            ?? selectedModel.enumValues(for: "mode").ifNotEmpty
            ?? ["None", "Zoom", "Dolly", "Orbit", "Handheld", "Watermark Removal"]
    }

    var supportsQualityControl: Bool {
        selectedModel.inputs?["quality"] != nil || selectedModel.inputs?["speed"] != nil || selectedStudio == .image
    }

    var supportsDurationControl: Bool {
        selectedModel.inputs?["duration"] != nil || selectedStudio == .video
    }

    var supportsBatchControl: Bool {
        selectedModel.inputs?["num_images"] != nil || selectedStudio == .image
    }

    var usesLocalGenerationControls: Bool {
        selectedModel.isLocalProvider
    }

    var filteredHistory: [GenerationJob] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else {
            return history
        }

        return history.filter {
            $0.prompt.localizedCaseInsensitiveContains(query)
                || $0.model.name.localizedCaseInsensitiveContains(query)
                || $0.studio.title.localizedCaseInsensitiveContains(query)
                || ($0.requestID?.localizedCaseInsensitiveContains(query) ?? false)
        }
    }

    var canGenerate: Bool {
        validationMessage == nil && !isGenerating
    }

    var validationMessage: String? {
        let trimmedPrompt = prompt.trimmingCharacters(in: .whitespacesAndNewlines)

        if requiresPrompt && trimmedPrompt.isEmpty {
            return "Enter a prompt before generating."
        }

        if preferredEngine == .local && !selectedModel.isLocalProvider {
            return "Choose a local model before generating with Local Models."
        }

        if preferredEngine == .wan2gp && !selectedModel.isWan2GPProvider {
            return "Choose a Wan2GP model before generating with the Wan2GP engine."
        }

        switch selectedStudio {
        case .image:
            if modeID == "image-to-image", attachmentCount(for: .referenceImage) == 0 {
                return "Add a reference image for image-to-image generation."
            }
        case .video:
            switch modeID {
            case "image-to-video":
                if attachmentCount(for: .referenceImage) == 0 {
                    return "Add a start image for image-to-video generation."
                }
            case "video-to-video":
                if attachmentCount(for: .referenceVideo) == 0 {
                    return "Add a source video for video-to-video generation."
                }
                if selectedModel.cleanImageField != nil && attachmentCount(for: .referenceImage) == 0 {
                    return "Add the reference image this motion-control model requires."
                }
            case "extend":
                if requestID.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                    return "Paste the previous request ID before extending a video."
                }
            default:
                break
            }
        case .lipSync:
            if attachmentCount(for: .sourceAudio) == 0 {
                return "Add an audio file for lip sync."
            }
            if modeID == "video-audio", attachmentCount(for: .sourceVideo) == 0 {
                return "Add a source video for video lip sync."
            }
            if modeID == "image-audio", attachmentCount(for: .sourceImage) == 0 {
                return "Add a source image for image lip sync."
            }
        case .cinema:
            break
        case .workflows, .agents, .mcpCli:
            return "\(selectedStudio.title) parity UI is present. API execution for this studio should be wired in the next native parity pass."
        }

        if !selectedModel.isLocalProvider {
            let apiKey = defaults.string(forKey: PreferenceKeys.muAPIKey)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if apiKey.isEmpty {
                return "Add a MuAPI key in Settings before generating with MuAPI Cloud."
            }
        }

        return nil
    }

    var attachedFiles: [UploadSlot: [AttachedFile]] {
        draft.attachments
    }

    func resetPrompt() {
        drafts[selectedStudio] = .defaults(for: selectedStudio)
        lastError = nil
    }

    func appendEnhancement(_ text: String) {
        if prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            prompt = text
        } else if !prompt.localizedCaseInsensitiveContains(text) {
            prompt += ", \(text)"
        }
    }

    func applyQuickPrompt(_ text: String) {
        prompt = text
    }

    func chooseFiles(for slot: UploadSlot) {
        let panel = NSOpenPanel()
        panel.allowsMultipleSelection = slot != .sourceAudio
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        panel.allowedContentTypes = slot.allowedExtensions.compactMap { UTType(filenameExtension: $0) }
        panel.message = "Choose \(slot.title.lowercased()) for \(selectedStudio.title)"

        guard panel.runModal() == .OK else {
            return
        }

        var nextDraft = draft
        nextDraft.attachments[slot, default: []].append(
            contentsOf: panel.urls.map { AttachedFile(url: $0) }
        )
        drafts[selectedStudio] = nextDraft
    }

    func clearFiles(for slot: UploadSlot) {
        var nextDraft = draft
        nextDraft.attachments[slot] = []
        drafts[selectedStudio] = nextDraft
    }

    func generate() async {
        guard canGenerate else {
            lastError = validationMessage
            return
        }

        lastError = nil
        isGenerating = true

        let job = GenerationJob(
            studio: selectedStudio,
            prompt: prompt.trimmingCharacters(in: .whitespacesAndNewlines),
            model: selectedModel,
            status: .queued
        )
        history.insert(job, at: 0)
        saveHistory()

        defer {
            isGenerating = false
        }

        do {
            update(jobID: job.id, status: .running(0.02))

            if selectedModel.isSDCppProvider {
                let result = try await localInference.generate(
                    model: selectedModel,
                    prompt: job.prompt,
                    negativePrompt: negativePrompt,
                    aspectRatio: aspectRatio,
                    steps: steps,
                    guidance: guidance,
                    seed: seed
                )
                update(jobID: job.id, status: .completed(result.url), resultURL: result.url)
                return
            }

            if selectedModel.isWan2GPProvider {
                let client = try Wan2GPClient(rawURL: defaults.string(forKey: PreferenceKeys.wan2GPURL) ?? "")
                let sourceImage = draft.attachments[.referenceImage]?.first ?? draft.attachments[.sourceImage]?.first
                let uploadedImage: Wan2GPUpload?
                if let sourceImage {
                    uploadedImage = try await client.upload(fileURL: sourceImage.url)
                } else {
                    uploadedImage = nil
                }
                let result = try await client.generate(
                    model: selectedModel,
                    prompt: job.prompt,
                    negativePrompt: negativePrompt,
                    aspectRatio: aspectRatio,
                    steps: steps,
                    guidance: guidance,
                    seed: seed,
                    image: uploadedImage
                )
                update(jobID: job.id, status: .completed(result.url), resultURL: result.url)
                return
            }

            let apiKey = defaults.string(forKey: PreferenceKeys.muAPIKey)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            let client = MuAPIClient(apiKey: apiKey)

            // 1. Sequential upload of any staged attachments
            var uploadedURLs: [UploadSlot: [URL]] = [:]
            let attachments = draft.attachments
            let totalFiles = attachments.values.reduce(0) { $0 + $1.count }
            var uploadedCount = 0

            for (slot, files) in attachments {
                for file in files {
                    update(jobID: job.id, status: .running(0.02 + (Double(uploadedCount) / Double(max(1, totalFiles))) * 0.15))
                    print("Uploading \(file.displayName) for slot \(slot.rawValue)...")
                    let remoteURL = try await client.uploadFile(fileURL: file.url)
                    uploadedURLs[slot, default: []].append(remoteURL)
                    uploadedCount += 1
                }
            }
            update(jobID: job.id, status: .running(0.18))

            // 2. Compose payload and endpoint
            var finalEndpoint = selectedModel.endpoint
            var finalPrompt = job.prompt
            var finalPayload: [String: JSONValue] = [:]

            switch selectedStudio {
            case .image:
                let inputs = selectedModel.inputs ?? [:]
                let hasSchema = !inputs.isEmpty
                if !hasSchema || inputs["aspect_ratio"] != nil || !(selectedModel.aspectRatios?.isEmpty ?? true) {
                    finalPayload["aspect_ratio"] = .string(draft.aspectRatio)
                } else if inputs["width"] != nil || inputs["height"] != nil {
                    let dimensions = imageDimensions(for: draft.aspectRatio, resolution: draft.resolution)
                    finalPayload["width"] = .int(dimensions.width)
                    finalPayload["height"] = .int(dimensions.height)
                }
                if !hasSchema || inputs["resolution"] != nil {
                    finalPayload["resolution"] = .string(draft.resolution.lowercased())
                } else if inputs["size"] != nil {
                    finalPayload["size"] = .string(draft.resolution)
                }
                if !hasSchema || inputs["quality"] != nil {
                    finalPayload["quality"] = .string(draft.quality)
                }
                if !hasSchema || inputs["num_images"] != nil {
                    finalPayload["num_images"] = .int(draft.imageCount)
                }
                if draft.seed >= 0 {
                    finalPayload["seed"] = .int(draft.seed)
                }
                if !draft.negativePrompt.isEmpty {
                    finalPayload["negative_prompt"] = .string(draft.negativePrompt)
                }
                if inputs["style_preset"] != nil, draft.stylePreset != "None" {
                    finalPayload["style_preset"] = .string(draft.stylePreset)
                }
                if !draft.loraID.isEmpty {
                    if inputs["model_id"] != nil {
                        finalPayload["model_id"] = .array([.string(draft.loraID)])
                    } else {
                        finalPayload["lora_id"] = .string(draft.loraID)
                    }
                    if !hasSchema || inputs["lora_weight"] != nil {
                        finalPayload["lora_weight"] = .double(draft.loraWeight)
                    }
                }

                // For image-to-image, use reference image if uploaded
                if modeID == "image-to-image" {
                    if let imgURL = uploadedURLs[.referenceImage]?.first {
                        let imgField = selectedModel.cleanImageField ?? "image_url"
                        if imgField == "images_list" {
                            finalPayload["images_list"] = .array([.string(imgURL.absoluteString)])
                        } else {
                            finalPayload[imgField] = .string(imgURL.absoluteString)
                        }
                        finalPayload["strength"] = .double(draft.referenceStrength / 100.0)
                    }
                }

            case .video:
                let inputs = selectedModel.inputs ?? [:]
                let hasSchema = !inputs.isEmpty
                if !hasSchema || inputs["aspect_ratio"] != nil || !(selectedModel.aspectRatios?.isEmpty ?? true) {
                    finalPayload["aspect_ratio"] = .string(draft.aspectRatio)
                }
                if !hasSchema || inputs["duration"] != nil {
                    finalPayload["duration"] = .int(draft.duration)
                }
                if !hasSchema || inputs["resolution"] != nil {
                    finalPayload["resolution"] = .string(draft.resolution)
                }
                if (!hasSchema || inputs["quality"] != nil), draft.quality != "standard" {
                    finalPayload["quality"] = .string(draft.quality)
                }
                if draft.effect != "None", let effectKey = effectPayloadKey(for: selectedModel) {
                    finalPayload[effectKey] = .string(draft.effect)
                }

                if modeID == "image-to-video" {
                    if let imgURL = uploadedURLs[.referenceImage]?.first {
                        let imgField = selectedModel.cleanImageField ?? "image_url"
                        if imgField == "images_list" {
                            finalPayload["images_list"] = .array([.string(imgURL.absoluteString)])
                        } else {
                            finalPayload[imgField] = .string(imgURL.absoluteString)
                        }
                    }
                    if let lastImgURL = uploadedURLs[.endFrame]?.first {
                        if let lastImgField = selectedModel.cleanLastImageField {
                            finalPayload[lastImgField] = .string(lastImgURL.absoluteString)
                        }
                    }
                } else if modeID == "video-to-video" {
                    if let vidURL = uploadedURLs[.referenceVideo]?.first {
                        finalPayload[selectedModel.cleanVideoField ?? "video_url"] = .string(vidURL.absoluteString)
                    }
                    if let imgURL = uploadedURLs[.referenceImage]?.first {
                        finalPayload[selectedModel.cleanImageField ?? "image_url"] = .string(imgURL.absoluteString)
                    }
                } else if modeID == "extend" {
                    if !draft.requestID.isEmpty {
                        finalPayload["request_id"] = .string(draft.requestID)
                    }
                }

            case .cinema:
                // Compile cinematic prompt
                let compiledPrompt = buildNanoBananaPrompt(
                    basePrompt: job.prompt,
                    camera: draft.camera,
                    lens: draft.lens,
                    focalLength: draft.focalLength,
                    aperture: draft.aperture
                )
                finalPrompt = compiledPrompt

                let hasReferenceImage = uploadedURLs[.referenceImage]?.first != nil
                finalEndpoint = hasReferenceImage ? "nano-banana-pro-edit" : "nano-banana-pro"

                finalPayload["aspect_ratio"] = .string(draft.aspectRatio)
                finalPayload["resolution"] = .string(draft.resolution.lowercased())
                finalPayload["negative_prompt"] = .string("blurry, low quality, distortion, bad composition")

                if let imgURL = uploadedURLs[.referenceImage]?.first {
                    finalPayload["images_list"] = .array([.string(imgURL.absoluteString)])
                } else {
                    finalPayload["images_list"] = .array([])
                }

            case .lipSync:
                let inputs = selectedModel.inputs ?? [:]
                let hasSchema = !inputs.isEmpty
                if !hasSchema || inputs["resolution"] != nil {
                    finalPayload["resolution"] = .string(draft.resolution)
                }
                if draft.seed >= 0 {
                    finalPayload["seed"] = .int(draft.seed)
                }
                if selectedModel.hasPrompt == true {
                    finalPayload["prompt"] = .string(job.prompt)
                }

                if modeID == "video-audio" {
                    if let vidURL = uploadedURLs[.sourceVideo]?.first {
                        finalPayload["video_url"] = .string(vidURL.absoluteString)
                    }
                    if let audURL = uploadedURLs[.sourceAudio]?.first {
                        finalPayload["audio_url"] = .string(audURL.absoluteString)
                    }
                } else if modeID == "image-audio" {
                    if let imgURL = uploadedURLs[.sourceImage]?.first {
                        finalPayload["image_url"] = .string(imgURL.absoluteString)
                    }
                    if let audURL = uploadedURLs[.sourceAudio]?.first {
                        finalPayload["audio_url"] = .string(audURL.absoluteString)
                    }
                }

            default:
                break
            }

            let submit: MuAPISubmitResponse
            if selectedStudio == .lipSync && selectedModel.hasPrompt != true {
                submit = try await client.submit(endpoint: finalEndpoint, payload: finalPayload)
            } else {
                submit = try await client.submit(endpoint: finalEndpoint, prompt: finalPrompt, options: finalPayload)
            }

            guard let requestID = submit.resolvedRequestID else {
                update(jobID: job.id, status: .completed(nil))
                return
            }

            update(jobID: job.id, requestID: requestID, status: .running(0.2))
            persistence.savePending(
                PendingGenerationJob(
                    job: job,
                    requestID: requestID,
                    maxAttempts: (selectedStudio == .video || selectedStudio == .lipSync) ? 900 : 60,
                    submittedAt: Date()
                )
            )
            let result = try await client.pollResult(
                requestID: requestID,
                maxAttempts: (selectedStudio == .video || selectedStudio == .lipSync) ? 900 : 60
            )
            update(
                jobID: job.id,
                requestID: requestID,
                status: .completed(result.resultURL),
                resultURL: result.resultURL
            )
            persistence.removePending(requestID: requestID)
        } catch {
            fail(jobID: job.id, message: error.localizedDescription)
        }
    }

    private func buildNanoBananaPrompt(basePrompt: String, camera: String, lens: String, focalLength: String, aperture: String) -> String {
        let cameraMap = [
            "Modular 8K Digital": "modular 8K digital cinema camera",
            "Full-Frame Cine Digital": "full-frame digital cinema camera",
            "Grand Format 70mm Film": "grand format 70mm film camera",
            "Studio Digital S35": "Super 35 studio digital camera",
            "Classic 16mm Film": "classic 16mm film camera",
            "Premium Large Format Digital": "premium large-format digital cinema camera"
        ]

        let lensMap = [
            "Creative Tilt Lens": "creative tilt lens effect",
            "Compact Anamorphic": "compact anamorphic lens",
            "Extreme Macro": "extreme macro lens",
            "70s Cinema Prime": "1970s cinema prime lens",
            "Classic Anamorphic": "classic anamorphic lens",
            "Premium Modern Prime": "premium modern prime lens",
            "Warm Cinema Prime": "warm-toned cinema prime lens",
            "Swirl Bokeh Portrait": "swirl bokeh portrait lens",
            "Vintage Prime": "vintage prime lens",
            "Halation Diffusion": "halation diffusion filter",
            "Clinical Sharp Prime": "ultra-sharp clinical prime lens"
        ]

        let focalPerspective = [
            "8": "ultra-wide perspective",
            "14": "wide-angle perspective",
            "24": "wide-angle dynamic perspective",
            "35": "natural cinematic perspective",
            "50": "standard portrait perspective",
            "85": "classic portrait perspective"
        ]

        let apertureEffect = [
            "f/1.4": "shallow depth of field, creamy bokeh",
            "f/4": "balanced depth of field",
            "f/11": "deep focus clarity, sharp foreground to background"
        ]

        let cameraDesc = cameraMap[camera] ?? camera
        let lensDesc = lensMap[lens] ?? lens

        let digits = focalLength.filter { $0.isNumber }
        let perspective = focalPerspective[digits] ?? ""
        let depthEffect = apertureEffect[aperture] ?? ""

        let qualityTags = [
            "professional photography",
            "ultra-detailed",
            "8K resolution"
        ]

        let focalDesc = focalLength.isEmpty ? "" : "\(focalLength)"
        let focalPart = focalDesc.isEmpty ? "" : "at \(focalDesc)\(perspective.isEmpty ? "" : " (\(perspective))")"

        let parts = [
            basePrompt,
            cameraDesc.isEmpty ? "" : "shot on a \(cameraDesc)",
            lensDesc.isEmpty ? "" : "using a \(lensDesc)\(focalPart.isEmpty ? "" : " " + focalPart)",
            aperture.isEmpty ? "" : "aperture \(aperture)",
            depthEffect,
            "cinematic lighting",
            "natural color science",
            "high dynamic range",
            qualityTags.joined(separator: ", ")
        ]

        return parts.filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }.joined(separator: ", ")
    }

    private func effectPayloadKey(for model: StudioModel) -> String? {
        if model.inputs?["name"] != nil {
            return "name"
        }
        if model.inputs?["mode"] != nil {
            return "mode"
        }
        return model.inputs?.isEmpty != false ? "mode" : nil
    }

    private func imageDimensions(for aspectRatio: String, resolution: String) -> (width: Int, height: Int) {
        let base = Int(resolution.filter(\.isNumber)) ?? 1024
        switch aspectRatio {
        case "16:9":
            return (roundToMultiple(Double(base) * 16.0 / 9.0, multiple: 64), base)
        case "9:16":
            return (base, roundToMultiple(Double(base) * 16.0 / 9.0, multiple: 64))
        case "21:9":
            return (roundToMultiple(Double(base) * 21.0 / 9.0, multiple: 64), base)
        case "4:3":
            return (roundToMultiple(Double(base) * 4.0 / 3.0, multiple: 64), base)
        case "3:4":
            return (base, roundToMultiple(Double(base) * 4.0 / 3.0, multiple: 64))
        case "3:2":
            return (roundToMultiple(Double(base) * 3.0 / 2.0, multiple: 64), base)
        case "2:3":
            return (base, roundToMultiple(Double(base) * 3.0 / 2.0, multiple: 64))
        case "4:5":
            return (base, roundToMultiple(Double(base) * 5.0 / 4.0, multiple: 64))
        case "5:4":
            return (roundToMultiple(Double(base) * 5.0 / 4.0, multiple: 64), base)
        default:
            return (base, base)
        }
    }

    private func roundToMultiple(_ value: Double, multiple: Int) -> Int {
        Int((value / Double(multiple)).rounded() * Double(multiple))
    }

    private func applyDefaults(for model: StudioModel, studio: StudioKind) {
        var nextDraft = drafts[studio] ?? .defaults(for: studio)

        let aspectRatios = model.aspectRatioChoices(fallback: defaultAspectRatios(for: studio))
        if !aspectRatios.contains(nextDraft.aspectRatio) {
            nextDraft.aspectRatio = model.defaultValue(for: "aspect_ratio") ?? aspectRatios.first ?? nextDraft.aspectRatio
        }

        let resolutions = model.enumValues(for: "resolution").ifNotEmpty
            ?? model.enumValues(for: "size").ifNotEmpty
            ?? defaultResolutions(for: studio)
        if !resolutions.isEmpty, !resolutions.contains(nextDraft.resolution) {
            nextDraft.resolution = model.defaultValue(for: "resolution")
                ?? model.defaultValue(for: "size")
                ?? resolutions.first
                ?? nextDraft.resolution
        }

        let qualities = model.enumValues(for: "quality").ifNotEmpty
            ?? model.enumValues(for: "speed").ifNotEmpty
            ?? (studio == .image ? ["standard", "high"] : [])
        if !qualities.isEmpty, !qualities.contains(nextDraft.quality) {
            nextDraft.quality = model.defaultValue(for: "quality")
                ?? model.defaultValue(for: "speed")
                ?? qualities.first
                ?? nextDraft.quality
        }

        let effects = model.enumValues(for: "name").ifNotEmpty
            ?? model.enumValues(for: "mode").ifNotEmpty
        if let effects, !effects.isEmpty, !effects.contains(nextDraft.effect) {
            nextDraft.effect = model.defaultValue(for: "name")
                ?? model.defaultValue(for: "mode")
                ?? effects.first
                ?? nextDraft.effect
        } else if effects == nil, nextDraft.effect.isEmpty {
            nextDraft.effect = "None"
        }

        if let durationDefault = model.defaultValue(for: "duration").flatMap(Int.init) {
            nextDraft.duration = durationDefault
        } else if let firstDuration = model.enumValues(for: "duration").compactMap(Int.init).first {
            nextDraft.duration = firstDuration
        } else if let input = model.inputs?["duration"] {
            let minValue = Int(input.minValue ?? 2)
            let maxValue = Int(input.maxValue ?? 15)
            nextDraft.duration = min(max(nextDraft.duration, minValue), maxValue)
        }

        if let defaultSteps = model.defaultSteps {
            nextDraft.steps = defaultSteps
        }
        if let defaultGuidance = model.defaultGuidance {
            nextDraft.guidance = defaultGuidance
        }

        drafts[studio] = nextDraft
    }

    private func defaultAspectRatios(for studio: StudioKind) -> [String] {
        switch studio {
        case .video:
            ["16:9", "9:16", "1:1"]
        case .cinema:
            ["16:9", "21:9", "9:16", "1:1", "4:5"]
        default:
            ["1:1", "4:5", "3:2", "16:9", "9:16", "21:9"]
        }
    }

    private func defaultResolutions(for studio: StudioKind) -> [String] {
        switch studio {
        case .image, .cinema:
            ["1024", "1536", "2048"]
        case .video, .lipSync:
            ["480p", "720p", "1080p"]
        default:
            []
        }
    }

    private var preferredEngine: RenderEngine {
        let rawValue = defaults.string(forKey: PreferenceKeys.preferredEngine) ?? RenderEngine.cloud.rawValue
        return RenderEngine(rawValue: rawValue) ?? .cloud
    }

    var localBinaryStatus: LocalBinaryStatus {
        localInference.binaryStatus()
    }

    var localManagedModels: [LocalManagedModel] {
        localInference.managedModels(from: catalog)
    }

    var localWan2GPModels: [StudioModel] {
        (catalog?.local ?? [])
            .filter(\.isWan2GPProvider)
    }

    var localAuxiliaryFiles: [LocalAuxiliaryFile] {
        (catalog?.localAuxiliary ?? [:])
            .sorted { $0.key < $1.key }
            .map(\.value)
    }

    func installLocalEngine() async throws {
        try await localInference.downloadBinary()
    }

    func downloadLocalModel(_ model: StudioModel) async throws {
        try await localInference.downloadModel(model)
    }

    func deleteLocalModel(_ model: StudioModel) throws {
        try localInference.deleteModel(model)
    }

    func downloadAuxiliary(_ aux: LocalAuxiliaryFile) async throws {
        try await localInference.downloadAuxiliary(aux)
    }

    func auxiliaryIsDownloaded(_ aux: LocalAuxiliaryFile) -> Bool {
        localInference.auxiliaryState(aux)
    }

    func probeWan2GP(url: String) async -> Wan2GPProbeResult {
        do {
            let client = try Wan2GPClient(rawURL: url)
            return await client.probe()
        } catch {
            return Wan2GPProbeResult(ok: false, message: error.localizedDescription, apiNames: [])
        }
    }

    private var requiresPrompt: Bool {
        switch selectedStudio {
        case .image:
            return modeID == "text-to-image"
                || modeID == "local-image"
                || selectedModel.hasPrompt == true
        case .video:
            switch modeID {
            case "text-to-video", "image-to-video":
                return selectedModel.hasPrompt ?? true
            case "video-to-video":
                return selectedModel.hasPrompt == true
            case "extend":
                return false
            default:
                return true
            }
        case .cinema:
            return true
        case .lipSync:
            return selectedModel.hasPrompt == true
        case .workflows, .agents, .mcpCli:
            return false
        }
    }

    private func attachmentCount(for slot: UploadSlot) -> Int {
        draft.attachments[slot]?.count ?? 0
    }

    private func ensureDraft(for studio: StudioKind) {
        if drafts[studio] == nil {
            drafts[studio] = .defaults(for: studio)
        }
    }

    private func resumePendingJobs(_ pendingJobs: [PendingGenerationJob]) async {
        let apiKey = defaults.string(forKey: PreferenceKeys.muAPIKey)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        guard !apiKey.isEmpty else {
            lastError = "Add a MuAPI key in Settings to resume \(pendingJobs.count) pending job\(pendingJobs.count == 1 ? "" : "s")."
            return
        }

        isResumingPending = true
        defer {
            isResumingPending = false
        }

        let client = MuAPIClient(apiKey: apiKey)
        for pending in pendingJobs {
            ensureHistoryContains(pending.job)
            update(jobID: pending.job.id, requestID: pending.requestID, status: .running(0.2))

            do {
                let result = try await client.pollResult(requestID: pending.requestID, maxAttempts: pending.maxAttempts)
                update(
                    jobID: pending.job.id,
                    requestID: pending.requestID,
                    status: .completed(result.resultURL),
                    resultURL: result.resultURL
                )
                persistence.removePending(requestID: pending.requestID)
            } catch {
                fail(jobID: pending.job.id, message: error.localizedDescription)
            }
        }
    }

    private func ensureHistoryContains(_ job: GenerationJob) {
        guard !history.contains(where: { $0.id == job.id }) else {
            return
        }

        var restored = job
        if restored.status.shouldResume {
            restored.status = .queued
        }
        history.insert(restored, at: 0)
        saveHistory()
    }

    private func fail(jobID: UUID, message: String) {
        if let requestID = history.first(where: { $0.id == jobID })?.requestID {
            persistence.removePending(requestID: requestID)
        }
        lastError = message
        update(jobID: jobID, status: .failed(message))
    }

    private func saveHistory() {
        persistence.saveHistory(history)
    }

    private func update(
        jobID: UUID,
        requestID: String? = nil,
        status: GenerationStatus,
        resultURL: URL? = nil
    ) {
        guard let index = history.firstIndex(where: { $0.id == jobID }) else {
            return
        }

        if let requestID {
            history[index].requestID = requestID
        }

        if let resultURL {
            history[index].resultURL = resultURL
        }

        history[index].status = status
        saveHistory()
    }
}

private extension StudioModel {
    func enumValues(for key: String) -> [String] {
        inputs?[key]?.enumValues ?? []
    }

    func defaultValue(for key: String) -> String? {
        inputs?[key]?.defaultValue?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }

    func aspectRatioChoices(fallback: [String]) -> [String] {
        enumValues(for: "aspect_ratio").ifNotEmpty
            ?? aspectRatios?.filter { !$0.isEmpty }.ifNotEmpty
            ?? fallback
    }

    var cleanImageField: String? {
        imageField?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }

    var cleanLastImageField: String? {
        lastImageField?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }

    var cleanVideoField: String? {
        videoField?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
    }

    var isLocalProvider: Bool {
        isSDCppProvider || isWan2GPProvider
    }

    var isSDCppProvider: Bool {
        let normalized = provider?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return normalized == "sdcpp" || normalized == "local"
    }

    var isWan2GPProvider: Bool {
        let normalized = provider?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return normalized == "wan2gp"
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }
}

private extension Array where Element == String {
    var ifNotEmpty: [String]? {
        isEmpty ? nil : self
    }
}

enum PreferenceKeys {
    static let muAPIKey = "nativeMuAPIKey"
    static let preferredEngine = "nativePreferredEngine"
    static let wan2GPURL = "nativeWan2GPURL"
    static let showAdvancedControls = "nativeShowAdvancedControls"
    static let autoResumePendingJobs = "nativeAutoResumePendingJobs"
}
