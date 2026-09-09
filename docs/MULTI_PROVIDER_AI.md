# Multi-Provider AI

The `feat/multi-provider-ai` branch adds a provider-neutral API alongside the existing MuAPI routes.

## Providers in this phase

- **Google Gemini**: cloud text and image generation through the Google Generative Language API.
- **Ollama**: local text generation through an Ollama server.
- **MuAPI**: existing image/video/audio functionality remains available through the original routes.

## API

### List providers and health

`GET /api/ai/providers`

### Generate

`POST /api/ai/generate`

Example text request:

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

## Configuration

Copy `.env.example` to `.env.local` for local development and provide `GEMINI_API_KEY` if using Gemini. Install Ollama separately and ensure the configured model has been pulled before using the Ollama provider.

The provider layer is deliberately separate from the existing MuAPI proxy routes. The next integration phase can migrate individual Studio experiences to `/api/ai/generate` without breaking existing workflows.
