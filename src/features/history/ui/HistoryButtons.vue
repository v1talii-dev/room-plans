<script setup>
import { canRedo, canUndo, redo, undo } from '@/entities/plan'
</script>

<template>
  <div class="grp">
    <button class="ib" title="Отменить (Ctrl+Z)" aria-label="Отменить" :disabled="!canUndo" @click="undo">
      <svg class="i" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
    </button>
    <button class="ib" title="Повторить (Ctrl+Shift+Z)" aria-label="Повторить" :disabled="!canRedo" @click="redo">
      <svg class="i" viewBox="0 0 24 24"><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></svg>
    </button>
  </div>
</template>
