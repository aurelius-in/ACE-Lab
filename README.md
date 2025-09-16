# ACE Lab — Agentic Creative Experience Lab

<p align="center">
  <img src="./ace-lab.png" alt="ACE Lab logo" width="25%" />
</p>


A compact creative-tools platform that pairs real-time shaders with agentic AI. Load images or video, apply from-scratch GLSL effects, record clips, and let specialized agents propose looks, optimize performance, compose transitions, and keep outputs on brand.

## Highlights

- **Agentic co-pilot**
  - Creative Brief Agent: turns a prompt or reference image into a look profile and starter params
  - Shader Architect Agent: proposes shader blocks and tunable schemas for the target device
  - Performance Optimizer Agent: profiles GPU time, reduces samples, and produces mobile-safe presets
  - Transition Composer Agent: analyzes media to auto-time transitions and build a keyframe timeline
  - Preset Curator Agent: learns from edits and recommends next presets
  - Policy Agent: brand and export rules with clear violations and one-click fixes
  - Knowledge/RAG Agent: retrieves shader tips and citations from a local corpus
  - QA Agent: sweeps presets, flags flicker or banding, and attaches an artifact report

- **Creative toolkit**
  - Filters: Halftone, VHS/aberration with scanlines and grain
  - Transition: Cross-zoom with tunable samples and strength
  - Text effect: Wave with outline using a canvas text atlas
  - Live inputs, presets, FPS HUD, and WebM clip recording

## Core pillars (image & video generation)

- **Image generation (WebGPU/WASM)**
  - Browser‑native thumbnail generation via ONNX Runtime Web. Accepts a model URL (or local catalog entry), shows device/provider (WebGPU/WASM) and timing, and supports one‑click “Send to Canvas” into the shader pipeline.
  - Local models: put `.onnx` files under `ace-lab/public/models/` and list them in `ace-lab/public/models/models.json` for quick selection.

- **Generative Fill (inpaint)**
  - Box‑select a region on the canvas, the app crops a minimal patch + mask, calls a FastAPI inpaint microservice (SDXL‑Turbo), and composites the patch back into the image.

- **Motion generation**
  - AnimateDiff (short 2–4s loops) and RIFE frame interpolation (2×/3×). Preview results and “Send to Canvas/Timeline” to apply transitions and effects. Timeline auto‑scrolls when clips are inserted.

- **Style transfer (TF.js)**
  - Fast on‑device styles (Mosaic/Udnie/Candy…) with a strength slider; results continue through Halftone/VHS/Post shaders for final look‑dev.

- **Export & policy**
  - WebM and GIF export with bitrate control. Policy hooks in place for pre‑export checks and one‑click auto‑fix.

## Quick start

```bash
# Create the app
npm create vite@latest ace-lab -- --template react-ts
cd ace-lab
npm i

# Add the main component
# Save your component file as: src/IGCreativeLab.tsx
# Replace src/App.tsx with:
