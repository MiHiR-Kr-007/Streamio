import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // target: 'http://localhost:5000',
        target: process.env.VITE_BACKEND_URL || 'https://your-backend-domain.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
