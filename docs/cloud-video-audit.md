# Repository audit and first cloud image-to-video integration

Audited 6 November 2026 on the fork's default branch, `main`.

## Architecture

| Area | Location and role |
| --- | --- |
| Web application | Root Next.js 15 App Router application, React 19, Tailwind 3. `npm run dev`, `npm run build`, `npm start`. |
| Web entry and navigation | `app/page.js` redirects to `/studio`; `app/studio/[[...slug]]/page.js` mounts `components/StandaloneShell.js`. English and Chinese route trees, agent and workflow pages. |
| Shared studio | `packages/studio/src`: React studios, large model catalog, model families, workflow/media capabilities, parameter serializers, localization, MuAPI client. Source is transpiled by Next.js; package CSS needs building. |
| Existing hosted inference | `packages/studio/src/muapi.js`: MuAPI uploads, model submission, result polling and history. `VideoStudio.jsx` supports text/image/video-conditioned models. Named model families include Wan, Kling, Veo, Seedance, Sora, LTX, MiniMax, Vidu and others; these are catalog entries behind MuAPI, not separately configured direct provider connections. |
| Existing API layer | `middleware.js` rewrites most `/api/v1/*` to MuAPI. App Router handlers proxy agents, workflows, apps, creative agent, uploads and the agent library's double `/api/api/v1/*` paths. The shell requires a browser-stored MuAPI key and fetches account balance. |
| Desktop application | `index.html`, `src/main.js`, `src/components`, `src/lib`, `vite.config.mjs` form the separate Vite UI. Electron main/preload and `electron/lib` implement IPC and local inference with sd.cpp/Wan2GP. Not required for cloud web generation. |
| Workspaces and submodules | Studio plus workflow-builder, ai-agent and design-agent workspaces. All three submodules initialized recursively at the committed SHAs; no submodule source edits. |
| Submodule applications | Each submodule includes a standalone client and Python/FastAPI server alongside its shared React package. The root Next.js app imports the shared packages and proxies hosted APIs; it does not need those Python servers for this integration. |
| Packaging | Docker/Compose build the workspace packages and Next.js server. Separate Electron packaging scripts and bundled local-AI assets. Existing tests mainly exercise desktop/local inference. |
| Documentation | README describes both applications. `project_knowledge.md` contains older Vite-only descriptions and an outdated video roadmap; use the actual App Router and shared package code as the current architecture. |

Initialized revisions:

- `packages/Open-AI-Design-Agent`: `ebc0ce7650baad0d13797ccd471c883e78be3161`
- `packages/Open-Poe-AI`: `3e21ebc92d93bd699ffc6000bbcf980eaa8830cb`
- `packages/Vibe-Workflow`: `c65ce897e82bf73659c2725528c8492cd609d831`

## Güncel uygulama

İlk tek sayfalı deneme, tam proje şartnamesi doğrultusunda `/personal` altında Türkçe kişisel stüdyoya genişletildi. Eski uzun bekleyen `/api/huggingface/image-to-video` denemesi kaldırıldı. Video çıkarımı artık resmi Gradio JS istemcisi üzerinden tarayıcıdan asenkron yürür.

- `app/personal`, `components/personal`: kontrol paneli, video, karakter, sahne, geçmiş ve ayarlar.
- `lib/personal`: gerçek yetenek kataloğu, sağlayıcı sözleşmesi, dosya doğrulama, IndexedDB, prompt şablonları ve erişim yardımcıları.
- `app/login`, `app/api/personal/session`, `middleware.js`: özel erişim; üretimde eksik ayarlarda kapalı davranış; ücretli eski API proxy yolları varsayılan kapalı.
- `.env.example`, `vercel.json`, `.nvmrc`, `docs/KURULUM.md`: düşük maliyetli bulut dağıtım hazırlığı.
- `tests/personalStudio.test.mjs`, `tests/browser`, `playwright.config.mjs`: sağlayıcı, güvenlik, saklama ve kullanıcı akışı kontrolleri.

Varsayılan motor Lightricks LTX Video Distilled'dır. Gerçek testte MP4 indirildi ve ffprobe ile doğrulandı: H.264, 288×512, 33 kare, 1.1 saniye, 28.374 bayt. Model şemaları, erişim/kota sınırları ve manuel MP4 alternatifi `docs/video-providers.md` içinde ayrıntılıdır. Wan ikinci ücretsiz seçenektir; ücretli MuAPI otomatik seçilmez.

İlk mimari bulgular ve sabit alt modül sürümleri yukarıda korunur. Dağıtım yapılmadı, GitHub'a gönderim yapılmadı ve ücretli servis açılmadı. Güncel kurulum, test komutları ve sınırlamalar için `docs/KURULUM.md` dosyasını kullanın.
