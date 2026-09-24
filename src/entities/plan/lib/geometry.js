import { clamp, rad } from '@/shared/lib'
import { isRound } from './item.js'

/* Все функции чистые: состояние/комната передаются явно, единицы — сантиметры. */

/** Полуразмеры повёрнутого предмета по осям X/Y. */
export function ext(it) {
  if (isRound(it)) { const r = it.w / 2; return [r, r] }
  const a = rad(it.rot), c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a)), hw = it.w / 2, hd = it.d / 2
  return [c * hw + s * hd, s * hw + c * hd]
}
export function aabb(it) {
  const e = ext(it)
  return { x1: it.x - e[0], x2: it.x + e[0], y1: it.y - e[1], y2: it.y + e[1] }
}
export function poly(it) {
  if (isRound(it)) {
    const r = it.w / 2, p = []
    for (let i = 0; i < 32; i++) { const a = (i / 32) * 2 * Math.PI; p.push([it.x + r * Math.cos(a), it.y + r * Math.sin(a)]) }
    return p
  }
  const a = rad(it.rot), c = Math.cos(a), s = Math.sin(a), hw = it.w / 2, hd = it.d / 2
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map((q) => [it.x + q[0] * c - q[1] * s, it.y + q[0] * s + q[1] * c])
}
export function overlapSAT(A, B, eps = 0.3) {
  for (const Pg of [A, B]) {
    for (let i = 0; i < Pg.length; i++) {
      const p1 = Pg[i], p2 = Pg[(i + 1) % Pg.length]
      let ax = p1[1] - p2[1], ay = p2[0] - p1[0]
      const len = Math.hypot(ax, ay)
      if (!len) continue
      ax /= len; ay /= len
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity
      for (const q of A) { const p = q[0] * ax + q[1] * ay; if (p < a0) a0 = p; if (p > a1) a1 = p }
      for (const q of B) { const p = q[0] * ax + q[1] * ay; if (p < b0) b0 = p; if (p > b1) b1 = p }
      if (Math.min(a1, b1) - Math.max(a0, b0) <= eps) return false
    }
  }
  return true
}

export function wallInfo(room, wall) {
  const W = room.w, H = room.h
  switch (wall) {
    case 'top': return { len: W, P: (t) => [t, 0], n: [0, 1] }
    case 'bottom': return { len: W, P: (t) => [t, H], n: [0, -1] }
    case 'left': return { len: H, P: (t) => [0, t], n: [1, 0] }
    default: return { len: H, P: (t) => [W, t], n: [-1, 0] }
  }
}
export function doorGeom(room, o) {
  const wi = wallInfo(room, o.wall), a = o.offset, b = o.offset + o.width
  const Hp = wi.P(o.hinge === 'start' ? a : b), Jp = wi.P(o.hinge === 'start' ? b : a)
  const sv = o.swing === 'out' ? [-wi.n[0], -wi.n[1]] : wi.n
  const L = [Hp[0] + sv[0] * o.width, Hp[1] + sv[1] * o.width]
  const v1 = [L[0] - Hp[0], L[1] - Hp[1]], v2 = [Jp[0] - Hp[0], Jp[1] - Hp[1]]
  return { wi, Hp, Jp, L, sweep: v1[0] * v2[1] - v1[1] * v2[0] > 0 ? 1 : 0 }
}
/** Сектор открывания двери как многоугольник (для проверки пересечений). */
export function sectorPoly(room, o) {
  const g = doorGeom(room, o), r = o.width
  const a1 = Math.atan2(g.L[1] - g.Hp[1], g.L[0] - g.Hp[0])
  let da = Math.atan2(g.Jp[1] - g.Hp[1], g.Jp[0] - g.Hp[0]) - a1
  while (da > Math.PI) da -= 2 * Math.PI
  while (da < -Math.PI) da += 2 * Math.PI
  const p = [g.Hp]
  for (let i = 0; i <= 12; i++) { const a = a1 + (da * i) / 12; p.push([g.Hp[0] + r * Math.cos(a), g.Hp[1] + r * Math.sin(a)]) }
  return p
}
export function clampInside(room, it) {
  const e = ext(it), W = room.w, H = room.h
  it.x = W >= 2 * e[0] ? clamp(it.x, e[0], W - e[0]) : W / 2
  it.y = H >= 2 * e[1] ? clamp(it.y, e[1], H - e[1]) : H / 2
}

