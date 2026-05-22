import Foundation

struct GenerationPersistenceStore: Sendable {
    private let directory: URL
    private let historyURL: URL
    private let pendingURL: URL

    init() {
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        directory = appSupport.appending(path: "open-generative-ai", directoryHint: .isDirectory)
        historyURL = directory.appending(path: "native-generation-history.json")
        pendingURL = directory.appending(path: "native-pending-jobs.json")
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    func loadHistory() -> [GenerationJob] {
        load([GenerationJob].self, from: historyURL) ?? []
    }

    func saveHistory(_ jobs: [GenerationJob]) {
        save(Array(jobs.prefix(100)), to: historyURL)
    }

    func loadPending() -> [PendingGenerationJob] {
        load([PendingGenerationJob].self, from: pendingURL) ?? []
    }

    func savePending(_ job: PendingGenerationJob) {
        var jobs = loadPending().filter { $0.requestID != job.requestID }
        jobs.append(job)
        save(jobs, to: pendingURL)
    }

    func removePending(requestID: String) {
        let jobs = loadPending().filter { $0.requestID != requestID }
        save(jobs, to: pendingURL)
    }

    func clearPending() {
        save([PendingGenerationJob](), to: pendingURL)
    }

    private func load<Value: Decodable>(_ type: Value.Type, from url: URL) -> Value? {
        guard FileManager.default.fileExists(atPath: url.path) else {
            return nil
        }

        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(type, from: data)
        } catch {
            print("Failed to load \(url.lastPathComponent): \(error)")
            return nil
        }
    }

    private func save<Value: Encodable>(_ value: Value, to url: URL) {
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            let data = try encoder.encode(value)
            try data.write(to: url, options: .atomic)
        } catch {
            print("Failed to save \(url.lastPathComponent): \(error)")
        }
    }
}
