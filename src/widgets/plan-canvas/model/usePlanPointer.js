import { ref } from 'vue'
import { clamp, fmt } from '@/shared/lib'
import {
  WALLS, clampInside, clearSelection, commit, doResize, getItem, getOpening, guides, localOf,
  multiSelection, plan, restore, select, selection, snapMove, snapshot, toggleMultiSelect, wallLenOf,
} from '@/entities/plan'
import { settings } from '@/entities/settings'
import { scale, setZoom, zoom } from '@/features/zoom-plan'

/**
 * Указатель на плане: перетаскивание предметов и дверей, ручки размера и поворота,
 * панорамирование пустого места и щипок двумя пальцами.
 */
export function usePlanPointer(svgRef, vpRef) {
  const dragging = ref(false)
  const cursorText = ref('')
  const pointers = new Map()
  let drag = null

  function toCm(e) {
    const m = svgRef.value.getScreenCTM()
    if (!m) return [0, 0]
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return [p.x, p.y]
  }
  function updateCursor(Pt) {
    const W = plan.value.room.w, H = plan.value.room.h
    cursorText.value = Pt[0] >= 0 && Pt[1] >= 0 && Pt[0] <= W && Pt[1] <= H ? `← ${fmt(Pt[0])} см ↑ ${fmt(Pt[1])} см` : ''
  }

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const svg = svgRef.value, vp = vpRef.value
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try { svg.setPointerCapture(e.pointerId) } catch (_) { /* ignore */ }
    if (pointers.size === 2) {
      // Второй палец: отменяем начатое перетаскивание и переходим к масштабированию
      if (drag && drag.moved && drag.mode !== 'pan' && drag.mode !== 'pinch') restore(drag.before)
      const v = [...pointers.values()]
      drag = { mode: 'pinch', d0: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), z0: zoom.value }
      guides.value = { x: null, y: null }
      dragging.value = false
      return
    }
    if (pointers.size > 2) return
    const Pt = toCm(e), t = e.target
    const h = t.closest && t.closest('[data-handle]'), ie = t.closest && t.closest('[data-id]'), oe = t.closest && t.closest('[data-oid]')
    const base = { x0: e.clientX, y0: e.clientY, moved: false, before: snapshot() }
    if (h) {
      const it = getItem(h.dataset.id)
      if (it) {
        drag = { ...base, mode: h.dataset.handle === 'rot' ? 'rotate' : 'resize', handle: h.dataset.handle, id: it.id, start: { ...it } }
        drag.l0 = localOf(Pt, it)
      }
    } else if (ie) {
      const it = getItem(ie.dataset.id)
      if (it) {
        const modifier = e.shiftKey || e.ctrlKey || e.metaKey
        if (modifier) {
          // Shift/Ctrl+клик: только переключить членство в групповом выделении, без перетаскивания.
          // Отдельный режим 'none' — иначе клик провалится в pan и снимет только что поставленное выделение.
          toggleMultiSelect(it.id)
          drag = { ...base, mode: 'none' }
        } else if (multiSelection.value.includes(it.id) && multiSelection.value.length > 1) {
          // Клик по предмету, уже входящему в группу: тащим всю группу вместе
          const starts = new Map(multiSelection.value.map((id) => { const o = getItem(id); return [id, { x: o.x, y: o.y }] }))
          selection.value = { t: 'i', id: it.id }
          drag = { ...base, mode: 'move-group', id: it.id, gx: Pt[0] - it.x, gy: Pt[1] - it.y, starts }
        } else {
          select('i', it.id)
          drag = it.locked
            ? { ...base, mode: 'pan', sl: vp.scrollLeft, st: vp.scrollTop, keep: true }
            : { ...base, mode: 'move', id: it.id, gx: Pt[0] - it.x, gy: Pt[1] - it.y }
        }
      }
    } else if (oe) {
      const op = getOpening(oe.dataset.oid)
      if (op) {
        select('o', op.id)
        const tc = op.wall === 'top' || op.wall === 'bottom' ? Pt[0] : Pt[1]
        drag = { ...base, mode: 'door', id: op.id, grab: tc - op.offset }
      }
    }
    if (!drag) drag = { ...base, mode: 'pan', sl: vp.scrollLeft, st: vp.scrollTop }
  }

  function onPointerMove(e) {
    const Pt = toCm(e)
    updateCursor(Pt)
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (!drag) return
    if (drag.mode === 'pinch') {
      if (pointers.size < 2) return
      const v = [...pointers.values()], d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y)
      if (drag.d0 > 0) setZoom((drag.z0 * d) / drag.d0, (v[0].x + v[1].x) / 2, (v[0].y + v[1].y) / 2)
      return
    }
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 3) return
      drag.moved = true
      if (drag.mode !== 'pan') dragging.value = true
    }
    const alt = e.altKey
    if (drag.mode === 'pan') {
      const vp = vpRef.value
      vp.scrollLeft = drag.sl - (e.clientX - drag.x0)
      vp.scrollTop = drag.st - (e.clientY - drag.y0)
      return
    }
    if (drag.mode === 'move') {
      const it = getItem(drag.id)
      if (!it) return
      const r = snapMove(plan.value, it, Pt[0] - drag.gx, Pt[1] - drag.gy, { snap: settings.snap && !alt, step: settings.step, scale: scale.value })
      it.x = r.cx
      it.y = r.cy
      guides.value = r.g
      return
    }
    if (drag.mode === 'move-group') {
      const primary = getItem(drag.id)
      if (!primary) return
      const r = snapMove(plan.value, primary, Pt[0] - drag.gx, Pt[1] - drag.gy, { snap: settings.snap && !alt, step: settings.step, scale: scale.value })
      const s0 = drag.starts.get(drag.id), dx = r.cx - s0.x, dy = r.cy - s0.y
      for (const [id, s] of drag.starts) {
        const o = getItem(id)
        if (!o || o.locked) continue
        o.x = s.x + dx
        o.y = s.y + dy
      }
      guides.value = r.g
      return
    }
    if (drag.mode === 'resize') {
      const it = getItem(drag.id)
      if (it) doResize(it, drag, Pt, alt || !settings.snap)
      return
    }
    if (drag.mode === 'rotate') {
      const it = getItem(drag.id)
      if (!it) return
      let a = (Math.atan2(Pt[1] - it.y, Pt[0] - it.x) * 180) / Math.PI + 90
      a = ((a % 360) + 360) % 360
      if (!alt) a = (Math.round(a / 15) * 15) % 360
      it.rot = Math.round(a * 10) / 10
      return
    }
    if (drag.mode === 'door') {
      const op = getOpening(drag.id)
      if (!op) return
      const W = plan.value.room.w, H = plan.value.room.h
      // Дверь переезжает на стену, к которой указатель заметно ближе
      const dist = { top: Math.abs(Pt[1]), bottom: Math.abs(H - Pt[1]), left: Math.abs(Pt[0]), right: Math.abs(W - Pt[0]) }
      let wall = op.wall
      for (const w of WALLS) if (dist[w] < dist[wall] - 8) wall = w
      if (wall !== op.wall) { op.wall = wall; drag.grab = op.width / 2 }
      const len = wallLenOf(plan.value, op.wall), tc = op.wall === 'top' || op.wall === 'bottom' ? Pt[0] : Pt[1]
      let off = tc - drag.grab
      if (settings.snap && !alt) {
        const thr = 8 / scale.value
        if (Math.abs(off) < thr) off = 0
        else if (Math.abs(len - op.width - off) < thr) off = len - op.width
        else off = Math.round(off / settings.step) * settings.step
      }
      op.offset = clamp(off, 0, len - op.width)
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId)
    if (!drag) return
    if (drag.mode === 'pinch') { if (pointers.size === 0) drag = null; return }
    const d = drag
    drag = null
    guides.value = { x: null, y: null }
    dragging.value = false
    if (d.mode === 'pan') {
      if (!d.moved && !d.keep && selection.value) clearSelection()
      return
    }
    if (d.moved) {
      if (d.mode === 'rotate') { const it = getItem(d.id); if (it) clampInside(plan.value.room, it) }
      commit()
    }
  }

  function onPointerLeave() {
    if (!drag) cursorText.value = ''
  }

  return { dragging, cursorText, onPointerDown, onPointerMove, onPointerUp, onPointerLeave }
}
