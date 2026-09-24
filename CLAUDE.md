# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-file, dependency-free web app: an interactive floor-plan editor for a nail salon room (UI text and code comments are in Russian). Everything — CSS, HTML template, saved layout data, and JS — lives in `index.html`. There is no build step, package manager, linter, or test suite; open `index.html` in a browser (or serve the folder statically) to run it. The only external resource is Google Fonts.

## File layout (`index.html`)

The file is split into four tagged blocks, and **the IDs matter** because the app re-serializes itself (see "Save to link" below):

- `<style id="app-css">` — all styles. Theme colors are CSS tokens on `:root`, with dark mode defined twice: under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`, and under `:root[data-theme="dark"]`. Keep both in sync.
- `<template id="app-tpl">` — the app markup, cloned into `#app` at startup.
- `<script type="application/json" id="saved-layout">` — the embedded, published layout (`{state, savedAt}`).
- `<script id="app-js">` — the whole app in one IIFE.

## Architecture (app-js)

- **State model**: `state = {room:{w,h}, items:[], openings:[]}`, all units in centimeters. Items have center `x,y`, size `w`×`d`, `rot` (degrees), `kind` (key into `KINDS`), `tone` (color group). Openings (doors/windows) are positioned by `wall` + `offset` + `width`. Any externally loaded state must go through `normalize()` (clamps, defaults, dedupes IDs); `validState()` is the gate.
- **Load priority**: localStorage draft (`nail-room-plan-v1`) wins if newer than the embedded `saved-layout.savedAt`; otherwise the embedded layout; otherwise `defaultState()` (variants `a`/`b` in `VARIANTS`). UI toggles persist separately under `nail-room-plan-ui-v1`.
- **History**: undo/redo stores JSON snapshots (`hist`, max 200). Mutations call `commit()` (or `commitSoon()` for debounced text input), which also triggers `saveDraftSoon()`.
- **Rendering**: the plan is an SVG rebuilt as a string each render (`planMarkup()` and the `*Markup` helpers). SVG user units are cm; `mkK(scale)` converts screen-pixel sizes (strokes, fonts) into cm so they stay constant on screen. `renderAll()` redraws everything; `requestRender()` is the rAF-throttled path used during drag. Colors for SVG come from the JS `PAL.light/dark` palettes (not CSS vars), chosen by `isDark()`, and the app re-renders on theme change.
- **Geometry/validation**: `poly()`/`aabb()`/`ext()` handle rotated items; `overlapSAT()` does collision checks; `computeIssues()` flags overlaps, items outside walls, and items inside an inward door swing sector (`sectorPoly()`). Results drive highlighting and the status bar.
- **Interaction**: pointer drag with snapping to walls/neighbors/grid (`snapMove()`, Alt disables), resize handles (`doResize()`), keyboard shortcuts, and zoom (`setZoom()`). Side-panel inputs are wired via `data-f` (selected item/opening fields → `applyField()`), `data-r` (room → `applyRoom()`), and `data-a`/`data-act` action attributes.
- **Export**: SVG/PNG export always renders with `PAL.light`; JSON copy/load goes through `normalize()`.

## Save to link (self-republishing)

When hosted as a claude.ai artifact, `window.claude.use('artifact')` enables the "Сохранить" button. `saveToLink()` calls `buildPageHTML()`, which reconstructs the **entire page** from the live `#app-css`, `#app-tpl`, and `#app-js` contents plus a fresh `saved-layout` JSON, then publishes it. Consequences:

- Anything outside those blocks is lost on save. `headHTML()` hardcodes the `<head>` (title, fonts) — update it if you change the real `<head>`.
- The `saved-layout` block in the repo is data written by the app; editing it by hand changes the default published layout.
- `window.claude.use('downloads')` is used for file downloads; outside the artifact host, downloading shows a toast instead.
