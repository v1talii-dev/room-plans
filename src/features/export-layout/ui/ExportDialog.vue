<script setup>
import { ref } from 'vue'
import { toast } from '@/shared/lib'
import { ModalDialog } from '@/shared/ui'
import { plan } from '@/entities/plan'
import { closeExport, downloadJSON, downloadPNG, downloadSVG, loadFromText } from '../model/exportLayout.js'

const text = ref(JSON.stringify(plan.value))
const box = ref(null)

async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    toast('Скопировано')
  } catch (e) {
    box.value.focus()
    box.value.select()
    try {
      document.execCommand('copy')
      toast('Скопировано')
    } catch (e2) {
      toast('Выделите текст и скопируйте вручную')
    }
  }
}
</script>

<template>
  <ModalDialog @close="closeExport">
    <h3>Экспорт и импорт</h3>
    <p class="hint">Оба файла — один и тот же чертёж с размерами и подписями предметов, отличается только формат. PNG удобно отправить в мессенджер. SVG — векторный чертёж в масштабе 1:50: если распечатать его в масштабе 100%, 1 см на листе равен 50 см комнаты.</p>
    <div class="btnrow">
      <button class="btn" @click="downloadPNG">Скачать чертёж PNG</button>
      <button class="btn" @click="downloadSVG">Скачать чертёж SVG (1:50)</button>
    </div>
    <h4>Файл расстановки</h4>
    <p class="hint">Скопируйте текст, чтобы сохранить расстановку у себя, или вставьте сохранённый ранее и нажмите «Загрузить».</p>
    <textarea ref="box" v-model="text" spellcheck="false" aria-label="Расстановка в формате JSON" />
    <div class="btnrow">
      <button class="btn" @click="copy">Скопировать</button>
      <button class="btn" @click="downloadJSON">Скачать .json</button>
      <button class="btn primary" @click="loadFromText(text)">Загрузить</button>
      <button class="btn" @click="closeExport">Закрыть</button>
    </div>
  </ModalDialog>
</template>
