# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An interactive floor-plan editor for furnishing rooms, built with Vue 3 + Vite (plain JS, no TypeScript). It manages multiple independent rooms (create/rename/delete/switch), each with its own furniture layout and undo history. UI text and code comments are in Russian. The only external resource at runtime is Google Fonts.

## Commands

Node version required is 24.14.0 (see `package.json` → `engines`); run `nvm use 24.14.0`.

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
  - `config/catalog.js`: `KINDS`, `PRESETS`, `TONES`, `PAL` palettes, and the localStorage key constants (`ROOMS_KEY` current, `STORE_KEY` legacy single-draft, read-only, kept for migration).
  - `config/saved-layout.json`: the layout used to seed the very first room on a visitor's very first launch (`{state, savedAt}`) — irrelevant once `ROOMS_KEY` exists in their browser.
  - `lib/state.js`: `normalize`, `validState`, `defaultState` variants `a`/`b` (used by `apply-variant`, and to bootstrap the first room), `emptyRoomState` (blank room for newly created ones).
  - `lib/geometry.js`: pure geometry, collisions (`overlapSAT`, `computeIssues`), snapping and resize.
  - `lib/markup.js`: SVG string rendering (`planMarkup`, `viewBox`).
  - `model/plan.js`: rooms (`rooms` list, `activeRoomId`, `activeRoomName`, `createRoom`/`switchRoom`/`renameRoom`/`deleteRoom`), the reactive `plan` ref (active room's layout), selection (`selection` single + `multiSelection`/`isMultiActive`/`toggleMultiSelect` for group move), `guides`, `issues`, `palette`, and undo/redo history (`commit`, `commitSoon`, `undo`, `redo`, `replacePlan`, `removeSelected`). History resets whenever the active room changes.
- **entities/settings/** — display/snap/zoom persisted in localStorage (`nail-room-plan-ui-v1`), debounced writes.
- **features/** — one user action per slice: `history`, `toggle-display`, `zoom-plan` (owns viewport/svg refs, `zoom`, computed `scale`, `setZoom`; `zoom` seeds from and writes back to `entities/settings`), `add-item`, `create-item` (custom items; optional templates saved in localStorage `nail-room-plan-templates-v1` via `entities/plan/model/templates.js`), `edit-item` (also handles group rotate/duplicate when `isMultiActive`), `edit-opening`, `edit-room`, `select-object`, `export-layout` (PNG/SVG 1:50, both the same technical drawing/JSON), `apply-variant`, `manage-rooms` (the rooms dialog: create/rename/delete/switch).
- **widgets/** — `toolbar` (room-name button opens the rooms dialog), `plan-canvas` (SVG + pointer drag/resize/rotate/pan/pinch/group-move in `model/usePlanPointer.js`, plus the status bar), `side-panel` (shows item/opening editor, or a group summary when `isMultiActive`).
- **pages/plan-editor/** — composes the widgets and dialogs; keyboard shortcuts live in `lib/useHotkeys.js`.
- **app/** — `createApp`, global styles (`styles/index.css`).

## Key conventions

- **State model**: `plan = {room:{w,h}, items:[], openings:[]}`, all units cm. Items have center `x,y`, size `w`×`d`, `rot` in degrees, `kind` and `tone`. Openings are positioned by `wall` + `offset` + `width`. Any external state goes through `normalize()`, and `validState()` is the gate.
- **Rooms**: each room is `{id, name, updatedAt}` in the lightweight `rooms` list plus its full state, persisted together under `ROOMS_KEY` as `{activeId, rooms:[{id,name,updatedAt,state}]}`. Only the active room's state lives in the live `plan` ref; inactive rooms' states are cached in an in-module `Map` and frozen there on `switchRoom`/`createRoom`. On first-ever launch (no `ROOMS_KEY` yet), it bootstraps from the legacy single-draft key or the embedded `saved-layout.json`, whichever is newer — see `bootstrapRoomsData()` in `model/plan.js`.
- **Mutations**: mutate `plan.value` in place, then call `commit()`, or `commitSoon()` for keyboard nudges. Commit also debounces a save of the whole rooms blob to `ROOMS_KEY`. Structural room operations (create/switch/rename/delete) save immediately instead.
- **Multi-select**: Shift/Ctrl+click on an item (canvas or the object list) toggles it in `multiSelection` without starting a drag. A plain click-drag on an item that's already part of an active group (`isMultiActive`, size > 1) moves the whole group by the primary item's snapped delta; other members aren't individually clamped/snapped during the drag. Group members render with a dashed highlight (`groupHighlight` in `markup.js`) instead of the single-selection's resize/rotate handles.
- **Rendering**: the plan is an SVG string, a `computed` fed to `v-html`, so the same code serves interactive view and export. SVG units are cm; `mkK(scale)` converts screen px to cm for strokes and fonts. SVG colors come from `PAL.light/dark` (via `palette`), not CSS vars. Export always uses `PAL.light`.
- **Theme CSS**: tokens on `:root`, with dark mode defined twice: under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and under `:root[data-theme="dark"]`. Keep both in sync.
- **Panel inputs** use `SyncInput`, which applies on change/Enter, then re-shows the model value. That reverts invalid input and shows formatted numbers.
