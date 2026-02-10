const Database = require('better-sqlite3')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const DB_PATH = path.join(__dirname, '..', 'data', 'taskflow.db')

let db

function getDb() {
    if (!db) {
        const fs = require('fs')
        const dir = path.dirname(DB_PATH)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        db = new Database(DB_PATH)
        db.pragma('journal_mode = WAL')
        db.pragma('foreign_keys = ON')
        migrate(db)
        seed(db)
    }
    return db
}

function migrate(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      color TEXT DEFAULT '#6366f1',
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#8b5cf6'
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (task_id, tag_id),
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `)
}

function seed(db) {
    const count = db.prepare('SELECT COUNT(*) as c FROM boards').get()
    if (count.c > 0) return

    const boardId = uuidv4()
    db.prepare('INSERT INTO boards (id, title) VALUES (?, ?)').run(boardId, 'My Project')

    const cols = [
        { id: uuidv4(), title: 'Backlog', position: 0, color: '#64748b' },
        { id: uuidv4(), title: 'To Do', position: 1, color: '#3b82f6' },
        { id: uuidv4(), title: 'In Progress', position: 2, color: '#f59e0b' },
        { id: uuidv4(), title: 'Done', position: 3, color: '#22c55e' }
    ]

    const insertCol = db.prepare('INSERT INTO columns (id, board_id, title, position, color) VALUES (?, ?, ?, ?, ?)')
    cols.forEach(c => insertCol.run(c.id, boardId, c.title, c.position, c.color))

    const tags = [
        { id: uuidv4(), name: 'bug', color: '#ef4444' },
        { id: uuidv4(), name: 'feature', color: '#8b5cf6' },
        { id: uuidv4(), name: 'ui', color: '#06b6d4' },
        { id: uuidv4(), name: 'api', color: '#f97316' },
        { id: uuidv4(), name: 'docs', color: '#84cc16' }
    ]
    const insertTag = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)')
    tags.forEach(t => insertTag.run(t.id, t.name, t.color))

    const tasks = [
        { title: 'Set up project structure', desc: 'Initialize Vue 3 + Express boilerplate', priority: 'high', colIdx: 3 },
        { title: 'Design database schema', desc: 'Create tables for boards, columns, tasks', priority: 'high', colIdx: 3 },
        { title: 'Build REST API endpoints', desc: 'CRUD for tasks, columns, boards', priority: 'high', colIdx: 2, tagNames: ['api'] },
        { title: 'Create Kanban board UI', desc: 'Drag and drop columns with task cards', priority: 'high', colIdx: 2, tagNames: ['ui', 'feature'] },
        { title: 'Add task filtering', desc: 'Filter by priority, tags, search text', priority: 'medium', colIdx: 1, tagNames: ['feature'] },
        { title: 'Implement drag & drop', desc: 'Move tasks between columns', priority: 'medium', colIdx: 1, tagNames: ['ui'] },
        { title: 'Write API documentation', desc: 'Document all endpoints in README', priority: 'low', colIdx: 0, tagNames: ['docs'] },
        { title: 'Add dark mode toggle', desc: 'Support light/dark theme switching', priority: 'low', colIdx: 0, tagNames: ['ui'] },
        { title: 'Fix date formatting bug', desc: 'Dates showing in wrong timezone', priority: 'medium', colIdx: 1, tagNames: ['bug'] },
        { title: 'Add unit tests', desc: 'Cover API routes with tests', priority: 'medium', colIdx: 0, tagNames: ['api'] }
    ]

    const insertTask = db.prepare('INSERT INTO tasks (id, column_id, title, description, priority, position) VALUES (?, ?, ?, ?, ?, ?)')
    const insertTaskTag = db.prepare('INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)')
    const tagMap = {}
    tags.forEach(t => { tagMap[t.name] = t.id })

    let positions = [0, 0, 0, 0]
    tasks.forEach(t => {
        const taskId = uuidv4()
        const colId = cols[t.colIdx].id
        insertTask.run(taskId, colId, t.title, t.desc, t.priority, positions[t.colIdx]++)
        if (t.tagNames) {
            t.tagNames.forEach(tn => insertTaskTag.run(taskId, tagMap[tn]))
        }
    })
}

module.exports = { getDb }
