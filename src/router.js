import { createRouter, createWebHistory } from 'vue-router'
import BoardList from './views/BoardList.vue'
import BoardView from './views/BoardView.vue'

const routes = [
    { path: '/', name: 'boards', component: BoardList },
    { path: '/board/:id', name: 'board', component: BoardView, props: true }
]

export default createRouter({
    history: createWebHistory(),
    routes
})
