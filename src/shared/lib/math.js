export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const rad = (d) => (d * Math.PI) / 180
export const n2 = (v) => +(+v).toFixed(2)
export const pt = (p) => n2(p[0]) + ' ' + n2(p[1])

/** Число в русской записи: одна цифра после запятой, без «-0». */
export function fmt(v) {
  const r = Math.round(v * 10) / 10
  return (Object.is(r, -0) ? 0 : r).toString().replace('.', ',')
}
/** Разбор числа из поля ввода: пробелы игнорируются, запятая = точка. */
export function num(s) {
  return parseFloat(String(s).replace(/\s/g, '').replace(',', '.'))
}
export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
export function plural(n, a, b, c) {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return a
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return b
  return c
}
export function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}
/** Грубая оценка ширины текста в пикселях без измерения шрифта. */
export function textW(str, px) {
  return String(str).length * px * 0.56
}
export const sizeOf = (v) => clamp(Math.round(v * 10) / 10, 1, 3000)
