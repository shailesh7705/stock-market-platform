import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lightweight-charts')) return 'charts';
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@dnd-kit')) return 'dnd';
            if (id.includes('react') || id.includes('@tanstack/react-query')) return 'react-vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
