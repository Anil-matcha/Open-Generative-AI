# Multi-Provider AI

The `feat/multi-provider-ai` branch adds a provider-neutral AI layer alongside the existing MuAPI routes.

## Providers in this phase

- **Google Gemini**: cloud text generation plus optional native image generation. Gemini 2.5 Flash has a free API tier; `gemini-2.5-flash-image` is currently paid-tier rather than free-tier, so it should not be described as a free image provider.
- **Ollama**: local text generation through an Ollama server with no API usage cost.
- **ComfyUI**: local image/video workflows through a ComfyUI server; model cost is local compute rather than API credits.
- **MuAPI**: existing image/video/audio functionality remains available through the original routes.

## API

### List providers and health

`GET /api/ai/providers`

### Generate

`POST /api/ai/generate`

Example Gemini text request:

```json
{
  "provider": "gemini",
  "task": "text",
  "model": "gemini-2.5-flash",
  "prompt": "Explain diffusion models in simple terms."
}
```

Example local request:

```json
{
  "provider": "ollama",
  "task": "text",
  "model": "llama3.2",
  "prompt": "Write three ideas for a children's coloring book."
}
```

Example local ComfyUI image request:

```json
{
  "provider": "comfyui",
  "task": "image",
  "prompt": "A cute 3D baby panda in a magical fairy garden"
}
```

## Configuration

Copy `.env.example` to `.env.local` for local development and provide `GEMINI_API_KEY` if using Gemini. Install Ollama separately and ensure the configured model has been pulled before using the Ollama provider.

For ComfyUI, export an API-format workflow JSON and configure the corresponding image/video workflow environment variable. Set `COMFYUI_PROMPT_NODE_ID` and `COMFYUI_PROMPT_INPUT` when the workflow needs prompt injection.

The provider layer is deliberately separate from the existing MuAPI proxy routes. Studio experiences are being migrated incrementally so existing workflows remain intact while local/free providers are introduced.
