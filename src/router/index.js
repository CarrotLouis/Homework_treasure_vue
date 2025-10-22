import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import UserManagement from '../views/UserManagement.vue'
import Leaderboard from '../views/Leaderboard.vue'

const routes = [
  {
    path: '/',
    name: 'Game',
    component: GameView
  },
  {
    path: '/users',
    name: 'Users',
    component: UserManagement
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: Leaderboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
