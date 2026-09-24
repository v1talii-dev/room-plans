import { ref, watch } from 'vue'
import { sizeOf, uid } from '@/shared/lib'
import { TONES } from '../config/catalog.js'

const TEMPLATES_KEY = 'nail-room-plan-templates-v1'

/** Шаблон своего предмета: {id, name, round, w, d, tone}. */
function normalizeTemplate(t) {
  const w = sizeOf(+t.w > 0 ? +t.w : 50)
  return {
    id: String(t.id || uid()),
    name: String(t.name || 'Свой предмет').trim().slice(0, 60) || 'Свой предмет',
    round: !!t.round,
    w,
    d: t.round ? w : sizeOf(+t.d > 0 ? +t.d : 50),
    tone: TONES.includes(t.tone) ? t.tone : 'other',
  }
}

function readTemplates() {
  try {
    const v = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]')
    return Array.isArray(v) ? v.filter((t) => t && typeof t === 'object').map(normalizeTemplate) : []
  } catch (e) {
    return []
  }
}

/** Свои предметы, сохранённые в этом браузере для повторного добавления. */
export const templates = ref(readTemplates())

watch(templates, (v) => {
  try { localStorage.setItem(TEMPLATES_KEY, JSON.stringify(v)) } catch (e) { /* ignore */ }
}, { deep: true })

export function addTemplate(t) {
  const tpl = normalizeTemplate({ ...t, id: uid() })
  templates.value.push(tpl)
  return tpl
}
export function removeTemplate(id) {
  templates.value = templates.value.filter((t) => t.id !== id)
}
/** Параметры для addItem() по шаблону. */
export function templateSpec(t) {
  return { kind: t.round ? 'circle' : 'box', name: t.name, w: t.w, d: t.d, tone: t.tone }
}
