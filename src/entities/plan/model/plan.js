import { computed, reactive, ref } from 'vue'
import { isDark, uid } from '@/shared/lib'
import { KINDS, PAL, ROOMS_KEY, STORE_KEY } from '../config/catalog.js'
import savedLayout from '../config/saved-layout.json'
import { defaultState, emptyRoomState, normalize, validState } from '../lib/state.js'
import { computeIssues, freeSpot } from '../lib/geometry.js'

const DEFAULT_ROOM_NAME = 'Комната'

/* ---------- загрузка и миграция ---------- */
// Старый ключ одиночного черновика (версии приложения без нескольких комнат).
function readOldDraft() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (v && validState(v.state)) return v
  } catch (e) { /* нет доступа к хранилищу */ }
  return null
}
function readRoomsData() {
  try {
    const raw = localStorage.getItem(ROOMS_KEY)
    if (!raw) return null
    const v = JSON.parse(raw)
    if (!v || !Array.isArray(v.rooms) || typeof v.activeId !== 'string') return null
    const rooms = v.rooms.filter((r) => r && typeof r.id === 'string' && validState(r.state))
    return rooms.length ? { activeId: v.activeId, rooms } : null
  } catch (e) { /* ignore */ }
  return null
}
// Первый запуск после обновления: список комнат ещё не сохранён — собираем одну комнату
// из встроенной расстановки или, если он новее, из черновика прежней (одноплановой) версии.
function bootstrapRoomsData() {
  const existing = readRoomsData()
  if (existing) return existing
  const embedded = savedLayout && validState(savedLayout.state) ? savedLayout : null
  const draft = readOldDraft()
  let state, updatedAt
  if (draft && (!embedded || (draft.updatedAt || 0) > (embedded.savedAt || 0))) { state = draft.state; updatedAt = draft.updatedAt }
  else if (embedded) { state = embedded.state; updatedAt = embedded.savedAt }
  else { state = defaultState(); updatedAt = Date.now() }
  const room = { id: 'default', name: DEFAULT_ROOM_NAME, state: normalize(state), updatedAt: updatedAt || Date.now() }
  return { activeId: room.id, rooms: [room] }
}
const boot = bootstrapRoomsData()

/* ---------- комнаты ---------- */
/** Лёгкий список комнат для переключателя: {id, name, updatedAt}[]. Сами расстановки — в plan/roomStates. */
export const rooms = reactive(boot.rooms.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt })))
/** id активной комнаты. */
export const activeRoomId = ref(boot.activeId)
export const activeRoomName = computed(() => {
  const r = rooms.find((x) => x.id === activeRoomId.value)
  return r ? r.name : DEFAULT_ROOM_NAME
})

// Расстановки неактивных комнат. Активная комната хранится в `plan`, а не здесь.
const roomStates = new Map(boot.rooms.map((r) => [r.id, r.state]))
roomStates.delete(activeRoomId.value)

/** Текущая расстановка активной комнаты: {room:{w,h}, items:[], openings:[]}, всё в сантиметрах. */
export const plan = ref(normalize((boot.rooms.find((r) => r.id === activeRoomId.value) || boot.rooms[0]).state))
/** Выбранный объект: {t:'i'|'o', id} или null. */
export const selection = ref(null)
/** Дополнительные предметы группового выделения (id), для перемещения нескольких сразу. */
export const multiSelection = ref([])
export const isMultiActive = computed(() => multiSelection.value.length > 1)
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
  multiSelection.value = []
}
export function clearSelection() {
  selection.value = null
  multiSelection.value = []
}
/** Shift/Ctrl+клик по предмету: добавить/убрать его из группового выделения. */
export function toggleMultiSelect(id) {
  // Первый такой клик после обычного одиночного выбора предмета затягивает его в группу как первого участника
  let base = multiSelection.value
  if (!base.length && selection.value && selection.value.t === 'i' && selection.value.id !== id) base = [selection.value.id]
  const i = base.indexOf(id)
  multiSelection.value = i >= 0 ? base.filter((x) => x !== id) : [...base, id]
  selection.value = multiSelection.value.length ? { t: 'i', id } : null
}

/**
 * Поставить новый предмет в ближайшее к центру свободное место и выбрать его.
 * spec: {kind, name?, w?, d?, tone?}; недостающее берётся из KINDS[kind].
 * Возвращает {item, ok}; ok = false, если свободного места не нашлось.
 */
export function addItem(spec) {
  const K = KINDS[spec.kind]
  const w = spec.w || K.w
  const it = {
    id: uid(), kind: spec.kind, name: String(spec.name || K.label).slice(0, 60),
    w, d: K.round ? w : spec.d || K.d, x: 0, y: 0, rot: 0, tone: spec.tone || K.tone, locked: false,
  }
  const ok = freeSpot(plan.value, it)
  plan.value.items.push(it)
  select('i', it.id)
  commit()
  return { item: it, ok }
}

