<script setup>
import { askVariant } from '../model/applyVariant.js'
</script>

<template>
  <button class="btn sm" title="Комоды и шкафчик вдоль верхней стены" @click="askVariant('b')">Вариант Б</button>
  <button class="btn sm" title="Проходы шире, хранение по стенам" @click="askVariant('a')">Вариант А</button>
</template>
