const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { v4: uuidv4 } = require('uuid')

router.post('/', (req, res) => {
    const db = getDb()
    const { board_id, title, color } = req.body
    if (!board_id || !title) return res.status(400).json({ error: 'board_id and title are required' })

    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as mp FROM columns WHERE board_id = ?').get(board_id)
    const id = uuidv4()
    db.prepare('INSERT INTO columns (id, board_id, title, position, color) VALUES (?, ?, ?, ?, ?)')
        .run(id, board_id, title, maxPos.mp + 1, color || '#6366f1')

    const col = db.prepare('SELECT * FROM columns WHERE id = ?').get(id)
    res.status(201).json(col)
})

router.put('/:id', (req, res) => {
    const db = getDb()
    const { title, color } = req.body
    const updates = []
    const params = []
    if (title !== undefined) { updates.push('title = ?'); params.push(title) }
    if (color !== undefined) { updates.push('color = ?'); params.push(color) }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' })

    params.push(req.params.id)
    db.prepare(`UPDATE columns SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    const col = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id)
    res.json(col)
})

router.put('/:id/reorder', (req, res) => {
    const db = getDb()
    const { position } = req.body
    db.prepare('UPDATE columns SET position = ? WHERE id = ?').run(position, req.params.id)
    res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
    const db = getDb()
    db.prepare('DELETE FROM columns WHERE id = ?').run(req.params.id)
    res.status(204).send()
})

module.exports = router
