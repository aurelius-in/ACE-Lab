# ACE Lab

<p align="center"><img src="../ace-lab.gif" width="30%" alt="ACE Lab logo"></p>

Agentic Creative Experience Lab scaffolded with Vite + React + TypeScript and Tailwind CSS. Brand styles use the ACE gradient and dark UI.

## Development

```
npm install
npm run dev
```

### Backend preset service

Start the simple preset service (CRUD) in another terminal:

```
# from ace-lab/ace-lab
npm run server
```

Windows-friendly dev alias:

```
# sets PORT then runs in foreground
npm run dev:server
```

## Quick usage

- Load Image A (and optionally Image B) in Effects tab.
- Adjust Halftone sliders; add Text in Text tab.
- Play the timeline; use Auto-compose to insert keyframes.
- Use device toggle (Desktop/Mobile). Export applies 1080p on Mobile.

### Keyboard shortcuts

- Space: Play/Pause
- Left/Right: Scrub timeline
- R: Record 3s  •  6: Record 6s
- E: Export  •  S: Save Style Pack
- A: Apply ACE Look (pipeline + top preset)

## What’s new (succinct)

- Agents & Policy panels: run agents with a live log; run policy checks and one-click Fix.
- Settings tab: export bitrate slider and timeline snap-step control.
- Export polish: progress HUD with Abort; bitrate applied to MediaRecorder.
- Presets: Export/Import JSON, Save current as preset, optional server sync toggle.
- Timeline: labeled grid, configurable snapping (Shift finer, Alt coarser) with live percent.
- Effects: VHS block selectable; LUT support (.cube/.png); SDF text rendering.

## Improvements backlog

- Architect flow
  - Blend suggested params directly post-pipeline and save as preset
  - Visual indicators for applied suggestions
- Presets
  - Expanded built-ins across Print, Mobile, Cinematic, Monochrome, VHS, Text
  - Server sync: login + bearer token; thumbs captured from canvas
- Policy parity
  - WASM OPA when available; server-side fallback otherwise
  - UI surfacing of violations and one-click fix
- CI
  - Lint + build + server tests + e2e (Playwright) on PRs
  - Preview artifact of dist/

## Acceptance checks (this iteration)

- Load photo, apply Halftone, Record 3s → downloads WebM
- Transition with two images, keyframes render and play
- BriefAgent with prompt “warm retro print, soft grain” updates look
- PerfAgent on cross-zoom reduces samples when needed
- PolicyAgent blocks 4K on Mobile and fixes to 1080p
- After 10 edits, PresetAgent suggests ≥2 presets

### Policy WASM build

Compile Rego to WASM (requires OPA CLI) and place it in `public/policy/policy.wasm`:

```
opa build -t wasm -e ace/policy/allow -o public/policy/policy.wasm src/policy/rules.rego
```


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
