Stage packaged local inference binaries here before running Electron builds.

Examples:
- `npm run stage:local-ai -- linux arm64 /path/to/stable-diffusion.cpp/build-cuda-arm64`
- `npm run stage:local-ai -- linux x64 /path/to/stable-diffusion.cpp/build/bin`

This copies the expected runtime files into `build/local-ai/<platform>-<arch>/bin`,
which Electron Builder then bundles into `resources/local-ai/...` via `extraResources`.
