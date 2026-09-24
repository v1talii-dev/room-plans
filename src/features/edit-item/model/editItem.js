import { num, sizeOf, uid } from '@/shared/lib'
import { KINDS, clampInside, commit, ext, freeSpot, plan, resizeAnchored, select, selectedItem } from '@/entities/plan'

/** Применить значение поля панели к выбранному предмету. */
export function applyItemField(f, raw) {
  const it = selectedItem.value
  if (!it) return
  const room = plan.value.room, W = room.w, H = room.h
  if (f === 'name') {
    it.name = String(raw).trim().slice(0, 60) || KINDS[it.kind].label
  } else if (f === 'locked') {
    it.locked = !!raw
  } else {
    const v = num(raw)
    if (!isFinite(v)) return
    const e = ext(it)
    switch (f) {
      case 'w': resizeAnchored(room, it, sizeOf(v), it.d); break
      case 'd': resizeAnchored(room, it, it.w, sizeOf(v)); break
      case 'dia': resizeAnchored(room, it, sizeOf(v), sizeOf(v)); break
      case 'rot': it.rot = ((v % 360) + 360) % 360; clampInside(room, it); break
      case 'left': it.x = v + e[0]; clampInside(room, it); break
      case 'right': it.x = W - v - e[0]; clampInside(room, it); break
      case 'top': it.y = v + e[1]; clampInside(room, it); break
      case 'bottom': it.y = H - v - e[1]; clampInside(room, it); break
    }
  }
  commit()
}

export function setTone(tone) {
  const it = selectedItem.value
  if (!it) return
  it.tone = tone
  commit()
}

export function rotateSelected(deg) {
  const it = selectedItem.value
  if (!it || it.locked) return
  it.rot = (((it.rot + deg) % 360) + 360) % 360
  clampInside(plan.value.room, it)
  commit()
}

export function duplicateSelected() {
  const src = selectedItem.value
  if (!src) return
  const it = { ...src, id: uid(), locked: false }
  freeSpot(plan.value, it, [src.x + 30, src.y + 30])
  plan.value.items.push(it)
  select('i', it.id)
  commit()
}
