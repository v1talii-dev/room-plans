export * from './config/catalog.js'
export { isRound, dimsText } from './lib/item.js'
export { defaultState, emptyRoomState, normalize, validState, wallLenOf, clampOpeningIn } from './lib/state.js'
export {
  ext, aabb, clampInside, computeIssues, summarize, freeSpot, resizeAnchored, rotateState,
  snapMove, localOf, doResize,
} from './lib/geometry.js'
export { planMarkup, padsCm, viewBox, mkK } from './lib/markup.js'
export {
  plan, selection, multiSelection, isMultiActive, guides, issues, palette,
  getItem, getOpening, selectedItem, selectedOpening, select, clearSelection, toggleMultiSelect,
  addItem, removeSelected,
  snapshot, canUndo, canRedo, commit, commitSoon, undo, redo, restore, replacePlan,
  rooms, activeRoomId, activeRoomName, switchRoom, createRoom, renameRoom, deleteRoom,
} from './model/plan.js'
export { templates, addTemplate, removeTemplate, templateSpec } from './model/templates.js'
