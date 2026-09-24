import { toast } from '@/shared/lib'
import { PRESETS, addItem, templateSpec } from '@/entities/plan'

function report({ item, ok }) {
  toast(ok ? `Добавлено: ${item.name.toLowerCase()}` : 'Свободного места нет, предмет поставлен в центр')
}

/** Добавить предмет из каталога в ближайшее к центру свободное место. */
export function addPreset(i) {
  const p = PRESETS[i]
  report(addItem({ kind: p.kind, w: p.w, d: p.d }))
}

/** Добавить свой предмет по сохранённому шаблону. */
export function addFromTemplate(t) {
  report(addItem(templateSpec(t)))
}
