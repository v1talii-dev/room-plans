import { ref } from 'vue'
import { clamp, download, esc, fmt, n2, toast } from '@/shared/lib'
import { FONT_DRAW, activeRoomName, computeIssues, mkK, padsCm, palette, plan, planMarkup, replacePlan, validState, viewBox } from '@/entities/plan'
import { settings } from '@/entities/settings'

export const exportOpen = ref(false)
export const openExport = () => { exportOpen.value = true }
export const closeExport = () => { exportOpen.value = false }

// Во сколько раз растеризуем PNG плотнее, чем на экране (как retina-скриншот): холст крупнее,
// но сам SVG (и, значит, пропорции подписей к мебели) строим как для liveScale — растягиваем
// вектор на отрисовке в canvas, а не через s, иначе подписи (фиксированный размер в px, см. mkK) станут мельче.
const RASTER_QUALITY = 3

/**
 * Самодостаточный SVG чертежа — та же тема, сетка и размер подписей, что и на экране.
 * liveScale — текущий масштаб плана на странице (px на см, из features/zoom-plan): используем его же
 * для экспорта, чтобы мебель и подписи были пиксель-в-пиксель такими же, как в интерактивном виде.
 * Ограничиваем сверху только на случай экстремального зума, чтобы не растеризовать в канвас за пределами разумного.
 */
export function exportSVG(liveScale) {
  const st = plan.value, P = palette.value
  const p = padsCm(st), cw = st.room.w + p.l + p.r, ch = st.room.h + p.t + p.b
  const s = clamp(liveScale, 0.05, 6000 / Math.max(cw, ch))
  const k = mkK(s), vb = viewBox(st, s), titleH = +(70 / s).toFixed(2)
  const inner = planMarkup(st, {
    pal: P, s, interactive: false, sel: null, issues: computeIssues(st), grid: settings.grid, labels: settings.labels, dims: false, guides: null,
  })
  const ty = vb.y + vb.h, W = st.room.w, H = st.room.h, x0 = vb.x + k(18), x1 = vb.x + vb.w - k(18)
  let t = `<text x="${n2(x0)}" y="${n2(ty + k(26))}" font-family="${FONT_DRAW}" font-size="${k(16)}" font-weight="600" fill="${P.text}">${esc(activeRoomName.value)}, ${fmt(W)} × ${fmt(H)} см</text>`
  t += `<text x="${n2(x0)}" y="${n2(ty + k(47))}" font-family="${FONT_DRAW}" font-size="${k(11)}" fill="${P.dim}">Размеры в сантиметрах, клетка сетки 10 см.</text>`
  const bx = x1 - 100, by = ty + k(30)
  t += `<path d="M${n2(bx)} ${n2(by)}H${n2(x1)}M${n2(bx)} ${n2(by - k(5))}V${n2(by + k(5))}M${n2(bx + 50)} ${n2(by - k(3))}V${n2(by + k(3))}M${n2(x1)} ${n2(by - k(5))}V${n2(by + k(5))}" stroke="${P.text}" stroke-width="${k(1.4)}" fill="none"/>`
  t += `<text x="${n2(bx + 50)}" y="${n2(by - k(12))}" font-family="${FONT_DRAW}" font-size="${k(11)}" fill="${P.text}" text-anchor="middle">1 м</text>`
  const th = vb.h + titleH
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(vb.x)} ${n2(vb.y)} ${n2(vb.w)} ${n2(th)}" width="${Math.round(vb.w * s)}" height="${Math.round(th * s)}"><rect x="${n2(vb.x)}" y="${n2(vb.y)}" width="${n2(vb.w)}" height="${n2(th)}" fill="${P.floor}"/>${inner}${t}</svg>`
  return { svg: out, w: Math.round(vb.w * s), h: Math.round(th * s), bg: P.floor }
}

function fileSlug() {
  const s = activeRoomName.value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-+|-+$/g, '')
  return s || 'komnata'
}

export async function downloadPNG(liveScale) {
  try {
    const r = exportSVG(liveScale)
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.svg)
    })
    const c = document.createElement('canvas')
    // SVG — вектор, поэтому отрисовка в увеличенный canvas даёт чёткую (не мыльную) картинку,
    // а не блочное растягивание уже готового растра.
    c.width = r.w * RASTER_QUALITY
    c.height = r.h * RASTER_QUALITY
    const ctx = c.getContext('2d')
    ctx.fillStyle = r.bg
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(img, 0, 0, c.width, c.height)
    const blob = await new Promise((res) => c.toBlob(res, 'image/png'))
    if (!blob) throw new Error('png')
    download(`plan-${fileSlug()}.png`, blob)
  } catch (e) {
    toast('Не получилось подготовить картинку. Попробуйте ещё раз.')
  }
}

export function downloadJSON() {
  download(`rasstanovka-${fileSlug()}.json`, JSON.stringify(plan.value, null, 2), 'application/json')
}

/** Загрузить расстановку из текста JSON. Принимает и {state, savedAt}, и голое состояние. */
export function loadFromText(text) {
  try {
    let v = JSON.parse(text)
    if (v && v.state) v = v.state
    if (!validState(v)) throw new Error('bad')
    replacePlan(v)
    closeExport()
    toast('Расстановка загружена')
  } catch (e) {
    toast('Текст не похож на расстановку. Проверьте, что он скопирован целиком.')
  }
}
