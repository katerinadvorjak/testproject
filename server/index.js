const express = require('express')
const cors = require('cors')
const boardRoutes = require('./routes/boards')
const columnRoutes = require('./routes/columns')
const taskRoutes = require('./routes/tasks')
const tagRoutes = require('./routes/tags')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/boards', boardRoutes)
app.use('/api/columns', columnRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/tags', tagRoutes)

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Internal Server Error' })
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
