import { esc, fmt, n2, pt, rad, textW } from '@/shared/lib'
import { FONT_DRAW, PADPX, T } from '../config/catalog.js'
import { dimsText, isRound } from './item.js'
import { aabb, doorGeom, wallInfo } from './geometry.js'

/*
 * План строится строкой SVG. Единицы viewBox — сантиметры; k = mkK(scale) переводит
 * экранные пиксели (толщины линий, кегль) в сантиметры, чтобы они не зависели от масштаба.
 * Параметры o: {st, pal, s, interactive, sel, issues, grid, labels, dims, guides, fsName, fsDim}
 */

export function mkK(s) {
  return (v) => +(v / s).toFixed(3)
}
function rect(x, y, w, h, rx, attrs) {
  if (w <= 0 || h <= 0) return ''
  return `<rect x="${n2(x)}" y="${n2(y)}" width="${n2(w)}" height="${n2(h)}" rx="${n2(Math.min(rx, w / 2, h / 2))}" ${attrs}/>`
}
function txt(x, y, str, o, opt = {}) {
  const k = mkK(o.s)
  const size = k(opt.size || 11), fill = opt.fill || o.pal.text, w = opt.weight || 500
  const halo = opt.halo ? ` stroke="${o.pal.floor}" stroke-width="${k(opt.haloW || 4)}" paint-order="stroke" stroke-linejoin="round"` : ''
  const tr = opt.rot ? ` transform="rotate(${opt.rot} ${n2(x)} ${n2(y)})"` : ''
  return `<text x="${n2(x)}" y="${n2(y)}" font-family="${FONT_DRAW}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="middle" dominant-baseline="central"${halo}${tr}>${esc(str)}</text>`
}

function gridMarkup(o) {
  const P = o.pal, k = mkK(o.s), W = o.st.room.w, H = o.st.room.h
  let d1 = '', d2 = '', d3 = ''
  for (let x = 10; x < W - 0.01; x += 10) { const g = `M${x} 0V${H}`; if (x % 100 === 0) d3 += g; else if (x % 50 === 0) d2 += g; else d1 += g }
  for (let y = 10; y < H - 0.01; y += 10) { const g = `M0 ${y}H${W}`; if (y % 100 === 0) d3 += g; else if (y % 50 === 0) d2 += g; else d1 += g }
  return `<path d="${d1}" stroke="${P.g1}" stroke-width="${k(1)}"/><path d="${d2}" stroke="${P.g2}" stroke-width="${k(1)}"/><path d="${d3}" stroke="${P.g3}" stroke-width="${k(1.2)}"/>`
}

