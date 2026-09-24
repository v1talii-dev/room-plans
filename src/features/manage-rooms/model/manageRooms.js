import { ref } from 'vue'
import { toast } from '@/shared/lib'
import { activeRoomId, createRoom, deleteRoom, renameRoom, rooms, switchRoom } from '@/entities/plan'

export const roomsOpen = ref(false)
export const openRooms = () => { roomsOpen.value = true }
export const closeRooms = () => { roomsOpen.value = false }

export function selectRoom(id) {
  switchRoom(id)
}
export function addRoom(name) {
  createRoom(name)
}
export function saveRoomName(id, name) {
  renameRoom(id, name)
}
export function removeRoom(id) {
  if (rooms.length <= 1) {
    toast('Нельзя удалить единственную комнату')
    return
  }
  const wasActive = id === activeRoomId.value
  deleteRoom(id)
  if (wasActive) toast('Комната удалена, переключились на другую')
}
