import { defineStore } from 'pinia'
import { ref } from 'vue'

const API = '/api'

export const useBoardStore = defineStore('board', () => {
    const boards = ref([])
    const currentBoard = ref(null)
    const loading = ref(false)
    const error = ref(null)

    async function fetchBoards() {
        loading.value = true
        try {
            const res = await fetch(`${API}/boards`)
            boards.value = await res.json()
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function fetchBoard(id) {
        loading.value = true
        try {
            const res = await fetch(`${API}/boards/${id}`)
            currentBoard.value = await res.json()
        } catch (e) {
            error.value = e.message
        } finally {
            loading.value = false
        }
    }

    async function createBoard(title) {
        const res = await fetch(`${API}/boards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        })
        const board = await res.json()
        boards.value.unshift(board)
        return board
    }

    async function updateBoard(id, title) {
        await fetch(`${API}/boards/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
        })
    }

    async function deleteBoard(id) {
        await fetch(`${API}/boards/${id}`, { method: 'DELETE' })
        boards.value = boards.value.filter(b => b.id !== id)
    }

    async function addColumn(boardId, title, color) {
        const res = await fetch(`${API}/columns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board_id: boardId, title, color })
        })
        const col = await res.json()
        if (currentBoard.value) {
            currentBoard.value.columns.push({ ...col, tasks: [] })
        }
        return col
    }

    async function deleteColumn(id) {
        await fetch(`${API}/columns/${id}`, { method: 'DELETE' })
        if (currentBoard.value) {
            currentBoard.value.columns = currentBoard.value.columns.filter(c => c.id !== id)
        }
    }

    async function addTask(columnId, data) {
        const res = await fetch(`${API}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: columnId, ...data })
        })
        return await res.json()
    }

    async function updateTask(id, data) {
        const res = await fetch(`${API}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return await res.json()
    }

    async function moveTask(taskId, columnId, position) {
        await fetch(`${API}/tasks/${taskId}/move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: columnId, position })
        })
    }

    async function deleteTask(id) {
        await fetch(`${API}/tasks/${id}`, { method: 'DELETE' })
    }

    return {
        boards, currentBoard, loading, error,
        fetchBoards, fetchBoard, createBoard, updateBoard, deleteBoard,
        addColumn, deleteColumn,
        addTask, updateTask, moveTask, deleteTask
    }
})

export const useTagStore = defineStore('tags', () => {
    const tags = ref([])

    async function fetchTags() {
        const res = await fetch(`${API}/tags`)
        tags.value = await res.json()
    }

    async function createTag(name, color) {
        const res = await fetch(`${API}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color })
        })
        const tag = await res.json()
        tags.value.push(tag)
        return tag
    }

    return { tags, fetchTags, createTag }
})
