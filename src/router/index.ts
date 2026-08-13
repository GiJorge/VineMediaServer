import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:album?',
      name: 'home',
      component: App
    }
  ]
})

// Force album path to lowercase safely with TypeScript typing
router.beforeEach((to, from, next) => {
  const albumParam = Array.isArray(to.params.album) 
    ? to.params.album[0] 
    : to.params.album

  if (albumParam && albumParam !== albumParam.toLowerCase()) {
    next({
      path: `/${albumParam.toLowerCase()}`,
      replace: true
    })
  } else {
    next()
  }
})

export default router