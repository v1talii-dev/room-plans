<script setup>
import { fmt } from '@/shared/lib'
import { activeRoomName, plan } from '@/entities/plan'
import { HistoryButtons } from '@/features/history'
import { DisplayToggles } from '@/features/toggle-display'
import { ZoomControls } from '@/features/zoom-plan'
import { openExport } from '@/features/export-layout'
import { openRooms } from '@/features/manage-rooms'
</script>

<template>
  <header class="bar">
    <div class="brand">
      <button class="room-switch" title="Сменить или создать комнату" aria-haspopup="dialog" @click="openRooms">
        <h1>{{ activeRoomName }}</h1>
        <svg class="i" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <span class="dim">{{ fmt(plan.room.w) }} × {{ fmt(plan.room.h) }} см</span>
    </div>
    <div class="tools" role="toolbar" aria-label="Инструменты плана">
      <HistoryButtons />
      <DisplayToggles />
      <ZoomControls />
      <button class="btn" @click="openExport">Экспорт и импорт</button>
    </div>
  </header>
</template>
