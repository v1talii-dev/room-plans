<script setup>
import { computed } from 'vue'
import { fmt } from '@/shared/lib'
import { NumField, SyncInput } from '@/shared/ui'
import { KINDS, TONES, TONE_NAMES, aabb, dimsText, isRound, palette, plan, removeSelected } from '@/entities/plan'
import { applyItemField, duplicateSelected, rotateSelected, setTone } from '../model/editItem.js'

const props = defineProps({ item: { type: Object, required: true } })

const round = computed(() => isRound(props.item))
const v = computed(() => {
  const it = props.item, A = aabb(it), room = plan.value.room
  return {
    w: fmt(it.w), d: fmt(it.d), rot: fmt(it.rot),
    left: fmt(A.x1), right: fmt(room.w - A.x2), top: fmt(A.y1), bottom: fmt(room.h - A.y2),
  }
})
const walls = [
  { f: 'top', cls: 'wb-t', label: 'До верхней стены' },
  { f: 'left', cls: 'wb-l', label: 'До левой стены' },
  { f: 'right', cls: 'wb-r', label: 'До правой стены' },
  { f: 'bottom', cls: 'wb-b', label: 'До нижней стены' },
]
</script>

<template>
  <h2>{{ KINDS[item.kind].label }}</h2>
  <SyncInput class="name" aria-label="Название предмета" :value="item.name" @commit="applyItemField('name', $event)" />
  <div class="fgrid">
    <NumField v-if="round" label="Диаметр" :value="v.w" @commit="applyItemField('dia', $event)" />
    <template v-else>
      <NumField label="Ширина" :value="v.w" @commit="applyItemField('w', $event)" />
      <NumField label="Глубина" :value="v.d" @commit="applyItemField('d', $event)" />
    </template>
  </div>
  <div v-if="!round" class="rotrow">
    <span class="lbl">Поворот</span>
    <button class="btn sm" title="Повернуть против часовой стрелки" @click="rotateSelected(-90)">↺ 90°</button>
    <span class="in sm"><SyncInput inputmode="decimal" aria-label="Угол поворота" :value="v.rot" @commit="applyItemField('rot', $event)" /><i>°</i></span>
    <button class="btn sm" title="Повернуть по часовой стрелке (R)" @click="rotateSelected(90)">↻ 90°</button>
  </div>
  <span class="lbl">Расстояние до стен</span>
  <div class="wallframe">
    <div class="wallbox">
      <div v-for="w in walls" :key="w.f" :class="w.cls">
        <span class="in">
          <SyncInput inputmode="decimal" :aria-label="w.label + ', см'" :title="w.label" :value="v[w.f]" @commit="applyItemField(w.f, $event)" /><i>см</i>
        </span>
      </div>
      <div class="wb-c">{{ dimsText(item) }}</div>
    </div>
  </div>
  <span class="lbl">Цвет</span>
  <div class="tones">
    <button
      v-for="t in TONES"
      :key="t"
      class="tone"
      :aria-pressed="String(item.tone === t)"
      :title="TONE_NAMES[t]"
      :aria-label="TONE_NAMES[t]"
      :style="{ background: palette.tones[t].f, borderColor: palette.tones[t].s }"
      @click="setTone(t)"
    />
  </div>
  <label class="check"><input type="checkbox" :checked="item.locked" @change="applyItemField('locked', $event.target.checked)"> Закрепить на месте</label>
  <div class="btnrow">
    <button class="btn sm" @click="duplicateSelected">Дублировать</button>
    <button class="btn sm danger" @click="removeSelected">Удалить</button>
  </div>
</template>