function drawKind(kind, hw, hd, t, o) {
  const k = mkK(o.s), sw = k(1.3), thin = k(0.9), F = t.f, S = t.s, w = 2 * hw, d = 2 * hd
  const base = `fill="${F}" stroke="${S}" stroke-width="${sw}"`
  switch (kind) {
    case 'table':
      return rect(-hw, -hd, w, d, 1.5, base) + (w > 12 && d > 12 ? rect(-hw + 3, -hd + 3, w - 6, d - 6, 1, `fill="none" stroke="${S}" stroke-opacity=".35" stroke-width="${thin}"`) : '')
    case 'master':
    case 'client':
      return rect(-hw, -hd, w, d, Math.min(4, w / 4), base) + rect(-hw + 2, -hd + 2, w - 4, Math.min(8, d * 0.18), 3, `fill="${S}" fill-opacity=".85"`)
    case 'armchair': {
      const back = Math.min(14, d * 0.22), arm = Math.min(12, w * 0.18)
      return rect(-hw, -hd, w, d, 6, base) + rect(-hw, -hd, w, back, 6, `fill="${S}" fill-opacity=".8"`)
        + rect(-hw, -hd, arm, d, 5, `fill="${S}" fill-opacity=".5"`) + rect(hw - arm, -hd, arm, d, 5, `fill="${S}" fill-opacity=".5"`)
        + rect(-hw + arm + 2, -hd + back + 2, w - 2 * arm - 4, d - back - 4, 4, `fill="none" stroke="${S}" stroke-opacity=".45" stroke-width="${thin}"`)
    }
    case 'coffee':
    case 'circle':
      return `<circle r="${n2(hw)}" ${base}/>` + (hw > 8 ? `<circle r="${n2(hw - 4)}" fill="none" stroke="${S}" stroke-opacity=".35" stroke-width="${thin}"/>` : '')
    case 'dresser':
    case 'cabinet': {
      let m = rect(-hw, -hd, w, d, 1, base)
      const fp = Math.min(4, d * 0.15)
      m += `<path d="M${n2(-hw)} ${n2(hd - fp)}H${n2(hw)}" stroke="${S}" stroke-width="${thin}" stroke-opacity=".7"/>`
      const nH = kind === 'cabinet' ? 1 : Math.max(1, Math.round(w / 40))
      let hp = ''
      for (let i = 0; i < nH; i++) { const cx = -hw + (w * (i + 0.5)) / nH, hl = Math.min(5, (w / nH) * 0.2); hp += `M${n2(cx - hl)} ${n2(hd - fp / 2)}H${n2(cx + hl)}` }
      for (let i = 1; i < nH; i++) { const x = -hw + (w * i) / nH; hp += `M${n2(x)} ${n2(hd - fp)}V${n2(hd)}` }
      m += `<path d="${hp}" stroke="${S}" stroke-width="${k(1.8)}" stroke-linecap="round"/>`
      return m
    }
    case 'cooler': {
      const r = Math.min(hw, hd)
      return rect(-hw, -hd, w, d, Math.min(4, r / 3), base)
        + `<circle cy="${n2(-hd * 0.08)}" r="${n2(r * 0.8)}" fill="${F}" stroke="${S}" stroke-width="${thin}"/>`
        + `<circle cy="${n2(-hd * 0.08)}" r="${n2(r * 0.3)}" fill="${S}" fill-opacity=".25"/>`
        + rect(-3, hd - 3, 6, 3, 1, `fill="${S}"`)
    }
    case 'rack': {
      let m = rect(-hw, -hd, w, d, 3, `fill="${F}" fill-opacity=".6" stroke="${S}" stroke-width="${sw}" stroke-dasharray="${k(5)} ${k(3)}"`)
      m += `<path d="M${n2(-hw + 4)} 0H${n2(hw - 4)}" stroke="${S}" stroke-width="${k(2.2)}" stroke-linecap="round"/>`
      let hp = ''
      for (let x = -hw + 12; x <= hw - 12; x += 10) hp += `M${n2(x - 1.5)} ${n2(-hd * 0.55)}L${n2(x + 1.5)} ${n2(hd * 0.55)}`
      if (hp) m += `<path d="${hp}" stroke="${S}" stroke-opacity=".6" stroke-width="${thin}"/>`
      m += `<circle cx="${n2(-hw + 4)}" r="2.5" fill="${S}"/><circle cx="${n2(hw - 4)}" r="2.5" fill="${S}"/>`
      return m
    }
    default:
      return rect(-hw, -hd, w, d, 2, base)
  }
}

function itemMarkup(it, o) {
  const P = o.pal, k = mkK(o.s), t = P.tones[it.tone] || P.tones.other
  const hw = it.w / 2, hd = it.d / 2, round = isRound(it)
  const r = o.issues && o.issues.get(it.id)
  const bad = r && (r.overlap.length || r.out), door = r && r.door
  let g = `<g class="item" data-id="${esc(it.id)}" transform="translate(${n2(it.x)} ${n2(it.y)}) rotate(${n2(it.rot)})">`
  g += drawKind(it.kind, hw, hd, t, o)
  if (bad) {
    const a = `fill="url(#hatch)" stroke="${P.warn}" stroke-width="${k(2)}"`
    g += round ? `<circle r="${n2(hw)}" ${a}/>` : rect(-hw, -hd, it.w, it.d, 1, a)
  } else if (door) {
    const a = `fill="${P.amber}" fill-opacity=".12" stroke="${P.amber}" stroke-width="${k(2)}" stroke-dasharray="${k(5)} ${k(3)}"`
    g += round ? `<circle r="${n2(hw)}" ${a}/>` : rect(-hw, -hd, it.w, it.d, 1, a)
  }
  if (o.interactive) g += round ? `<circle r="${n2(hw)}" fill="transparent"/>` : rect(-hw, -hd, it.w, it.d, 0, 'fill="transparent"')
  return g + '</g>'
}

