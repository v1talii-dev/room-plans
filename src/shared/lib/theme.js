import { ref } from 'vue'

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

function detect() {
  const t = document.documentElement.getAttribute('data-theme')
  if (t === 'dark') return true
  if (t === 'light') return false
  return !!(mq && mq.matches)
}

/** Тёмная ли тема сейчас: учитывает data-theme на <html> и системную настройку. */
export const isDark = ref(detect())

const update = () => { isDark.value = detect() }
if (mq) mq.addEventListener('change', update)
new MutationObserver(update).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
