import { clamp, num, sizeOf } from '@/shared/lib'
import { clampOpeningIn, commit, plan, selectedOpening, wallLenOf } from '@/entities/plan'

/** Применить значение поля панели к выбранной двери/окну. */
export function applyOpeningField(f, raw) {
  const op = selectedOpening.value
  if (!op) return
  if (f === 'otype') op.type = raw === 'window' ? 'window' : 'door'
  else if (f === 'wall') op.wall = raw
  else if (f === 'hinge') op.hinge = raw
  else if (f === 'swing') op.swing = raw
  else {
    const v = num(raw)
    if (!isFinite(v)) return
    const len = wallLenOf(plan.value, op.wall)
    if (f === 'owidth') op.width = clamp(sizeOf(v), 10, len)
    if (f === 'ostart') op.offset = v
    if (f === 'oend') op.offset = len - v - op.width
  }
  clampOpeningIn(plan.value, op)
  commit()
}