function openingMarkup(op, o) {
  const P = o.pal, k = mkK(o.s), wi = wallInfo(o.st.room, op.wall), nx = wi.n[0], ny = wi.n[1]
  const A = wi.P(op.offset), B = wi.P(op.offset + op.width)
  const off = (p, d) => [p[0] - nx * d, p[1] - ny * d]
  const Ao = off(A, T), Bo = off(B, T)
  const isSel = o.interactive && o.sel && o.sel.t === 'o' && o.sel.id === op.id
  let m = ''
  m += `<path d="M${pt(off(A, -0.3))}L${pt(off(B, -0.3))}L${pt(off(Bo, 0.3))}L${pt(off(Ao, 0.3))}Z" fill="${op.type === 'window' ? P.win : P.floor}"/>`
  m += `<path d="M${pt(A)}L${pt(Ao)}M${pt(B)}L${pt(Bo)}" stroke="${P.wall}" stroke-width="${k(1.5)}"/>`
  if (op.type === 'window') {
    m += `<path d="M${pt(A)}L${pt(B)}M${pt(Ao)}L${pt(Bo)}M${pt(off(A, T / 3))}L${pt(off(B, T / 3))}M${pt(off(A, (2 * T) / 3))}L${pt(off(B, (2 * T) / 3))}" stroke="${P.winLine}" stroke-width="${k(1)}"/>`
  } else {
    const g = doorGeom(o.st.room, op), vl = Math.hypot(g.Jp[0] - g.Hp[0], g.Jp[1] - g.Hp[1]) || 1
    const v = [((g.Jp[0] - g.Hp[0]) / vl) * 4, ((g.Jp[1] - g.Hp[1]) / vl) * 4]
    m += `<path d="M${pt(g.Hp)}L${pt(g.L)}L${pt([g.L[0] + v[0], g.L[1] + v[1]])}L${pt([g.Hp[0] + v[0], g.Hp[1] + v[1]])}Z" fill="${P.floor}" stroke="${P.leaf}" stroke-width="${k(1.5)}"/>`
  }
  if (isSel) m += `<path d="M${pt(A)}L${pt(B)}L${pt(Bo)}L${pt(Ao)}Z" fill="none" stroke="${P.accent}" stroke-width="${k(2.2)}"/>`
  if (o.interactive) {
    const e = k(14), Ai = off(A, -e), Bi = off(B, -e), Ae = off(A, T + k(4)), Be = off(B, T + k(4))
    m += `<path data-oid="${esc(op.id)}" d="M${pt(Ai)}L${pt(Bi)}L${pt(Be)}L${pt(Ae)}Z" fill="transparent"/>`
    if (op.type === 'door') {
      const g = doorGeom(o.st.room, op)
      m += `<line data-oid="${esc(op.id)}" x1="${n2(g.Hp[0])}" y1="${n2(g.Hp[1])}" x2="${n2(g.L[0])}" y2="${n2(g.L[1])}" stroke="transparent" stroke-width="${k(16)}"/>`
    }
  }
  return m
}

function roomDims(o) {
  const P = o.pal, k = mkK(o.s), W = o.st.room.w, H = o.st.room.h, off = T + 32, tk = k(4)
  let d = `M0 ${-T - 3}V${-off - 6}M${W} ${-T - 3}V${-off - 6}M0 ${-off}H${W}`
  d += `M${-tk} ${-off + tk}L${tk} ${-off - tk}M${W - tk} ${-off + tk}L${W + tk} ${-off - tk}`
  d += `M${-T - 3} 0H${-off - 6}M${-T - 3} ${H}H${-off - 6}M${-off} 0V${H}`
  d += `M${-off - tk} ${tk}L${-off + tk} ${-tk}M${-off - tk} ${H + tk}L${-off + tk} ${H - tk}`
  let m = `<path d="${d}" stroke="${P.dim}" stroke-width="${k(1)}" fill="none"/>`
  m += txt(W / 2, -off - k(9), fmt(W) + ' см', o, { size: 12, weight: 600 })
  m += txt(-off - k(9), H / 2, fmt(H) + ' см', o, { size: 12, weight: 600, rot: -90 })
  return m
}

