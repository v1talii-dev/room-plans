<script setup>
import { settings } from '@/entities/settings'
</script>

<template>
  <div class="grp">
    <button class="tg" :aria-pressed="String(settings.grid)" title="Сетка: клетка 10 см, тёмные линии через 1 м" @click="settings.grid = !settings.grid">
      <svg class="i" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg><span>Сетка</span>
    </button>
    <button class="tg" :aria-pressed="String(settings.snap)" title="Примагничивать к стенам, соседним предметам и сетке (Alt при перетаскивании — отключить)" @click="settings.snap = !settings.snap">
      <svg class="i" viewBox="0 0 24 24"><path d="m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15" /><path d="m5 8 4 4" /><path d="m12 15 4 4" /></svg><span>Привязка</span>
    </button>
    <button class="tg" :aria-pressed="String(settings.dims)" title="Показывать расстояния от выбранного предмета до стен и соседей" @click="settings.dims = !settings.dims">
      <svg class="i" viewBox="0 0 24 24"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2" /></svg><span>Расстояния</span>
    </button>
    <button class="tg" :aria-pressed="String(settings.labels)" title="Названия и размеры на предметах" @click="settings.labels = !settings.labels">
      <svg class="i" viewBox="0 0 24 24"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg><span>Подписи</span>
    </button>
  </div>
</template>
