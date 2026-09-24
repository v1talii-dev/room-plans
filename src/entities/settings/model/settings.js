import { reactive, watch } from 'vue'

const UI_KEY = 'nail-room-plan-ui-v1'

/** Настройки отображения, привязки и масштаба; сохраняются в браузере отдельно от расстановок комнат. */
export const settings = reactive({ grid: true, snap: true, dims: true, labels: true, step: 5, zoom: 1 })

try {
  const u = JSON.parse(localStorage.getItem(UI_KEY) || 'null')
  if (u && typeof u === 'object') {
    for (const k of ['grid', 'snap', 'dims', 'labels']) if (typeof u[k] === 'boolean') settings[k] = u[k]
    if ([1, 5, 10].includes(u.step)) settings.step = u.step
    if (isFinite(+u.zoom) && +u.zoom > 0) settings.zoom = +u.zoom
  }
} catch (e) { /* ignore */ }

let saveTimer = 0
watch(settings, () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(UI_KEY, JSON.stringify({ ...settings })) } catch (e) { /* ignore */ }
  }, 350)
})