function openingDims(op, o) {
  const P = o.pal, k = mkK(o.s), wi = wallInfo(o.st.room, op.wall), off = T + 10, tk = k(4)
  const Q = (t) => { const p = wi.P(t); return [p[0] - wi.n[0] * off, p[1] - wi.n[1] * off] }
  const a = op.offset, b = op.offset + op.width, len = wi.len
  const marks = [0]
  if (a > 0.05) marks.push(a)
  marks.push(b)
  if (len - b > 0.05) marks.push(len)
  let d = `M${pt(Q(0))}L${pt(Q(len))}`
  for (const t of marks) { const q = Q(t); d += `M${n2(q[0] - tk)} ${n2(q[1] + tk)}L${n2(q[0] + tk)} ${n2(q[1] - tk)}` }
  const A0 = wi.P(a), B0 = wi.P(b), qa = Q(a), qb = Q(b)
  const ea = [A0[0] - wi.n[0] * (T + 2), A0[1] - wi.n[1] * (T + 2)], eb = [B0[0] - wi.n[0] * (T + 2), B0[1] - wi.n[1] * (T + 2)]
  d += `M${pt(ea)}L${pt(qa)}M${pt(eb)}L${pt(qb)}`
  const vert = op.wall === 'left' || op.wall === 'right'
  const isSel = o.interactive && o.sel && o.sel.t === 'o' && o.sel.id === op.id
  let m = `<path d="${d}" stroke="${P.dim}" stroke-width="${k(1)}" fill="none"/>`
  for (let i = 0; i < marks.length - 1; i++) {
    const t1 = marks[i], t2 = marks[i + 1], mid = Q((t1 + t2) / 2)
    const lp = [mid[0] - wi.n[0] * k(9), mid[1] - wi.n[1] * k(9)]
    const isOpen = Math.abs(t1 - a) < 0.01 && Math.abs(t2 - b) < 0.01
    m += txt(lp[0], lp[1], fmt(t2 - t1), o, { size: 11, weight: isOpen ? 650 : 500, fill: isOpen ? (isSel ? P.accent : P.text) : P.dim, rot: vert ? -90 : 0 })
  }
  return m
}

function labelsMarkup(o) {
  const P = o.pal, s = o.s, k = mkK(s), fsN = o.fsName || 11.5, fsD = o.fsDim || 10.5
  let m = '<g pointer-events="none">'
  for (const it of o.st.items) {
    const b = aabb(it), bw = b.x2 - b.x1, bh = b.y2 - b.y1, t = P.tones[it.tone] || P.tones.other
    const name = it.name || '', dims = dimsText(it)
    const wN = textW(name, fsN) / s, wD = textW(dims, fsD) / s, lh = k(13), pad = k(6)
    let lines = []
    if (wN + pad <= bw && wD + pad <= bw && 2 * lh + pad * 0.5 <= bh) lines = [[name, fsN, 650], [dims, fsD, 500]]
    else if (wN + pad <= bw && lh + 2 <= bh) lines = [[name, fsN, 650]]
    else if (wD + pad <= bw && lh + 2 <= bh) lines = [[dims, fsD, 500]]
    const ys = lines.length === 2 ? [it.y - lh / 2, it.y + lh / 2] : [it.y]
    lines.forEach((L, i) => {
      m += `<text x="${n2(it.x)}" y="${n2(ys[i])}" font-family="${FONT_DRAW}" font-size="${k(L[1])}" font-weight="${L[2]}" fill="${t.s}" text-anchor="middle" dominant-baseline="central" stroke="${t.f}" stroke-width="${k(3)}" paint-order="stroke" stroke-linejoin="round">${esc(L[0])}</text>`
    })
  }
  return m + '</g>'
}

function dimInside(x1, y1, x2, y2, label, o) {
  const P = o.pal, s = o.s, k = mkK(s), hor = Math.abs(y2 - y1) < 1e-6, tk = k(4)
  let d = `M${n2(x1)} ${n2(y1)}L${n2(x2)} ${n2(y2)}`
  if (hor) d += `M${n2(x1)} ${n2(y1 - tk)}V${n2(y1 + tk)}M${n2(x2)} ${n2(y2 - tk)}V${n2(y2 + tk)}`
  else d += `M${n2(x1 - tk)} ${n2(y1)}H${n2(x1 + tk)}M${n2(x2 - tk)} ${n2(y2)}H${n2(x2 + tk)}`
  const len = hor ? Math.abs(x2 - x1) : Math.abs(y2 - y1), tw = textW(label, 11) / s
  let tx = (x1 + x2) / 2, ty = (y1 + y2) / 2
  if (hor && len < tw + k(8)) ty -= k(11)
  if (!hor && len < k(20)) tx += tw / 2 + k(8)
  return `<path d="${d}" stroke="${P.accent}" stroke-width="${k(1.3)}" fill="none"/>` + txt(tx, ty, label, o, { size: 11.5, weight: 650, fill: P.accent, halo: true, haloW: 4.5 })
}

