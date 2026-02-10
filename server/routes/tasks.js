const express = require('express')
const router = express.Router()
const { getDb } = require('../db')
const { v4: uuidv4 } = require('uuid')

router.get('/', (req, res) => {
    const db = getDb()
    const { column_id, priority, search, tag } = req.query
    let sql = `
    SELECT t.*, GROUP_CONCAT(tg.name) as tag_names, GROUP_CONCAT(tg.color) as tag_colors, GROUP_CONCAT(tg.id) as tag_ids
    FROM tasks t
    LEFT JOIN task_tags tt ON t.id = tt.task_id
    LEFT JOIN tags tg ON tt.tag_id = tg.id
  `
    const where = []
    const params = []

    if (column_id) { where.push('t.column_id = ?'); params.push(column_id) }
    if (priority) { where.push('t.priority = ?'); params.push(priority) }
    if (search) { where.push('(t.title LIKE ? OR t.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }
    if (tag) {
        where.push('t.id IN (SELECT task_id FROM task_tags JOIN tags ON tags.id = task_tags.tag_id WHERE tags.name = ?)')
        params.push(tag)
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ')
    sql += ' GROUP BY t.id ORDER BY t.position'

    const tasks = db.prepare(sql).all(...params).map(t => ({
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
    res.json(tasks)
})

router.post('/', (req, res) => {
    const db = getDb()
    const { column_id, title, description, priority, tags } = req.body
    if (!column_id || !title) return res.status(400).json({ error: 'column_id and title are required' })

    const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as mp FROM tasks WHERE column_id = ?').get(column_id)
    const id = uuidv4()
    db.prepare('INSERT INTO tasks (id, column_id, title, description, priority, position) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, column_id, title, description || '', priority || 'medium', maxPos.mp + 1)

    if (tags && tags.length) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)')
        tags.forEach(tagId => insertTag.run(id, tagId))
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
    res.status(201).json(task)
})

router.put('/:id', (req, res) => {
    const db = getDb()
    const { title, description, priority, column_id, position, tags } = req.body
    const updates = []
    const params = []

    if (title !== undefined) { updates.push('title = ?'); params.push(title) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority) }
    if (column_id !== undefined) { updates.push('column_id = ?'); params.push(column_id) }
    if (position !== undefined) { updates.push('position = ?'); params.push(position) }

    if (updates.length) {
        updates.push("updated_at = datetime('now')")
        params.push(req.params.id)
        db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }

    if (tags !== undefined) {
        db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(req.params.id)
        const insertTag = db.prepare('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)')
        tags.forEach(tagId => insertTag.run(req.params.id, tagId))
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
    res.json(task)
})

router.put('/:id/move', (req, res) => {
    const db = getDb()
    const { column_id, position } = req.body
    db.prepare("UPDATE tasks SET column_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?")
        .run(column_id, position, req.params.id)
    res.json({ ok: true })
})

router.delete('/:id', (req, res) => {
    const db = getDb()
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id)
    res.status(204).send()
})

module.exports = router
