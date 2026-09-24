import { ref } from 'vue'
import { num, sizeOf, toast } from '@/shared/lib'
import { addItem, addTemplate, templateSpec } from '@/entities/plan'

export const createOpen = ref(false)
export const openCreate = () => { createOpen.value = true }
export const closeCreate = () => { createOpen.value = false }

/**
 * Проверить поля формы. Возвращает {tpl} с готовым шаблоном или {error} с текстом ошибки.
 * form: {name, round, w, d, tone} — w и d строками из полей ввода.
 */
export function validateForm(form) {
  const w = num(form.w), d = form.round ? w : num(form.d)
  if (!isFinite(w) || w <= 0 || !isFinite(d) || d <= 0) {
    return { error: form.round ? 'Укажите диаметр больше нуля.' : 'Укажите ширину и глубину больше нуля.' }
  }
  if (w > 3000 || d > 3000) return { error: 'Размер не может быть больше 3000 см.' }
  const name = String(form.name || '').trim().slice(0, 60) || 'Свой предмет'
  return { tpl: { name, round: !!form.round, w: sizeOf(w), d: sizeOf(d), tone: form.tone } }
}

/** Поставить свой предмет на план; remember — запомнить его в списке «Добавить предмет». */
export function createItem(tpl, remember) {
  if (remember) addTemplate(tpl)
  const { item, ok } = addItem(templateSpec(tpl))
  closeCreate()
  toast(ok ? `Добавлено: ${item.name.toLowerCase()}` : 'Свободного места нет, предмет поставлен в центр')
}
