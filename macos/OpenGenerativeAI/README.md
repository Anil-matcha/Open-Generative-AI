# Open Generative AI Native macOS

This directory contains a native SwiftUI macOS 26 client for Open Generative AI.

The app is intentionally separate from the existing Electron shell so contributors can review and iterate on the native experience without disrupting the current release pipeline.

## Requirements

- macOS 26
- Xcode 26.4 or newer
- Swift 6.3 or newer

## Run

From the repository root:

```sh
./script/build_native_macos.sh
```

The script builds the SwiftPM target, creates a local `.app` bundle under `dist/macOS`, and launches it as a normal foreground macOS app.

## Scope

- Native `NavigationSplitView` sidebar/detail workspace
- macOS 26 Liquid Glass surfaces and glass button styles
- Native toolbar, commands, keyboard shortcuts, and Settings scene
- Image, Video, Cinema, Lip Sync, Workflows, Agents, and MCP CLI studio surfaces
- Studio model selection, prompt composer, upload slots, quick tools, advanced controls, and generation history
- Generated app icon bundled into the local `.app`
- MuAPI submission and polling for cloud image/video generation
- Visible local-engine and Wan2GP configuration surfaces for bridging existing Electron backend services

The native client is designed to match the Electron app's feature surface while using macOS-native structure. Image and video cloud generation are wired now; local engines and the remaining specialized studio execution paths intentionally report clear bridge messages until the existing Electron services are connected.
