<script setup>
import { nextTick, ref } from 'vue'

// Поле, которое применяет значение по change/Enter и после этого
// показывает то, что реально записалось в модель (отформатированное или прежнее).
const props = defineProps({ value: { type: [String, Number], default: '' } })
const emit = defineEmits(['commit'])
const el = ref(null)

async function onChange(e) {
  emit('commit', e.target.value)
  await nextTick()
  if (el.value && document.activeElement !== el.value) el.value.value = String(props.value)
}
</script>

<template>
  <input ref="el" :value="value" autocomplete="off" spellcheck="false" @change="onChange" @keydown.enter="$event.target.blur()">
</template>
