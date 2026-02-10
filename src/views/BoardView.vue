<template>
  <div class="board-view" v-if="board">
    <div class="board-toolbar">
      <div class="toolbar-left">
        <router-link to="/" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </router-link>
        <h2 class="board-title" v-if="!editingTitle" @dblclick="startEditTitle">{{ board.title }}</h2>
        <input
          v-else
          v-model="titleDraft"
          class="board-title-input"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          ref="titleInput"
        />
      </div>
      <div class="toolbar-right">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input v-model="searchQuery" placeholder="Search tasks..." class="search-input" />
        </div>
        <select v-model="filterPriority" class="filter-select">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select v-model="filterTag" class="filter-select">
          <option value="">All tags</option>
          <option v-for="tag in allTags" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
        </select>
      </div>
    </div>

    <div class="columns-container">
      <div
        v-for="column in board.columns"
        :key="column.id"
        class="column"
        @dragover.prevent
        @drop="handleDrop($event, column)"
      >
        <div class="column-header">
          <div class="column-color" :style="{ background: column.color }"></div>
          <h3>{{ column.title }}</h3>
          <span class="task-count">{{ filteredTasks(column).length }}</span>
          <button class="column-menu-btn" @click="handleDeleteColumn(column.id)" title="Delete column">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="column-tasks">
          <div
            v-for="task in filteredTasks(column)"
            :key="task.id"
            class="task-card"
            draggable="true"
            @dragstart="handleDragStart($event, task, column)"
            @click="openTask(task, column)"
          >
            <div class="task-tags" v-if="task.tags && task.tags.length">
              <span
                v-for="tag in task.tags"
                :key="tag.id"
                class="tag-badge"
                :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }"
              >{{ tag.name }}</span>
            </div>
            <p class="task-title">{{ task.title }}</p>
            <div class="task-meta">
              <span class="priority-dot" :class="'priority--' + task.priority" :title="task.priority"></span>
              <span class="task-date">{{ formatDate(task.created_at) }}</span>
            </div>
          </div>
        </div>

        <button class="add-task-btn" @click="startAddTask(column)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          Add task
        </button>
      </div>

      <div class="column column--add" @click="showAddColumn = true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
        <span>Add Column</span>
      </div>
    </div>

    <!-- Add Task Modal -->
    <div v-if="addingTask" class="modal-overlay" @click.self="addingTask = null">
      <div class="modal">
        <h2>New Task</h2>
        <input v-model="newTask.title" placeholder="Task title..." class="input" ref="taskTitleInput" @keyup.enter="submitTask" />
        <textarea v-model="newTask.description" placeholder="Description (optional)" class="input textarea" rows="3"></textarea>
        <div class="form-row">
          <label>Priority</label>
          <select v-model="newTask.priority" class="filter-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-row">
          <label>Tags</label>
          <div class="tag-select">
            <label v-for="tag in allTags" :key="tag.id" class="tag-check">
              <input type="checkbox" :value="tag.id" v-model="newTask.tags" />
              <span class="tag-badge" :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }">{{ tag.name }}</span>
            </label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn--ghost" @click="addingTask = null">Cancel</button>
          <button class="btn btn--primary" @click="submitTask" :disabled="!newTask.title.trim()">Create</button>
        </div>
      </div>
    </div>

    <!-- Edit Task Modal -->
    <div v-if="editingTask" class="modal-overlay" @click.self="editingTask = null">
      <div class="modal modal--wide">
        <div class="modal-header-row">
          <h2>Edit Task</h2>
          <button class="btn btn--danger btn--sm" @click="handleDeleteTask">Delete</button>
        </div>
        <input v-model="editDraft.title" placeholder="Task title..." class="input" />
        <textarea v-model="editDraft.description" placeholder="Description" class="input textarea" rows="4"></textarea>
        <div class="form-row">
          <label>Priority</label>
          <select v-model="editDraft.priority" class="filter-select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="form-row">
          <label>Tags</label>
          <div class="tag-select">
            <label v-for="tag in allTags" :key="tag.id" class="tag-check">
              <input type="checkbox" :value="tag.id" v-model="editDraft.tags" />
              <span class="tag-badge" :style="{ background: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }">{{ tag.name }}</span>
            </label>
          </div>
        </div>
        <div class="form-row">
          <label>Move to</label>
          <select v-model="editDraft.column_id" class="filter-select">
            <option v-for="col in board.columns" :key="col.id" :value="col.id">{{ col.title }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn--ghost" @click="editingTask = null">Cancel</button>
          <button class="btn btn--primary" @click="saveTask">Save</button>
        </div>
      </div>
    </div>

    <!-- Add Column Modal -->
    <div v-if="showAddColumn" class="modal-overlay" @click.self="showAddColumn = false">
      <div class="modal">
        <h2>Add Column</h2>
        <input v-model="newColTitle" placeholder="Column title..." class="input" @keyup.enter="submitColumn" ref="colInput" />
        <div class="form-row">
          <label>Color</label>
          <input type="color" v-model="newColColor" class="color-picker" />
        </div>
        <div class="modal-actions">
          <button class="btn btn--ghost" @click="showAddColumn = false">Cancel</button>
          <button class="btn btn--primary" @click="submitColumn" :disabled="!newColTitle.trim()">Add</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="loading" class="loader"><div class="spinner"></div></div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { useBoardStore, useTagStore } from '../stores'

const props = defineProps({ id: String })
const boardStore = useBoardStore()
const tagStore = useTagStore()

const board = ref(null)
const loading = ref(true)
const allTags = ref([])

const searchQuery = ref('')
const filterPriority = ref('')
const filterTag = ref('')

const editingTitle = ref(false)
const titleDraft = ref('')
const titleInput = ref(null)

const addingTask = ref(null)
const newTask = ref({ title: '', description: '', priority: 'medium', tags: [] })
const taskTitleInput = ref(null)

const editingTask = ref(null)
const editTaskColumn = ref(null)
const editDraft = ref({ title: '', description: '', priority: 'medium', tags: [], column_id: '' })

const showAddColumn = ref(false)
const newColTitle = ref('')
const newColColor = ref('#6366f1')
const colInput = ref(null)

let dragTask = null
let dragSourceColumn = null

onMounted(async () => {
  await Promise.all([
    boardStore.fetchBoard(props.id),
    tagStore.fetchTags()
  ])
  board.value = boardStore.currentBoard
  allTags.value = tagStore.tags
  loading.value = false
})

watch(showAddColumn, async (v) => { if (v) { await nextTick(); colInput.value?.focus() } })
watch(addingTask, async (v) => { if (v) { await nextTick(); taskTitleInput.value?.focus() } })

function filteredTasks(column) {
  let tasks = column.tasks || []
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q)))
  }
  if (filterPriority.value) {
    tasks = tasks.filter(t => t.priority === filterPriority.value)
  }
  if (filterTag.value) {
    tasks = tasks.filter(t => t.tags && t.tags.some(tg => tg.name === filterTag.value))
  }
  return tasks
}

