import { ref } from 'vue'
import { toast } from '@/shared/lib'
import { VARIANTS, defaultState, replacePlan } from '@/entities/plan'

/** Вариант, ожидающий подтверждения ('a' | 'b' | null). */
export const pendingVariant = ref(null)

export function askVariant(v) {
  if (VARIANTS[v]) pendingVariant.value = v
}
export function cancelVariant() {
  pendingVariant.value = null
}
export function confirmVariant() {
  const v = pendingVariant.value
  if (!v) return
  replacePlan(defaultState(v))
  pendingVariant.value = null
  toast(VARIANTS[v].title + ' на плане')
}
