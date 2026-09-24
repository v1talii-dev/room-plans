<script setup>
import { toastState } from '../lib/toast.js'
</script>

<template>
  <div class="toast" :class="{ show: toastState.show }" role="status" aria-live="polite">{{ toastState.msg }}</div>
</template>
