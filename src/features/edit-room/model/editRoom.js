import { clamp, num, uid } from '@/shared/lib'
import { clampInside, clampOpeningIn, commit, plan, rotateState, select } from '@/entities/plan'

/** Изменить длину стен: r = 'w' (верхняя и нижняя) или 'h' (левая и правая). */
export function applyRoomSize(r, raw) {
  const v = num(raw)
  if (!isFinite(v)) return
  const st = plan.value
  st.room[r] = clamp(Math.round(v * 10) / 10, 50, 3000)
  st.openings.forEach((o) => clampOpeningIn(st, o))
  st.items.forEach((it) => clampInside(st.room, it))
  commit()
}

export function addOpening(type) {
  const W = plan.value.room.w
  const o = { id: uid(), type, wall: 'top', width: type === 'door' ? 80 : 120, offset: 0, hinge: 'start', swing: 'in' }
  o.width = Math.min(o.width, W)
  o.offset = Math.max(0, (W - o.width) / 2)
  plan.value.openings.push(o)
  select('o', o.id)
  commit()
}

export function rotatePlan() {
  rotateState(plan.value)
  commit()
}
