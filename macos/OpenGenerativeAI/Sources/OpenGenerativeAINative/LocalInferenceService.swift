import Darwin
import Foundation

struct LocalBinaryStatus: Hashable {
    let exists: Bool
    let path: URL
    let modelsDirectory: URL
}

struct LocalManagedModel: Identifiable, Hashable {
    enum State: String {
        case downloaded = "Downloaded"
        case partial = "Partial"
        case notDownloaded = "Not Downloaded"
    }

    var id: String { model.id }
    let model: StudioModel
    let state: State
    let fileURL: URL?
}

struct LocalGenerationResult {
    let url: URL
    let seed: Int
}

struct LocalInferenceService: Sendable {
    private let dataDirectory: URL
    private let binDirectory: URL
    private let modelsDirectory: URL
    private let tempDirectory: URL

    init() {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        dataDirectory = appSupport.appending(path: "open-generative-ai/local-ai", directoryHint: .isDirectory)
        binDirectory = dataDirectory.appending(path: "bin", directoryHint: .isDirectory)
        modelsDirectory = dataDirectory.appending(path: "models", directoryHint: .isDirectory)
        tempDirectory = dataDirectory.appending(path: "tmp", directoryHint: .isDirectory)
        for directory in [binDirectory, modelsDirectory, tempDirectory] {
            try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        }
    }

    var binaryURL: URL {
        binDirectory.appending(path: "sd-cli")
    }

    func binaryStatus() -> LocalBinaryStatus {
        LocalBinaryStatus(
            exists: FileManager.default.isExecutableFile(atPath: binaryURL.path),
            path: binaryURL,
            modelsDirectory: modelsDirectory
        )
    }

    func managedModels(from catalog: ModelCatalog?) -> [LocalManagedModel] {
        (catalog?.local ?? [])
            .filter { $0.isSDCppProvider }
            .map { model in
                let fileURL = model.localModelFileURL(in: modelsDirectory)
                let state: LocalManagedModel.State
                if let fileURL, FileManager.default.fileExists(atPath: fileURL.path) {
                    state = .downloaded
                } else if let fileURL, FileManager.default.fileExists(atPath: fileURL.appendingPathExtension("part").path) {
                    state = .partial
                } else {
                    state = .notDownloaded
                }
                return LocalManagedModel(model: model, state: state, fileURL: fileURL)
            }
    }

    func auxiliaryState(_ aux: LocalAuxiliaryFile) -> Bool {
        FileManager.default.fileExists(atPath: modelsDirectory.appending(path: aux.filename).path)
    }

    func downloadBinary() async throws {
        guard ProcessInfo.processInfo.machineHardwareName == "arm64" else {
            throw LocalInferenceError.unsupportedPlatform
        }

        if binaryStatus().exists {
            return
        }

        let url = URL(string: "https://github.com/Anil-matcha/Open-Generative-AI/releases/download/v1.0.3-binaries/sd-cli-metal-macos-arm64.zip")!
        let zipURL = tempDirectory.appending(path: "sd-cli-metal-macos-arm64.zip")
        try await download(url: url, to: zipURL)
        try unzip(zipURL, into: binDirectory)
        try? FileManager.default.removeItem(at: zipURL)

        guard let found = findFile(named: "sd-cli", under: binDirectory) else {
            throw LocalInferenceError.binaryMissingAfterInstall
        }

        if found != binaryURL {
            try? FileManager.default.removeItem(at: binaryURL)
            try FileManager.default.moveItem(at: found, to: binaryURL)
        }

        try makeExecutable(binDirectory)
        try clearQuarantine(binDirectory)
    }

    func downloadModel(_ model: StudioModel) async throws {
        guard let downloadURL = model.downloadURL, let targetURL = model.localModelFileURL(in: modelsDirectory) else {
            throw LocalInferenceError.missingDownloadURL(model.name)
        }

        if FileManager.default.fileExists(atPath: targetURL.path) {
            return
        }

        try await download(url: downloadURL, to: targetURL)
    }

    func downloadAuxiliary(_ aux: LocalAuxiliaryFile) async throws {
        guard let url = URL(string: aux.downloadUrl) else {
            throw LocalInferenceError.missingDownloadURL(aux.displayName)
        }
        let targetURL = modelsDirectory.appending(path: aux.filename)
        if FileManager.default.fileExists(atPath: targetURL.path) {
            return
        }
        try await download(url: url, to: targetURL)
    }

