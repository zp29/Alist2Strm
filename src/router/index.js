import { createRouter, createWebHistory } from 'vue-router'

const isAuthenticated = () => {
  const token = localStorage.getItem('token')
  const expiresAt = localStorage.getItem('expiresAt')
  
  if (!token || !expiresAt) return false
  
  return new Date().getTime() < parseInt(expiresAt)
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      redirect: '/automation'
    },
    {
      path: '/automation',
      name: 'automation',
      component: () => import('../views/AutomationView.vue'),
    },
    {
      path: '/alist',
      name: 'alist',
      component: () => import('../views/alist.vue'),
    },
    {
      path: '/alist-strm',
      name: 'alist-strm',
      component: () => import('../views/alist-strm.vue'),
    },
    {
      path: '/taosync',
      name: 'taosync',
      component: () => import('../views/taosync.vue'),
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../views/UserSettingsView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/about.vue'),
    },

  ],
})

router.beforeEach((to, from, next) => {
  if (to.path !== '/login' && !isAuthenticated()) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated()) {
    next('/')
  } else {
    next()
  }
})

export default router
