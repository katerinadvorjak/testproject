# TaskFlow — Task Management Board

A fullstack Kanban-style task management application built as a technical assessment.

## Tech Stack

- **Frontend:** Vue 3 (Composition API), Pinia, Vue Router, Vite
- **Backend:** Node.js, Express
- **Database:** SQLite (via better-sqlite3)
- **Styling:** Vanilla CSS with CSS custom properties

## Features

- Kanban board with draggable task cards
- CRUD operations for boards, columns, and tasks
- Task filtering by priority, tags, and free-text search
- Tag system with color labels
- Inline board title editing
- Dark / light theme toggle
- Responsive layout
- Seeded demo data

## Getting Started

```bash
npm install
npm run dev
```

The app starts on `http://localhost:5173` (frontend) and `http://localhost:3000` (API).

## API Endpoints

| Method | Endpoint | Description |
|--------|---------------------|------------------------|
| GET | /api/boards | List all boards |
| GET | /api/boards/:id | Get board with columns & tasks |
| POST | /api/boards | Create board |
| PUT | /api/boards/:id | Update board |
| DELETE | /api/boards/:id | Delete board |
| POST | /api/columns | Create column |
| PUT | /api/columns/:id | Update column |
| DELETE | /api/columns/:id | Delete column |
| GET | /api/tasks | List/filter tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PUT | /api/tasks/:id/move | Move task to column |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/tags | List tags |
| POST | /api/tags | Create tag |
| DELETE | /api/tags/:id | Delete tag |

## Project Structure

```
├── server/
│   ├── index.js          # Express entry point
│   ├── db.js             # SQLite setup, migrations, seed
│   └── routes/
│       ├── boards.js
│       ├── columns.js
│       ├── tasks.js
│       └── tags.js
├── src/
│   ├── main.js           # Vue app entry
│   ├── router.js
│   ├── App.vue
│   ├── stores/
│   │   └── index.js      # Pinia stores
│   ├── views/
│   │   ├── BoardList.vue
│   │   └── BoardView.vue
│   └── assets/
│       └── styles.css
├── index.html
├── vite.config.js
└── package.json
```
