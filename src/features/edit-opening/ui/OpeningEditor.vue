<script setup>
import { computed } from 'vue'
import { fmt } from '@/shared/lib'
import { NumField } from '@/shared/ui'
import { WALLS, WALL_NAMES, plan, removeSelected, wallLenOf } from '@/entities/plan'
import { applyOpeningField } from '../model/editOpening.js'

const props = defineProps({ opening: { type: Object, required: true } })

const vert = computed(() => props.opening.wall === 'left' || props.opening.wall === 'right')
const door = computed(() => props.opening.type === 'door')
const v = computed(() => {
  const op = props.opening, len = wallLenOf(plan.value, op.wall)
  return { width: fmt(op.width), start: fmt(op.offset), end: fmt(len - op.offset - op.width) }
})
</script>

<template>
  <h2>{{ door ? 'Дверь' : 'Окно' }}</h2>
  <div class="fgrid">
    <label class="f"><span>Тип</span>
      <select :value="opening.type" @change="applyOpeningField('otype', $event.target.value)">
        <option value="door">Дверь</option>
        <option value="window">Окно</option>
      </select>
    </label>
    <label class="f"><span>Стена</span>
      <select :value="opening.wall" @change="applyOpeningField('wall', $event.target.value)">
        <option v-for="w in WALLS" :key="w" :value="w">{{ WALL_NAMES[w] }}, {{ fmt(wallLenOf(plan, w)) }}</option>
      </select>
    </label>
    <NumField label="Ширина проёма" :value="v.width" @commit="applyOpeningField('owidth', $event)" />
    <span />
    <NumField :label="vert ? 'От верхнего угла' : 'От левого угла'" :value="v.start" @commit="applyOpeningField('ostart', $event)" />
    <NumField :label="vert ? 'До нижнего угла' : 'До правого угла'" :value="v.end" @commit="applyOpeningField('oend', $event)" />
    <template v-if="door">
      <label class="f"><span>Петли</span>
        <select :value="opening.hinge" @change="applyOpeningField('hinge', $event.target.value)">
          <option value="start">{{ vert ? 'сверху' : 'слева' }}</option>
          <option value="end">{{ vert ? 'снизу' : 'справа' }}</option>
        </select>
      </label>
      <label class="f"><span>Открывается</span>
        <select :value="opening.swing" @change="applyOpeningField('swing', $event.target.value)">
          <option value="in">внутрь</option>
          <option value="out">наружу</option>
        </select>
      </label>
    </template>
  </div>
  <p class="note">{{ door ? 'Дверь можно перетащить вдоль стены или на другую стену прямо на плане. ' : '' }}Серая дуга показывает, где открывается полотно.</p>
  <div class="btnrow">
    <button class="btn sm danger" @click="removeSelected">Удалить {{ door ? 'дверь' : 'окно' }}</button>
  </div>
</template>
