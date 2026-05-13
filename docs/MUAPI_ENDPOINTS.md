# MUAPI Endpoints Documentation

This document lists all allowed endpoints for the MuAPI proxy service.

## Allowed Endpoints

The following endpoints are permitted through the proxy:

### Standard MuAPI Endpoints
- `predictions` - General predictions endpoint (with sub-paths)
- `image-generation` - Image generation (with sub-paths)
- `video-generation` - Video generation (with sub-paths)
- `image-to-image` - Image to image conversion (with sub-paths)
- `image-to-video` - Image to video conversion (with sub-paths)
- `video-to-video` - Video to video conversion (with sub-paths)
- `flux-dev-image` - Flux development image generation
- `generate_wan_ai_effects` - WAN AI effects generation
- `ai-image-face-swap` - AI image face swap
- `api/storyboard/projects` - Storyboard projects API
- `upload_file` - File upload endpoint

### Lip Sync & Audio Models
- `sync-lipsync` - Lip sync processing
- `latentsync-video` - Latent sync video
- `mmaudio-v2/text-to-audio` - MMAudio text to audio
- `mmaudio-v2/video-to-video` - MMAudio video to video

### Suno Music Models
- `suno-create-music` - Create music
- `suno-remix-music` - Remix music
- `suno-extend-music` - Extend music
- `suno-add-vocals` - Add vocals
- `suno-generate-mashup` - Generate mashup
- `suno-generate-lyrics` - Generate lyrics

### Style Transfer Models
- `ai-ghibli-style` - Ghibli style transfer
- `ai-anime-generator` - Anime generation

### LTX Video Models
- `ltx-2-pro-text-to-video` - LTX 2 Pro text to video
- `ltx-2-fast-text-to-video` - LTX 2 Fast text to video
- `ltx-2-19b-text-to-video` - LTX 2 19B text to video
- `ltx-2-pro-image-to-video` - LTX 2 Pro image to video
- `ltx-2-fast-image-to-video` - LTX 2 Fast image to video
- `ltx-2-19b-image-to-video` - LTX 2 19B image to video

### Additional Video Models (Wildcard Patterns)
- `seedance-*` - Seedance video models (any variant)
- `kling-*` - Kling video models (any variant)
- `veo3-*` - VEO3 video models (any variant)
- `wan2-*` - WAN2 video models (any variant)
- `minimax-hailuo-*` - Minimax Hailuo video models (any variant)
- `openai-sora-*` - OpenAI Sora video models (any variant)
- `pixverse-*` - Pixverse video models (any variant)
- `runway-*` - Runway video models (any variant)
- `hunyuan-*` - Hunyuan video models (any variant)

## Notes

- Endpoints with `(with sub-paths)` allow additional path segments (e.g., `predictions/some-id`)
- Wildcard endpoints (`*`) match any variant of that prefix
- This list should be updated whenever the `ALLOWED_ENDPOINTS` array in `supabase/functions/muapi-proxy/index.ts` is modified</content>
<parameter name="filePath">docs/MUAPI_ENDPOINTS.md