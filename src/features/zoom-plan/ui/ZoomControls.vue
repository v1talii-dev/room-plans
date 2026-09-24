<script setup>
import { setZoom, zoom, zoomFit } from '../model/viewport.js'
</script>

<template>
  <div class="grp">
    <button class="ib" title="Уменьшить" aria-label="Уменьшить" @click="setZoom(zoom / 1.25)">
      <svg class="i" viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
    </button>
    <button class="zv" title="Вписать план в экран" @click="zoomFit">{{ Math.round(zoom * 100) }}%</button>
    <button class="ib" title="Увеличить (Ctrl + колесо мыши)" aria-label="Увеличить" @click="setZoom(zoom * 1.25)">
      <svg class="i" viewBox="0 0 24 24"><path d="M5 12h14M12 5v14" /></svg>
    </button>
  </div>
</template>