/** Пересечения, выход за стены и попадание в сектор двери — по каждому предмету. */
export function computeIssues(st) {
  const res = new Map(), W = st.room.w, H = st.room.h
  const polys = st.items.map(poly)
  st.items.forEach((it, i) => {
    const r = { overlap: [], out: false, door: false }
    for (const q of polys[i]) if (q[0] < -0.3 || q[1] < -0.3 || q[0] > W + 0.3 || q[1] > H + 0.3) { r.out = true; break }
    res.set(it.id, r)
  })
  for (let i = 0; i < st.items.length; i++) for (let j = i + 1; j < st.items.length; j++) {
    if (overlapSAT(polys[i], polys[j])) {
      res.get(st.items[i].id).overlap.push(st.items[j].id)
      res.get(st.items[j].id).overlap.push(st.items[i].id)
    }
  }
  for (const o of st.openings) {
    if (o.type !== 'door' || o.swing !== 'in') continue
    const sp = sectorPoly(st.room, o)
    st.items.forEach((it, i) => { if (overlapSAT(polys[i], sp, 0.5)) res.get(it.id).door = true })
  }
  return res
}
export function summarize(iss) {
  const pairs = new Set()
  let out = 0, door = 0, first = null
  for (const [id, r] of iss) {
    for (const j of r.overlap) pairs.add([id, j].sort().join('|'))
    if (r.out) out++
    if (r.door) door++
    if (!first && (r.overlap.length || r.out || r.door)) first = id
  }
  return { pairs: pairs.size, out, door, first }
}

/** Ставит предмет в ближайшее к точке near свободное место. false — места нет. */
export function freeSpot(st, it, near) {
  const W = st.room.w, H = st.room.h, e = ext(it), cx0 = near ? near[0] : W / 2, cy0 = near ? near[1] : H / 2
  const obst = st.items.filter((o) => o !== it && o.id !== it.id).map(aabb)
  for (const od of st.openings) if (od.type === 'door' && od.swing === 'in') {
    const sp = sectorPoly(st.room, od)
    obst.push({ x1: Math.min(...sp.map((q) => q[0])), x2: Math.max(...sp.map((q) => q[0])), y1: Math.min(...sp.map((q) => q[1])), y2: Math.max(...sp.map((q) => q[1])) })
  }
  const c = []
  for (let y = e[1]; y <= H - e[1] + 0.01; y += 5) for (let x = e[0]; x <= W - e[0] + 0.01; x += 5) c.push([x, y, (x - cx0) ** 2 + (y - cy0) ** 2])
  c.sort((a, b) => a[2] - b[2])
  for (const q of c) {
    const A = { x1: q[0] - e[0], x2: q[0] + e[0], y1: q[1] - e[1], y2: q[1] + e[1] }
    if (!obst.some((B) => A.x1 < B.x2 - 0.1 && A.x2 > B.x1 + 0.1 && A.y1 < B.y2 - 0.1 && A.y2 > B.y1 + 0.1)) { it.x = q[0]; it.y = q[1]; return true }
  }
  it.x = cx0; it.y = cy0
  clampInside(st.room, it)
  return false
}

/** Смена размера с сохранением прилегания к правой/нижней стене. */
export function resizeAnchored(room, it, w, d) {
  const W = room.w, H = room.h, e = 0.6, A = aabb(it)
  const keepR = Math.abs(A.x2 - W) < e && Math.abs(A.x1) >= e, keepB = Math.abs(A.y2 - H) < e && Math.abs(A.y1) >= e
  it.w = w
  it.d = isRound(it) ? w : d
  const x = ext(it)
  it.x = keepR ? A.x2 - x[0] : A.x1 + x[0]
  it.y = keepB ? A.y2 - x[1] : A.y1 + x[1]
  clampInside(room, it)
}

