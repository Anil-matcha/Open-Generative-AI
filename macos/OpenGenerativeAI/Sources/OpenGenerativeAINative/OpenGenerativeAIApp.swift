import AppKit
import SwiftUI

@main
struct OpenGenerativeAIApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var store = StudioStore()

    var body: some Scene {
        WindowGroup("Open Generative AI") {
            RootView()
                .environment(store)
                .frame(minWidth: 1120, minHeight: 720)
        }
        .defaultSize(width: 1220, height: 820)
        .commands {
            AppCommands(store: store)
        }

        Settings {
            SettingsView()
                .environment(store)
                .frame(width: 780, height: 760)
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.activate(ignoringOtherApps: true)
    }
}

struct AppCommands: Commands {
    let store: StudioStore

    var body: some Commands {
        CommandGroup(replacing: .appSettings) {
            SettingsLink {
                Text("Settings...")
            }
            .keyboardShortcut(",", modifiers: [.command])
        }

        CommandGroup(after: .newItem) {
            Button("New Prompt") {
                store.resetPrompt()
            }
            .keyboardShortcut("n", modifiers: [.command])
        }

        CommandMenu("Studio") {
            ForEach(StudioKind.allCases) { studio in
                Button(studio.title) {
                    store.selectedStudio = studio
                }
                .keyboardShortcut(studio.shortcut, modifiers: [.command])
            }

            Divider()

            Button("Generate") {
                Task {
                    await store.generate()
                }
            }
            .keyboardShortcut(.return, modifiers: [.command])
            .disabled(!store.canGenerate)
        }
    }
}