    func deleteModel(_ model: StudioModel) throws {
        guard let fileURL = model.localModelFileURL(in: modelsDirectory) else {
            return
        }
        if FileManager.default.fileExists(atPath: fileURL.path) {
            try FileManager.default.removeItem(at: fileURL)
        }
        let partial = fileURL.appendingPathExtension("part")
        if FileManager.default.fileExists(atPath: partial.path) {
            try FileManager.default.removeItem(at: partial)
        }
    }

    func generate(
        model: StudioModel,
        prompt: String,
        negativePrompt: String,
        aspectRatio: String,
        steps: Int,
        guidance: Double,
        seed requestedSeed: Int
    ) async throws -> LocalGenerationResult {
        try await Task.detached(priority: .userInitiated) {
            guard FileManager.default.isExecutableFile(atPath: binaryURL.path) else {
                throw LocalInferenceError.binaryNotInstalled
            }

            guard let modelURL = model.localModelFileURL(in: modelsDirectory),
                  FileManager.default.fileExists(atPath: modelURL.path) else {
                throw LocalInferenceError.modelNotDownloaded(model.name)
            }

            if model.requiresAuxiliary == true {
                let llmURL = modelsDirectory.appending(path: "Qwen3-4B-Instruct-2507-UD-Q4_K_XL.gguf")
                let vaeURL = modelsDirectory.appending(path: "ae.safetensors")
                guard FileManager.default.fileExists(atPath: llmURL.path) else {
                    throw LocalInferenceError.auxiliaryMissing("Qwen3-4B Text Encoder")
                }
                guard FileManager.default.fileExists(atPath: vaeURL.path) else {
                    throw LocalInferenceError.auxiliaryMissing("FLUX VAE")
                }
            }

            let dimensions = dimensions(for: aspectRatio, modelType: model.type ?? "")
            let seed = requestedSeed >= 0 ? requestedSeed : Int.random(in: 1...Int(Int32.max))
            let outURL = tempDirectory.appending(path: "gen-\(UUID().uuidString).png")
            let modelType = model.type ?? ""
            let modelFlag = (modelType == "z-image" || modelType == "flux") ? "--diffusion-model" : "-m"
            let resolvedSteps = model.defaultSteps ?? steps
            let resolvedGuidance = model.defaultGuidance ?? guidance

            var args = [
                modelFlag, modelURL.path,
                "-p", prompt,
                "-o", outURL.path,
                "--steps", String(resolvedSteps),
                "-H", String(dimensions.height),
                "-W", String(dimensions.width),
                "--cfg-scale", String(resolvedGuidance),
                "--seed", String(seed),
                "--sampling-method", model.sampler?.nilIfEmpty ?? "euler_a",
                "-v",
            ]

            if !negativePrompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                args.append(contentsOf: ["-n", negativePrompt])
            }

            if modelType == "z-image" {
                args.append(contentsOf: [
                    "--llm", modelsDirectory.appending(path: "Qwen3-4B-Instruct-2507-UD-Q4_K_XL.gguf").path,
                    "--vae", modelsDirectory.appending(path: "ae.safetensors").path,
                ])
                if let scheduler = model.scheduler?.nilIfEmpty {
                    args.append(contentsOf: ["--scheduler", scheduler])
                }
            } else if modelType == "sdxl" {
                args.append(contentsOf: ["--sd-version", "sdxl"])
            } else if modelType == "sd2" {
                args.append(contentsOf: ["--sd-version", "sd2"])
            } else if modelType == "flux" {
                args.append("--flux")
            }

            let process = Process()
            process.executableURL = binaryURL
            process.arguments = args
            process.environment = ProcessInfo.processInfo.environment.merging([
                "DYLD_LIBRARY_PATH": binDirectory.path,
                "LD_LIBRARY_PATH": binDirectory.path,
            ]) { _, new in new }

            let pipe = Pipe()
            process.standardOutput = pipe
            process.standardError = pipe
            try process.run()
            process.waitUntilExit()

            let output = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
            guard process.terminationStatus == 0 else {
                throw LocalInferenceError.processFailed(output.linesSuffix(20))
            }
            guard FileManager.default.fileExists(atPath: outURL.path) else {
                throw LocalInferenceError.outputMissing
            }
            return LocalGenerationResult(url: outURL, seed: seed)
        }.value
    }

    private func download(url: URL, to targetURL: URL) async throws {
        try FileManager.default.createDirectory(at: targetURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        let partialURL = targetURL.appendingPathExtension("part")
        let (tempURL, response) = try await URLSession.shared.download(from: url)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw LocalInferenceError.downloadFailed(url.absoluteString)
        }
        try? FileManager.default.removeItem(at: partialURL)
        try? FileManager.default.removeItem(at: targetURL)
        try FileManager.default.moveItem(at: tempURL, to: targetURL)
    }

    private func unzip(_ zipURL: URL, into destination: URL) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/unzip")
        process.arguments = ["-o", zipURL.path, "-d", destination.path]
        try process.run()
        process.waitUntilExit()
        if process.terminationStatus != 0 {
            throw LocalInferenceError.unzipFailed
        }
    }

    private func findFile(named name: String, under directory: URL) -> URL? {
        guard let enumerator = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: nil) else {
            return nil
        }
        for case let url as URL in enumerator where url.lastPathComponent == name {
            return url
        }
        return nil
    }

    private func makeExecutable(_ directory: URL) throws {
        guard let enumerator = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: nil) else {
            return
        }
        for case let url as URL in enumerator {
            if ["sd-cli", "sd-server", "libstable-diffusion.dylib"].contains(url.lastPathComponent) {
                try FileManager.default.setAttributes([.posixPermissions: 0o755], ofItemAtPath: url.path)
            }
        }
    }

    private func clearQuarantine(_ directory: URL) throws {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/xattr")
        process.arguments = ["-cr", directory.path]
        try process.run()
        process.waitUntilExit()
    }

    private func dimensions(for aspectRatio: String, modelType: String) -> (width: Int, height: Int) {
        let base = (modelType == "sdxl" || modelType == "z-image") ? 1024 : 512
        switch aspectRatio {
        case "16:9":
            return (roundTo64(Double(base) * 16.0 / 9.0), base)
        case "9:16":
            return (base, roundTo64(Double(base) * 16.0 / 9.0))
        case "4:3":
            return (roundTo64(Double(base) * 4.0 / 3.0), base)
        case "3:4":
            return (base, roundTo64(Double(base) * 4.0 / 3.0))
        default:
            return (base, base)
        }
    }

    private func roundTo64(_ value: Double) -> Int {
        Int((value / 64.0).rounded() * 64.0)
    }
}

