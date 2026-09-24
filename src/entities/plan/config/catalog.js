export const STORE_KEY = 'nail-room-plan-v1' // старый ключ одиночного черновика — оставлен для миграции
export const ROOMS_KEY = 'nail-room-plan-rooms-v1'
export const T = 12 // условная толщина стен на чертеже, см
export const PADPX = 22
export const FONT_DRAW = "'IBM Plex Sans Condensed','Roboto Condensed','Arial Narrow',Arial,sans-serif"

export const KINDS = {
  table: { label: 'Стол', w: 120, d: 50, tone: 'work' },
  master: { label: 'Стул', w: 50, d: 50, tone: 'seat' },
  client: { label: 'Стул', w: 50, d: 50, tone: 'seat' },
  armchair: { label: 'Кресло', w: 65, d: 65, tone: 'lounge' },
  coffee: { label: 'Журнальный столик', w: 44, d: 44, tone: 'lounge', round: true },
  dresser: { label: 'Комод', w: 120, d: 39, tone: 'storage' },
  cabinet: { label: 'Шкафчик', w: 24.5, d: 30, tone: 'storage' },
  cooler: { label: 'Кулер для воды', w: 30, d: 33, tone: 'utility' },
  rack: { label: 'Вешалка', w: 80, d: 30, tone: 'lounge' },
  box: { label: 'Прямоугольник', w: 60, d: 40, tone: 'other' },
  circle: { label: 'Круг', w: 50, d: 50, tone: 'other', round: true },
}

export const PRESETS = [
  { kind: 'table' }, { kind: 'client' }, { kind: 'armchair' },
  { kind: 'coffee' }, { kind: 'cooler' }, { kind: 'dresser', w: 120, d: 39 }, { kind: 'dresser', w: 70, d: 35 },
  { kind: 'cabinet' }, { kind: 'rack' }, { kind: 'box' }, { kind: 'circle' },
]

export const TONES = ['work', 'seat', 'lounge', 'storage', 'utility', 'other']
export const TONE_NAMES = { work: 'Дерево', seat: 'Розовый', lounge: 'Лавандовый', storage: 'Шалфей', utility: 'Бирюзовый', other: 'Серый' }
export const WALLS = ['top', 'right', 'bottom', 'left']
export const WALL_NAMES = { top: 'Верхняя', right: 'Правая', bottom: 'Нижняя', left: 'Левая' }

export const VARIANTS = {
  b: { title: 'Вариант Б', desc: 'Комоды и шкафчик вдоль верхней стены, за спинами мастеров первого ряда' },
  a: { title: 'Вариант А', desc: 'Проходы шире, хранение распределено по стенам' },
}

// Цвета для SVG (не CSS-переменные: экспортируемая картинка должна быть самодостаточной)
export const PAL = {
  light: {
    floor: '#FFFFFF', g1: '#EDF0F4', g2: '#DDE1E8', g3: '#C3CAD6', wall: '#34303A', dim: '#6B7080', text: '#2E323C',
    accent: '#B0305C', warn: '#D23B2F', amber: '#C77C12', win: '#D5E7F5', winLine: '#5C84A6', leaf: '#34303A', arc: '#8C8F9C',
    tones: {
      work: { f: '#F1E4CC', s: '#8C6A3E' }, seat: { f: '#F5D8E0', s: '#A34E67' }, lounge: { f: '#E2DDF1', s: '#62558F' },
      storage: { f: '#D9E8DC', s: '#4E7658' }, utility: { f: '#D3EBF0', s: '#347885' }, other: { f: '#E4E5EA', s: '#626473' },
    },
  },
  dark: {
    floor: '#1F2127', g1: '#262930', g2: '#30343D', g3: '#434855', wall: '#C9C3D1', dim: '#9CA1AF', text: '#DDE0E8',
    accent: '#E0658F', warn: '#FF6B5E', amber: '#F0A640', win: '#23384A', winLine: '#7FA8CC', leaf: '#C9C3D1', arc: '#7D8190',
    tones: {
      work: { f: '#44392A', s: '#D6B588' }, seat: { f: '#4A2A35', s: '#EC9CB2' }, lounge: { f: '#34304A', s: '#B7AAE6' },
      storage: { f: '#2B3E31', s: '#9CCBA8' }, utility: { f: '#233E46', s: '#8BCBD8' }, other: { f: '#32333A', s: '#A9AAB4' },
    },
  },
}
