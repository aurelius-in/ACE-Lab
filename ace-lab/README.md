# ACE Lab

Agentic Creative Experience Lab for rapid visual look‑development. Real‑time WebGL canvas with agent assist, presets, policy checks, and export.

<p align="center">
  <img src="../ace-lab-readme.gif" alt="ACE Lab demo – interactions, menus, and VHS conversion" style="max-width:100%; height:auto;" />
  <br/>
  <em>Interactive tour: menus, canvas edits, and converting a clip to VHS quality</em>
</p>

## Capabilities

- Real‑time WebGL canvas with shader pipeline (Halftone, Cross‑zoom, VHS, Post).
- Image generation (WebGPU/WASM): ONNX Runtime Web thumbnail gen with model URL or local models catalog; device + timing shown; one‑click “Send to Canvas”.
- Generative Fill: box‑select area → patch inpaint via microservice → composite back to image.
- Motion: AnimateDiff (short loops) and RIFE interpolation; preview, then “Send to Canvas/Timeline” (auto‑scrolls) with transitions/effects.
- Style Transfer (TF.js): fast local styles with strength blending; flows through shaders.
- Enhance toggle: snapshots/restores effect params (no accumulation).
- Timeline: keyframes with easing, scrubber, keyboard controls; ready for clip list.
- Export: WebM/GIF, bitrate control; policy hooks for pre‑export checks and auto‑fix.
- Keyboard shortcuts: Space play/pause, arrows scrub, E export, R/6 record, S save pack, A apply ACE look, G/M/T open popouts.
- Demo ready: `npm run demo` runs a guided Playwright demo; services have health checks and Docker Compose.

## Tech stack

- **Vite + React + TypeScript**: fast HMR and typed UI.
- **Zustand**: lightweight state store (`src/store/useLabStore.ts`).
- **WebGL2 + GLSL shaders**: halftone, cross‑zoom, VHS, bloom/post.
- **Tiny‑SDF**: crisp text rendering on the canvas.
- **ONNX Runtime Web (WebGPU/WASM)**: browser‑native image generation (SDXL‑Turbo/Lightning/LCM‑LoRA) for fast 256–512px thumbnails.
- **TensorFlow.js**: on‑device neural style transfer for interactive look blending.
- **FastAPI microservices**: AnimateDiff (short loops), RIFE (frame interpolation), SDXL‑Turbo Inpaint (patch fill).
- **Docker Compose**: one‑command bring‑up of motion/inpaint microservices.
- **OPA (policy)**: in‑browser WASM when available, server fallback.
- **Express server**: simple preset/token endpoints (`server/`).
- **Playwright**: basic e2e.

## App tour

- **Header**
  - **Device**: Desktop/Mobile preview toggle (affects policy/export hints).
  - **Enhance**: one‑click quality boost (see “Enhance” below).
  - **Tabs**: Effects, Text, Presets, Co‑pilot, Agents, Policy, Settings, Library.
  - **Export / Record**: WebM export with bitrate and quick 3s/6s record.

- **Main panel (left)**
  - Real‑time canvas (`CanvasHost`) with the active effect pipeline.
  - Timeline readout and keyframe mixing when Cross‑zoom is active.

- **Right panel (Library)**
  - Shows whether Image A/B are loaded and lets you clear them.

## Media

- Load a primary still/video; optional secondary enables cross‑zoom.
- Supported: common image formats (png, jpg, webp) and video (mp4/webm).

## Effects pipeline (what each control does)

- **Halftone** (default)
  - `dotScale`: controls dot size.
  - `angleRad`: screen angle in radians.
  - `contrast`: contrast curve multiplier.
  - `invert01`: invert toggle (0/1).

- **Cross‑zoom** (when secondary media is set)
  - `zoomStrength`: zoom intensity during transition.
  - `samples`: quality/perf tradeoff (auto‑reduced by PerfAgent on low fps).
  - Uses timeline keyframes to blend from A→B over t ∈ [0..1].

- **VHS**
  - `aberration`, `noise`, `scanline`, `vignette` for retro look.

- **Post / Global** (applies to all effects)
  - `bloomStrength`, `bloomThreshold`: glow amount and threshold.
  - `lutAmount`: strength of LUT toning if a LUT is loaded.
  - `grainAmount`: film grain.
  - `vignette01`: vignette strength.

- **Text overlay**
  - Enable in Text tab; rendered with SDF on the canvas.
  - `amp` (wiggle), `freq`, `speed`, `outlinePx`.

## Popout panels (what they’re for)

- **Generate (WebGPU)**: on‑device thumbnail generation with prompt/seed/steps/cfg. Preview and “Send to Canvas”.
- **Generative Fill**: box‑select an area over a canvas snapshot, call Inpaint service, and composite the returned patch back onto the primary image.
- **Motion**: AnimateDiff creates a 2–4s clip at 12/24 fps; RIFE upsamples fps 2×/3×. Preview and “Send to Canvas/Timeline”.
- **Style Transfer**: apply fast style transfer (Mosaic/Udnie/Candy/…) with a strength slider; result continues through the shader pipeline.
- **Effects**: switches between Halftone/Cross‑zoom/VHS and exposes sliders above.
- **Text**: toggles SDF text and its animation/outline.
- **Presets**: Save current look, import/export JSON, apply saved styles.
- **Co‑pilot**: lightweight assistant panel UI.
- **Agents**: run agents (see below) and inspect logs/traces.
- **Policy**: evaluate export policy; shows violations and one‑click fix.
- **Settings**: export bitrate, timeline snap granularity.
- **Library**: status and clear actions for Image A/B, and style‑pack import/export.