/** Поворот всего плана на 90° по часовой стрелке (мутирует st). */
export function rotateState(st) {
  const H = st.room.h, W = st.room.w, map = { top: 'right', right: 'bottom', bottom: 'left', left: 'top' }
  for (const it of st.items) { const x = it.x, y = it.y; it.x = H - y; it.y = x; it.rot = (it.rot + 90) % 360 }
  for (const o of st.openings) {
    if (o.wall === 'right' || o.wall === 'left') { o.offset = H - o.offset - o.width; o.hinge = o.hinge === 'start' ? 'end' : 'start' }
    o.wall = map[o.wall]
  }
  st.room = { w: H, h: W }
}

/* ---------- перетаскивание ---------- */

/** Привязка центра (cx, cy) к стенам, соседям и сетке. scale — пикселей на см. */
export function snapMove(st, it, cx, cy, { snap, step, scale }) {
  const e = ext(it), W = st.room.w, H = st.room.h, g = { x: null, y: null }
  if (snap) {
    const thr = 8 / scale, others = st.items.filter((o) => o.id !== it.id)
    const pick = (lo, hi, c, wallHi, axis) => {
      const cand = [{ v: 0, e: 'l', wall: 1 }, { v: wallHi, e: 'h', wall: 1 }]
      for (const o of others) {
        const b = aabb(o), b1 = axis ? b.y1 : b.x1, b2 = axis ? b.y2 : b.x2, oc = axis ? o.y : o.x
        cand.push({ v: b1, e: 'l' }, { v: b2, e: 'l' }, { v: b1, e: 'h' }, { v: b2, e: 'h' }, { v: oc, e: 'c' })
      }
      let best = null
      for (const q of cand) {
        const edge = q.e === 'l' ? lo : q.e === 'h' ? hi : c, d = q.v - edge
        if (Math.abs(d) < thr && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, v: q.v, wall: !!q.wall }
      }
      return best
    }
    const bx = pick(cx - e[0], cx + e[0], cx, W, 0)
    if (bx) { cx += bx.d; if (!bx.wall) g.x = bx.v }
    else if (step > 0) cx = Math.round((cx - e[0]) / step) * step + e[0]
    const by = pick(cy - e[1], cy + e[1], cy, H, 1)
    if (by) { cy += by.d; if (!by.wall) g.y = by.v }
    else if (step > 0) cy = Math.round((cy - e[1]) / step) * step + e[1]
  }
  cx = W >= 2 * e[0] ? clamp(cx, e[0], W - e[0]) : W / 2
  cy = H >= 2 * e[1] ? clamp(cy, e[1], H - e[1]) : H / 2
  return { cx, cy, g }
}

/** Точка плана в локальных координатах предмета. */
export function localOf(Pt, it) {
  const a = rad(it.rot), c = Math.cos(a), s = Math.sin(a), dx = Pt[0] - it.x, dy = Pt[1] - it.y
  return [dx * c + dy * s, -dx * s + dy * c]
}

/** Изменение размера ручкой. d = {start, l0, handle}; fine — шаг 0,1 см вместо 1 см. */
export function doResize(it, d, Pt, fine) {
  const st = d.start, L = localOf(Pt, st), dl = [L[0] - d.l0[0], L[1] - d.l0[1]], h = d.handle, step = fine ? 0.1 : 1
  if (h === 'r') {
    const r0 = Math.hypot(d.l0[0], d.l0[1]), r = Math.hypot(L[0], L[1])
    const dia = clamp(Math.round((st.w + 2 * (r - r0)) / step) * step, 5, 3000)
    it.w = it.d = dia
    return
  }
  let x1 = -st.w / 2, x2 = st.w / 2, y1 = -st.d / 2, y2 = st.d / 2
  if (h.includes('e')) x2 += dl[0]
  if (h.includes('w')) x1 += dl[0]
  if (h.includes('s')) y2 += dl[1]
  if (h.includes('n')) y1 += dl[1]
  const w = Math.max(5, Math.round((x2 - x1) / step) * step), dd = Math.max(5, Math.round((y2 - y1) / step) * step)
  if (h.includes('w')) x1 = x2 - w; else x2 = x1 + w
  if (h.includes('n')) y1 = y2 - dd; else y2 = y1 + dd
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = rad(st.rot), c = Math.cos(a), s = Math.sin(a)
  it.w = x2 - x1
  it.d = y2 - y1
  it.x = st.x + mx * c - my * s
  it.y = st.y + mx * s + my * c
}
