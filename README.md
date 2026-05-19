# Waifu Vault

**Waifu Vault** is a premium local-first media exploration and creative AI workspace built with React, TypeScript and Vite. It combines a modern dark-mode gallery, multiple anime/booru/video/doujin sources, local ComfyUI tooling, Ollama-powered prompt engineering, Prompt Lab, Vault Chat and specialized parsers into one cohesive desktop-like web application.

The project is designed for users who collect, browse, analyze and transform anime-style media while keeping the creative workflow local whenever possible.

> This project includes NSFW-capable browsing tools. Use responsibly, follow local laws, respect source terms, and do not use the application for illegal, non-consensual, real-person sexualization, minors, childlike content, deepfakes or abusive content.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Screens and Modules](#screens-and-modules)
- [Local AI and ComfyUI](#local-ai-and-comfyui)
- [Supported Sources](#supported-sources)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Configuration Notes](#configuration-notes)
- [Local API Endpoints](#local-api-endpoints)
- [Data Persistence](#data-persistence)
- [Recommended Workflow](#recommended-workflow)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Waifu Vault is a unified creative environment for:

- Browsing images, GIFs and videos from multiple image boards and custom scrapers.
- Exploring galleries, doujins and anime/video sources without leaving the app.
- Sending images into a Prompt Lab for local AI analysis and Stable Diffusion prompt generation.
- Converting prompts between checkpoint families such as SDXL, Pony, Illustrious, Animagine, FLUX and Z-Image.
- Opening ComfyUI inside the app and preparing prompts for local generation.
- Chatting with a local Ollama model through Vault Chat.
- Managing favorites, personal collections, prompt history and AI settings.

The interface is built around a premium dark visual system inspired by streaming platforms, booru galleries and local AI workstations: deep black surfaces, violet/cyan accents, subtle red NSFW signals, glass panels, hover overlays and high-density media grids.

---

## Core Features

### Premium Home

- Cinematic hero section with immersive background media.
- Horizontal content rows for latest videos, images, doujins and curated sources.
- Large 16:9 video cards with duration, views, rating and hover play overlay.
- Quick filter bar for `All`, `Videos`, `Images`, `Doujin` and `Hentai`.
- Loading skeletons and responsive layout for desktop and mobile.
- Discreet `NSFW` seal integrated into the Waifu Vault logo.

### Vault Gallery / Explore APIs

- Unified gallery for image board sources.
- Large search bar optimized for tag, artist and character queries.
- Source chips for Waifu.im, Gelbooru, Rule34, Konachan, Yandere and Danbooru.
- Format filters: `All`, `Images`, `Videos`, `GIFs`.
- Sort controls: `Newest`, `Trending`, `Most Viewed`, `Rating`.
- Premium responsive masonry grid.
- Rich card hover overlay with:
  - source badge,
  - rating/NSFW badge,
  - title/tags,
  - score,
  - Prompt Lab action,
  - Analyze AI action,
  - Vault Chat action,
  - ComfyUI action.

### Prompt Lab

Prompt Lab is the structured AI prompt workspace for a selected image.

Features:

- Image preview and source context.
- SFW/NSFW analysis mode.
- Ollama model selection.
- Target checkpoint selection.
- Checkpoint Prompt Preset selector.
- Custom instruction field.
- Structured editable result fields:
  - description,
  - style analysis,
  - character details,
  - composition,
  - lighting,
  - color palette,
  - background,
  - mood,
  - positive prompt,
  - negative prompt,
  - booru tags,
  - recommended aspect ratio,
  - recommended resolution,
  - ComfyUI notes,
  - safety notes.
- Copy actions for prompt, negative prompt, tags and JSON.
- Prompt history.
- Prompt variations.
- Prompt refinement.
- Send to ComfyUI.
- Send to Vault Chat as context.

### Prompt Template Engine

The Prompt Template Engine adapts prompt structure to the selected checkpoint family instead of producing one generic prompt for all models.

Supported presets:

- `sdxl`
- `pony`
- `illustrious`
- `animagine`
- `flux`
- `z_image`
- `z_image_turbo`
- `anime_generic`
- `realistic_generic`
- `custom`

Examples:

- Pony prompts use score/source/rating tags at the beginning.
- SDXL prompts use hybrid natural language and concise negative prompts.
- FLUX prompts use clear natural-language descriptions.
- Z-Image Turbo avoids traditional negative prompts and converts restrictions into positive wording.
- Illustrious and Animagine prioritize Danbooru-style tags with appropriate quality/rating tags.

### Vault Chat

Vault Chat is a local AI side drawer that can be opened without leaving the current screen.

Features:

- Local Ollama chat integration.
- Chat modes:
  - SFW,
  - NSFW,
  - Prompt Engineering,
  - ComfyUI Helper,
  - Dev,
  - Free.
- Model selector.
- Context attachments:
  - selected image,
  - current positive prompt,
  - current negative prompt,
  - analysis,
  - prompt history item.
- Prompt detection in assistant responses.
- Actions for generated prompts:
  - use in Prompt Lab,
  - copy prompt,
  - save to history,
  - send to ComfyUI,
  - generate variations,
  - convert to another preset.

### ComfyUI Internal Studio

- Internal ComfyUI route with iframe support.
- ComfyUI online/offline/busy status.
- Reload button.
- External open fallback.
- Output folder browser.
- Local image browser for ComfyUI outputs.
- PNG metadata parsing for ComfyUI prompts.
- Prompt handoff from Prompt Lab.

### Specialized Media Modules

- NHentai reader.
- E-Hentai metadata and gallery parser.
- E-Hentai HTML reader/parser for page thumbnails and image-page resolution.
- Rule34Video browser and player.
- HentaiHaven browser.
- Tag Explorer for artists, characters and metadata.
- Profile/favorites/collections.

---

## Screens and Modules

| Area | Purpose |
| --- | --- |
| Home | Premium discovery page with hero and curated sections |
| Explore APIs / Vault Gallery | Unified media gallery and API exploration |
| Prompt Lab | Structured image analysis and prompt engineering |
| Vault Chat | Local assistant for prompt, workflow and development help |
| ComfyUI Studio | Internal ComfyUI view and local output explorer |
| Settings | Persistent AI and local integration settings |
| NHentai | Doujin search and reader |
| E-Hentai | Gallery metadata, parser and page resolver |
| Rule34Video | Video search and playback |
| HentaiHaven | Anime browsing |
| Tag Explorer | Artist, character and metadata exploration |
| Profile | Favorites and user collections |

---

## Local AI and ComfyUI

Waifu Vault is designed for constrained local hardware, including machines with 16 GB RAM and an RTX 4060.

Important runtime rules implemented in the architecture:

- ComfyUI has GPU priority.
- Ollama tasks are sequential.
- The app should not run ComfyUI generation and Ollama image/chat tasks simultaneously.
- Low Memory Mode is enabled by default in AI settings.
- Ollama model keep-alive values are intentionally short.
- Base64 image buffers are temporary and should not be stored in prompt/chat history.
- History stores URLs, IDs, thumbnails and text analysis only.

### Recommended Local Models

The app can use any installed Ollama model, but the current defaults and common options are:

```bash
ollama run gemma4:e4b
ollama run dolphin3
ollama run dolphin-mistral
ollama run qwen3-vl:4b
```

For image analysis, use a model that actually supports vision. Text-only models may return weak or malformed visual analysis.

---

## Supported Sources

### Image APIs

- Waifu.im
- Gelbooru
- Rule34
- Konachan
- Yandere
- Danbooru
- Local ComfyUI outputs

### Video and Gallery Sources

- Rule34Video
- HentaiHaven
- NHentai
- E-Hentai
- ExHentai support is partially available through cookies where applicable.

### Notes

Many public sources have CORS, hotlinking, Cloudflare or rate-limit restrictions. The app uses local Vite middleware and proxy endpoints to improve compatibility, but source behavior can change without notice.

---

## Tech Stack

- React 19
- TypeScript 5
- Vite 6
- Tailwind CDN runtime configuration
- Cheerio for HTML parsing
- Vite middleware plugins for local APIs and proxies
- Prisma dependency for local account/favorites infrastructure
- Ollama local API
- ComfyUI local API / iframe integration

---

## Project Structure

```text
.
├── App.tsx
├── index.tsx
├── index.html
├── vite.config.ts
├── constants.ts
├── types.ts
├── comfyui-plugin.ts
├── ehentai-plugin.ts
├── hh-plugin.ts
├── nhentai-plugin.ts
├── r34video-plugin.ts
├── prisma-plugin.ts
├── components/
│   ├── AI/
│   ├── PromptLab/
│   ├── VaultChat/
│   ├── HomeView.tsx
│   ├── ImageCard.tsx
│   ├── ImageGrid.tsx
│   ├── ImageModal.tsx
│   ├── Sidebar.tsx
│   ├── ComfyUIView.tsx
│   ├── EHentaiView.tsx
│   ├── NHentaiView.tsx
│   ├── R34VideoView.tsx
│   └── SettingsView.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── services/
│   ├── LocalAIExecutionManager.ts
│   ├── imageService.ts
│   ├── ollamaService.ts
│   ├── ollamaChatService.ts
│   ├── comfyuiService.ts
│   ├── settingsService.ts
│   ├── promptHistoryService.ts
│   ├── promptTemplateEngine.ts
│   ├── promptTemplateRegistry.ts
│   ├── ehentai/
│   ├── hentaihaven/
│   └── rule34video/
├── types/
│   └── ai.types.ts
├── prisma/
│   └── schema.prisma
└── public/
```

---

## Requirements

### Required

- Node.js 18 or newer
- npm
- Modern Chromium-based browser recommended

### Optional

- Ollama for local AI features
- ComfyUI for local generation workflow
- NVIDIA GPU for ComfyUI generation
- Installed Ollama vision model for image analysis

---

## Installation

```bash
git clone https://github.com/raphawestim/Waifu_valt_Project.git
cd Waifu_valt_Project
npm install
```

---

## Environment Variables

Create a `.env.local` file in the project root if you need optional keys:

```env
GEMINI_API_KEY=
NHENTAI_API_KEY=
```

Current notes:

- E-Hentai API does not require an API key.
- Ollama runs locally and does not require a key.
- ComfyUI runs locally and does not require a key.
- Some scrapers may rely on local proxy middleware instead of direct browser requests.

---

## Running the App

Development server:

```bash
npm run dev
```

Default Vite server:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Configuration Notes

### ComfyUI Paths

The ComfyUI plugin currently contains local Windows paths:

```ts
const COMFYUI_OUTPUT_DIR = 'C:/Users/Raphael/Documents/ComfyUI/ComfyUI/output';
const COMFYUI_BAT_PATH = 'C:\\Users\\Raphael\\Documents\\ComfyUI\\run_nvidia_gpu.bat';
```

If you run the app on another machine, update these values in:

```text
comfyui-plugin.ts
```

The default ComfyUI URL used by the app settings is:

```text
http://127.0.0.1:8188
```

### Ollama URL

Default Ollama URL:

```text
http://localhost:11434
```

This can be changed in the app settings.

### AI Settings Persistence

AI settings are stored in localStorage under:

```text
wv_ai_settings
```

Prompt history:

```text
wv_prompt_history
```

Chat sessions:

```text
wv_chat_sessions
```

---

## Local API Endpoints

The Vite development server exposes local middleware endpoints used by the frontend.

### Generic Media/JSON Proxy

```text
GET /api/proxy-json?url=...
GET /api/proxy-image?url=...
```

Used to bypass browser CORS/hotlinking restrictions for supported sources.

### Ollama

```text
GET  /api/ollama/health
GET  /api/ollama/models
POST /api/ollama/chat
POST /api/ollama/analyze-image
POST /api/ollama/unload
```

### ComfyUI

```text
GET  /api/comfyui/status
GET  /api/comfyui/folders
GET  /api/comfyui/images
POST /api/comfyui/start
POST /api/comfyui/prompt
```

### E-Hentai

```text
POST /api/ehentai/gdata
POST /api/ehentai/parse-gallery
POST /api/ehentai/resolve-image-page
```

### NHentai

```text
GET /api/nhentai/...
```

### Rule34Video

```text
GET /api/r34video/latest
GET /api/r34video/search
GET /api/r34video/details
```

### HentaiHaven

```text
GET /api/hh/latest
GET /api/hh/search
GET /api/hh/genre
GET /api/hh/episodes
```

---

## Data Persistence

Most user-facing data is persisted locally:

- Favorites and lists: auth/profile context and local app storage.
- AI settings: localStorage.
- Prompt history: localStorage.
- Chat sessions: localStorage.
- ComfyUI images: read from the configured local ComfyUI output directory.

The app avoids storing large image base64 buffers in history.

---

## Recommended Workflow

1. Start ComfyUI if you want generation support.
2. Start Ollama if you want Prompt Lab or Vault Chat.
3. Open Waifu Vault with `npm run dev`.
4. Browse Home or Explore APIs.
5. Open an image in Prompt Lab.
6. Select the mode and checkpoint preset.
7. Generate or refine a prompt.
8. Send the prompt to ComfyUI or Vault Chat.
9. Save useful outputs to prompt history.

---

## Troubleshooting

### Ollama model is reported as not installed

Check installed models:

```bash
ollama list
```

Install or run a model:

```bash
ollama run qwen3-vl:4b
```

If a selected model fails, the app may try the configured fallback model.

### Image analysis is poor

Common causes:

- The selected model is text-only.
- The model has weak vision support.
- The image could not be converted to base64 due to CORS/hotlink restrictions.
- The response JSON from the model was malformed.

Use a vision-capable model such as `qwen3-vl:4b` or another local multimodal model available in Ollama.

### ComfyUI iframe does not load

Some ComfyUI setups may block iframe embedding through response headers or browser policy. Use the external open button as a fallback.

### External images fail to load

Some hosts block hotlinking. The app attempts to route media through `/api/proxy-image`, but not every remote host is guaranteed to allow retrieval.

### E-Hentai pages do not resolve final images

E-Hentai gallery pages and image pages can require cookies, rate limiting or specific access conditions. For ExHentai, login cookies are required.

### Build errors after changing paths

Check that local Windows paths in `comfyui-plugin.ts` are valid and properly escaped.

---

## Roadmap

Potential next improvements:

- True infinite scroll in Vault Gallery.
- More robust per-source sorting support.
- User-editable custom checkpoint presets UI.
- IndexedDB migration for large prompt/chat histories.
- ComfyUI workflow JSON injection.
- Better source availability diagnostics.
- More local model presets and vision model recommendations.
- Optional backend mode for production deployment.

---

## Contributing

Contributions are welcome. Good areas to improve:

- New source adapters.
- Parser reliability.
- UI polish and responsive behavior.
- Prompt Template Engine presets.
- ComfyUI workflow integration.
- Local AI memory management.
- Test coverage.

Before submitting changes:

```bash
npm run build
```

Keep changes modular and avoid breaking existing sources or local workflows.

---

## License

This project is intended as a personal/local creative tool. Check the repository license before redistribution or commercial use.

