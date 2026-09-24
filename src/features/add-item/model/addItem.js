import { toast, uid } from '@/shared/lib'
import { KINDS, PRESETS, commit, freeSpot, plan, select } from '@/entities/plan'

/** Добавить предмет из каталога в ближайшее к центру свободное место. */
export function addPreset(i) {
  const p = PRESETS[i], K = KINDS[p.kind]
  const it = { id: uid(), kind: p.kind, name: K.label, w: p.w || K.w, d: p.d || K.d, x: 0, y: 0, rot: 0, tone: K.tone, locked: false }
  const ok = freeSpot(plan.value, it)
  plan.value.items.push(it)
  select('i', it.id)
  commit()
  toast(ok ? `Добавлено: ${it.name.toLowerCase()}` : 'Свободного места нет, предмет поставлен в центр')
}
