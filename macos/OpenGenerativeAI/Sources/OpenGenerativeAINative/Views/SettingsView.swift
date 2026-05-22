import AppKit
import SwiftUI

struct SettingsView: View {
    @AppStorage(PreferenceKeys.muAPIKey) private var apiKey = ""
    @AppStorage(PreferenceKeys.preferredEngine) private var preferredEngine = RenderEngine.cloud.rawValue
    @AppStorage(PreferenceKeys.wan2GPURL) private var wan2gpURL = "http://127.0.0.1:7860"
    @AppStorage(PreferenceKeys.showAdvancedControls) private var showAdvancedControls = true
    @AppStorage(PreferenceKeys.autoResumePendingJobs) private var autoResumePendingJobs = true

    var body: some View {
        Form {
            Section("Cloud API") {
                SecureField("MuAPI key", text: $apiKey)
                Text("Stored in macOS app preferences and used only for MuAPI requests.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("Engines") {
                Picker("Default engine", selection: $preferredEngine) {
                    ForEach(RenderEngine.allCases) { engine in
                        Label(engine.title, systemImage: engine.symbolName)
                            .tag(engine.rawValue)
                    }
                }
            }

            Section("Local Models") {
                LocalModelSettingsPanel(wan2gpURL: $wan2gpURL)
            }

            Section("Workspace") {
                Toggle("Show advanced controls by default", isOn: $showAdvancedControls)
                Toggle("Resume pending jobs on launch", isOn: $autoResumePendingJobs)
            }
        }
        .formStyle(.grouped)
        .padding()
    }
}

struct LocalModelSettingsPanel: View {
    @Environment(StudioStore.self) private var store
    @Binding var wan2gpURL: String
    @State private var busyIDs: Set<String> = []
    @State private var statusMessage: String?
    @State private var statusIsError = false
    @State private var probeResult: Wan2GPProbeResult?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            engineRow

            if !store.localAuxiliaryFiles.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 8) {
                    Text("Required Components")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    ForEach(store.localAuxiliaryFiles) { aux in
                        auxiliaryRow(aux)
                    }
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("sd.cpp Models")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                ForEach(store.localManagedModels) { managed in
                    localModelRow(managed)
                }
            }

            Divider()

            wan2GPRow

