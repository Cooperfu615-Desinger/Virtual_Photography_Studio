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
          // Profiles read wardrobe recipes at module initialization; keep both in the data chunk.
          if (id.endsWith('/src/lib/engine/characterProfiles.js') || id.endsWith('/src/lib/engine/characterWardrobeSources.js')) return 'prompt-catalog'
          if (id.includes('/src/lib/engine.js') || id.includes('/src/lib/engine/')) return 'prompt-engine'
          return undefined
        },
      },
    },
  },
})
