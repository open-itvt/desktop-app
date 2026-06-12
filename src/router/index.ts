import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/live/:channel',
    name: 'live',
    component: () => import('@/views/LiveView.vue'),
  },
  {
    path: '/watch/:videoName/:claimId',
    name: 'watch',
    component: () => import('@/views/WatchView.vue'),
  },
  {
    path: '/vod',
    name: 'vod',
    component: () => import('@/views/VodLibraryView.vue'),
  },
  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('@/views/ScheduleView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
