import Foundation

struct MuAPIClient: Sendable {
    var baseURL = URL(string: "https://api.muapi.ai/api/v1")!
    var apiKey: String

    func submit(endpoint: String, payload: [String: JSONValue]) async throws -> MuAPISubmitResponse {
        var request = URLRequest(url: baseURL.appending(path: endpoint))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")

        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)
        return try JSONDecoder().decode(MuAPISubmitResponse.self, from: data)
    }

    func submit(endpoint: String, prompt: String, options: [String: JSONValue]) async throws -> MuAPISubmitResponse {
        var payload = options
        payload["prompt"] = .string(prompt)
        return try await submit(endpoint: endpoint, payload: payload)
    }

    func pollResult(requestID: String, maxAttempts: Int = 60) async throws -> MuAPIResultResponse {
        let url = baseURL.appending(path: "predictions/\(requestID)/result")

        for _ in 0..<maxAttempts {
            try await Task.sleep(for: .seconds(2))

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue(apiKey, forHTTPHeaderField: "x-api-key")

            let (data, response) = try await URLSession.shared.data(for: request)
            try validate(response: response, data: data)
            let result = try JSONDecoder().decode(MuAPIResultResponse.self, from: data)

            if result.didFail {
                throw MuAPIError.generationFailed(result.error ?? "The generation failed.")
            }

            if result.isTerminal {
                return result
            }
        }

        throw MuAPIError.timedOut
    }

    func uploadFile(fileURL: URL) async throws -> URL {
        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: baseURL.appending(path: "upload_file"))
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "x-api-key")

        let filename = fileURL.lastPathComponent
        let mime = mimeType(for: fileURL)

        let fileData = try Data(contentsOf: fileURL)

        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mime)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct UploadResponse: Decodable {
            let url: URL?
            let fileURL: URL?
            let data: NestedData?

            enum CodingKeys: String, CodingKey {
                case url
                case fileURL = "file_url"
                case data
            }

            struct NestedData: Decodable {
                let url: URL?
            }
        }

        let decoded = try JSONDecoder().decode(UploadResponse.self, from: data)
        guard let resolvedURL = decoded.url ?? decoded.fileURL ?? decoded.data?.url else {
            throw MuAPIError.requestFailed(statusCode: 400, body: "No upload URL returned: \(String(data: data, encoding: .utf8) ?? "")")
        }
        return resolvedURL
    }

    private func mimeType(for url: URL) -> String {
        let ext = url.pathExtension.lowercased()
        switch ext {
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "gif": return "image/gif"
        case "webp": return "image/webp"
        case "heic": return "image/heic"
        case "mp4": return "video/mp4"
        case "mov": return "video/quicktime"
        case "webm": return "video/webm"
        case "m4v": return "video/x-m4v"
        case "mp3": return "audio/mpeg"
        case "wav": return "audio/wav"
        case "m4a": return "audio/mp4"
        case "aac": return "audio/aac"
        case "flac": return "audio/flac"
        case "txt": return "text/plain"
        case "md": return "text/markdown"
        case "json": return "application/json"
        case "pdf": return "application/pdf"
        default: return "application/octet-stream"
        }
    }


    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            return
        }

        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? "No response body"
            throw MuAPIError.requestFailed(statusCode: http.statusCode, body: body)
        }
    }
}

enum JSONValue: Encodable, Hashable, Sendable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    func encode(to encoder: Encoder) throws {
        switch self {
        case .string(let value):
            var container = encoder.singleValueContainer()
            try container.encode(value)
        case .int(let value):
            var container = encoder.singleValueContainer()
            try container.encode(value)
        case .double(let value):
            var container = encoder.singleValueContainer()
            try container.encode(value)
        case .bool(let value):
            var container = encoder.singleValueContainer()
            try container.encode(value)
        case .array(let value):
            var container = encoder.unkeyedContainer()
            for item in value {
                try container.encode(item)
            }
        case .object(let value):
            var container = encoder.container(keyedBy: DynamicCodingKeys.self)
            for (key, val) in value {
                try container.encode(val, forKey: DynamicCodingKeys(stringValue: key)!)
            }
        case .null:
            var container = encoder.singleValueContainer()
            try container.encodeNil()
        }
    }

    private struct DynamicCodingKeys: CodingKey {
        var stringValue: String
        init?(stringValue: String) {
            self.stringValue = stringValue
        }
        var intValue: Int? { nil }
        init?(intValue: Int) { nil }
    }
}

struct MuAPISubmitResponse: Decodable {
    let requestID: String?
    let id: String?

    enum CodingKeys: String, CodingKey {
        case requestID = "request_id"
        case id
    }

    var resolvedRequestID: String? {
        requestID ?? id
    }
}

struct MuAPIResultResponse: Decodable {
    let status: String?
    let outputs: [URL]?
    let url: URL?
    let output: MuAPIOutput?
    let error: String?

    var resultURL: URL? {
        outputs?.first ?? url ?? output?.url
    }

    var isTerminal: Bool {
        let normalized = status?.lowercased()
        return normalized == "completed"
            || normalized == "succeeded"
            || normalized == "success"
            || normalized == "failed"
            || normalized == "error"
    }

    var didFail: Bool {
        let normalized = status?.lowercased()
        return normalized == "failed" || normalized == "error"
    }
}

struct MuAPIOutput: Decodable {
    let url: URL?
}

enum MuAPIError: LocalizedError {
    case requestFailed(statusCode: Int, body: String)
    case generationFailed(String)
    case timedOut

    var errorDescription: String? {
        switch self {
        case .requestFailed(let statusCode, let body):
            "MuAPI request failed with HTTP \(statusCode): \(body)"
        case .generationFailed(let message):
            message
        case .timedOut:
            "Generation timed out while waiting for a result."
        }
    }
}