/** Расстояния от выбранного предмета до ближайших соседей/стен по четырём сторонам. */
function distMarkup(it, o) {
  const W = o.st.room.w, H = o.st.room.h, A = aabb(it), e = 0.05
  const others = o.st.items.filter((x) => x.id !== it.id).map(aabb)
  const ov = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1) > e
  const mid = (a1, a2, b1, b2) => (Math.max(a1, b1) + Math.min(a2, b2)) / 2
  let m = '', best
  best = { d: A.x1, c: it.y }
  for (const b of others) if (ov(A.y1, A.y2, b.y1, b.y2) && b.x2 <= A.x1 + e) { const d = A.x1 - b.x2; if (d < best.d) best = { d, c: mid(A.y1, A.y2, b.y1, b.y2) } }
  if (best.d > 0.4) m += dimInside(A.x1 - best.d, best.c, A.x1, best.c, fmt(best.d), o)
  best = { d: W - A.x2, c: it.y }
  for (const b of others) if (ov(A.y1, A.y2, b.y1, b.y2) && b.x1 >= A.x2 - e) { const d = b.x1 - A.x2; if (d < best.d) best = { d, c: mid(A.y1, A.y2, b.y1, b.y2) } }
  if (best.d > 0.4) m += dimInside(A.x2, best.c, A.x2 + best.d, best.c, fmt(best.d), o)
  best = { d: A.y1, c: it.x }
  for (const b of others) if (ov(A.x1, A.x2, b.x1, b.x2) && b.y2 <= A.y1 + e) { const d = A.y1 - b.y2; if (d < best.d) best = { d, c: mid(A.x1, A.x2, b.x1, b.x2) } }
  if (best.d > 0.4) m += dimInside(best.c, A.y1 - best.d, best.c, A.y1, fmt(best.d), o)
  best = { d: H - A.y2, c: it.x }
  for (const b of others) if (ov(A.x1, A.x2, b.x1, b.x2) && b.y1 >= A.y2 - e) { const d = b.y1 - A.y2; if (d < best.d) best = { d, c: mid(A.x1, A.x2, b.x1, b.x2) } }
  if (best.d > 0.4) m += dimInside(best.c, A.y2, best.c, A.y2 + best.d, fmt(best.d), o)
  return m
}

/** Рамка выделения, ручки размера (data-handle) и ручка поворота. */
function selMarkup(it, o) {
  const P = o.pal, k = mkK(o.s), hw = it.w / 2, hd = it.d / 2, round = isRound(it), pad = k(4), id = esc(it.id)
  let m = `<g transform="translate(${n2(it.x)} ${n2(it.y)}) rotate(${n2(it.rot)})">`
  const oa = `fill="none" stroke="${it.locked ? P.dim : P.accent}" stroke-width="${k(1.6)}"${it.locked ? ` stroke-dasharray="${k(4)} ${k(3)}"` : ''}`
  m += round ? `<circle r="${n2(hw + pad)}" ${oa}/>` : rect(-hw - pad, -hd - pad, it.w + 2 * pad, it.d + 2 * pad, k(2), oa)
  if (!it.locked) {
    // Видимая ручка маленькая (hs), а её зона касания (hit) — крупнее, под палец
    const hs = k(9), hit = k(32)
    const hdl = (name, x, y) => `<g data-handle="${name}" data-id="${id}"><rect x="${n2(x - hit / 2)}" y="${n2(y - hit / 2)}" width="${n2(hit)}" height="${n2(hit)}" fill="transparent"/><rect x="${n2(x - hs / 2)}" y="${n2(y - hs / 2)}" width="${n2(hs)}" height="${n2(hs)}" rx="${k(2)}" fill="${P.floor}" stroke="${P.accent}" stroke-width="${k(1.6)}"/></g>`
    if (round) {
      m += hdl('r', hw + pad, 0)
    } else {
      const X = hw + pad, Y = hd + pad, ry = -Y - k(28)
      m += `<path d="M0 ${n2(-Y)}V${n2(ry)}" stroke="${P.accent}" stroke-width="${k(1.3)}"/>`
      m += `<g data-handle="rot" data-id="${id}"><circle cy="${n2(ry)}" r="${k(18)}" fill="transparent"/><circle cy="${n2(ry)}" r="${k(6.5)}" fill="${P.accent}" stroke="${P.floor}" stroke-width="${k(1.5)}"/></g>`
      m += hdl('e', X, 0) + hdl('w', -X, 0) + hdl('s', 0, Y) + hdl('n', 0, -Y) + hdl('ne', X, -Y) + hdl('nw', -X, -Y) + hdl('se', X, Y) + hdl('sw', -X, Y)
    }
  }
  return m + '</g>'
}