function startEditTitle() {
  titleDraft.value = board.value.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

async function saveTitle() {
  editingTitle.value = false
  if (titleDraft.value.trim() && titleDraft.value !== board.value.title) {
    await boardStore.updateBoard(board.value.id, titleDraft.value.trim())
    board.value.title = titleDraft.value.trim()
  }
}

function startAddTask(column) {
  addingTask.value = column
  newTask.value = { title: '', description: '', priority: 'medium', tags: [] }
}

async function submitTask() {
  if (!newTask.value.title.trim()) return
  await boardStore.addTask(addingTask.value.id, newTask.value)
  addingTask.value = null
  await reload()
}

function openTask(task, column) {
  editingTask.value = task
  editTaskColumn.value = column
  editDraft.value = {
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    tags: task.tags ? task.tags.map(t => t.id) : [],
    column_id: column.id
  }
}

async function saveTask() {
  const moved = editDraft.value.column_id !== editTaskColumn.value.id
  await boardStore.updateTask(editingTask.value.id, {
    title: editDraft.value.title,
    description: editDraft.value.description,
    priority: editDraft.value.priority,
    tags: editDraft.value.tags,
    column_id: editDraft.value.column_id
  })
  editingTask.value = null
  await reload()
}

async function handleDeleteTask() {
  await boardStore.deleteTask(editingTask.value.id)
  editingTask.value = null
  await reload()
}

async function submitColumn() {
  if (!newColTitle.value.trim()) return
  await boardStore.addColumn(board.value.id, newColTitle.value.trim(), newColColor.value)
  showAddColumn.value = false
  newColTitle.value = ''
  newColColor.value = '#6366f1'
  await reload()
}

async function handleDeleteColumn(id) {
  await boardStore.deleteColumn(id)
  await reload()
}

function handleDragStart(e, task, column) {
  dragTask = task
  dragSourceColumn = column
  e.dataTransfer.effectAllowed = 'move'
  e.target.classList.add('dragging')
  setTimeout(() => e.target.classList.remove('dragging'), 0)
}

async function handleDrop(e, targetColumn) {
  if (!dragTask || targetColumn.id === dragSourceColumn.id) return
  const pos = targetColumn.tasks ? targetColumn.tasks.length : 0
  await boardStore.moveTask(dragTask.id, targetColumn.id, pos)
  dragTask = null
  dragSourceColumn = null
  await reload()
}

async function reload() {
  await boardStore.fetchBoard(props.id)
  board.value = boardStore.currentBoard
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>