/** Удалить выбранный предмет/проём, либо всю группу, если активно групповое выделение. */
export function removeSelected() {
  if (isMultiActive.value) {
    const ids = new Set(multiSelection.value)
    plan.value.items = plan.value.items.filter((i) => !ids.has(i.id))
    clearSelection()
    commit()
    return
  }
  const s = selection.value
  if (!s) return
  if (s.t === 'i') plan.value.items = plan.value.items.filter((i) => i.id !== s.id)
  else plan.value.openings = plan.value.openings.filter((o) => o.id !== s.id)
  selection.value = null
  commit()
}

/* ---------- сохранение ---------- */
function roomsBlob() {
  return {
    activeId: activeRoomId.value,
    rooms: rooms.map((r) => ({
      id: r.id, name: r.name, updatedAt: r.updatedAt,
      state: r.id === activeRoomId.value ? plan.value : roomStates.get(r.id),
    })),
  }
}
let saveTimer = 0
function saveSoon() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNow, 350)
}
function saveNow() {
  try { localStorage.setItem(ROOMS_KEY, JSON.stringify(roomsBlob())) } catch (e) { /* ignore */ }
}
function touchActiveRoom() {
  const r = rooms.find((x) => x.id === activeRoomId.value)
  if (r) r.updatedAt = Date.now()
}

/* ---------- история ---------- */
export const snapshot = () => JSON.stringify(plan.value)

let hist = [snapshot()]
const hi = ref(0)
const histLen = ref(1)
export const canUndo = computed(() => hi.value > 0)
export const canRedo = computed(() => hi.value < histLen.value - 1)

/** Зафиксировать текущее состояние в истории (и сохранить черновик). */
export function commit() {
  const s = snapshot()
  if (hist[hi.value] === s) return
  hist = hist.slice(0, hi.value + 1)
  hist.push(s)
  if (hist.length > 200) hist.shift()
  hi.value = hist.length - 1
  histLen.value = hist.length
  touchActiveRoom()
  saveSoon()
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
  if (multiSelection.value.length) multiSelection.value = multiSelection.value.filter((id) => getItem(id))
}
export function undo() {
  clearTimeout(commitTimer)
  commit()
  if (hi.value <= 0) return
  hi.value--
  plan.value = JSON.parse(hist[hi.value])
  fixSelection()
  touchActiveRoom()
  saveSoon()
}
export function redo() {
  if (hi.value >= histLen.value - 1) return
  hi.value++
  plan.value = JSON.parse(hist[hi.value])
  fixSelection()
  touchActiveRoom()
  saveSoon()
}

/** Вернуть состояние из снимка без записи в историю (отмена незавершённого жеста). */
export function restore(snap) {
  plan.value = JSON.parse(snap)
}
/** Заменить расстановку целиком (вариант, загрузка из файла) с записью в историю. */
export function replacePlan(next) {
  plan.value = normalize(next)
  selection.value = null
  multiSelection.value = []
  commit()
}

/* ---------- управление комнатами ---------- */
function resetHistoryFor(state) {
  plan.value = state
  hist = [snapshot()]
  hi.value = 0
  histLen.value = 1
  selection.value = null
  multiSelection.value = []
}
/** Переключиться на другую комнату по id. История отмены — своя для каждой комнаты. */
export function switchRoom(id) {
  if (id === activeRoomId.value) return
  const target = rooms.find((r) => r.id === id)
  if (!target) return
  roomStates.set(activeRoomId.value, plan.value) // заморозить состояние покидаемой комнаты
  activeRoomId.value = id
  resetHistoryFor(normalize(roomStates.get(id)))
  roomStates.delete(id) // источник истины для активной комнаты теперь — plan
  saveNow()
}
/** Создать пустую комнату и переключиться на неё. Возвращает её id. */
export function createRoom(name) {
  roomStates.set(activeRoomId.value, plan.value)
  const id = uid()
  rooms.push({ id, name: String(name || '').trim().slice(0, 60) || DEFAULT_ROOM_NAME, updatedAt: Date.now() })
  activeRoomId.value = id
  resetHistoryFor(normalize(emptyRoomState()))
  saveNow()
  return id
}
export function renameRoom(id, name) {
  const r = rooms.find((x) => x.id === id)
  if (!r) return
  r.name = String(name || '').trim().slice(0, 60) || DEFAULT_ROOM_NAME
  r.updatedAt = Date.now()
  saveNow()
}
/** Удалить комнату (кроме последней оставшейся). Возвращает true, если удалено. */
export function deleteRoom(id) {
  if (rooms.length <= 1) return false
  const idx = rooms.findIndex((r) => r.id === id)
  if (idx < 0) return false
  if (id === activeRoomId.value) {
    const fallback = rooms[idx - 1] || rooms[idx + 1]
    switchRoom(fallback.id)
  }
  rooms.splice(rooms.findIndex((r) => r.id === id), 1)
  roomStates.delete(id)
  saveNow()
  return true
}
