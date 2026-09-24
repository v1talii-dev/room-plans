<script setup>
import { ref } from 'vue'
import { ModalDialog } from '@/shared/ui'
import { activeRoomId, rooms } from '@/entities/plan'
import { addRoom, closeRooms, removeRoom, saveRoomName, selectRoom } from '../model/manageRooms.js'

const newName = ref('')

function onSubmitNew() {
  addRoom(newName.value)
  newName.value = ''
}
function onRename(e, id) {
  saveRoomName(id, e.target.value)
}
</script>

<template>
  <ModalDialog @close="closeRooms">
    <h3>Комнаты</h3>
    <p class="hint">Каждая комната хранит свою расстановку и историю отмены независимо от остальных. Все они сохраняются в этом браузере.</p>
    <ul class="list">
      <li v-for="r in rooms" :key="r.id">
        <div class="row room-row" :class="{ on: r.id === activeRoomId }">
          <button class="sw room-pick" :class="{ on: r.id === activeRoomId }" :title="r.id === activeRoomId ? 'Текущая комната' : 'Переключиться'" :aria-label="'Переключиться на «' + r.name + '»'" @click="selectRoom(r.id)" />
          <input class="room-name" :value="r.name" :aria-label="'Название комнаты «' + r.name + '»'" maxlength="60" @change="onRename($event, r.id)">
          <button class="add-x" title="Удалить комнату" :aria-label="'Удалить комнату «' + r.name + '»'" :disabled="rooms.length <= 1" @click="removeRoom(r.id)">×</button>
        </div>
      </li>
    </ul>
    <form class="btnrow room-add" @submit.prevent="onSubmitNew">
      <span class="in"><input v-model="newName" placeholder="Название новой комнаты" maxlength="60" autocomplete="off"></span>
      <button type="submit" class="btn primary">Создать комнату</button>
    </form>
    <div class="btnrow">
      <button class="btn" autofocus @click="closeRooms">Закрыть</button>
    </div>
  </ModalDialog>
</template>
