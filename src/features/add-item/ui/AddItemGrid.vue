<script setup>
import { fmt } from '@/shared/lib'
import { KINDS, PRESETS, palette } from '@/entities/plan'
import { addPreset } from '../model/addItem.js'

const presets = PRESETS.map((p) => {
  const K = KINDS[p.kind], w = p.w || K.w, d = p.d || K.d
  return { label: K.label, tone: K.tone, size: K.round ? 'Ø ' + fmt(w) : fmt(w) + ' × ' + fmt(d) }
})
</script>

<template>
  <div class="add-grid">
    <button v-for="(p, i) in presets" :key="i" class="add" @click="addPreset(i)">
      <b><span class="dot" :style="{ background: palette.tones[p.tone].f, borderColor: palette.tones[p.tone].s }" />{{ p.label }}</b>
      <small>{{ p.size }} см</small>
    </button>
  </div>
</template>
