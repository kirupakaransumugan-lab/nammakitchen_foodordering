import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Photos are saved as "/api/images/5" (no host). On Vercel the backend
    // is on the same domain; locally this sends /api to the FastAPI server.
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
