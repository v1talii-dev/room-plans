<script setup>
import { reactive, ref } from 'vue'
import { ModalDialog } from '@/shared/ui'
import { TONES, TONE_NAMES, palette } from '@/entities/plan'
import { closeCreate, createItem, validateForm } from '../model/createItem.js'

const form = reactive({ name: '', round: false, w: '60', d: '40', tone: 'other' })
const remember = ref(true)
const error = ref('')

function submit() {
  const r = validateForm(form)
  if (r.error) { error.value = r.error; return }
  createItem(r.tpl, remember.value)
}
</script>

<template>
  <ModalDialog @close="closeCreate">
    <form @submit.prevent="submit" @input="error = ''">
      <h3>Свой предмет</h3>
      <p class="hint">Задайте название, форму и размеры. Предмет встанет на свободное место плана, дальше его можно двигать и менять как любой другой.</p>
      <div class="form">
        <label class="f"><span>Название</span>
          <span class="in"><input v-model="form.name" autofocus maxlength="60" autocomplete="off" placeholder="Например, стеллаж"></span>
        </label>
        <div class="f"><span>Форма</span>
          <div class="grp seg" role="radiogroup" aria-label="Форма">
            <button type="button" class="tg" role="radio" :aria-checked="String(!form.round)" :aria-pressed="String(!form.round)" @click="form.round = false">
              <svg class="i" viewBox="0 0 24 24"><rect x="4" y="7" width="16" height="10" rx="1.5" /></svg><span>Прямоугольник</span>
            </button>
            <button type="button" class="tg" role="radio" :aria-checked="String(form.round)" :aria-pressed="String(form.round)" @click="form.round = true">
              <svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" /></svg><span>Круг</span>
            </button>
          </div>
        </div>
        <div class="fgrid">
          <label class="f"><span>{{ form.round ? 'Диаметр' : 'Ширина' }}</span>
            <span class="in"><input v-model="form.w" inputmode="decimal" autocomplete="off"><i>см</i></span>
          </label>
          <label v-if="!form.round" class="f"><span>Глубина</span>
            <span class="in"><input v-model="form.d" inputmode="decimal" autocomplete="off"><i>см</i></span>
          </label>
        </div>
        <div class="f"><span>Цвет</span>
          <div class="tones">
            <button
              v-for="t in TONES"
              :key="t"
              type="button"
              class="tone"
              :aria-pressed="String(form.tone === t)"
              :title="TONE_NAMES[t]"
              :aria-label="TONE_NAMES[t]"
              :style="{ background: palette.tones[t].f, borderColor: palette.tones[t].s }"
              @click="form.tone = t"
            />
          </div>
        </div>
      </div>
      <label class="check"><input v-model="remember" type="checkbox"> Запомнить в списке «Добавить предмет»</label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="btnrow">
        <button type="submit" class="btn primary">Добавить на план</button>
        <button type="button" class="btn" @click="closeCreate">Отмена</button>
      </div>
    </form>
  </ModalDialog>
</template>
