<script setup>
import { fmt } from '@/shared/lib'
import { WALL_NAMES, dimsText, issues, palette, plan, select, selection } from '@/entities/plan'

const isOn = (t, id) => !!selection.value && selection.value.t === t && selection.value.id === id
function hasIssue(id) {
  const r = issues.value.get(id)
  return !!(r && (r.overlap.length || r.out || r.door))
}
</script>

<template>
  <ul class="list">
    <li v-for="it in plan.items" :key="'i' + it.id">
      <button class="row" :class="{ on: isOn('i', it.id) }" @click="select('i', it.id)">
        <span class="sw" :style="{ background: palette.tones[it.tone].f, borderColor: palette.tones[it.tone].s }" />
        <span class="nm">{{ it.name }} <span v-if="it.locked" class="lk">закреплён</span></span>
        <span class="dm">{{ dimsText(it) }}</span>
        <span class="wr" :title="hasIssue(it.id) ? 'Пересекается или мешает двери' : ''">{{ hasIssue(it.id) ? '!' : '' }}</span>
      </button>
    </li>
    <li v-for="op in plan.openings" :key="'o' + op.id">
      <button class="row" :class="{ on: isOn('o', op.id) }" @click="select('o', op.id)">
        <span class="sw" :style="{ background: op.type === 'door' ? palette.floor : palette.win, borderColor: palette.wall }" />
        <span class="nm">{{ op.type === 'door' ? 'Дверь' : 'Окно' }}, {{ WALL_NAMES[op.wall].toLowerCase() }} стена</span>
        <span class="dm">{{ fmt(op.width) }}</span>
        <span />
      </button>
    </li>
  </ul>
</template>
