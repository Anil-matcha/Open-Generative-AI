// swift-tools-version: 6.3

import PackageDescription

let package = Package(
    name: "OpenGenerativeAINative",
    platforms: [
        .macOS(.v26)
    ],
    products: [
        .executable(
            name: "OpenGenerativeAINative",
            targets: ["OpenGenerativeAINative"]
        )
    ],
    targets: [
        .executableTarget(
            name: "OpenGenerativeAINative",
            path: "Sources/OpenGenerativeAINative"
        )
    ]
)
