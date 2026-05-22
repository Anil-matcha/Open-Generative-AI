import Foundation

struct Wan2GPProbeResult: Hashable {
    let ok: Bool
    let message: String
    let apiNames: [String]
}

struct Wan2GPUpload: Hashable {
    let url: URL
    let path: String
    let name: String
    let mimeType: String
}

struct Wan2GPGenerationResult {
    let url: URL
}

struct Wan2GPClient: Sendable {
    let baseURL: URL

    init(rawURL: String) throws {
        let normalized = rawURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: normalized), !normalized.isEmpty else {
            throw Wan2GPError.missingURL
        }
        self.baseURL = url
    }

    func probe() async -> Wan2GPProbeResult {
        do {
            let configURL = baseURL.appending(path: "config")
            let (_, response) = try await URLSession.shared.data(from: configURL)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                return Wan2GPProbeResult(ok: false, message: "No Gradio /config response.", apiNames: [])
            }
            let apiNames = await fetchApiNames()
            return Wan2GPProbeResult(
                ok: true,
                message: apiNames.isEmpty ? "Connected, but no named endpoints were discovered." : "Connected with \(apiNames.count) endpoints.",
                apiNames: apiNames
            )
        } catch {
            return Wan2GPProbeResult(ok: false, message: error.localizedDescription, apiNames: [])
        }
    }

    func upload(fileURL: URL) async throws -> Wan2GPUpload {
        let fileData = try Data(contentsOf: fileURL)
        let uploadID = UUID().uuidString.prefix(10)
        var components = URLComponents(url: baseURL.appending(path: "upload"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "upload_id", value: String(uploadID))]
        guard let uploadURL = components.url else {
            throw Wan2GPError.badURL
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        let filename = fileURL.lastPathComponent
        let mime = mimeType(for: fileURL)
        var body = Data()
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"files\"; filename=\"\(filename)\"\r\n")
        body.appendString("Content-Type: \(mime)\r\n\r\n")
        body.append(fileData)
        body.appendString("\r\n--\(boundary)--\r\n")
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)
        let parsed = try JSONSerialization.jsonObject(with: data)
        let path = (parsed as? [String])?.first ?? parsed as? String
        guard let path, !path.isEmpty else {
            throw Wan2GPError.malformedResponse(String(data: data, encoding: .utf8) ?? "")
        }

        guard let previewURL = URL(string: "\(baseURL.absoluteString)/file=\(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))") else {
            throw Wan2GPError.badURL
        }
        return Wan2GPUpload(url: previewURL, path: path, name: filename, mimeType: mime)
    }

    func generate(
        model: StudioModel,
        prompt: String,
        negativePrompt: String,
        aspectRatio: String,
        steps: Int,
        guidance: Double,
        seed requestedSeed: Int,
        image: Wan2GPUpload?
    ) async throws -> Wan2GPGenerationResult {
        let apiNames = await fetchApiNames()
        let apiName = resolveFunctionName(for: model, apiNames: apiNames)
        guard let apiName else {
            let sample = apiNames.prefix(8).joined(separator: ", ")
            throw Wan2GPError.endpointUnavailable(model.name, sample)
        }

        if model.needsImage == true && image == nil {
            throw Wan2GPError.imageRequired(model.name)
        }

        let dimensions = dimensions(for: aspectRatio)
        let seed = requestedSeed >= 0 ? requestedSeed : Int.random(in: 1...Int(Int32.max))
        let imageDescriptor: JSONValue = if let image {
            .object([
                "path": .string(image.path),
                "url": .string(image.url.absoluteString),
                "orig_name": .string(image.name),
                "mime_type": .string(image.mimeType),
                "meta": .object(["_type": .string("gradio.FileData")]),
            ])
        } else {
            .null
        }

        let payload: [String: JSONValue] = [
            "data": .array([
                .string(prompt),
                .string(negativePrompt),
                .int(dimensions.width),
                .int(dimensions.height),
                .int(model.defaultSteps ?? steps),
                .double(model.defaultGuidance ?? guidance),
                .int(seed),
                imageDescriptor,
            ])
        ]

        let output = try await gradioCall(apiName: apiName, payload: payload)
        guard let url = resolveOutputURL(output) else {
            throw Wan2GPError.malformedResponse(output)
        }
        return Wan2GPGenerationResult(url: url)
    }

    private func fetchApiNames() async -> [String] {
        for path in ["info", "api", "gradio_api/info"] {
            do {
                let data = try await dataIfOK(from: baseURL.appending(path: path))
                let parsed = try JSONSerialization.jsonObject(with: data)
                if let names = namedEndpoints(from: parsed), !names.isEmpty {
                    return names
                }
            } catch {
                continue
            }
        }

        do {
            let data = try await dataIfOK(from: baseURL.appending(path: "config"))
            let parsed = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let dependencies = parsed?["dependencies"] as? [[String: Any]] ?? []
            return dependencies.compactMap { $0["api_name"] as? String }.filter { !$0.isEmpty && $0 != "false" }
        } catch {
            return []
        }
    }

    private func namedEndpoints(from parsed: Any) -> [String]? {
        let dictionary = parsed as? [String: Any]
        let named = dictionary?["named_endpoints"] as? [String: Any]
            ?? dictionary?["unnamed_endpoints"] as? [String: Any]
            ?? dictionary
        return named?
            .keys
            .filter { $0.hasPrefix("/") }
            .map { $0.trimmingCharacters(in: CharacterSet(charactersIn: "/")) }
    }

    private func resolveFunctionName(for model: StudioModel, apiNames: [String]) -> String? {
        let names = Set(apiNames)
        if let fn = model.fn?.nilIfEmpty, names.contains(fn) {
            return fn
        }
        for alias in model.fnAliases ?? [] where names.contains(alias) {
            return alias
        }

        let family = model.family.lowercased()
        let type = model.type?.lowercased() ?? ""
        return apiNames.first { candidate in
            let lower = candidate.lowercased()
            let typeMatches = type == "video"
                ? lower.contains("video") || lower.contains("t2v") || lower.contains("i2v")
                : lower.contains("image") || lower.contains("t2i") || lower.contains("txt2img")
            return lower.contains(family) && typeMatches
        } ?? apiNames.first { $0.lowercased().contains(family) }
    }

    private func gradioCall(apiName: String, payload: [String: JSONValue]) async throws -> String {
        var submit = URLRequest(url: baseURL.appending(path: "gradio_api/call/\(apiName)"))
        submit.httpMethod = "POST"
        submit.setValue("application/json", forHTTPHeaderField: "Content-Type")
        submit.httpBody = try JSONEncoder().encode(payload)
        let (submitData, submitResponse) = try await URLSession.shared.data(for: submit)
        try validate(response: submitResponse, data: submitData)
        let submitObject = try JSONSerialization.jsonObject(with: submitData) as? [String: Any]
        guard let eventID = submitObject?["event_id"] as? String else {
            throw Wan2GPError.malformedResponse(String(data: submitData, encoding: .utf8) ?? "")
        }

        let resultURL = baseURL.appending(path: "gradio_api/call/\(apiName)/\(eventID)")
        let (streamData, streamResponse) = try await URLSession.shared.data(from: resultURL)
        try validate(response: streamResponse, data: streamData)
        let stream = String(data: streamData, encoding: .utf8) ?? ""
        return try completionData(from: stream)
    }

    private func completionData(from stream: String) throws -> String {
        let blocks = stream.components(separatedBy: "\n\n")
        for block in blocks {
            guard block.contains("event: complete") || block.contains("event: process_completes") else {
                continue
            }
            let lines = block.split(separator: "\n", omittingEmptySubsequences: false)
            let dataLines = lines
                .filter { $0.hasPrefix("data:") }
                .map { $0.dropFirst("data:".count).trimmingCharacters(in: .whitespaces) }
            let data = dataLines.joined(separator: "\n")
            if !data.isEmpty {
                return data
            }
        }
        if stream.contains("event: error") || stream.contains("event: process_error") {
            throw Wan2GPError.remoteError(stream.linesSuffix(12))
        }
        throw Wan2GPError.malformedResponse(stream.linesSuffix(12))
    }

    private func resolveOutputURL(_ json: String) -> URL? {
        guard let data = json.data(using: .utf8),
              let parsed = try? JSONSerialization.jsonObject(with: data) else {
            return URL(string: json)
        }

        let candidate = firstOutputCandidate(parsed)
        guard let candidate else {
            return nil
        }
        if candidate.hasPrefix("http") {
            return URL(string: candidate)
        }
        if candidate.hasPrefix("/") {
            return URL(string: baseURL.absoluteString + candidate)
        }
        return URL(string: "\(baseURL.absoluteString)/file=\(candidate.trimmingCharacters(in: CharacterSet(charactersIn: "/")))")
    }

    private func firstOutputCandidate(_ value: Any) -> String? {
        if let string = value as? String {
            return string
        }
        if let array = value as? [Any] {
            for item in array {
                if let candidate = firstOutputCandidate(item) {
                    return candidate
                }
            }
        }
        if let dictionary = value as? [String: Any] {
            for key in ["url", "path", "name"] {
                if let string = dictionary[key] as? String {
                    return string
                }
            }
            if let data = dictionary["data"], let candidate = firstOutputCandidate(data) {
                return candidate
            }
        }
        return nil
    }

    private func dataIfOK(from url: URL) async throws -> Data {
        let (data, response) = try await URLSession.shared.data(from: url)
        try validate(response: response, data: data)
        return data
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            return
        }
        guard (200..<300).contains(http.statusCode) else {
            throw Wan2GPError.http(http.statusCode, String(data: data, encoding: .utf8) ?? "")
        }
    }

    private func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "jpg", "jpeg": "image/jpeg"
        case "png": "image/png"
        case "webp": "image/webp"
        case "heic": "image/heic"
        case "mp4": "video/mp4"
        case "mov": "video/quicktime"
        case "webm": "video/webm"
        default: "application/octet-stream"
        }
    }

    private func dimensions(for aspectRatio: String) -> (width: Int, height: Int) {
        let base = 1024
        switch aspectRatio {
        case "16:9":
            return (Int((Double(base) * 16 / 9 / 64).rounded() * 64), base)
        case "9:16":
            return (base, Int((Double(base) * 16 / 9 / 64).rounded() * 64))
        case "4:3":
            return (Int((Double(base) * 4 / 3 / 64).rounded() * 64), base)
        case "3:4":
            return (base, Int((Double(base) * 4 / 3 / 64).rounded() * 64))
        default:
            return (base, base)
        }
    }
}

enum Wan2GPError: LocalizedError {
    case missingURL
    case badURL
    case http(Int, String)
    case endpointUnavailable(String, String)
    case imageRequired(String)
    case malformedResponse(String)
    case remoteError(String)

    var errorDescription: String? {
        switch self {
        case .missingURL:
            "Set the Wan2GP server URL in Settings before generating."
        case .badURL:
            "The Wan2GP server URL is invalid."
        case .http(let status, let body):
            "Wan2GP request failed with HTTP \(status): \(body.prefix(200))"
        case .endpointUnavailable(let model, let sample):
            "\(model) is not exposed by this Wan2GP server. Available endpoints: \(sample)"
        case .imageRequired(let model):
            "\(model) requires a start image."
        case .malformedResponse(let response):
            "Wan2GP returned an unrecognized response: \(response.prefix(200))"
        case .remoteError(let error):
            "Wan2GP error: \(error)"
        }
    }
}

private extension Data {
    mutating func appendString(_ string: String) {
        append(string.data(using: .utf8)!)
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
