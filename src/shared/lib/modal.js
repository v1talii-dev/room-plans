import { computed, ref } from 'vue'

const openCount = ref(0)

/** Открыто ли сейчас какое-нибудь модальное окно (горячие клавиши плана при этом молчат). */
export const isModalOpen = computed(() => openCount.value > 0)

export function registerModal() {
  openCount.value++
  return () => { openCount.value = Math.max(0, openCount.value - 1) }
}
