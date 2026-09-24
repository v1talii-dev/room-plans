import { clamp, uid } from '@/shared/lib'
import { KINDS, TONES, WALLS } from '../config/catalog.js'

/* ---------- исходная расстановка ---------- */
export function defaultState(v) {
  let c = 0
  const it = (kind, name, x, y, rot, extra) =>
    Object.assign({ id: 'd' + ++c, kind, name, w: KINDS[kind].w, d: KINDS[kind].d, x, y, rot, tone: KINDS[kind].tone, locked: false }, extra || {})
  const base = {
    room: { w: 310, h: 570 },
    openings: [{ id: 'door1', type: 'door', wall: 'right', offset: 478, width: 90, hinge: 'end', swing: 'in' }],
  }
  if (v === 'a') {
    base.items = [
      it('table', 'Стол 1', 60, 100, 0), it('table', 'Стол 2', 250, 100, 0),
      it('master', 'Стул мастера 1', 60, 42, 0), it('master', 'Стул мастера 2', 250, 42, 0),
      it('client', 'Стул клиента 1', 60, 155, 180), it('client', 'Стул клиента 2', 250, 155, 180),
      it('dresser', 'Комод большой', 19.5, 500, 270), it('cabinet', 'Шкафчик', 295, 220, 90),
      it('dresser', 'Комод малый', 155, 17.5, 0, { w: 70, d: 35 }), it('rack', 'Вешалка', 295, 435, 90),
      it('cooler', 'Кулер', 16.5, 220, 270),
      it('armchair', 'Кресло 1', 73.5, 535.5, 180), it('coffee', 'Журнальный столик', 130, 535.5, 0), it('armchair', 'Кресло 2', 186.5, 535.5, 180),
      it('table', 'Стол 3', 60, 340, 0), it('table', 'Стол 4', 250, 340, 0),
      it('master', 'Стул мастера 3', 60, 282.5, 0), it('master', 'Стул мастера 4', 250, 282.5, 0),
      it('client', 'Стул клиента 3', 60, 395, 180), it('client', 'Стул клиента 4', 250, 395, 180),
    ]
  } else {
    base.items = [
      it('table', 'Стол 1', 60, 130, 0), it('table', 'Стол 2', 250, 130, 0),
      it('master', 'Стул мастера 1', 60, 72.5, 0), it('master', 'Стул мастера 2', 250, 72.5, 0),
      it('client', 'Стул клиента 1', 60, 185, 180), it('client', 'Стул клиента 2', 250, 185, 180),
      it('dresser', 'Комод большой', 60, 19.5, 0), it('cabinet', 'Шкафчик', 297.75, 15, 0),
      it('dresser', 'Комод малый', 225, 17.5, 0, { w: 70, d: 35 }), it('rack', 'Вешалка', 295, 435, 90),
      it('cooler', 'Кулер', 202, 552.5, 180),
      it('armchair', 'Кресло 1', 35.5, 535.5, 180), it('coffee', 'Журнальный столик', 93, 535.5, 0), it('armchair', 'Кресло 2', 150.5, 535.5, 180),
      it('table', 'Стол 3', 60, 360, 0), it('table', 'Стол 4', 250, 360, 0),
      it('master', 'Стул мастера 3', 60, 302.5, 0), it('master', 'Стул мастера 4', 250, 302.5, 0),
      it('client', 'Стул клиента 3', 60, 415, 180), it('client', 'Стул клиента 4', 250, 415, 180),
    ]
  }
  return base
}

export function wallLenOf(st, wall) {
  return wall === 'top' || wall === 'bottom' ? st.room.w : st.room.h
}

export function clampOpeningIn(st, o) {
  const len = wallLenOf(st, o.wall)
  o.width = clamp(o.width, 10, len)
  o.offset = clamp(o.offset, 0, len - o.width)
}

// Любое состояние извне (черновик, файл, JSON) проходит через normalize()
export function normalize(s) {
  const out = { room: { w: clamp(+s.room.w || 310, 50, 3000), h: clamp(+s.room.h || 570, 50, 3000) }, items: [], openings: [] }
  for (const it of s.items || []) {
    if (!it) continue
    const kind = KINDS[it.kind] ? it.kind : 'box', K = KINDS[kind]
    const w = +it.w > 0 ? +it.w : K.w
    let d = +it.d > 0 ? +it.d : K.d
    if (K.round) d = w
    out.items.push({
      id: String(it.id || uid()), kind, name: String(it.name || K.label).slice(0, 60), w, d,
      x: isFinite(+it.x) ? +it.x : out.room.w / 2, y: isFinite(+it.y) ? +it.y : out.room.h / 2,
      rot: (((+it.rot || 0) % 360) + 360) % 360, tone: TONES.includes(it.tone) ? it.tone : K.tone, locked: !!it.locked,
    })
  }
  for (const o of s.openings || []) {
    if (!o) continue
    out.openings.push({
      id: String(o.id || uid()), type: o.type === 'window' ? 'window' : 'door', wall: WALLS.includes(o.wall) ? o.wall : 'top',
      offset: +o.offset || 0, width: +o.width > 0 ? +o.width : 80, hinge: o.hinge === 'end' ? 'end' : 'start', swing: o.swing === 'out' ? 'out' : 'in',
    })
  }
  const seen = new Set()
  for (const a of out.items.concat(out.openings)) {
    while (seen.has(a.id)) a.id = uid()
    seen.add(a.id)
  }
  out.openings.forEach((o) => clampOpeningIn(out, o))
  return out
}

export function validState(s) {
  return !!(s && s.room && +s.room.w > 0 && +s.room.h > 0 && Array.isArray(s.items) && Array.isArray(s.openings))
}
