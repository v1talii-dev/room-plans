# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive floor-plan editor for a nail salon room, built with Vue 3 + Vite (plain JS, no TypeScript). UI text and code comments are in Russian. The only external resource at runtime is Google Fonts.

## Commands

Node version is pinned in `.nvmrc` (24.14.0). nvm-windows 1.1.x does not read `.nvmrc`, so run `nvm use 24.14.0` there. Newer nvm, nvm-windows and fnm pick it up with a plain `nvm use`.

- `npm run dev` — dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — serve the built `dist/`
- `npm run deploy` — build, then push `dist/` to the `gh-pages` branch via the `gh-pages` package. GitHub Pages must be set to serve from the `gh-pages` branch, root.

There is no linter or test suite. `vite.config.js` uses `base: './'`, so the build works under any Pages sub-path. `@` is aliased to `src/`.

## Architecture: Feature-Sliced Design

Layers in `src/`. A layer imports only from layers below it, and only through a slice's public `index.js`:

`app` → `pages` → `widgets` → `features` → `entities` → `shared`

- **shared/** — generic, domain-free code. `lib/` has number formatting (`fmt`, `num`), `isDark` theme ref, `toast`, `download`, and the modal-open counter. `ui/` has `SyncInput`, `NumField`, `ModalDialog` and `AppToast`.
- **entities/plan/** — the core domain.
  - `config/catalog.js`: `KINDS`, `PRESETS`, `TONES`, `PAL` palettes and other constants.
  - `config/saved-layout.json`: the default published layout (`{state, savedAt}`).
  - `lib/state.js`: `normalize`, `validState` and `defaultState` variants `a`/`b`.
  - `lib/geometry.js`: pure geometry, collisions (`overlapSAT`, `computeIssues`), snapping and resize.
  - `lib/markup.js`: SVG string rendering (`planMarkup`, `viewBox`).
  - `model/plan.js`: the reactive `plan` ref, `selection`, `guides`, `issues`, `palette`, and undo/redo history (`commit`, `commitSoon`, `undo`, `redo`, `replacePlan`, `removeSelected`).
- **entities/settings/** — display/snap toggles persisted in localStorage (`nail-room-plan-ui-v1`).
- **features/** — one user action per slice: `history`, `toggle-display`, `zoom-plan` (owns viewport/svg refs, `zoom`, computed `scale`, `setZoom`), `add-item`, `create-item` (custom items; optional templates saved in localStorage `nail-room-plan-templates-v1` via `entities/plan/model/templates.js`), `edit-item`, `edit-opening`, `edit-room`, `select-object`, `export-layout` (PNG/SVG 1:50/JSON), `apply-variant`.
- **widgets/** — `toolbar`, `plan-canvas` (SVG + pointer drag/resize/rotate/pan/pinch in `model/usePlanPointer.js`, plus the status bar), `side-panel`.
- **pages/plan-editor/** — composes the widgets and dialogs; keyboard shortcuts live in `lib/useHotkeys.js`.
- **app/** — `createApp`, global styles (`styles/index.css`).

## Key conventions

- **State model**: `plan = {room:{w,h}, items:[], openings:[]}`, all units cm. Items have center `x,y`, size `w`×`d`, `rot` in degrees, `kind` and `tone`. Openings are positioned by `wall` + `offset` + `width`. Any external state goes through `normalize()`, and `validState()` is the gate.
- **Mutations**: mutate `plan.value` in place, then call `commit()`, or `commitSoon()` for keyboard nudges. Commit also saves the draft to localStorage (`nail-room-plan-v1`). On load, the draft wins only if it is newer than `saved-layout.json`'s `savedAt`.
- **Rendering**: the plan is an SVG string, a `computed` fed to `v-html`, so the same code serves interactive view and export. SVG units are cm; `mkK(scale)` converts screen px to cm for strokes and fonts. SVG colors come from `PAL.light/dark` (via `palette`), not CSS vars. Export always uses `PAL.light`.
- **Theme CSS**: tokens on `:root`, with dark mode defined twice: under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and under `:root[data-theme="dark"]`. Keep both in sync.
- **Panel inputs** use `SyncInput`, which applies on change/Enter, then re-shows the model value. That reverts invalid input and shows formatted numbers.
