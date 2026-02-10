const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { v4: uuidv4 } = require('uuid')

router.get('/', (req, res) => {
    const db = getDb()
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all()
    res.json(tags)
})

router.post('/', (req, res) => {
    const db = getDb()
    const { name, color } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const id = uuidv4()
    db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(id, name, color || '#8b5cf6')
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id)
    res.status(201).json(tag)
})

router.delete('/:id', (req, res) => {
    const db = getDb()
    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id)
    res.status(204).send()
})

module.exports = router
