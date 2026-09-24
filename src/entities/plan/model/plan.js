import { computed, ref } from 'vue'
import { isDark } from '@/shared/lib'
import { PAL, STORE_KEY } from '../config/catalog.js'
import savedLayout from '../config/saved-layout.json'
import { defaultState, normalize, validState } from '../lib/state.js'
import { computeIssues } from '../lib/geometry.js'

/* ---------- загрузка ---------- */
// Черновик из localStorage важнее опубликованной расстановки, только если он новее неё.
function readDraft() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (v && validState(v.state)) return v
  } catch (e) { /* нет доступа к хранилищу */ }
  return null
}
function initialState() {
  const embedded = savedLayout && validState(savedLayout.state) ? savedLayout : null
  const draft = readDraft()
  if (draft && (!embedded || (draft.updatedAt || 0) > (embedded.savedAt || 0))) return normalize(draft.state)
  if (embedded) return normalize(embedded.state)
  return defaultState()
}

/** Текущая расстановка: {room:{w,h}, items:[], openings:[]}, всё в сантиметрах. */
export const plan = ref(initialState())
/** Выбранный объект: {t:'i'|'o', id} или null. */
export const selection = ref(null)
/** Направляющие привязки во время перетаскивания. */
export const guides = ref({ x: null, y: null })

export const issues = computed(() => computeIssues(plan.value))
export const palette = computed(() => (isDark.value ? PAL.dark : PAL.light))

export const getItem = (id) => plan.value.items.find((i) => i.id === id)
export const getOpening = (id) => plan.value.openings.find((o) => o.id === id)
export const selectedItem = computed(() => (selection.value && selection.value.t === 'i' ? getItem(selection.value.id) || null : null))
export const selectedOpening = computed(() => (selection.value && selection.value.t === 'o' ? getOpening(selection.value.id) || null : null))

export function select(t, id) {
  selection.value = { t, id }
}
export function clearSelection() {
  selection.value = null
}

/** Удалить выбранный предмет или проём. */
export function removeSelected() {
  const s = selection.value
  if (!s) return
  if (s.t === 'i') plan.value.items = plan.value.items.filter((i) => i.id !== s.id)
  else plan.value.openings = plan.value.openings.filter((o) => o.id !== s.id)
  selection.value = null
  commit()
}

/* ---------- история и черновик ---------- */
export const snapshot = () => JSON.stringify(plan.value)

let hist = [snapshot()]
const hi = ref(0)
const histLen = ref(1)
export const canUndo = computed(() => hi.value > 0)
export const canRedo = computed(() => hi.value < histLen.value - 1)

let draftTimer = 0
function saveDraftSoon() {
  clearTimeout(draftTimer)
  draftTimer = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ state: plan.value, updatedAt: Date.now() })) } catch (e) { /* ignore */ }
  }, 350)
}

/** Зафиксировать текущее состояние в истории (и сохранить черновик). */
export function commit() {
  const s = snapshot()
  if (hist[hi.value] === s) return
  hist = hist.slice(0, hi.value + 1)
  hist.push(s)
  if (hist.length > 200) hist.shift()
  hi.value = hist.length - 1
  histLen.value = hist.length
  saveDraftSoon()
}
let commitTimer = 0
/** Отложенный commit — для серий мелких правок (стрелки клавиатуры). */
export function commitSoon() {
  clearTimeout(commitTimer)
  commitTimer = setTimeout(commit, 450)
}

function fixSelection() {
  const s = selection.value
  if (s && !(s.t === 'i' ? getItem(s.id) : getOpening(s.id))) selection.value = null
}
export function undo() {
  clearTimeout(commitTimer)
  commit()
  if (hi.value <= 0) return
  hi.value--
  plan.value = JSON.parse(hist[hi.value])
  fixSelection()
  saveDraftSoon()
}
export function redo() {
  if (hi.value >= histLen.value - 1) return
  hi.value++
  plan.value = JSON.parse(hist[hi.value])
  fixSelection()
  saveDraftSoon()
}

/** Вернуть состояние из снимка без записи в историю (отмена незавершённого жеста). */
export function restore(snap) {
  plan.value = JSON.parse(snap)
}
/** Заменить расстановку целиком (вариант, загрузка из файла) с записью в историю. */
export function replacePlan(next) {
  plan.value = normalize(next)
  selection.value = null
  commit()
}
