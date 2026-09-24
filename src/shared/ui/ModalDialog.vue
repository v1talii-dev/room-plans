<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { registerModal } from '../lib/modal.js'

const emit = defineEmits(['close'])
const dialog = ref(null)
let unregister = null

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  unregister = registerModal()
  document.addEventListener('keydown', onKey)
  const f = dialog.value && dialog.value.querySelector('.btn')
  if (f) f.focus()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (unregister) unregister()
})
</script>

<template>
  <div class="modal" @click.self="emit('close')">
    <div ref="dialog" class="dialog" role="dialog" aria-modal="true">
      <slot />
    </div>
  </div>
</template>