/** Пунктирная рамка группового выделения — без ручек, для всех предметов группы, кроме основного. */
function groupHighlight(it, o) {
  const P = o.pal, k = mkK(o.s), hw = it.w / 2, hd = it.d / 2, round = isRound(it), pad = k(4)
  const oa = `fill="none" stroke="${P.accent}" stroke-width="${k(1.6)}" stroke-dasharray="${k(3)} ${k(2.5)}"`
  const box = round ? `<circle r="${n2(hw + pad)}" ${oa}/>` : rect(-hw - pad, -hd - pad, it.w + 2 * pad, it.d + 2 * pad, k(2), oa)
  return `<g transform="translate(${n2(it.x)} ${n2(it.y)}) rotate(${n2(it.rot)})">${box}</g>`
}

/** Поля вокруг комнаты (см): место под размерные линии и двери наружу. */
export function padsCm(st) {
  const p = { t: T + 40, r: T + 40, b: T + 40, l: T + 40 }
  for (const o of st.openings) if (o.type === 'door' && o.swing === 'out') {
    const key = { top: 't', right: 'r', bottom: 'b', left: 'l' }[o.wall]
    p[key] = Math.max(p[key], T + o.width + 12)
  }
  return p
}
export function viewBox(st, s) {
  const p = padsCm(st), e = PADPX / s
  return { x: -p.l - e, y: -p.t - e, w: st.room.w + p.l + p.r + 2 * e, h: st.room.h + p.t + p.b + 2 * e }
}

/** Содержимое <svg> плана. */
export function planMarkup(st, opts) {
  const o = { ...opts, st }
  const P = o.pal, k = mkK(o.s), W = st.room.w, H = st.room.h
  let m = `<defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="${k(7)}" height="${k(7)}" patternTransform="rotate(45)"><rect width="${k(7)}" height="${k(7)}" fill="${P.warn}" fill-opacity=".08"/><line x1="0" y1="0" x2="0" y2="${k(7)}" stroke="${P.warn}" stroke-width="${k(2.2)}" stroke-opacity=".6"/></pattern></defs>`
  m += `<rect x="0" y="0" width="${W}" height="${H}" fill="${P.floor}"/>`
  if (o.grid) m += gridMarkup(o)
  for (const od of st.openings) {
    if (od.type !== 'door') continue
    const g = doorGeom(st.room, od), r = n2(od.width)
    m += `<path d="M${pt(g.Hp)}L${pt(g.L)}A${r} ${r} 0 0 ${g.sweep} ${pt(g.Jp)}Z" fill="${P.accent}" fill-opacity=".05"/>`
    m += `<path d="M${pt(g.L)}A${r} ${r} 0 0 ${g.sweep} ${pt(g.Jp)}" fill="none" stroke="${P.arc}" stroke-width="${k(1)}" stroke-dasharray="${k(5)} ${k(4)}"/>`
  }
  const selId = o.sel && o.sel.t === 'i' ? o.sel.id : null
  const sIt = selId ? st.items.find((i) => i.id === selId) : null
  for (const it of st.items) if (it !== sIt) m += itemMarkup(it, o)
  if (sIt) m += itemMarkup(sIt, o)
  m += `<path d="M${-T} ${-T}H${W + T}V${H + T}H${-T}ZM0 0V${H}H${W}V0Z" fill="${P.wall}" fill-rule="evenodd"/>`
  for (const op of st.openings) m += openingMarkup(op, o)
  m += roomDims(o)
  for (const op of st.openings) m += openingDims(op, o)
  if (o.labels) m += labelsMarkup(o)
  if (o.interactive) {
    const gd = o.guides
    if (gd && gd.x != null) m += `<path d="M${n2(gd.x)} 0V${H}" stroke="${P.accent}" stroke-width="${k(1)}" stroke-dasharray="${k(4)} ${k(3)}"/>`
    if (gd && gd.y != null) m += `<path d="M0 ${n2(gd.y)}H${W}" stroke="${P.accent}" stroke-width="${k(1)}" stroke-dasharray="${k(4)} ${k(3)}"/>`
    const multiIds = o.multiIds && o.multiIds.length > 1 ? new Set(o.multiIds) : null
    if (multiIds) {
      for (const it of st.items) if (multiIds.has(it.id)) m += groupHighlight(it, o)
    } else if (sIt) {
      if (o.dims) m += distMarkup(sIt, o)
      m += selMarkup(sIt, o)
    }
  }
  return m
}
