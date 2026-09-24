import { onBeforeUnmount, onMounted } from 'vue'
import { clamp, isModalOpen } from '@/shared/lib'
import {
  clampInside, clearSelection, commitSoon, getItem, isMultiActive, multiSelection,
  plan, redo, removeSelected, selectedItem, selectedOpening, selection, undo, wallLenOf,
} from '@/entities/plan'
import { duplicateSelected, rotateSelected } from '@/features/edit-item'

/** Сдвиг выбранного предмета, группы или проёма стрелками (история пишется с задержкой). */
function nudge(dx, dy) {
  const it = selectedItem.value, op = selectedOpening.value
  if (isMultiActive.value) {
    for (const id of multiSelection.value) {
      const o = getItem(id)
      if (!o || o.locked) continue
      o.x += dx
      o.y += dy
      clampInside(plan.value.room, o)
    }
  } else if (it) {
    if (it.locked) return
    it.x += dx
    it.y += dy
    clampInside(plan.value.room, it)
  } else if (op) {
    const len = wallLenOf(plan.value, op.wall)
    op.offset = clamp(op.offset + (op.wall === 'top' || op.wall === 'bottom' ? dx : dy), 0, len - op.width)
  } else return
  commitSoon()
}

function onKeydown(e) {
  const tag = (e.target.tagName || '').toLowerCase()
  const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable
  const mod = e.ctrlKey || e.metaKey
  if (isModalOpen.value) return
  if (mod && e.code === 'KeyZ') { if (typing) return; e.preventDefault(); e.shiftKey ? redo() : undo(); return }
  if (mod && e.code === 'KeyY') { if (typing) return; e.preventDefault(); redo(); return }
  if (typing) return
  if (mod && e.code === 'KeyD') { e.preventDefault(); duplicateSelected(); return }
  if (e.key === 'Escape') { if (selection.value) clearSelection(); return }
  if (!selection.value) return
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); return }
  if (e.code === 'KeyR' && !mod) { rotateSelected(e.shiftKey ? -90 : 90); return }
  const st = e.shiftKey ? 10 : 1
  let dx = 0, dy = 0
  if (e.key === 'ArrowLeft') dx = -st
  else if (e.key === 'ArrowRight') dx = st
  else if (e.key === 'ArrowUp') dy = -st
  else if (e.key === 'ArrowDown') dy = st
  if (!dx && !dy) return
  e.preventDefault()
  nudge(dx, dy)
}

export function useHotkeys() {
  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
