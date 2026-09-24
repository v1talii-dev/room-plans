<script setup>
import SyncInput from './SyncInput.vue'

defineProps({
  label: { type: String, default: '' },
  value: { type: [String, Number], default: '' },
  unit: { type: String, default: 'см' },
})
const emit = defineEmits(['commit'])
</script>

<template>
  <label class="f">
    <span>{{ label }}</span>
    <span class="in"><SyncInput inputmode="decimal" :value="value" @commit="emit('commit', $event)" /><i>{{ unit }}</i></span>
  </label>
</template>
