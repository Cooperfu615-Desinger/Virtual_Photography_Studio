import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Virtual_Photography_Studio/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.endsWith('/src/data/database.json')) return 'prompt-catalog'
          if (id.includes('/src/lib/engine.js') || id.includes('/src/lib/engine/')) return 'prompt-engine'
          return undefined
        },
      },
    },
  },
})
