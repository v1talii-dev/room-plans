<script setup>
import { fmt } from '@/shared/lib'
import { KINDS, PRESETS, palette, removeTemplate, templates } from '@/entities/plan'
import { addFromTemplate, addPreset } from '../model/addItem.js'

const presets = PRESETS.map((p) => {
  const K = KINDS[p.kind], w = p.w || K.w, d = p.d || K.d
  return { label: K.label, tone: K.tone, size: K.round ? 'Ø ' + fmt(w) : fmt(w) + ' × ' + fmt(d) }
})
const sizeText = (t) => (t.round ? 'Ø ' + fmt(t.w) : fmt(t.w) + ' × ' + fmt(t.d))
</script>

<template>
  <div class="add-grid">
    <button v-for="(p, i) in presets" :key="i" class="add" @click="addPreset(i)">
      <b><span class="dot" :style="{ background: palette.tones[p.tone].f, borderColor: palette.tones[p.tone].s }" />{{ p.label }}</b>
      <small>{{ p.size }} см</small>
    </button>
    <div v-for="t in templates" :key="t.id" class="add-own">
      <button class="add" :title="'Добавить: ' + t.name" @click="addFromTemplate(t)">
        <b><span class="dot" :class="{ round: t.round }" :style="{ background: palette.tones[t.tone].f, borderColor: palette.tones[t.tone].s }" />{{ t.name }}</b>
        <small>{{ sizeText(t) }} см</small>
      </button>
      <button class="add-x" :title="'Убрать «' + t.name + '» из списка'" :aria-label="'Убрать «' + t.name + '» из списка'" @click="removeTemplate(t.id)">×</button>
    </div>
  </div>
</template>
