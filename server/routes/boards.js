const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { v4: uuidv4 } = require('uuid')

router.get('/', (req, res) => {
    const db = getDb()
    const boards = db.prepare('SELECT * FROM boards ORDER BY created_at DESC').all()
    res.json(boards)
})

router.get('/:id', (req, res) => {
    const db = getDb()
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id)
    if (!board) return res.status(404).json({ error: 'Board not found' })

    const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position').all(board.id)

    const taskStmt = db.prepare(`
    SELECT t.*, GROUP_CONCAT(tg.name) as tag_names, GROUP_CONCAT(tg.color) as tag_colors, GROUP_CONCAT(tg.id) as tag_ids
    FROM tasks t
    LEFT JOIN task_tags tt ON t.id = tt.task_id
    LEFT JOIN tags tg ON tt.tag_id = tg.id
    WHERE t.column_id = ?
    GROUP BY t.id
    ORDER BY t.position
  `)

    const result = {
        ...board,
        columns: columns.map(col => ({
            ...col,
            tasks: taskStmt.all(col.id).map(t => ({
                ...t,
                tags: t.tag_names
                    ? t.tag_names.split(',').map((name, i) => ({
                        id: t.tag_ids.split(',')[i],
                        name,
                        color: t.tag_colors.split(',')[i]
                    }))
                    : [],
                tag_names: undefined,
                tag_colors: undefined,
                tag_ids: undefined
            }))
        }))
    }

    res.json(result)
})

router.post('/', (req, res) => {
    const db = getDb()
    const id = uuidv4()
    const { title } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    db.prepare('INSERT INTO boards (id, title) VALUES (?, ?)').run(id, title)

    const defaultCols = [
        { title: 'To Do', position: 0, color: '#3b82f6' },
        { title: 'In Progress', position: 1, color: '#f59e0b' },
        { title: 'Done', position: 2, color: '#22c55e' }
    ]
    const insertCol = db.prepare('INSERT INTO columns (id, board_id, title, position, color) VALUES (?, ?, ?, ?, ?)')
    defaultCols.forEach(c => insertCol.run(uuidv4(), id, c.title, c.position, c.color))

    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(id)
    res.status(201).json(board)
})

router.put('/:id', (req, res) => {
    const db = getDb()
    const { title } = req.body
    db.prepare("UPDATE boards SET title = ?, updated_at = datetime('now') WHERE id = ?").run(title, req.params.id)
    const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id)
    res.json(board)
})

router.delete('/:id', (req, res) => {
    const db = getDb()
    db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id)
    res.status(204).send()
})

module.exports = router
