<script setup>
import { openCreate } from '../model/createItem.js'
</script>

<template>
  <button class="btn sm create" @click="openCreate">
    <svg class="i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>Создать свой предмет
  </button>
</template>
