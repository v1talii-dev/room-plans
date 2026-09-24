<script setup>
import { computed } from 'vue'
import { ModalDialog } from '@/shared/ui'
import { VARIANTS } from '@/entities/plan'
import { cancelVariant, confirmVariant, pendingVariant } from '../model/applyVariant.js'

const V = computed(() => VARIANTS[pendingVariant.value])
</script>

<template>
  <ModalDialog @close="cancelVariant">
    <h3>Показать {{ V.title.toLowerCase() }}?</h3>
    <p class="hint">{{ V.desc }}. Текущая расстановка заменится. Если передумаете, нажмите «Отменить» на панели сверху.</p>
    <div class="btnrow">
      <button class="btn primary" @click="confirmVariant">Показать {{ V.title.toLowerCase() }}</button>
      <button class="btn" @click="cancelVariant">Оставить как есть</button>
    </div>
  </ModalDialog>
</template>
