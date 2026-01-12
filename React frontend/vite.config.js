// React frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'PollTestWidgets',
      fileName: (format) => `poll-test-widgets.${format}.js`
    },
    rollupOptions: {
      // Исключаем React из сборки, чтобы не было дубликатов
      external: ['react', 'react-dom', '@xyflow/react'], 
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@xyflow/react': 'ReactFlow'
        }
      }
    }
  }
})