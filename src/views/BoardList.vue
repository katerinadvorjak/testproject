<template>
  <div class="board-list-page">
    <div class="page-header">
      <h1>Your Boards</h1>
      <p class="subtitle">Select a board or create a new one</p>
    </div>

    <div v-if="loading" class="loader">
      <div class="spinner"></div>
    </div>

    <div v-else class="boards-grid">
      <div
        v-for="board in boards"
        :key="board.id"
        class="board-card"
        @click="$router.push(`/board/${board.id}`)"
      >
        <div class="board-card-gradient"></div>
        <div class="board-card-content">
          <h3>{{ board.title }}</h3>
          <span class="board-date">{{ formatDate(board.created_at) }}</span>
        </div>
        <button class="board-delete" @click.stop="handleDelete(board.id)" title="Delete board">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      </div>

      <div class="board-card board-card--new" @click="showCreate = true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        <span>New Board</span>
      </div>
    </div>

    <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
      <div class="modal">
        <h2>Create Board</h2>
        <input
          v-model="newTitle"
          placeholder="Board title..."
          class="input"
          @keyup.enter="handleCreate"
          ref="createInput"
        />
        <div class="modal-actions">
          <button class="btn btn--ghost" @click="showCreate = false">Cancel</button>
          <button class="btn btn--primary" @click="handleCreate" :disabled="!newTitle.trim()">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useBoardStore } from '../stores'

const store = useBoardStore()
const boards = ref([])
const loading = ref(true)
const showCreate = ref(false)
const newTitle = ref('')
const createInput = ref(null)

watch(showCreate, async (val) => {
  if (val) {
    await nextTick()
    createInput.value?.focus()
  }
})

onMounted(async () => {
  await store.fetchBoards()
  boards.value = store.boards
  loading.value = false
})

async function handleCreate() {
  if (!newTitle.value.trim()) return
  const board = await store.createBoard(newTitle.value.trim())
  newTitle.value = ''
  showCreate.value = false
  boards.value = store.boards
}

async function handleDelete(id) {
  await store.deleteBoard(id)
  boards.value = store.boards
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
