# ACE Lab

Agentic Creative Experience Lab for rapid visual look‑development. Real‑time WebGL canvas with agent assist, presets, policy checks, and export.

<p align="center">
  <img src="../ace-lab-readme.gif" alt="ACE Lab demo – interactions, menus, and VHS conversion" style="max-width:100%; height:auto;" />
  <br/>
  <em>Interactive tour: menus, canvas edits, and converting a clip to VHS quality</em>
</p>

## Tech stack

- **Vite + React + TypeScript**: fast HMR and typed UI.
- **Zustand**: lightweight state store (`src/store/useLabStore.ts`).
- **WebGL2 + GLSL shaders**: halftone, cross‑zoom, VHS, bloom/post.
- **Tiny‑SDF**: crisp text rendering on the canvas.
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

- **Effects**: switches between Halftone/Cross‑zoom/VHS and exposes sliders above.
- **Text**: toggles SDF text and its animation/outline.
- **Presets**: Save current look, import/export JSON, apply saved styles.
- **Co‑pilot**: lightweight assistant panel UI.
- **Agents**: run agents (see below) and inspect logs/traces.
- **Policy**: evaluate export policy; shows violations and one‑click fix.
- **Settings**: export bitrate, timeline snap granularity.
- **Library**: status and clear actions for Image A/B, and style‑pack import/export.

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

## Project map

- `src/lab/CanvasHost.tsx`: WebGL renderer and shader pipeline.
- `src/store/useLabStore.ts`: global state, actions, agents.
- `src/shaders/*`: fragment shaders for blocks and post.
- `src/utils/media.ts`: capture/export helpers.
- `server/`: minimal Express service and tests.

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
