import { fmt } from '@/shared/lib'
import { KINDS } from '../config/catalog.js'

export function isRound(it) {
  return !!(KINDS[it.kind] && KINDS[it.kind].round)
}
export function dimsText(it) {
  return isRound(it) ? 'Ø' + fmt(it.w) : fmt(it.w) + '×' + fmt(it.d)
}
