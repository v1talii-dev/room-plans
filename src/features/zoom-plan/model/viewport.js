import { computed, nextTick, reactive, ref, shallowRef } from 'vue'
import { clamp } from '@/shared/lib'
import { PADPX, padsCm, plan } from '@/entities/plan'

/** DOM-узлы области просмотра и SVG — регистрирует холст плана. */
export const viewportEl = shallowRef(null)
export const svgEl = shallowRef(null)
export const viewportSize = reactive({ w: 0, h: 0 })
export const zoom = ref(1)

/** Пикселей на сантиметр: «вписать в экран» × zoom. */
export const scale = computed(() => {
  const st = plan.value, p = padsCm(st)
  const aw = Math.max(80, viewportSize.w - 28), ah = Math.max(80, viewportSize.h - 28)
  const cw = st.room.w + p.l + p.r, ch = st.room.h + p.t + p.b
  return Math.max(0.05, Math.min((aw - 2 * PADPX) / cw, (ah - 2 * PADPX) / ch)) * zoom.value
})

/** Масштабирование с сохранением точки (cx, cy) экрана под курсором. */
export async function setZoom(z, cx, cy) {
  z = clamp(z, 0.4, 8)
  if (Math.abs(z - zoom.value) < 1e-4) return
  const vp = viewportEl.value, svg = svgEl.value
  if (!vp || !svg) { zoom.value = z; return }
  const r = vp.getBoundingClientRect()
  if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2 }
  const m = svg.getScreenCTM(), before = m ? new DOMPoint(cx, cy).matrixTransform(m.inverse()) : null
  zoom.value = z
  await nextTick()
  if (!before) return
  const m2 = svg.getScreenCTM()
  if (!m2) return
  const p = new DOMPoint(before.x, before.y).matrixTransform(m2)
  vp.scrollLeft += p.x - cx
  vp.scrollTop += p.y - cy
}

export async function zoomFit() {
  zoom.value = 1
  await nextTick()
  const vp = viewportEl.value
  if (vp) { vp.scrollLeft = 0; vp.scrollTop = 0 }
}
