<script setup>
import { computed, ref, watch } from 'vue'
import { selectedItem, selectedOpening, selection } from '@/entities/plan'
import { AddItemGrid } from '@/features/add-item'
import { CreateItemButton } from '@/features/create-item'
import { ItemEditor } from '@/features/edit-item'
import { OpeningEditor } from '@/features/edit-opening'
import { RoomSettings } from '@/features/edit-room'
import { ObjectList } from '@/features/select-object'
import { VariantButtons } from '@/features/apply-variant'
import { openExport } from '@/features/export-layout'
import HelpSection from './HelpSection.vue'

const panel = ref(null)
const selKey = computed(() => (selection.value ? selection.value.t + selection.value.id : ''))

// При выборе другого объекта прокручиваем панель к его свойствам
watch(selKey, (key, prev) => {
  const pn = panel.value
  if (!key || key === prev || !pn || pn.scrollTop <= 0) return
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  pn.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
})
</script>

<template>
  <aside ref="panel" class="panel">
    <section class="sec sel" :class="{ active: !!selection }">
      <ItemEditor v-if="selectedItem" :key="'i' + selectedItem.id" :item="selectedItem" />
      <OpeningEditor v-else-if="selectedOpening" :key="'o' + selectedOpening.id" :opening="selectedOpening" />
      <HelpSection v-else />
    </section>
    <section class="sec">
      <h2>Добавить предмет</h2>
      <AddItemGrid />
      <CreateItemButton />
    </section>
    <section class="sec">
      <h2>Комната</h2>
      <RoomSettings />
      <p class="note">Размеры комнаты указаны по внутренней стороне стен. Толщина стен на плане условная.</p>
    </section>
    <section class="sec">
      <h2>Предметы в комнате</h2>
      <ObjectList />
    </section>
    <section class="sec">
      <h2>Расстановка</h2>
      <p class="hint">Изменения сохраняются в этом браузере автоматически. Чтобы перенести план на другое устройство, воспользуйтесь экспортом.</p>
      <div class="btnrow">
        <VariantButtons />
        <button class="btn sm" @click="openExport">Экспорт и импорт</button>
      </div>
    </section>
  </aside>
</template>