## Image & video generation (overview)

- **Image (WebGPU)**: Uses ONNX Runtime Web to generate 256–512px previews in ≈1–2s on modern GPUs. Sliders for very low steps and compact CFG to keep latency low. One‑click “Send to Canvas” passes the result into the shader pipeline (Halftone/VHS/Post).
- **Generative Fill**: For small areas, a crop + mask is sent to the Inpaint microservice (SDXL‑Turbo patch). Returned PNG is composited into the original frame at the selected coordinates.
- **Motion**: AnimateDiff produces short looping clips; RIFE increases fps for smoother motion. Results can be previewed and inserted as the primary clip with transitions and effects applied.
- **Style Transfer**: Runs locally with TF.js. Blend strength allows subtle looks while keeping shader‑based adjustments available afterward.

### Local ONNX models (optional)

- Drop `.onnx` files under `public/models/` and list them in `public/models/models.json` as:

```
[
  { "name": "My Model", "url": "/models/my-model.onnx" }
]
```

- In the app, open Generate (WebGPU) and pick from the “Local models” dropdown. You can also paste a public URL or use the built‑in demo model.

## Enhance button (what it does and why)

- One‑click boost intended to improve perceived quality of the current photo/video without changing the creative intent.
- Under the hood it increases `contrast`, slightly raises `bloomStrength` and `lutAmount`, and gently reduces `grainAmount`. On Mobile the contrast bump is smaller to avoid clipping.
- It’s a toggle (press again to revert via manual sliders or another preset).

## Agents (what/why)

- **TransitionAgent**: inserts 3 keyframes for a simple Cross‑zoom.
- **PresetAgent**: proposes two starter presets after some edits.
- **PerfAgent**: reduces samples to maintain smooth fps on mobile.
- **BriefAgent**: applies parameters derived from a short style brief.
- **PolicyAgent**: enforces export constraints (e.g., 1080p on mobile).
- **ArchitectAgent**: suggests tasteful post params and saves as preset.
- **QAAgent**: measures fps for quick quality assurance.

## Keyboard shortcuts

- Space: Play/Pause
- Left/Right: Scrub timeline
- R: Record 3s  •  6: Record 6s
- E: Export  •  S: Save Style Pack
- A: Apply ACE Look (pipeline + top preset)
- ?: Toggle key help

## Use cases

- Rapid look‑development on stills or short clips (mood boards, pitches).
- Prototyping transitions between two images using Cross‑zoom.
- Batch exporting short previews for social or internal reviews.

## Development

```
npm install
npm run dev
```

### Demo (guided)

Run a short headed demo that opens Generate, uses a demo ONNX, sends to canvas, and opens Motion:

```
npm run demo
```

Optional: spin up motion/inpaint services (Docker required), then smoke-test endpoints:

```
npm run services:up
# mac/linux
npm run services:smoke
# windows powershell
npm run services:smoke:ps
```

### Backend preset service

Run in a second terminal from `ace-lab/ace-lab`:

```
npm run server
```

Windows‑friendly alias (sets PORT and runs in foreground):

```
npm run dev:server
```

## Exporting

- WebM export (bitrate from Settings). Optional GIF export (via command in the Lab tab).
- Policy checks run before export with auto‑fix suggestions (e.g., width for mobile).

## Microservices (run locally)

- Bring up services (inpaint/animate/rife) with Docker Compose:

```
docker compose -f infra/compose/docker-compose.yml up -d --build
```

- Quick smoke test (after services are up):

```
bash scripts/smoke.sh
```

## Project map

- `src/lab/CanvasHost.tsx`: WebGL renderer and shader pipeline.
- `src/store/useLabStore.ts`: global state, actions, agents.
- `src/shaders/*`: fragment shaders for blocks and post.
- `src/utils/media.ts`: capture/export helpers.
- `server/`: minimal Express service and tests.
- `packages/webgpu-gen`: WebGPU/WASM image generator (ONNX Runtime Web wrapper).
- `packages/style-transfer`: TF.js fast style transfer utilities.
- `services/micro-animate`: FastAPI service for AnimateDiff.
- `services/micro-rife`: FastAPI service for RIFE interpolation.
- `services/micro-inpaint`: FastAPI service for SDXL‑Turbo inpaint (patch fill only).
- `infra/compose/docker-compose.yml`: compose file for local services.
- `scripts/smoke.sh`: sanity checks and tiny sample calls.

## Additional capabilities

- Drag‑drop media loading with instant thumbnails.
- Curated LUT gallery with mobile‑tuned performance.
- Full undo/redo for parameter edits and snapshot compare.
- Audio import for videos and synchronized A/V export.
- Multi‑clip timeline with additional transitions beyond Cross‑zoom.
- Comprehensive accessibility support and full keyboard control of sliders.
- Expanded built‑in preset packs with thumbnail previews.

## Policy WASM build (optional)

Compile Rego to WASM (requires OPA CLI) and place it at `public/policy/policy.wasm`:

```
opa build -t wasm -e ace/policy/allow -o public/policy/policy.wasm src/policy/rules.rego
```

## Timeline export (multi-clip)

You can export the timeline as a single WebM from the Clips section using Export Timeline. The exporter stitches image and video clips, supports FPS/bitrate presets, and optionally mixes an audio track (browser captureStream). In production, use the background export worker for long renders.
