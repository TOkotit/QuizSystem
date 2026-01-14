// React frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    dts({ 
      insertTypesEntry: true, // Создает файл index.d.ts
      include: ['src'],       // Откуда брать файлы
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.js'),
      name: 'PollTestWidgets',
      fileName: (format) => `poll-test-widgets.${format}.js`
    },
    rollupOptions: {
  external: [
    'react', 
    'react-dom', 
    'react/jsx-runtime', 
    '@xyflow/react'
  ],
  output: {
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'react/jsx-runtime': 'jsxRuntime', 
      '@xyflow/react': 'ReactFlow'
    }
  }
}
  }
})