            if !store.localWan2GPModels.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Wan2GP Models")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    ForEach(store.localWan2GPModels) { model in
                        wan2GPModelRow(model)
                    }
                }
            }

            if let statusMessage {
                Label(statusMessage, systemImage: statusIsError ? "exclamationmark.triangle" : "checkmark.circle")
                    .font(.caption)
                    .foregroundStyle(statusIsError ? .red : .secondary)
                    .textSelection(.enabled)
            }
        }
    }

    private func wan2GPModelRow(_ model: StudioModel) -> some View {
        let ready = wan2GPModelIsReady(model)
        return HStack(spacing: 10) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(model.name)
                        .lineLimit(1)
                    Text([model.type?.uppercased(), model.fn].compactMap { $0?.isEmpty == false ? $0 : nil }.joined(separator: " · "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } icon: {
                Image(systemName: model.type == "video" ? "video" : "photo")
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(wan2GPStatusText(ready))
                .font(.caption)
                .foregroundStyle(ready == true ? .green : (ready == false ? .orange : .secondary))
        }
    }

    private var engineRow: some View {
        let status = store.localBinaryStatus
        return VStack(alignment: .leading, spacing: 8) {
            LabeledContent("Inference engine") {
                Label(status.exists ? "Installed" : "Not installed", systemImage: status.exists ? "checkmark.circle" : "shippingbox")
                    .foregroundStyle(status.exists ? .green : .orange)
            }

            HStack {
                Text(status.path.path)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                    .textSelection(.enabled)

                Spacer()

                Button {
                    reveal(status.modelsDirectory)
                } label: {
                    Label("Reveal", systemImage: "folder")
                }
                .controlSize(.small)

                Button {
                    runBusy("__binary__") {
                        try await store.installLocalEngine()
                        return "Installed the local sd.cpp inference engine."
                    }
                } label: {
                    busyLabel(id: "__binary__", title: status.exists ? "Reinstall" : "Install", systemImage: "arrow.down.circle")
                }
                .controlSize(.small)
                .disabled(isBusy("__binary__"))
            }
        }
    }

    private func auxiliaryRow(_ aux: LocalAuxiliaryFile) -> some View {
        let downloaded = store.auxiliaryIsDownloaded(aux)
        let id = "aux-\(aux.id)"

        return HStack(spacing: 10) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(aux.displayName)
                        .lineLimit(1)
                    Text("\(formatGB(aux.sizeGB)) · \(aux.filename)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } icon: {
                Image(systemName: downloaded ? "checkmark.circle" : "puzzlepiece.extension")
                    .foregroundStyle(downloaded ? .green : .secondary)
            }

            Spacer()

            if downloaded {
                Text("Ready")
                    .font(.caption)
                    .foregroundStyle(.green)
            } else {
                Button {
                    runBusy(id) {
                        try await store.downloadAuxiliary(aux)
                        return "Downloaded \(aux.displayName)."
                    }
                } label: {
                    busyLabel(id: id, title: "Get", systemImage: "arrow.down.circle")
                }
                .controlSize(.small)
                .disabled(isBusy(id))
            }
        }
    }

    private func localModelRow(_ managed: LocalManagedModel) -> some View {
        let id = "model-\(managed.id)"

        return HStack(spacing: 10) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(managed.model.name)
                        .lineLimit(1)
                    Text(modelSubtitle(managed.model))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            } icon: {
                Image(systemName: managed.state == .downloaded ? "checkmark.circle" : "cpu")
                    .foregroundStyle(managed.state == .downloaded ? .green : .secondary)
            }

            Spacer()

            Text(managed.state.rawValue)
                .font(.caption)
                .foregroundStyle(managed.state == .downloaded ? .green : .secondary)

            if managed.state == .downloaded {
                Button(role: .destructive) {
                    runBusy(id) {
                        try store.deleteLocalModel(managed.model)
                        return "Removed \(managed.model.name)."
                    }
                } label: {
                    busyLabel(id: id, title: "Delete", systemImage: "trash")
                }
                .controlSize(.small)
                .disabled(isBusy(id))
            } else {
                Button {
                    runBusy(id) {
                        try await store.downloadLocalModel(managed.model)
                        return "Downloaded \(managed.model.name)."
                    }
                } label: {
                    busyLabel(id: id, title: "Download", systemImage: "arrow.down.circle")
                }
                .controlSize(.small)
                .disabled(isBusy(id))
            }
        }
    }

    private var wan2GPRow: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Wan2GP Server")
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack {
                TextField("http://127.0.0.1:7860", text: $wan2gpURL)
                    .textFieldStyle(.roundedBorder)

                Button {
                    runBusy("__wan2gp_probe__") {
                        let result = await store.probeWan2GP(url: wan2gpURL)
                        probeResult = result
                        if result.ok {
                            return result.message
                        }
                        throw SettingsActionError.message(result.message)
                    }
                } label: {
                    busyLabel(id: "__wan2gp_probe__", title: "Test", systemImage: "network")
                }
                .controlSize(.small)
                .disabled(isBusy("__wan2gp_probe__"))
            }

            if let probeResult {
                VStack(alignment: .leading, spacing: 3) {
                    Label(probeResult.message, systemImage: probeResult.ok ? "checkmark.circle" : "xmark.octagon")
                        .foregroundStyle(probeResult.ok ? .green : .red)
                    if !probeResult.apiNames.isEmpty {
                        Text(probeResult.apiNames.prefix(8).joined(separator: ", "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                            .textSelection(.enabled)
                    }
                }
                .font(.caption)
            }
        }
    }

    private func busyLabel(id: String, title: String, systemImage: String) -> some View {
        Label {
            Text(isBusy(id) ? "Working" : title)
        } icon: {
            if isBusy(id) {
                ProgressView()
                    .controlSize(.small)
            } else {
                Image(systemName: systemImage)
            }
        }
    }

    private func runBusy(_ id: String, action: @escaping () async throws -> String) {
        busyIDs.insert(id)
        statusMessage = nil
        statusIsError = false

        Task {
            do {
                let message = try await action()
                statusMessage = message
                statusIsError = false
            } catch {
                statusMessage = error.localizedDescription
                statusIsError = true
            }
            busyIDs.remove(id)
        }
    }

    private func isBusy(_ id: String) -> Bool {
        busyIDs.contains(id)
    }

    private func reveal(_ url: URL) {
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }

    private func modelSubtitle(_ model: StudioModel) -> String {
        [
            model.type?.uppercased(),
            model.sizeGB.map(formatGB),
            model.requiresAuxiliary == true ? "requires components" : nil,
            model.filename
        ]
        .compactMap { $0 }
        .joined(separator: " · ")
    }

    private func formatGB(_ value: Double) -> String {
        value >= 1 ? "\(String(format: "%.1f", value)) GB" : "\(Int((value * 1024).rounded())) MB"
    }

    private func wan2GPModelIsReady(_ model: StudioModel) -> Bool? {
        guard let probeResult, probeResult.ok else {
            return nil
        }
        let names = Set(probeResult.apiNames)
        if let fn = model.fn, names.contains(fn) {
            return true
        }
        if (model.fnAliases ?? []).contains(where: names.contains) {
            return true
        }
        return false
    }

    private func wan2GPStatusText(_ ready: Bool?) -> String {
        switch ready {
        case true:
            "Available"
        case false:
            "Offline"
        case nil:
            "Not checked"
        }
    }
}

private enum SettingsActionError: LocalizedError {
    case message(String)

    var errorDescription: String? {
        switch self {
        case .message(let message):
            message
        }
    }
}
