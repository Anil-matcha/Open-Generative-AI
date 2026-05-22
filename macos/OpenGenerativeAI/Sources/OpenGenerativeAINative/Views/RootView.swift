import SwiftUI

struct RootView: View {
    @Environment(StudioStore.self) private var store

    var body: some View {
        @Bindable var store = store

        NavigationSplitView {
            SidebarView(selection: $store.selectedStudio)
        } detail: {
            WorkspaceView()
        }
        .navigationTitle(store.selectedStudio.title)
        .searchable(text: $store.searchText, prompt: "Search jobs and models")
        .toolbar {
            ToolbarItem(placement: .navigation) {
                AppBrandPill()
            }

            ToolbarSpacer(.fixed)

            ToolbarItemGroup(placement: .primaryAction) {
                Button {
                    store.resetPrompt()
                } label: {
                    Label("New Prompt", systemImage: "square.and.pencil")
                }
                .buttonStyle(.glass)

                Button {
                    Task {
                        await store.generate()
                    }
                } label: {
                    Label("Generate", systemImage: "wand.and.sparkles")
                }
                .buttonStyle(.glassProminent)
                .disabled(!store.canGenerate)
                .help(store.validationMessage ?? "Generate")
            }
        }
    }
}

struct AppBrandPill: View {
    var body: some View {
        Label("Open Generative AI", systemImage: "sparkles")
            .labelStyle(.titleAndIcon)
            .font(.headline)
            .fontWeight(.semibold)
            .lineLimit(1)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .glassEffect(.regular.interactive(), in: Capsule())
    }
}

struct SidebarView: View {
    @Binding var selection: StudioKind

    var body: some View {
        List {
            Section("Studios") {
                ForEach(StudioKind.allCases) { studio in
                    Button {
                        selection = studio
                    } label: {
                        Label(studio.shortTitle, systemImage: studio.symbolName)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(selection == studio ? .primary : .secondary)
                    .padding(.vertical, 4)
                    .listRowBackground(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(selection == studio ? Color.accentColor.opacity(0.22) : Color.clear)
                    )
                }
            }
        }
        .listStyle(.sidebar)
        .navigationSplitViewColumnWidth(min: 210, ideal: 240)
    }
}
