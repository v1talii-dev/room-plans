import { ref } from 'vue'
import { download, esc, fmt, n2, toast } from '@/shared/lib'
import { FONT_DRAW, PAL, activeRoomName, computeIssues, mkK, plan, planMarkup, replacePlan, validState, viewBox } from '@/entities/plan'
import { settings } from '@/entities/settings'

export const exportOpen = ref(false)
export const openExport = () => { exportOpen.value = true }
export const closeExport = () => { exportOpen.value = false }

/** Самодостаточный SVG чертежа (всегда светлая палитра), растеризуется в downloadPNG(). */
export function exportSVG() {
  const st = plan.value
  const s = 4 // px на см — разрешение растра при экспорте в PNG
  const P = PAL.light, k = mkK(s), vb = viewBox(st, s), titleH = +(70 / s).toFixed(2)
  const inner = planMarkup(st, {
    pal: P, s, interactive: false, sel: null, issues: computeIssues(st), grid: settings.grid, labels: true, dims: false, guides: null,
    fsName: 12, fsDim: 11,
  })
  const ty = vb.y + vb.h, W = st.room.w, H = st.room.h, x0 = vb.x + k(18), x1 = vb.x + vb.w - k(18)
  let t = `<text x="${n2(x0)}" y="${n2(ty + k(26))}" font-family="${FONT_DRAW}" font-size="${k(16)}" font-weight="600" fill="${P.text}">${esc(activeRoomName.value)}, ${fmt(W)} × ${fmt(H)} см</text>`
  t += `<text x="${n2(x0)}" y="${n2(ty + k(47))}" font-family="${FONT_DRAW}" font-size="${k(11)}" fill="${P.dim}">Размеры в сантиметрах, клетка сетки 10 см.</text>`
  const bx = x1 - 100, by = ty + k(30)
  t += `<path d="M${n2(bx)} ${n2(by)}H${n2(x1)}M${n2(bx)} ${n2(by - k(5))}V${n2(by + k(5))}M${n2(bx + 50)} ${n2(by - k(3))}V${n2(by + k(3))}M${n2(x1)} ${n2(by - k(5))}V${n2(by + k(5))}" stroke="${P.text}" stroke-width="${k(1.4)}" fill="none"/>`
  t += `<text x="${n2(bx + 50)}" y="${n2(by - k(12))}" font-family="${FONT_DRAW}" font-size="${k(11)}" fill="${P.text}" text-anchor="middle">1 м</text>`
  const th = vb.h + titleH
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n2(vb.x)} ${n2(vb.y)} ${n2(vb.w)} ${n2(th)}" width="${Math.round(vb.w * s)}" height="${Math.round(th * s)}"><rect x="${n2(vb.x)}" y="${n2(vb.y)}" width="${n2(vb.w)}" height="${n2(th)}" fill="#FFFFFF"/>${inner}${t}</svg>`
  return { svg: out, w: Math.round(vb.w * s), h: Math.round(th * s) }
}

function fileSlug() {
  const s = activeRoomName.value.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-+|-+$/g, '')
  return s || 'komnata'
}

export async function downloadPNG() {
  try {
    const r = exportSVG()
    const img = new Image()
    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.svg)
    })
    const c = document.createElement('canvas')
    c.width = r.w
    c.height = r.h
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
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
