<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { n2, plural } from '@/shared/lib'
import { guides, issues, palette, plan, planMarkup, select, selection, summarize, viewBox } from '@/entities/plan'
import { settings } from '@/entities/settings'
import { scale, setZoom, svgEl, viewportEl, viewportSize, zoom } from '@/features/zoom-plan'
import { usePlanPointer } from '../model/usePlanPointer.js'

const vp = ref(null)
const svg = ref(null)
const { dragging, cursorText, onPointerDown, onPointerMove, onPointerUp, onPointerLeave } = usePlanPointer(svg, vp)

const vb = computed(() => viewBox(plan.value, scale.value))
const markup = computed(() => planMarkup(plan.value, {
  pal: palette.value, s: scale.value, interactive: true, sel: selection.value, issues: issues.value,
  grid: settings.grid, labels: settings.labels, dims: settings.dims, guides: guides.value,
}))

const summary = computed(() => summarize(issues.value))
const issueParts = computed(() => {
  const s = summary.value, parts = []
  if (s.pairs) parts.push(s.pairs + ' ' + plural(s.pairs, 'пересечение', 'пересечения', 'пересечений'))
  if (s.out) parts.push(s.out + ' ' + plural(s.out, 'предмет', 'предмета', 'предметов') + ' за стенами')
  if (s.door) parts.push(s.door + ' ' + plural(s.door, 'мешает', 'мешают', 'мешают') + ' двери')
  return parts
})
const issueClass = computed(() => {
  const s = summary.value
  return s.pairs || s.out ? 'bad' : s.door ? 'amber' : ''
})
function showFirstIssue() {
  const f = summary.value.first
  if (f) select('i', f)
}

function onWheel(e) {
  if (!(e.ctrlKey || e.metaKey)) return
  e.preventDefault()
  setZoom(zoom.value * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY)
}

let ro = null
onMounted(() => {
  viewportEl.value = vp.value
  svgEl.value = svg.value
  const measure = () => {
    viewportSize.w = vp.value.clientWidth
    viewportSize.h = vp.value.clientHeight
  }
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(vp.value)
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  viewportEl.value = null
  svgEl.value = null
})
</script>

<template>
  <section class="stage" aria-label="План комнаты">
    <div ref="vp" class="viewport" @wheel="onWheel">
      <div class="vp-inner">
        <svg
          id="plan"
          ref="svg"
          :class="{ dragging }"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="План комнаты с мебелью"
          :viewBox="`${n2(vb.x)} ${n2(vb.y)} ${n2(vb.w)} ${n2(vb.h)}`"
          :width="(vb.w * scale).toFixed(1)"
          :height="(vb.h * scale).toFixed(1)"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @pointerleave="onPointerLeave"
          v-html="markup"
        />
      </div>
    </div>
    <footer class="status">
      <span class="cur" title="Расстояние от курсора до левой и верхней стены">{{ cursorText }}</span>
      <button
        class="issues"
        :class="issueClass"
        type="button"
        :title="issueParts.length ? 'Показать проблемный предмет' : 'Предметы не пересекаются и не мешают двери'"
        @click="showFirstIssue"
      >
        {{ issueParts.length ? issueParts.join(', ') : 'Пересечений нет' }}
      </button>
      <span class="scale">Все размеры в сантиметрах, клетка 10 см</span>
    </footer>
  </section>
</template>