enum LocalInferenceError: LocalizedError {
    case unsupportedPlatform
    case binaryNotInstalled
    case binaryMissingAfterInstall
    case modelNotDownloaded(String)
    case auxiliaryMissing(String)
    case missingDownloadURL(String)
    case downloadFailed(String)
    case unzipFailed
    case processFailed(String)
    case outputMissing

    var errorDescription: String? {
        switch self {
        case .unsupportedPlatform:
            "Local sd.cpp inference on macOS currently requires Apple Silicon."
        case .binaryNotInstalled:
            "sd.cpp is not installed. Open Settings > Local Models and install the inference engine."
        case .binaryMissingAfterInstall:
            "The sd.cpp archive installed, but sd-cli was not found inside it."
        case .modelNotDownloaded(let name):
            "Download \(name) in Settings > Local Models before generating locally."
        case .auxiliaryMissing(let name):
            "Download \(name) in Settings > Local Models before using this Z-Image model."
        case .missingDownloadURL(let name):
            "\(name) does not have a download URL in the native model catalog."
        case .downloadFailed(let url):
            "Download failed: \(url)"
        case .unzipFailed:
            "Failed to extract the sd.cpp archive."
        case .processFailed(let output):
            "sd.cpp failed:\n\(output)"
        case .outputMissing:
            "sd.cpp finished but did not produce an output image."
        }
    }
}

private extension StudioModel {
    var isSDCppProvider: Bool {
        let normalized = provider?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return normalized == "sdcpp" || normalized == "local"
    }

    var downloadURL: URL? {
        guard let downloadUrl = downloadUrl?.nilIfEmpty else {
            return nil
        }
        return URL(string: downloadUrl)
    }

    func localModelFileURL(in directory: URL) -> URL? {
        guard let filename = filename?.nilIfEmpty else {
            return nil
        }
        return directory.appending(path: filename)
    }
}

private extension ProcessInfo {
    var machineHardwareName: String {
        var size = 0
        sysctlbyname("hw.machine", nil, &size, nil, 0)
        var machine = [CChar](repeating: 0, count: size)
        sysctlbyname("hw.machine", &machine, &size, nil, 0)
        let bytes = machine.prefix { $0 != 0 }.map { UInt8(bitPattern: $0) }
        return String(decoding: bytes, as: UTF8.self)
    }
}

private extension String {
    var nilIfEmpty: String? {
        isEmpty ? nil : self
    }

    func linesSuffix(_ count: Int) -> String {
        split(separator: "\n").suffix(count).joined(separator: "\n")
    }
}
