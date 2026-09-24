<script setup>
import { fmt } from '@/shared/lib'
import { NumField } from '@/shared/ui'
import { plan } from '@/entities/plan'
import { settings } from '@/entities/settings'
import { addOpening, applyRoomSize, rotatePlan } from '../model/editRoom.js'
</script>

<template>
  <div class="fgrid">
    <NumField label="Верхняя и нижняя стены" :value="fmt(plan.room.w)" @commit="applyRoomSize('w', $event)" />
    <NumField label="Левая и правая стены" :value="fmt(plan.room.h)" @commit="applyRoomSize('h', $event)" />
  </div>
  <div class="btnrow">
    <button class="btn sm" @click="addOpening('door')">Добавить дверь</button>
    <button class="btn sm" @click="addOpening('window')">Добавить окно</button>
    <button class="btn sm" @click="rotatePlan">Повернуть план на 90°</button>
  </div>
  <label class="f inline"><span>Шаг привязки к сетке</span>
    <select :value="String(settings.step)" @change="settings.step = +$event.target.value || 5">
      <option value="1">1 см</option>
      <option value="5">5 см</option>
      <option value="10">10 см</option>
    </select>
  </label>
</template>
