<script setup>
import { fmt } from '@/shared/lib'
import { plan } from '@/entities/plan'
import { HistoryButtons } from '@/features/history'
import { DisplayToggles } from '@/features/toggle-display'
import { ZoomControls } from '@/features/zoom-plan'
import { openExport } from '@/features/export-layout'
</script>

<template>
  <header class="bar">
    <div class="brand">
      <h1>Кабинет маникюра</h1>
      <span class="dim">{{ fmt(plan.room.w) }} × {{ fmt(plan.room.h) }} см</span>
    </div>
    <div class="tools" role="toolbar" aria-label="Инструменты плана">
      <HistoryButtons />
      <DisplayToggles />
      <ZoomControls />
      <button class="btn" @click="openExport">Экспорт</button>
    </div>
  </header>
</template>
