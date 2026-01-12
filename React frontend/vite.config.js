// React frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // !!! НОВЫЙ БЛОК: Настройка сервера разработки и проксирования !!!
  server: {
    // 1. Проксирование всех запросов, начинающихся с /api, на бэкенд (порт 8000)
    // Это гарантирует, что запросы к /api/polls/... будут отправлены Django
    // proxy: {
    //   '/api': {
    //     target: 'http://127.0.0.1:8000', // Адрес Django-сервера
    //     changeOrigin: true,             // Важно для корректной работы с заголовками
    //     secure: false,                  // Не используем HTTPS в разработке
    //   },
    // },
    port: 5173, 
    strictPort: true,
  },
})