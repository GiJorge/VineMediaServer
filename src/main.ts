// import { createApp } from 'vue'
// import App from './App.vue'
// import router from './router' // Adjust path if your router file is elsewhere


// createApp(App).mount('#app')

// app.use(router)





import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // Adjust path if your router file is elsewhere
import './assets/main.css'
const app = createApp(App)

app.use(router) // 👈 CRITICAL: This injects `route` into useRoute() across your app

app.mount('#app')